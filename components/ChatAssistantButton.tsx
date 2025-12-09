import React from 'react';
import { SparklesIcon } from './Icons';

interface ChatAssistantButtonProps {
    onClick: () => void;
}

const ChatAssistantButton: React.FC<ChatAssistantButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 h-16 w-16 bg-brand-accent rounded-full shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400 dark:focus:ring-blue-500"
            aria-label="Open AI Assistant"
        >
            <SparklesIcon className="w-8 h-8" />
        </button>
    );
};

export default ChatAssistantButton;