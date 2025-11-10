import React, { useState } from 'react';
import Spinner from './Spinner';
import { DownloadIcon, ErrorIcon, CheckboxIcon, CheckboxCheckedIcon, DeselectIcon, SelectAllIcon } from './icons';
import { ImageJob } from '../types';
import { dataURLtoBlob } from '../utils/fileUtils';

interface ImageDisplayProps {
  jobs: ImageJob[];
  selectedJobIds: Set<string>;
  onToggleSelection: (jobId: string) => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
}

const ImageJobCard: React.FC<{
  job: ImageJob;
  isSelected: boolean;
  onDownloadClick: (job: ImageJob) => void;
  onToggleSelection: (jobId: string) => void;
}> = ({ job, isSelected, onDownloadClick, onToggleSelection }) => {
  const isDone = job.status === 'done';

  return (
    <div>
      <div 
        className={`relative aspect-square bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all duration-200
        ${isSelected ? 'ring-2 ring-purple-500' : ''}
        ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={isDone ? () => onToggleSelection(job.id) : undefined}
      >
        <img
          src={job.processedUrl || job.originalUrl}
          alt={job.file.name}
          className="w-full h-full object-contain"
        />
        
        {isDone && (
          <div className="absolute top-2 left-2 transition-opacity opacity-0 group-hover:opacity-100">
            {isSelected ? (
              <CheckboxCheckedIcon className="w-6 h-6 text-purple-400" />
            ) : (
              <CheckboxIcon className="w-6 h-6 text-gray-300" />
            )}
          </div>
        )}

        {job.status !== 'done' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-2 text-center">
            {job.status === 'processing' && (
              <>
                <Spinner className="w-8 h-8" />
                <p className="mt-2 text-sm text-gray-300 animate-pulse">Обработка...</p>
              </>
            )}
            {job.status === 'queued' && <p className="text-sm text-gray-300">В очереди</p>}
            {job.status === 'error' && (
              <>
                <ErrorIcon className="w-8 h-8 text-red-400" />
                <p className="mt-2 text-sm text-red-400">{job.error}</p>
              </>
            )}
          </div>
        )}

        {isDone && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent toggling selection
              onDownloadClick(job);
            }}
            className="absolute bottom-2 right-2 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label={`Скачать ${job.file.name}`}
          >
            <DownloadIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-400 text-center truncate" title={job.file.name}>
        {job.file.name}
      </p>
    </div>
  );
};

const ConfirmationDialog: React.FC<{
  title: string;
  description: string;
  onConfirm: (format: 'png' | 'jpeg' | 'webp') => void;
  onCancel: () => void;
}> = ({ title, description, onConfirm, onCancel }) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">{title}</h3>
        <p className="text-gray-300 mb-6 text-center">{description}</p>
        
        <fieldset className="mb-6">
          <legend className="sr-only">Image format</legend>
          <div className="flex justify-center gap-4">
            {(['png', 'jpeg', 'webp'] as const).map((f) => (
              <div key={f}>
                <input 
                  type="radio" 
                  id={`format-${f}`} 
                  name="format" 
                  value={f} 
                  checked={format === f} 
                  onChange={() => setFormat(f)}
                  className="sr-only peer"
                />
                <label 
                  htmlFor={`format-${f}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors
                    peer-checked:bg-purple-600 peer-checked:text-white 
                    bg-gray-700 text-gray-300 hover:bg-gray-600
                    focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-800 peer-focus:ring-purple-500`}
                >
                  {f.toUpperCase()}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-base font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onConfirm(format)}
            className="px-4 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all"
          >
            Подтвердить и скачать
          </button>
        </div>
      </div>
    </div>
  );
};


const ImageDisplay: React.FC<ImageDisplayProps> = ({ jobs, selectedJobIds, onToggleSelection, onClearSelection, onSelectAll }) => {
  const [jobToDownload, setJobToDownload] = useState<ImageJob | null>(null);
  const [showBatchDownloadDialog, setShowBatchDownloadDialog] = useState(false);

  const getPluralForm = (count: number, forms: [string, string, string]): string => {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  const selectedCount = selectedJobIds.size;
  const selectedText = getPluralForm(selectedCount, ['изображение', 'изображения', 'изображений']);

  const convertImage = (imageUrl: string, format: 'png' | 'jpeg' | 'webp'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Could not get canvas context'));
          
          ctx.drawImage(image, 0, 0);
          const mimeType = `image/${format}`;
          const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.92 : undefined);
          resolve(dataUrl);
      };
      image.onerror = (err) => reject(err);
      image.src = imageUrl;
    });
  };

  const handleDownloadClick = (job: ImageJob) => {
    setJobToDownload(job);
  };

  const handleConfirmDownload = async (format: 'png' | 'jpeg' | 'webp') => {
    if (!jobToDownload || !jobToDownload.processedUrl) return setJobToDownload(null);

    try {
      const dataUrl = await convertImage(jobToDownload.processedUrl, format);
      const link = document.createElement('a');
      link.href = dataUrl;
      
      const nameWithoutExtension = jobToDownload.file.name.split('.').slice(0, -1).join('.');
      link.download = `${nameWithoutExtension}-removed.${format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to convert and download image:", error);
      alert("Произошла ошибка во время скачивания. Пожалуйста, попробуйте снова.");
    }

    setJobToDownload(null);
  };

  const handleConfirmBatchDownload = async (format: 'png' | 'jpeg' | 'webp') => {
      const zip = new JSZip();
      const selectedJobs = jobs.filter(job => selectedJobIds.has(job.id) && job.processedUrl);

      await Promise.all(selectedJobs.map(async (job) => {
          try {
              const dataUrl = await convertImage(job.processedUrl!, format);
              const blob = dataURLtoBlob(dataUrl);
              const nameWithoutExtension = job.file.name.split('.').slice(0, -1).join('.');
              zip.file(`${nameWithoutExtension}-removed.${format}`, blob);
          } catch (error) {
              console.error(`Failed to process ${job.file.name} for zipping:`, error);
          }
      }));

      zip.generateAsync({ type: 'blob' }).then(content => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `watermark-removed-images.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      });

      setShowBatchDownloadDialog(false);
  };
  
  const hasSelectableJobs = jobs.some(job => job.status === 'done');

  return (
    <div className="w-full">
      {hasSelectableJobs && (
        <div className="flex justify-end items-center mb-4">
            <button
                onClick={onSelectAll}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors"
            >
                <SelectAllIcon className="w-5 h-5 mr-2" />
                Выбрать все
            </button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-6 pb-24">
        {jobs.map(job => (
          <ImageJobCard 
            key={job.id} 
            job={job} 
            isSelected={selectedJobIds.has(job.id)}
            onDownloadClick={handleDownloadClick} 
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>

      {selectedJobIds.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm p-4 z-30 transform transition-transform duration-300 ease-in-out translate-y-0">
              <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
                  <p className="text-white font-medium whitespace-nowrap">Выбрано {selectedCount} {selectedText}</p>
                  <div className="flex items-center gap-2 sm:gap-4">
                     <button
                        onClick={onClearSelection}
                        className="flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors"
                        title="Снять выделение"
                     >
                        <DeselectIcon className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:inline">Снять выделение</span>
                     </button>
                     <button
                        onClick={() => setShowBatchDownloadDialog(true)}
                        className="flex items-center justify-center px-5 py-2.5 text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all"
                     >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Скачать выбранные
                     </button>
                  </div>
              </div>
          </div>
      )}

      {jobToDownload && (
        <ConfirmationDialog
          title="Подтвердить загрузку"
          description="Пожалуйста, выберите формат для скачивания."
          onConfirm={handleConfirmDownload}
          onCancel={() => setJobToDownload(null)}
        />
      )}
      {showBatchDownloadDialog && (
         <ConfirmationDialog
          title={`Скачать ${selectedJobIds.size} ${getPluralForm(selectedJobIds.size, ['файл', 'файла', 'файлов'])}`}
          description="Выберите формат для .zip архива."
          onConfirm={handleConfirmBatchDownload}
          onCancel={() => setShowBatchDownloadDialog(false)}
        />
      )}
    </div>
  );
};

export default ImageDisplay;
