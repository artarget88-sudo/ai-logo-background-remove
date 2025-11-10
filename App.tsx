import React, { useState, useCallback, useMemo } from 'react';
import { AppState, Quality, ImageJob, ProcessingFunction } from './types';
import { removeWatermark, removeBackground } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
import FunctionSelector from './components/FunctionSelector';
import { HomeIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.CHOOSING_FUNCTION);
  const [imageJobs, setImageJobs] = useState<ImageJob[]>([]);
  const [quality, setQuality] = useState<Quality>('medium');
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [processingFunction, setProcessingFunction] = useState<ProcessingFunction | null>(null);

  const processImages = useCallback(async (jobs: ImageJob[], func: ProcessingFunction) => {
    const CONCURRENCY_LIMIT = 5;
    const queue = [...jobs];

    const runJob = async (job: ImageJob) => {
        try {
            setImageJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j));
            
            const { base64: resultBase64, mimeType } = func === ProcessingFunction.WATERMARK_REMOVAL
              ? await removeWatermark(job.file, quality)
              : await removeBackground(job.file);

            const processedUrl = `data:${mimeType};base64,${resultBase64}`;
            setImageJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'done', processedUrl } : j));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setImageJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', error: message } : j));
        }
    };

    const worker = async () => {
        while(queue.length > 0) {
            const job = queue.shift();
            if (job) {
                await runJob(job);
            }
        }
    };

    const workers = Array(CONCURRENCY_LIMIT).fill(null).map(() => worker());
    await Promise.all(workers);

  }, [quality]);

  const handleFunctionSelect = (func: ProcessingFunction) => {
    setProcessingFunction(func);
    setAppState(AppState.IDLE);
  }

  const handleImageUpload = useCallback(async (files: File[]) => {
    if (files.length === 0 || !processingFunction) return;
    
    setAppState(AppState.PROCESSING);
    
    const newJobs: ImageJob[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      status: 'queued',
    }));

    setImageJobs(newJobs);
    setSelectedJobIds(new Set());
    processImages(newJobs, processingFunction);
  }, [processImages, processingFunction]);


  const handleReset = useCallback(() => {
    imageJobs.forEach(job => URL.revokeObjectURL(job.originalUrl));
    setAppState(AppState.CHOOSING_FUNCTION);
    setProcessingFunction(null);
    setImageJobs([]);
    setSelectedJobIds(new Set());
  }, [imageJobs]);

  const handleToggleSelection = useCallback((jobId: string) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedJobIds(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    const doneJobIds = imageJobs
      .filter(job => job.status === 'done')
      .map(job => job.id);
    setSelectedJobIds(new Set(doneJobIds));
  }, [imageJobs]);

  const progress = useMemo(() => {
    if (imageJobs.length === 0) return { done: 0, total: 0 };
    const doneCount = imageJobs.filter(j => j.status === 'done' || j.status === 'error').length;
    return { done: doneCount, total: imageJobs.length };
  }, [imageJobs]);


  const renderContent = () => {
    if (appState === AppState.CHOOSING_FUNCTION) {
      return <FunctionSelector onSelectFunction={handleFunctionSelect} />;
    }
    if (appState === AppState.IDLE) {
      return <ImageUploader onImageUpload={handleImageUpload} quality={quality} onQualityChange={setQuality} showQualitySelector={processingFunction === ProcessingFunction.WATERMARK_REMOVAL} />;
    }
    return (
      <ImageDisplay 
        jobs={imageJobs}
        selectedJobIds={selectedJobIds}
        onToggleSelection={handleToggleSelection}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
      />
    );
  };

  const getHeaderTitle = () => {
    switch(processingFunction) {
      case ProcessingFunction.WATERMARK_REMOVAL:
        return "Удаление водяного знака";
      case ProcessingFunction.BACKGROUND_REMOVAL:
        return "Удаление фона";
      default:
        return null;
    }
  }

  const getHeaderDescription = () => {
    if (appState === AppState.PROCESSING) {
      return null; // Progress bar will be shown instead
    }
    switch(processingFunction) {
      case ProcessingFunction.WATERMARK_REMOVAL:
        return "Загрузите до 50 изображений, выберите желаемое качество и волшебным образом удалите водяные знаки.";
      case ProcessingFunction.BACKGROUND_REMOVAL:
        return "Загрузите до 50 изображений, и ИИ аккуратно удалит фон, оставив только основной объект.";
      default:
        return "Выберите операцию, которую вы хотите выполнить с вашими изображениями.";
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl text-center mb-8 relative">
        {appState !== AppState.CHOOSING_FUNCTION && (
          <button 
            onClick={handleReset} 
            className="absolute top-0 left-0 flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg"
            title="На главную"
            >
            <HomeIcon className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 text-transparent bg-clip-text">
          AI ЛОГО и ФОН удалитель
        </h1>
        {appState !== AppState.CHOOSING_FUNCTION && getHeaderTitle() && (
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-200">{getHeaderTitle()}</h2>
        )}
        {appState === AppState.PROCESSING ? (
          <div className="mt-4">
             <p className="text-lg text-gray-400">
               Обработка {progress.total} изображений...
             </p>
            <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-2.5 mt-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-500" 
                style={{width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`}}>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{progress.done} / {progress.total} завершено</p>
          </div>
        ) : (
           <p className="mt-2 text-lg text-gray-400">
             {getHeaderDescription()}
           </p>
        )}
      </header>
      <main className="w-full max-w-7xl flex-grow flex items-start justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;