
import React, { useState, useEffect, useCallback } from 'react';
import { Goal, GoalSuggestion } from '../types';
import { getGoalSuggestion } from '../services/geminiService';
import { XIcon, SparklesIcon, DeleteIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goalData: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>, goalId?: string) => void;
    existingGoal: Goal | null;
    currency: string;
    onDelete?: (id: string) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSave, existingGoal, currency, onDelete }) => {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [aiQuery, setAiQuery] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<GoalSuggestion | null>(null);
    const [error, setError] = useState('');
    
    const isEditMode = !!existingGoal;
    
    const resetForm = useCallback(() => {
        setName(existingGoal?.name || '');
        setTargetAmount(existingGoal?.targetAmount.toString() || '');
        setTargetDate(existingGoal?.targetDate || '');
        setAiQuery('');
        setSuggestion(null);
        setError('');
    }, [existingGoal]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !targetAmount) {
            setError(t('general.error.requiredFields'));
            return;
        }
        const numericAmount = parseFloat(targetAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError(t('general.error.positiveAmount'));
            return;
        }
        
        onSave({
            name,
            targetAmount: numericAmount,
            targetDate: targetDate || null,
        }, existingGoal?.id);
    };

    const handleGetSuggestion = async () => {
        if (!aiQuery) return;
        setIsSuggesting(true);
        setError('');
        setSuggestion(null);
        try {
            const result = await getGoalSuggestion(aiQuery, currency);
            setSuggestion(result);
            setName(result.name);
            setTargetAmount(result.targetAmount.toFixed(2));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('general.error.unknown');
            setError(t('modals.addGoal.suggestionFailed', { error: errorMessage }));
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleDelete = () => {
        if (onDelete && existingGoal) {
            if (window.confirm(t('goalsPage.deleteConfirm', { goalName: existingGoal.name }))) {
                onDelete(existingGoal.id);
            }
        }
    }

    if (!isOpen) return null;
    
    const modalTitle = isEditMode ? t('modals.addGoal.editTitle') : t('modals.addGoal.createTitle');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 p-4" aria-modal="true" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-800 dark:text-white">{modalTitle}</h2>
                    <button onClick={onClose} aria-label={t('general.close')} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-hidden flex flex-col">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="goal-name" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addGoal.name')}</label>
                            <input type="text" id="goal-name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder={t('modals.addGoal.namePlaceholder')} />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="target-amount" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{`${t('modals.addGoal.targetAmount')} (${currency})`}</label>
                                <input type="number" id="target-amount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required min="0.01" step="0.01" className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="0.00" />
                            </div>
                            <div>
                                <label htmlFor="target-date" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addGoal.targetDate')}</label>
                                <input type="date" id="target-date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                            </div>
                        </div>

                        {!isEditMode && (
                            <div className="p-4 bg-gray-50 dark:bg-brand-primary/50 rounded-lg space-y-3 border border-gray-200 dark:border-gray-700">
                                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"><SparklesIcon className="text-brand-accent" /> {t('modals.addGoal.aiHelperTitle')}</h4>
                                <p className="text-sm text-gray-500 dark:text-brand-muted">{t('modals.addGoal.aiHelperDescription')}</p>
                                <div>
                                    <textarea
                                        rows={2}
                                        value={aiQuery}
                                        onChange={e => setAiQuery(e.target.value)}
                                        className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                        placeholder={t('modals.addGoal.aiPlaceholder')}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGetSuggestion}
                                    disabled={isSuggesting || !aiQuery}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    {isSuggesting && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                                    {t('modals.addGoal.getSuggestion')}
                                </button>
                                {suggestion && (
                                     <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded-r-lg mt-2">
                                         <p className="text-sm text-blue-800 dark:text-blue-300">{suggestion.reasoning}</p>
                                     </div>
                                )}
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600 dark:text-brand-red text-center" role="alert">{error}</p>}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-between gap-4 rounded-b-xl flex-shrink-0">
                        <div>
                            {isEditMode && onDelete && existingGoal && (
                                <button type="button" onClick={handleDelete} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors" aria-label={t('general.delete')}>
                                    <DeleteIcon />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors">{t('general.cancel')}</button>
                            <button type="submit" className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold transition-colors">{t('general.save')}</button>
                        </div>
                    </div>
                </form>
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

export default AddGoalModal;
