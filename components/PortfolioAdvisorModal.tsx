
import React from 'react';
import { PortfolioSuggestion } from '../types';
import { XIcon, SparklesIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface PortfolioAdvisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: PortfolioSuggestion[];
    isLoading: boolean;
    sources?: { title: string; uri: string }[];
}

const PortfolioAdvisorModal: React.FC<PortfolioAdvisorModalProps> = ({ isOpen, onClose, suggestions, isLoading, sources }) => {
    const { t } = useI18n();

    if (!isOpen) return null;

    const getActionColor = (action: string) => {
        switch(action.toLowerCase()) {
            case 'buy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
            case 'sell': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
            case 'hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
            case 'rebalance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const getRiskColor = (risk: string) => {
        switch(risk.toLowerCase()) {
            case 'high': return 'text-red-600 dark:text-red-400';
            case 'medium': return 'text-yellow-600 dark:text-yellow-400';
            case 'low': return 'text-green-600 dark:text-green-400';
            default: return 'text-gray-500';
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-brand-primary">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-brand-accent" />
                        {t('portfolioAdvisor.title')}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white"><XIcon /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mb-4"></div>
                            <p className="text-gray-500 dark:text-brand-muted">{t('portfolioAdvisor.analyzing')}</p>
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No suggestions available. Try refreshing.</div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t('portfolioAdvisor.subtitle')}</p>
                            
                            {suggestions.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-brand-primary/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase border ${getActionColor(item.action)}`}>
                                                {t(`portfolioAdvisor.${item.action.toLowerCase()}`, {defaultValue: item.action})}
                                            </span>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.symbol}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-bold ${getRiskColor(item.riskLevel)}`}>
                                                {item.riskLevel} {t('portfolioAdvisor.risk')}
                                            </span>
                                            {item.targetPrice && (
                                                <p className="text-xs text-gray-500 mt-1">Target: ${item.targetPrice}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
                                        "{item.reasoning}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="bg-gray-50 dark:bg-brand-primary p-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
                    <p>AI-generated content for informational purposes only. Not financial advice.</p>
                    {sources && sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-center gap-2">
                            <span className="font-semibold">Sources:</span>
                            {sources.map((s, i) => (
                                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {s.title}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default PortfolioAdvisorModal;
