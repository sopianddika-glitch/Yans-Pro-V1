import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { XIcon, FlagIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddFunds: (goalId: string, amount: number) => void;
    goal: Goal;
    currency: string;
}

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, onAddFunds, goal, currency }) => {
    const { t } = useI18n();
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError(t('modals.addFunds.errorPositiveAmount'));
            return;
        }
        onAddFunds(goal.id, numericAmount);
    };

    if (!isOpen) return null;
    
    const newAmount = goal.currentAmount + (parseFloat(amount) || 0);
    const progressPercent = goal.targetAmount > 0 ? (newAmount / goal.targetAmount) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 p-4" aria-modal="true" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><FlagIcon /> {t('modals.addFunds.title')}</h2>
                    <button onClick={onClose} aria-label={t('general.close')} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-hidden flex flex-col">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <p className="text-center text-gray-600 dark:text-gray-300">Adding funds to: <strong className="text-gray-800 dark:text-white">{goal.name}</strong></p>
                        
                        <div>
                            <label htmlFor="fund-amount" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{`${t('modals.addFunds.amountToAdd')} (${currency})`}</label>
                            <input type="number" id="fund-amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" autoFocus className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-3xl text-center font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="0.00" />
                        </div>
                        
                        <div className="space-y-3 pt-2">
                             <div className="text-sm">
                                <p className="text-gray-500 dark:text-brand-muted">{t('modals.addFunds.currentProgress')}</p>
                                <p className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}</p>
                            </div>
                             <div className="text-sm">
                                <p className="text-gray-500 dark:text-brand-muted">{t('modals.addFunds.newProgress')}</p>
                                <p className="font-semibold text-brand-accent">{formatCurrency(newAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}</p>
                            </div>
                             <div className="w-full bg-gray-200 dark:bg-brand-primary rounded-full h-2.5">
                                <div className="bg-brand-accent h-2.5 rounded-full" style={{ width: `${Math.min(progressPercent, 100)}%` }}></div>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 dark:text-brand-red text-center" role="alert">{error}</p>}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-4 rounded-b-xl flex-shrink-0">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors">{t('general.cancel')}</button>
                        <button type="submit" className="py-2 px-4 rounded-lg bg-brand-green hover:bg-green-600 text-white font-semibold transition-colors">{t('modals.addFunds.addAndRecord')}</button>
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

export default AddFundsModal;
