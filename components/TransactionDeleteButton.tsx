
import React, { useState } from 'react';
import { DeleteIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface TransactionDeleteButtonProps {
    transactionId: string;
    onDelete: (id: string) => Promise<void> | void;
    disabled?: boolean;
    className?: string;
}

const TransactionDeleteButton: React.FC<TransactionDeleteButtonProps> = ({
    transactionId,
    onDelete,
    disabled = false,
    className
}) => {
    const { t } = useI18n();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        setIsConfirmOpen(true);
    };

    const handleConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        try {
            await onDelete(transactionId);
        } catch (error) {
            console.error("Failed to delete transaction", error);
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmOpen(false);
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={disabled || isDeleting}
                className={`p-2 rounded-full transition-colors duration-200 ${
                    disabled
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-brand-red hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                } ${className || ''}`}
                title={t('general.delete')}
                data-testid="delete-transaction-btn"
                aria-label="Delete transaction"
            >
                {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <DeleteIcon className="w-4 h-4" />
                )}
            </button>

            {isConfirmOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" 
                    onClick={handleCancel}
                    role="dialog"
                    aria-modal="true"
                >
                    <div 
                        className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 border border-gray-100 dark:border-gray-700" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <DeleteIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Transaction?</h3>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                            Are you sure you want to delete this transaction? This action will move it to the trash and can be undone for a short time.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {t('general.cancel')}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-colors flex items-center gap-2"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : t('general.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
            `}</style>
        </>
    );
};

export default TransactionDeleteButton;
