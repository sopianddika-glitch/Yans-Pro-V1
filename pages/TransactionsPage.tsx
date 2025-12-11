
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { AddIcon, ArrowDownIcon, ArrowUpIcon, ExportIcon, DeleteIcon, CameraIcon, InvoiceIcon, SortIcon, FilterIcon, EditIcon, RepeatIcon } from '../components/Icons';
import TransactionDeleteButton from '../components/TransactionDeleteButton';
import { useI18n } from '../hooks/useI18n';

interface TransactionsPageProps {
    transactions: Transaction[];
    currency: string;
    profileSettings?: {
        allowEdit?: boolean;
        showDeleted?: boolean;
    };
    onAddTransactionClick: () => void;
    onDeleteTransactions: (transactionIds: string[], isHardDelete?: boolean) => void;
    onRestoreTransaction: (transactionId: string) => void;
    onAddFromReceiptClick: () => void;
    onNavigateToInvoice: (invoiceId: string) => void;
    onGenerateInvoice: (transactions: Transaction[]) => void;
    onEditTransaction: (transaction: Transaction) => void;
    onViewAudit: (transactionId: string) => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ 
    transactions, currency, profileSettings,
    onAddTransactionClick, onDeleteTransactions, onRestoreTransaction, onAddFromReceiptClick, 
    onNavigateToInvoice, onGenerateInvoice, onEditTransaction, onViewAudit 
}) => {
    const { t } = useI18n();
    const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'ascending' | 'descending' }>({ key: 'date', direction: 'descending' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [showDeleted, setShowDeleted] = useState(profileSettings?.showDeleted || false);
    
    const filteredAndSortedTransactions = useMemo(() => {
        let sortedTransactions = [...transactions];

        // Filtering
        sortedTransactions = sortedTransactions.filter(t => {
            if (!showDeleted && t.deletedAt) return false;
            if (showDeleted && !t.deletedAt) return false; // In 'Deleted' view, show ONLY deleted items

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
    }, [transactions, filterType, searchTerm, startDate, endDate, sortConfig, showDeleted]);

    const selectedTransactions = useMemo(() => {
        return transactions.filter(t => selectedIds.has(t.id));
    }, [selectedIds, transactions]);

    const canGenerateInvoice = useMemo(() => {
        return selectedTransactions.length > 0;
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
        if (selectedIds.size === 0) return;
        const msg = showDeleted 
            ? "Permanently delete these items? This cannot be undone." 
            : t('transactionsPage.deleteConfirm', { count: selectedIds.size });
            
        if (window.confirm(msg)) {
            onDeleteTransactions(Array.from(selectedIds), showDeleted); // Hard delete if already in deleted view
            setSelectedIds(new Set());
        }
    };

    const handleDeleteSingle = async (id: string) => {
        onDeleteTransactions([id], showDeleted);
    };
    
    const handleRestoreOne = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        onRestoreTransaction(id);
    }

    const handleGenerateInvoice = () => {
        if (canGenerateInvoice) {
            onGenerateInvoice(selectedTransactions);
            setSelectedIds(new Set());
        }
    };

    const handleClearFilters = () => {
        setFilterType('all');
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setSortConfig({ key: 'date', direction: 'descending' });
    };

    const isFilterActive = filterType !== 'all' || startDate !== '' || endDate !== '';

    const handleExportCSV = () => {
        const headers = ["ID", "Date", "Description", "Amount", "Type", "Category", "Currency", "InvoiceID"];
        
        const escapeCsvField = (field: string | number | undefined | null) => {
            if (field === undefined || field === null) return '';
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const rows = (\ ?? []).map(t => 
            [
                escapeCsvField(t.id),
                escapeCsvField(new Date(t.date).toISOString()),
                escapeCsvField(t.description),
                escapeCsvField(t.amount),
                escapeCsvField(t.type),
                escapeCsvField(t.category),
                escapeCsvField(currency),
                escapeCsvField(t.invoiceId)
            ].join(',')
        );

        const csvContent = [headers.join(','), ...rows].join('\n');
        const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
        
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `yans_pro_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const allowEdit = profileSettings?.allowEdit !== false; // Default true

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="flex flex-col gap-4 sm:flex-row justify-between sm:items-center mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('transactionsPage.title')}</h1>
                    {/* Toggle Deleted View */}
                    <button 
                        onClick={() => { setShowDeleted(!showDeleted); setSelectedIds(new Set()); }}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${showDeleted ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {showDeleted ? 'Viewing Deleted' : 'Active'}
                    </button>
                </div>
                 <div className="flex gap-2 flex-wrap">
                    {!showDeleted && (
                        <>
                            <button
                                onClick={onAddFromReceiptClick}
                                className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                                aria-label={t('dashboard.addFromReceipt')}
                            >
                                <CameraIcon />
                                <span className="hidden sm:inline">{t('dashboard.addFromReceipt')}</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                                aria-label={t('transactionsPage.exportCsv')}
                            >
                                <ExportIcon />
                                <span className="hidden sm:inline">{t('transactionsPage.exportCsv')}</span>
                            </button>
                            <button
                                onClick={onAddTransactionClick}
                                className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md"
                                aria-label={t('dashboard.addTransaction')}
                            >
                                <AddIcon />
                                <span>{t('dashboard.addTransaction')}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Improved Filter and Search Controls */}
            <div className="mb-6 bg-white dark:bg-brand-secondary rounded-xl shadow-md overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-gray-100 dark:border-gray-700">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder={t('transactionsPage.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {/* Sort Dropdown (Mobile Only) */}
                        <div className="md:hidden flex-grow">
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <SortIcon className="w-4 h-4" />
                                </div>
                                <select 
                                    className="w-full pl-10 bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none appearance-none"
                                    onChange={(e) => {
                                        const [key, direction] = e.target.value.split('-');
                                        setSortConfig({ key: key as keyof Transaction, direction: direction as 'ascending' | 'descending' });
                                    }}
                                    value={`${sortConfig.key}-${sortConfig.direction}`}
                                    aria-label="Sort Transactions"
                                >
                                    <option value="date-desc">Newest First</option>
                                    <option value="date-asc">Oldest First</option>
                                    <option value="amount-desc">Amount: High to Low</option>
                                    <option value="amount-asc">Amount: Low to High</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Toggle Button */}
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-colors w-full md:w-auto ${showFilters || isFilterActive ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'bg-gray-50 dark:bg-brand-primary border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            aria-expanded={showFilters}
                        >
                            <FilterIcon className="w-5 h-5"/>
                            <span>Filter</span>
                            {isFilterActive && <span className="flex h-2 w-2 rounded-full bg-brand-accent"></span>}
                        </button>
                    </div>
                </div>

                {/* Collapsible Advanced Filters */}
                <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50/50 dark:bg-gray-800/20">
                        {/* Transaction Type Segmented Control */}
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Type</label>
                            <div className="flex bg-gray-200 dark:bg-brand-primary rounded-lg p-1">
                                {(['all', TransactionType.INCOME, TransactionType.EXPENSE] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === type ? 'bg-white dark:bg-gray-700 text-brand-accent shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                    >
                                        {type === 'all' ? t('transactionsPage.allTypes') : t(`general.${type.toLowerCase()}`, {defaultValue: type})}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="md:col-span-6 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('transactionsPage.startDate')}</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('transactionsPage.endDate')}</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                            </div>
                        </div>

                        {/* Reset Actions */}
                        <div className="md:col-span-2 flex items-end">
                            {isFilterActive && (
                                <button onClick={handleClearFilters} className="w-full py-2 px-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800">
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-md">
                {selectedIds.size > 0 && (
                     <div className="flex items-center justify-between bg-blue-100 dark:bg-gray-800/60 p-3 sm:p-4 rounded-t-xl sticky top-0 z-10 backdrop-blur-sm">
                        <span className="text-sm font-semibold text-blue-800 dark:text-white">{t('transactionsPage.selected', { count: selectedIds.size })}</span>
                        <div className="flex items-center gap-2">
                            {!showDeleted && (
                                <button
                                    onClick={handleGenerateInvoice}
                                    disabled={!canGenerateInvoice}
                                    title={!canGenerateInvoice ? t('transactionsPage.createInvoiceTooltip') : ''}
                                    className="flex items-center gap-2 text-sm bg-brand-accent hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-md transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    <InvoiceIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t('transactionsPage.createInvoice')}</span>
                                </button>
                            )}
                            <button onClick={handleDeleteSelected} className="flex items-center gap-2 text-sm bg-brand-red hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-md transition-colors">
                                <DeleteIcon />
                                <span className="hidden sm:inline">{t('transactionsPage.deleteSelected')}</span>
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
                                    <button onClick={() => requestSort('description')} className="flex items-center gap-2 group">{t('general.description')} <span className="text-gray-400 dark:text-brand-muted group-hover:text-brand-accent">{getSortIndicator('description')}</span></button>
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                     <button onClick={() => requestSort('category')} className="flex items-center gap-2 group">{t('general.category')} <span className="text-gray-400 dark:text-brand-muted group-hover:text-brand-accent">{getSortIndicator('category')}</span></button>
                                </th>
                                 <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                     <button onClick={() => requestSort('amount')} className="flex items-center gap-2 group">{t('general.amount')} <span className="text-gray-400 dark:text-brand-muted group-hover:text-brand-accent">{getSortIndicator('amount')}</span></button>
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                     <button onClick={() => requestSort('date')} className="flex items-center gap-2 group">{t('general.date')} <span className="text-gray-400 dark:text-brand-muted group-hover:text-brand-accent">{getSortIndicator('date')}</span></button>
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">{t('general.actions')}</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {(\ ?? []).map((transaction) => (
                                <tr key={transaction.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${selectedIds.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${transaction.deletedAt ? 'opacity-60' : ''}`}>
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
                                                <div className={`font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 ${transaction.deletedAt ? 'line-through decoration-red-500' : ''}`}>
                                                    <span>{transaction.description}</span>
                                                    {transaction.invoiceId && (
                                                        <button onClick={() => onNavigateToInvoice(transaction.invoiceId!)} className="text-brand-accent hover:text-blue-400" title={t('transactionsPage.viewInvoice')}>
                                                            <InvoiceIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-brand-muted">{transaction.category}</td>
                                    <td className={`whitespace-nowrap px-3 py-4 text-sm font-semibold ${transaction.type === TransactionType.INCOME ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>
                                        {transaction.type === TransactionType.INCOME ? '+' : '-'}
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(transaction.amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-brand-muted">
                                        {new Date(transaction.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex items-center justify-end gap-1">
                                            {showDeleted ? (
                                                <button onClick={(e) => handleRestoreOne(transaction.id, e)} className="text-brand-green hover:text-green-400 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 mr-1" title="Restore">
                                                    <RepeatIcon className="w-4 h-4"/>
                                                </button>
                                            ) : (
                                                <>
                                                    {allowEdit && (
                                                        <button onClick={(e) => { e.stopPropagation(); onEditTransaction(transaction); }} className="text-brand-accent hover:text-blue-400 p-2 mr-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                                            <EditIcon />
                                                        </button>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); onViewAudit(transaction.id); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 mr-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="View History">
                                                        <SortIcon className="w-4 h-4 rotate-90"/>
                                                    </button>
                                                </>
                                            )}
                                            
                                            <TransactionDeleteButton 
                                                transactionId={transaction.id}
                                                onDelete={handleDeleteSingle}
                                                disabled={!allowEdit && !showDeleted}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                     {(\ ?? []).map((transaction) => (
                        <div key={transaction.id} className={`p-4 rounded-lg shadow-sm border ${selectedIds.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-brand-accent' : 'bg-gray-50 dark:bg-brand-primary border-gray-200 dark:border-gray-700'} relative ${transaction.deletedAt ? 'opacity-70 border-red-200' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <input type="checkbox"
                                        className="h-6 w-6 rounded border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-brand-primary text-brand-accent focus:ring-brand-accent"
                                        checked={selectedIds.has(transaction.id)}
                                        onChange={() => handleSelectOne(transaction.id)}
                                        aria-label={`Select transaction ${transaction.description}`}
                                    />
                                    <div className="flex-grow min-w-0">
                                        <div className={`font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 ${transaction.deletedAt ? 'line-through decoration-red-500' : ''}`}>
                                            <span className="truncate">{transaction.description}</span>
                                            {transaction.invoiceId && (
                                                <button onClick={() => onNavigateToInvoice(transaction.invoiceId!)} className="text-brand-accent hover:text-blue-400 flex-shrink-0" title={t('transactionsPage.viewInvoice')}>
                                                    <InvoiceIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-brand-muted truncate">{transaction.category}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                                    <p className={`text-lg font-bold ${transaction.type === TransactionType.INCOME ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>
                                        {transaction.type === TransactionType.INCOME ? '+' : '-'}
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(transaction.amount)}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        {showDeleted ? (
                                            <button onClick={(e) => handleRestoreOne(transaction.id, e)} className="text-brand-green hover:text-green-400 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800" title="Restore"><RepeatIcon className="w-5 h-5"/></button>
                                        ) : (
                                            <>
                                                {allowEdit && (
                                                    <button onClick={(e) => { e.stopPropagation(); onEditTransaction(transaction); }} className="text-brand-accent hover:text-blue-400 p-2 mr-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><EditIcon className="w-5 h-5" /></button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); onViewAudit(transaction.id); }} className="text-gray-500 hover:text-gray-700 p-2 mr-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><SortIcon className="w-5 h-5 rotate-90" /></button>
                                            </>
                                        )}
                                        <TransactionDeleteButton 
                                            transactionId={transaction.id}
                                            onDelete={handleDeleteSingle}
                                            disabled={!allowEdit && !showDeleted}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-right text-xs text-gray-400 dark:text-gray-500 flex justify-between items-center pl-9">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${transaction.type === TransactionType.INCOME ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                    {t(`general.${transaction.type.toLowerCase()}`)}
                                </span>
                                {new Date(transaction.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                     ))}
                </div>

                 {filteredAndSortedTransactions.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-brand-muted">
                        <p>{t('transactionsPage.noTransactions')}</p>
                        <p className="text-sm mt-1">{t('transactionsPage.adjustFilters')}</p>
                        {isFilterActive && (
                            <button onClick={handleClearFilters} className="mt-4 text-brand-accent hover:underline text-sm font-medium">
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionsPage;

