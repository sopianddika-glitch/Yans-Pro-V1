import React, { useState, useCallback } from 'react';
import { Transaction, FinancialSummary } from '../types';
import { getFinancialAnalysis } from '../services/geminiService';
import { SparklesIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface FinancialInsightProps {
  transactions: Transaction[];
  summary: FinancialSummary;
}

const FinancialInsight: React.FC<FinancialInsightProps> = ({ transactions, summary }) => {
  const { t } = useI18n();
  const [insight, setInsight] = useState<string>('');
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  const suggestedQueries = [
    { key: 'summary', text: t('ai.suggestedQueries.summary') },
    { key: 'spending', text: t('ai.suggestedQueries.spending') },
    { key: 'improvement', text: t('ai.suggestedQueries.improvement') },
  ];

  const handleGenerateInsight = useCallback(async (currentQuery: string) => {
    if (!currentQuery) return;
    setIsLoading(true);
    setError('');
    setInsight('');
    setSources([]);
    try {
      const response = await getFinancialAnalysis(transactions, summary, currentQuery);
      setInsight(response.text);
      setSources(response.sources);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('general.error.unknown');
      setError(t('ai.error', { error: errorMessage }));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [transactions, summary, t]);

  const handleSuggestedQueryClick = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
    handleGenerateInsight(suggestedQuery);
  }

  // Helper to parse bold text within a string
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Improved Markdown Renderer
  const renderFormattedInsight = (text: string) => {
    if (!text) return null;
    
    return text.split('\n').map((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('### ')) {
            return <h4 key={index} className="text-md font-bold text-gray-800 dark:text-white mt-3 mb-2">{parseBold(trimmedLine.substring(4))}</h4>;
        }
        
        if (trimmedLine.startsWith('## ')) {
            return <h3 key={index} className="text-lg font-bold text-gray-800 dark:text-white mt-4 mb-2">{parseBold(trimmedLine.substring(3))}</h3>;
        }

        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            return (
                <div key={index} className="flex items-start gap-2 ml-2 mb-1">
                    <span className="text-brand-accent mt-1.5">•</span>
                    <span className="text-gray-600 dark:text-gray-300">{parseBold(trimmedLine.substring(2))}</span>
                </div>
            );
        }
        
        if (trimmedLine === '') {
            return <div key={index} className="h-2"></div>;
        }

        return <p key={index} className="text-gray-600 dark:text-gray-300 mb-1 leading-relaxed">{parseBold(trimmedLine)}</p>;
    });
  };

  return (
    <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg h-full flex flex-col border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0 border-b border-gray-100 dark:border-gray-700 pb-4">
        <div className="bg-brand-accent/10 p-2 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-brand-accent" />
        </div>
        <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('ai.financialInsight')}</h3>
            <p className="text-xs text-gray-500 dark:text-brand-muted">Powered by Gemini 2.5</p>
        </div>
      </div>
      
      <div className="space-y-4 flex flex-col flex-grow">
        <div className="space-y-2">
            <label htmlFor="ai-query" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('ai.askQuery')}
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map(sq => (
                 <button 
                    key={sq.key} 
                    onClick={() => handleSuggestedQueryClick(sq.text)} 
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-brand-accent hover:text-white dark:hover:bg-brand-accent dark:hover:text-white rounded-full transition-colors border border-gray-200 dark:border-gray-700"
                 >
                   {sq.text}
                 </button>
              ))}
            </div>
            <div className="relative">
                <textarea
                    id="ai-query"
                    rows={2}
                    className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition resize-none text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('ai.queryPlaceholder')}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerateInsight(query);
                        }
                    }}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    Press Enter to send
                </div>
            </div>
        </div>

        <button
          onClick={() => handleGenerateInsight(query)}
          disabled={isLoading || !query}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-accent to-blue-600 hover:from-blue-600 hover:to-brand-accent disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-md transform active:scale-95"
        >
          {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('ai.analyzing')}</span>
              </>
          ) : (
              <span>{t('ai.generateInsight')}</span>
          )}
        </button>
        
        <div className="flex-grow overflow-y-auto min-h-[150px] custom-scrollbar rounded-lg">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg text-sm flex items-start gap-2">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {insight ? (
              <div className="bg-gray-50 dark:bg-brand-primary p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-full animate-fade-in-scale">
                <div className="text-sm">
                    {renderFormattedInsight(insight)}
                </div>
                {sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <span>🔍</span> {t('ai.sources')}
                        </h4>
                        <ul className="space-y-1">
                            {sources.map((source, idx) => (
                                <li key={idx} className="truncate">
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-xs text-brand-accent hover:underline flex items-center gap-1 group"
                                    >
                                        <span className="truncate">{source.title}</span>
                                        <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
              </div>
            ) : !isLoading && !error && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 text-center p-4">
                    <SparklesIcon className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">Ready to analyze your finances.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FinancialInsight;
