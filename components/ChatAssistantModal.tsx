import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { XIcon, SparklesIcon, SendIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface ChatAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: ChatMessage[];
    onSend: (message: string) => void;
    isLoading: boolean;
}

const ChatAssistantModal: React.FC<ChatAssistantModalProps> = ({ isOpen, onClose, history, onSend, isLoading }) => {
    const { t } = useI18n();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, isLoading]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end sm:items-center z-50 transition-opacity duration-300" aria-modal="true" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-brand-secondary rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 opacity-0 animate-fade-in-up flex flex-col h-[85%] sm:h-[75%]">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-brand-accent"/>
                        <span>{t('ai.chat.title')}</span>
                    </h2>
                    <button onClick={onClose} aria-label={t('general.close')} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white"/></div>}
                            <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-accent text-white rounded-br-none' : 'bg-gray-100 dark:bg-brand-primary text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                <p className={`text-sm ${msg.isActionConfirmation ? 'italic text-blue-700 dark:text-blue-300' : ''}`}>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                             <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white animate-pulse"/></div>
                             <div className="max-w-md p-3 rounded-2xl bg-gray-100 dark:bg-brand-primary rounded-bl-none flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('ai.chat.placeholder')}
                            disabled={isLoading}
                            className="w-full bg-gray-100 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-full p-3 pr-12 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:bg-gray-200 dark:disabled:bg-gray-800"
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-brand-accent text-white disabled:bg-gray-400 dark:disabled:bg-gray-500 transition-colors">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </form>

            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ChatAssistantModal;