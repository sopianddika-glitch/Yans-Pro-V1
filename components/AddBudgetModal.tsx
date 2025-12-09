
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Budget, Category, Transaction, TransactionType, BudgetPeriod, BudgetSuggestionResult } from '../types';
import { getBudgetSuggestion } from '../services/geminiService';
import { XIcon, LightbulbIcon, DeleteIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';


interface AddBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddBudget: (budget: Omit<Budget, 'id'>) => void;
    onUpdateBudget: (budget: Budget) => void;
    categories: Category[];
    transactions: Transaction[];
    existingBudget: Budget | null;
    currency: string;
    onDelete?: (id: string) => void;
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ isOpen, onClose, onAddBudget, onUpdateBudget, categories, transactions, existingBudget, currency, onDelete }) => {
    const { t } = useI18n();
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState<BudgetPeriod>('monthly');
    const [error, setError] = useState('');

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<BudgetSuggestionResult | null>(null);

    const isEditMode = !!existingBudget;
    
    const resetForm = useCallback(() => {
        setCategoryId(existingBudget?.categoryId || '');
        setAmount(existingBudget?.amount.toString() || '');
        setPeriod(existingBudget?.period || 'monthly');
        setError('');
        setSuggestion(null);
    }, [existingBudget]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId || !amount) {
            setError(t('general.error.requiredFields'));
            return;
        }
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError(t('general.error.positiveAmount'));
            return;
        }

        const budgetData = { categoryId, amount: numericAmount, period };
        if (isEditMode) {
            onUpdateBudget({ id: existingBudget.id, ...budgetData });
        } else {
            onAddBudget(budgetData);
        }
        onClose();
    };

    const handleGetSuggestion = async () => {
        if (!categoryId) {
            setError(t('modals.addBudget.selectCategoryFirst'));
            return;
        }
        setIsSuggesting(true);
        setError('');
        setSuggestion(null);
        try {
            const result = await getBudgetSuggestion(categoryId, categories, transactions);
            setSuggestion(result);
            setAmount(result.suggestedAmount.toFixed(2));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('general.error.unknown');
            setError(t('ai.error', { error: errorMessage }));
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleDelete = () => {
        if (onDelete && existingBudget) {
            if (window.confirm(t('budgetsPage.deleteConfirm'))) {
                onDelete(existingBudget.id);
            }
        }
    }

    const budgetableCategories = useMemo(() => {
        // Budgets are typically for expense categories.
        // We only show top-level categories, as spending includes sub-categories.
        return categories.filter(c => c.type === TransactionType.EXPENSE && !c.parentId);
    }, [categories]);

    if (!isOpen) return null;
    
    const modalTitle = isEditMode ? t('modals.addBudget.editTitle') : t('modals.addBudget.createTitle');
    const submitButtonText = isEditMode ? t('general.saveChanges') : t('budgetsPage.create');

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
                            <label htmlFor="category" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('general.category')}</label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={e => {
                                    setCategoryId(e.target.value);
                                    setSuggestion(null); // Reset suggestion when category changes
                                }}
                                required
                                className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                            >
                                <option value="" disabled>{t('modals.addBudget.selectCategory')}</option>
                                {budgetableCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 dark:text-brand-muted mt-1">{t('modals.addBudget.categoryInfo')}</p>
                        </div>

                        <div className="relative">
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{`${t('general.amount')} (${currency})`}</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    id="amount"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    className="flex-grow w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                    placeholder="0.00"
                                />
                                <button
                                    type="button"
                                    onClick={handleGetSuggestion}
                                    disabled={isSuggesting || !categoryId}
                                    className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-800 dark:text-white font-semibold py-2.5 px-3 rounded-lg transition-colors"
                                    aria-label={t('modals.addBudget.getSuggestion')}
                                >
                                    {isSuggesting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-accent"></div>
                                    ) : (
                                        <LightbulbIcon className="w-5 h-5 text-yellow-500" />
                                    )}
                                    <span>{t('modals.addBudget.suggest')}</span>
                                </button>
                            </div>
                        </div>
                        
                        {isSuggesting && (
                             <div className="text-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mx-auto"></div>
                                <p className="mt-2 text-gray-500 dark:text-brand-muted">{t('modals.receiptScanner.analyzing')}</p>
                             </div>
                        )}

                        {suggestion && (
                             <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded-r-lg">
                                 <p className="text-sm text-blue-800 dark:text-blue-300">{suggestion.explanation}</p>
                             </div>
                        )}

                        <div>
                            <label htmlFor="period" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addBudget.period')}</label>
                            <select
                                id="period"
                                value={period}
                                onChange={e => setPeriod(e.target.value as BudgetPeriod)}
                                className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                            >
                                <option value="monthly">{t('modals.addBudget.monthly')}</option>
                                <option value="yearly">{t('modals.addBudget.yearly')}</option>
                            </select>
                        </div>

                        {error && <p className="text-sm text-red-600 dark:text-brand-red text-center" role="alert">{error}</p>}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-between gap-4 rounded-b-xl flex-shrink-0">
                        <div>
                            {isEditMode && onDelete && existingBudget && (
                                <button type="button" onClick={handleDelete} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors" aria-label={t('general.delete')}>
                                    <DeleteIcon />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors">{t('general.cancel')}</button>
                            <button type="submit" className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold transition-colors">{submitButtonText}</button>
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

export default AddBudgetModal;
