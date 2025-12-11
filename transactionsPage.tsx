
import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, TransactionType } from '../types';
import { AddIcon, ArrowDownIcon, ArrowUpIcon, ExportIcon, DeleteIcon, CameraIcon, InvoiceIcon } from '../components/Icons';
import { useI18n } from '../hooks/useI18n';

interface TransactionsPageProps {
    transactions: Transaction[];
    currency: string;
    onAddTransactionClick: () => void;
    onDeleteTransactions: (transactionIds: string[]) => void;
    onAddFromReceiptClick: () => void;
    onNavigateToInvoice: (invoiceId: string) => void;
    onGenerateInvoice: (transactions: Transaction[]) => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ transactions, currency, onAddTransactionClick, onDeleteTransactions, onAddFromReceiptClick, onNavigateToInvoice, onGenerateInvoice }) => {
    const { t } = useI18n();
    const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'ascending' | 'descending' }>({ key: 'date', direction: 'descending' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    const filteredAndSortedTransactions = useMemo(() => {
        let sortedTransactions = [...transactions];

        // Filtering
        sortedTransactions = sortedTransactions.filter(t => {
            const typeMatch = filterType === 'all' || t.type === filterType;
            const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                t.category.toLowerCase().includes(searchTerm.toLowerCase());
            
            const transactionDate = new Date(t.date);
            const startMatch = !startDate || transactionDate >= new Date(startDate + 'T00:00:00');
            const endMatch = !endDate || transactionDate <= new Date(endDate + 'T23:59:59');

            return typeMatch && searchMatch && startMatch && endMatch;
        });
        
        // Sorting
        sortedTransactions.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === 'date') {
                aValue = new Date(aValue as string).getTime();
                bValue = new Date(bValue as string).getTime();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortedTransactions;
    }, [transactions, filterType, searchTerm, startDate, endDate, sortConfig]);

    const selectedTransactions = useMemo(() => {
        return transactions.filter(t => selectedIds.has(t.id));
    }, [selectedIds, transactions]);

    const canGenerateInvoice = useMemo(() => {
        if (selectedTransactions.length === 0) return false;
        return selectedTransactions.every(t => t.type === TransactionType.INCOME);
    }, [selectedTransactions]);
    
    const requestSort = (key: keyof Transaction) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Transaction) => {
        if (sortConfig.key !== key) return ' ';
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }

    const handleSelectOne = (id: string) => {
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
        } else {
            newSelectedIds.add(id);
        }
        setSelectedIds(newSelectedIds);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedTransactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set((\ ?? []).map(t => t.id)));
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(t('transactionsPage.deleteConfirm', { count: selectedIds.size }))) {
            onDeleteTransactions(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };
    
    const handleGenerateInvoice = () => {
        if (canGenerateInvoice) {
            onGenerateInvoice(selectedTransactions);
            setSelectedIds(new Set());
        }
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Date", "Description", "Amount", "Type", "Category", "Currency", "InvoiceID"];
        const rows = (\ ?? []).map(t => 
            [t.id, new Date(t.date).toISOString(), `"${t.description.replace(/"/g, '""')}"`, t.amount, t.type, t.category, currency, t.invoiceId || ''].join(',')
        );

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `yans_pro_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="flex flex-col gap-4 sm:flex-row justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('transactionsPage.title')}</h1>
                 <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={onAddFromReceiptClick}
                        className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                        <CameraIcon />
                        <span className="hidden sm:inline">{t('dashboard.addFromReceipt')}</span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                        <ExportIcon />
                        <span className="hidden sm:inline">{t('transactionsPage.exportCsv')}</span>
                    </button>
                    <button
                        onClick={onAddTransactionClick}
                        className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                        <AddIcon />
                        <span>{t('dashboard.addTransaction')}</span>
                    </button>
                </div>
            </div>
            
            {/* Filter and Search Controls */}
            <div className="mb-6 p-4 bg-white dark:bg-brand-secondary rounded-xl space-y-4 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder={t('transactionsPage.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
                        className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                    >
                        <option value="all">{t('transactionsPage.allTypes')}</option>
                        <option value={TransactionType.INCOME}>{t('general.income')}</option>
                        <option value={TransactionType.EXPENSE}>{t('general.expense')}</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="start-date" className="text-sm font-medium text-gray-500 dark:text-brand-muted mb-1 block">{t('transactionsPage.startDate')}</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                    </div>
                     <div>
                        <label htmlFor="end-date" className="text-sm font-medium text-gray-500 dark:text-brand-muted mb-1 block">{t('transactionsPage.endDate')}</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-md">
                {selectedIds.size > 0 && (
                     <div className="flex items-center justify-between bg-blue-100 dark:bg-gray-800/60 p-3 sm:p-4 rounded-t-xl">
                        <span className="text-sm font-semibold text-blue-800 dark:text-white">{t('transactionsPage.selected', { count: selectedIds.size })}</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleGenerateInvoice}
                                disabled={!canGenerateInvoice}
                                title={!canGenerateInvoice ? t('transactionsPage.createInvoiceTooltip') : ''}
                                className="flex items-center gap-2 text-sm bg-brand-accent hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-md transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                <InvoiceIcon className="w-4 h-4" />
                                {t('transactionsPage.createInvoice')}
                            </button>
                            <button onClick={handleDeleteSelected} className="flex items-center gap-2 text-sm bg-brand-red hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-md transition-colors">
                                <DeleteIcon />
                                {t('transactionsPage.deleteSelected')}
                            </button>
                        </div>
                    </div>
                )}
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 sm:pl-6 w-12">
                                    <input type="checkbox"
                                        className="h-4 w-4 rounded border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-brand-primary text-brand-accent focus:ring-brand-accent"
                                        checked={selectedIds.size > 0 && selectedIds.size === filteredAndSortedTransactions.length && filteredAndSortedTransactions.length > 0}
                                        onChange={handleSelectAll}
                                        aria-label="Select all transactions"
                                     />
                                </th>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    <button onClick={() => requestSort('description')} className="flex items-center gap-2">{t('general.description')} <span className="text-gray-400 dark:text-brand-muted">{getSortIndicator('description')}</span></button>
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                     <button onClick={() => requestSort('category')} className="flex items-center gap-2">{t('general.category')} <span className="text-gray-400 dark:text-brand-muted">{getSortIndicator('category')}</span></button>
                                </th>
                                 <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                     <button onClick={() => requestSort('amount')} className="flex items-center gap-2">{t('general.amount')} <span className="text-gray-400 dark:text-brand-muted">{getSortIndicator('amount')}</span></button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {(\ ?? []).map((transaction) => (
                                <tr key={transaction.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${selectedIds.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    <td className="py-4 pl-4 pr-3 sm:pl-6">
                                        <input type="checkbox"
                                            className="h-4 w-4 rounded border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-brand-primary text-brand-accent focus:ring-brand-accent"
                                            checked={selectedIds.has(transaction.id)}
                                            onChange={() => handleSelectOne(transaction.id)}
                                            aria-label={`Select transaction ${transaction.description}`}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                                {transaction.type === TransactionType.INCOME ? <ArrowUpIcon className="h-5 w-5 text-brand-green" /> : <ArrowDownIcon className="h-5 w-5 text-brand-red" />}
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    <span>{transaction.description}</span>
                                                    {transaction.invoiceId && (
                                                        <button onClick={() => onNavigateToInvoice(transaction.invoiceId!)} className="text-brand-accent hover:text-blue-400" title={t('transactionsPage.viewInvoice')}>
                                                            <InvoiceIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-gray-500 dark:text-brand-muted text-xs mt-1">
                                                    {new Date(transaction.date).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-brand-muted">{transaction.category}</td>
                                    <td className={`whitespace-nowrap px-3 py-4 text-sm font-semibold ${transaction.type === TransactionType.INCOME ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>
                                        {transaction.type === TransactionType.INCOME ? '+' : '-'}
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(transaction.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                     {(\ ?? []).map((transaction) => (
                        <div key={transaction.id} className={`p-4 rounded-lg shadow-sm border ${selectedIds.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-brand-accent' : 'bg-gray-50 dark:bg-brand-primary border-gray-200 dark:border-gray-700'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox"
                                        className="h-4 w-4 rounded border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-brand-primary text-brand-accent focus:ring-brand-accent"
                                        checked={selectedIds.has(transaction.id)}
                                        onChange={() => handleSelectOne(transaction.id)}
                                        aria-label={`Select transaction ${transaction.description}`}
                                    />
                                    <div className="flex-grow">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <span>{transaction.description}</span>
                                            {transaction.invoiceId && (
                                                <button onClick={() => onNavigateToInvoice(transaction.invoiceId!)} className="text-brand-accent hover:text-blue-400" title={t('transactionsPage.viewInvoice')}>
                                                    <InvoiceIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-brand-muted">{transaction.category}</p>
                                    </div>
                                </div>
                                <p className={`text-lg font-bold ${transaction.type === TransactionType.INCOME ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>
                                    {transaction.type === TransactionType.INCOME ? '+' : '-'}
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(transaction.amount)}
                                </p>
                            </div>
                            <div className="mt-2 text-right text-xs text-gray-400 dark:text-gray-500">
                                 {new Date(transaction.date).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                     ))}
                </div>

                 {filteredAndSortedTransactions.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-brand-muted">
                        <p>{t('transactionsPage.noTransactions')}</p>
                        <p className="text-sm mt-1">{t('transactionsPage.adjustFilters')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionsPage;

