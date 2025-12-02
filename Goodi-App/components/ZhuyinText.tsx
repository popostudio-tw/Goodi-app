import React, { useState } from 'react';

interface SpeechTextProps {
  text: string;
  playAudio: (text: string) => void;
}

const SpeechText: React.FC<SpeechTextProps> = ({ text, playAudio }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handlePlay = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLoading) return;
        setIsLoading(true);
        await playAudio(text);
        setIsLoading(false);
    };
    
    return (
        <button 
            onClick={handlePlay} 
            className="group inline-flex items-center gap-1 text-left bg-transparent border-none p-0 m-0 font-inherit text-inherit cursor-pointer"
            aria-label={`朗讀: ${text}`}
            disabled={isLoading}
        >
            <span>{text}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-4 w-4 text-gray-500 group-hover:text-blue-500 transition-colors ${isLoading ? 'animate-pulse text-blue-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
        </button>
    );
};

export default SpeechText;