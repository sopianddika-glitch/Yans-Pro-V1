
import React, { useState, FormEvent, useEffect, useMemo, useCallback } from 'react';
import { Transaction, TransactionType, Category, RecurringTransaction, Frequency, Product, Client } from '../types';
import { XIcon, DeleteIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    onUpdateTransaction: (transaction: Transaction) => void;
    onAddRecurringTransaction: (rule: Omit<RecurringTransaction, 'id'>) => void;
    onUpdateRecurringTransaction: (rule: RecurringTransaction) => void;
    onDelete?: (id: string) => void;
    categories: Category[];
    currency: string;
    products: Product[];
    clients: Client[];
    preloadedData?: {
        description: string;
        amount: number;
        date: string;
        time: string;
    } | null;
    recurringTransactionToEdit?: RecurringTransaction | null;
    transactionToEdit?: Transaction | null;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    isOpen,
    onClose,
    onAddTransaction,
    onUpdateTransaction,
    onAddRecurringTransaction,
    onUpdateRecurringTransaction,
    onDelete,
    categories,
    currency,
    products,
    clients,
    preloadedData,
    recurringTransactionToEdit,
    transactionToEdit
}) => {
    const { t } = useI18n();
    // Shared state
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [productId, setProductId] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string>('');
    
    // Single transaction state
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    // Recurring transaction state
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<Frequency>(Frequency.MONTHLY);
    const [interval, setIntervalState] = useState('1');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const isEditMode = !!recurringTransactionToEdit || !!transactionToEdit;
    
    const getHierarchicalCategories = (type: TransactionType) => {
        const topLevel = categories.filter(c => c.type === type && !c.parentId);
        const grouped = categories.filter(c => c.type === type && c.parentId);
        return topLevel.map(parent => ({
            ...parent,
            children: grouped.filter(child => child.parentId === parent.id)
        }));
    };

    const availableCategories = useMemo(() => getHierarchicalCategories(type), [categories, type]);

    const resetForm = useCallback(() => {
        const now = new Date();
        setType(TransactionType.EXPENSE);
        setAmount('');
        setDescription('');
        setCategory('');
        setProductId(undefined);
        setDate(now.toISOString().split('T')[0]);
        setTime(now.toTimeString().slice(0, 5));
        
        setIsRecurring(false);
        setFrequency(Frequency.MONTHLY);
        setIntervalState('1');
        setStartDate(now.toISOString().split('T')[0]);
        setEndDate('');
        
        setError('');
    }, []);
    
    useEffect(() => {
        if (isOpen) {
            if (recurringTransactionToEdit) {
                // Populate for editing a recurring transaction rule
                setType(recurringTransactionToEdit.type);
                setAmount(recurringTransactionToEdit.amount.toString());
                setDescription(recurringTransactionToEdit.description);
                setCategory(recurringTransactionToEdit.category);
                setProductId(undefined);
                setIsRecurring(true);
                setFrequency(recurringTransactionToEdit.frequency);
                setIntervalState(recurringTransactionToEdit.interval.toString());
                setStartDate(recurringTransactionToEdit.startDate);
                setEndDate(recurringTransactionToEdit.endDate || '');
            } else if (transactionToEdit) {
                // Populate for editing a regular transaction
                setType(transactionToEdit.type);
                setAmount(transactionToEdit.amount.toString());
                setDescription(transactionToEdit.description);
                setCategory(transactionToEdit.category);
                setProductId(transactionToEdit.productId);
                
                const dateObj = new Date(transactionToEdit.date);
                setDate(dateObj.toISOString().split('T')[0]);
                setTime(dateObj.toTimeString().slice(0, 5));
                
                setIsRecurring(false);
                // reset other recurring fields to defaults
                setFrequency(Frequency.MONTHLY);
                setIntervalState('1');
                setStartDate(dateObj.toISOString().split('T')[0]);
                setEndDate('');
            } else if (preloadedData) {
                // Populate with AI data for a single transaction
                resetForm();
                setDescription(preloadedData.description);
                setAmount(preloadedData.amount.toString());
                setDate(preloadedData.date);
                setTime(preloadedData.time);
                setType(TransactionType.EXPENSE);
            } else {
                // Reset for a new single or recurring transaction
                resetForm();
            }
        }
    }, [isOpen, preloadedData, recurringTransactionToEdit, transactionToEdit, resetForm]);

    useEffect(() => {
        if (isOpen) {
            if (!transactionToEdit && !recurringTransactionToEdit) {
                setCategory('');
                setProductId(undefined);
            }
        }
    }, [type, isOpen, transactionToEdit, recurringTransactionToEdit]);

    const handleProductSelect = (selectedProductId: string) => {
        setProductId(selectedProductId);
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
            setDescription(product.name);
            setAmount(product.price.toString());
        } else {
            setProductId(undefined);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!description || !amount || !category) {
            setError(t('general.error.requiredFields'));
            return;
        }
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError(t('general.error.positiveAmount'));
            return;
        }

        if (isRecurring) {
            const numericInterval = parseInt(interval, 10);
            if (!startDate || isNaN(numericInterval) || numericInterval < 1) {
                setError(t('modals.addTransaction.errorRecurring'));
                return;
            }
            
            const ruleData = {
                description,
                amount: numericAmount,
                type,
                category,
                frequency,
                interval: numericInterval,
                startDate,
                endDate: endDate || null,
            };

            if (recurringTransactionToEdit) {
                onUpdateRecurringTransaction({ id: recurringTransactionToEdit.id, ...ruleData });
            } else {
                onAddRecurringTransaction(ruleData);
            }

        } else {
            if (!date) {
                setError(t('modals.addTransaction.errorDate'));
                return;
            }
            const combinedDate = new Date(`${date}T${time || '00:00:00'}`).toISOString();
            
            let resolvedClientId: string | undefined;
            if (type === TransactionType.INCOME) {
                const client = clients.find(c => c.name === description);
                if (client) {
                    resolvedClientId = client.id;
                }
            }

            const transactionData = {
                amount: numericAmount,
                category,
                date: combinedDate,
                description,
                type,
                productId: category === 'Product Sales' ? productId : undefined,
                clientId: resolvedClientId
            };

            if (transactionToEdit) {
                onUpdateTransaction({ 
                    ...transactionData, 
                    id: transactionToEdit.id,
                    invoiceId: transactionToEdit.invoiceId,
                    recurringTransactionId: transactionToEdit.recurringTransactionId
                });
            } else {
                onAddTransaction(transactionData);
            }
        }
    };

    const handleDeleteClick = () => {
        if (!onDelete) return;
        
        const idToDelete = recurringTransactionToEdit?.id || transactionToEdit?.id;
        const confirmMessage = recurringTransactionToEdit 
            ? "Are you sure you want to delete this recurring rule? Future transactions won't be generated."
            : t('transactionsPage.deleteConfirm', { count: 1 });

        if (idToDelete && window.confirm(confirmMessage)) {
            onDelete(idToDelete);
        }
    };

    if (!isOpen) return null;
    
    const modalTitle = isEditMode 
        ? (recurringTransactionToEdit ? t('modals.addTransaction.editRecurringTitle') : t('general.edit')) 
        : t('modals.addTransaction.title');
        
    const submitButtonText = isEditMode 
        ? (recurringTransactionToEdit ? t('modals.addTransaction.updateRule') : t('general.save')) 
        : isRecurring ? t('modals.addTransaction.addRecurringRule') : t('modals.addTransaction.addTransaction');
        
    const showProductSelector = type === TransactionType.INCOME && category === 'Product Sales';

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
                        <fieldset>
                            <legend className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-2">{t('modals.addTransaction.type')}</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" role="radio" aria-checked={type === TransactionType.INCOME} onClick={() => setType(TransactionType.INCOME)} className={`py-3 px-4 rounded-lg text-center font-semibold transition-all duration-200 ${type === TransactionType.INCOME ? 'bg-brand-green text-white ring-2 ring-brand-green ring-offset-2 ring-offset-white dark:ring-offset-brand-secondary' : 'bg-gray-100 dark:bg-brand-primary hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>{t('general.income')}</button>
                                <button type="button" role="radio" aria-checked={type === TransactionType.EXPENSE} onClick={() => setType(TransactionType.EXPENSE)} className={`py-3 px-4 rounded-lg text-center font-semibold transition-all duration-200 ${type === TransactionType.EXPENSE ? 'bg-brand-red text-white ring-2 ring-brand-red ring-offset-2 ring-offset-white dark:ring-offset-brand-secondary' : 'bg-gray-100 dark:bg-brand-primary hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>{t('general.expense')}</button>
                            </div>
                        </fieldset>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('general.category')}</label>
                                <select id="category" value={category} onChange={e => setCategory(e.target.value)} required className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition">
                                    <option value="" disabled>{t('modals.addTransaction.selectCategory')}</option>
                                    {availableCategories.map(group => (
                                        <optgroup key={group.id} label={group.name} className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                            {group.children.length === 0 ? <option value={group.name} className="bg-white dark:bg-brand-primary text-gray-800 dark:text-gray-200">{group.name}</option> : group.children.map(child => <option key={child.id} value={child.name} className="bg-white dark:bg-brand-primary text-gray-800 dark:text-gray-200">{child.name}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{`${t('general.amount')} (${currency})`}</label>
                                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="0.00" />
                            </div>
                        </div>

                        {/* Product Selector */}
                        {showProductSelector && (
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addProduct.product')}</label>
                                <select 
                                    value={productId || ''} 
                                    onChange={(e) => handleProductSelect(e.target.value)}
                                    className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                >
                                    <option value="">{t('modals.addProduct.selectProduct')}</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.price}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('general.description')}</label>
                            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="e.g., Lunch with client" autoComplete="on" />
                        </div>

                        {!isRecurring ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('general.date')}</label>
                                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                </div>
                                <div>
                                    <label htmlFor="time" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('general.time')}</label>
                                    <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 dark:bg-brand-primary/50 p-4 rounded-lg space-y-4 border border-gray-200 dark:border-gray-700 animate-fade-in-scale">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="frequency" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addTransaction.frequency')}</label>
                                        <select id="frequency" value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition">
                                            <option value={Frequency.DAILY}>{t('modals.addTransaction.daily')}</option>
                                            <option value={Frequency.WEEKLY}>{t('modals.addTransaction.weekly')}</option>
                                            <option value={Frequency.MONTHLY}>{t('modals.addTransaction.monthly')}</option>
                                            <option value={Frequency.YEARLY}>{t('modals.addTransaction.yearly')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="interval" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addTransaction.every')}</label>
                                        <div className="flex items-center">
                                            <input type="number" id="interval" value={interval} onChange={e => setIntervalState(e.target.value)} min="1" className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 capitalize">{frequency.replace('ly', 's')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addTransaction.startDate')}</label>
                                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                    </div>
                                    <div>
                                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addTransaction.endDate')}</label>
                                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isEditMode && !recurringTransactionToEdit && (
                            <div className="flex items-center mt-2">
                                <input id="recurring" type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded" />
                                <label htmlFor="recurring" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">{t('modals.addTransaction.makeRecurring')}</label>
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600 dark:text-brand-red text-center" role="alert">{error}</p>}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-between gap-4 rounded-b-xl flex-shrink-0">
                        <div>
                            {isEditMode && onDelete && (
                                <button type="button" onClick={handleDeleteClick} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors" aria-label={t('general.delete')}>
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

export default AddTransactionModal;

