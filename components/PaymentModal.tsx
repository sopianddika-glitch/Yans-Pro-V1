
import React, { useMemo } from 'react';
import { XIcon, CheckIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    total: number;
    currency: string;
}

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, total, currency }) => {
    const { t } = useI18n();

    const quickAmounts = useMemo(() => {
        // Generate smart quick cash suggestions
        const suggestions = [];
        // Exact
        suggestions.push(total);
        
        // Next 10, 20, 50, 100
        const bases = [10, 20, 50, 100];
        bases.forEach(base => {
            const next = Math.ceil(total / base) * base;
            if (next > total && !suggestions.includes(next)) {
                suggestions.push(next);
            } else if (next === total && !suggestions.includes(next + base)) {
                 // If total is exactly 20, suggest 50
                 suggestions.push(next + base);
            }
        });
        
        return suggestions.sort((a,b) => a - b).slice(0, 4);
    }, [total]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 p-4" aria-modal="true" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-800 dark:text-white">{t('modals.payment.title')}</h2>
                    <button onClick={onClose} aria-label={t('general.close')} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="p-6 text-center space-y-2">
                    <p className="text-gray-500 dark:text-brand-muted uppercase text-xs font-bold tracking-wider">{t('modals.payment.totalDue')}</p>
                    <p className="text-5xl font-extrabold text-brand-accent tracking-tight">{formatCurrency(total, currency)}</p>
                </div>

                <div className="px-6 pb-2">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase">Quick Cash</p>
                    <div className="grid grid-cols-2 gap-3">
                        {quickAmounts.map(amount => (
                            <button
                                key={amount}
                                onClick={onConfirm} // Logic for cash change can be added here
                                className="py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium transition-colors border border-transparent hover:border-brand-accent text-sm"
                            >
                                {amount === total ? 'Exact' : ''} {formatCurrency(amount, currency)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 pt-4">
                     <button
                        onClick={onConfirm}
                        className="w-full flex items-center justify-center gap-2 bg-brand-green hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg transition-colors duration-300 shadow-lg active:scale-95"
                    >
                        <CheckIcon className="h-6 w-6" />
                        <span>{t('modals.payment.confirm')}</span>
                    </button>
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

export default PaymentModal;

