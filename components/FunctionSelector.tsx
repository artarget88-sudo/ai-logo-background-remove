import React from 'react';
import { ProcessingFunction } from '../types';
import { WatermarkIcon, BackgroundIcon } from './icons';

interface FunctionSelectorProps {
    onSelectFunction: (func: ProcessingFunction) => void;
}

const FunctionCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
}> = ({ title, description, icon, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-full sm:w-80 p-8 bg-gray-800/50 border-2 border-gray-700 rounded-2xl text-left hover:border-purple-500 hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex flex-col items-start"
        >
            <div className="p-3 bg-gray-700 rounded-lg mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 flex-grow">{description}</p>
        </button>
    )
}

const FunctionSelector: React.FC<FunctionSelectorProps> = ({ onSelectFunction }) => {
    return (
        <div className="flex flex-col sm:flex-row gap-8 items-center justify-center">
            <FunctionCard 
                title="Удалить водяной знак"
                description="Автоматически обнаруживает и удаляет логотипы, текст и другие водяные знаки с ваших изображений."
                icon={<WatermarkIcon className="w-8 h-8 text-purple-400" />}
                onClick={() => onSelectFunction(ProcessingFunction.WATERMARK_REMOVAL)}
            />
             <FunctionCard 
                title="Удалить фон"
                description="Аккуратно вырезает главный объект и делает фон прозрачным, идеально для каталогов и дизайна."
                icon={<BackgroundIcon className="w-8 h-8 text-blue-400" />}
                onClick={() => onSelectFunction(ProcessingFunction.BACKGROUND_REMOVAL)}
            />
        </div>
    );
};

export default FunctionSelector;
