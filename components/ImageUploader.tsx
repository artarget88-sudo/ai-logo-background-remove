import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';
import { Quality } from '../types';

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
  quality: Quality;
  onQualityChange: (quality: Quality) => void;
  showQualitySelector: boolean;
}

const MAX_FILES = 50;

const QualityButton: React.FC<{
  label: string;
  value: Quality;
  currentQuality: Quality;
  onClick: (quality: Quality) => void;
}> = ({ label, value, currentQuality, onClick }) => {
  const isSelected = value === currentQuality;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500
      ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
    >
      {label}
    </button>
  );
};


const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, quality, onQualityChange, showQualitySelector }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      if (files.length > MAX_FILES) {
        alert(`Вы можете загрузить не более ${MAX_FILES} изображений за раз.`);
        return;
      }
      onImageUpload(Array.from(files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [onImageUpload]);


  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`w-full max-w-2xl p-8 border-2 border-dashed rounded-xl transition-colors duration-300 flex flex-col items-center justify-center text-center
      ${isDragging ? 'border-purple-500 bg-gray-800' : 'border-gray-600 bg-gray-900/50'}`}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        multiple
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
        <UploadIcon className="w-16 h-16 mb-4 text-gray-500" />
        <p className="text-xl font-semibold text-gray-300">
          Перетащите ваши изображения сюда
        </p>
        <p className="text-gray-400">или <span className="font-semibold text-purple-400">нажмите для обзора</span></p>
        <p className="mt-4 text-sm text-gray-500">Поддерживает: PNG, JPG, WEBP (до 50 файлов)</p>
      </label>

      {showQualitySelector && (
        <div className="mt-6 w-full max-w-xs">
            <p className="text-sm font-medium text-gray-400 mb-2">Качество вывода</p>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-800 rounded-lg">
              <QualityButton label="Низкое" value="low" currentQuality={quality} onClick={onQualityChange} />
              <QualityButton label="Среднее" value="medium" currentQuality={quality} onClick={onQualityChange} />
              <QualityButton label="Высокое" value="high" currentQuality={quality} onClick={onQualityChange} />
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
