
import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { AddIcon, EditIcon, DeleteIcon, InvoiceIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import { useI18n } from '../hooks/useI18n';

interface InvoicesPageProps {
    invoices: Invoice[];
    currency: string;
    onNavigateToInvoice: (invoiceId?: string | null) => void;
    onDeleteInvoice: (invoiceId: string) => void;
}

const getStatusClass = (status: InvoiceStatus) => {
    switch (status) {
        case InvoiceStatus.PAID:
            return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
        case InvoiceStatus.OVERDUE:
            return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
        case InvoiceStatus.SENT:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
        case InvoiceStatus.DRAFT:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400';
        default:
            return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const InvoicesPage: React.FC<InvoicesPageProps> = ({ invoices, currency, onNavigateToInvoice, onDeleteInvoice }) => {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Invoice | 'total'; direction: 'ascending' | 'descending' }>({ key: 'issueDate', direction: 'descending' });

    const filteredAndSortedInvoices = useMemo(() => {
        const sortedInvoices = [...invoices].filter(inv =>
            inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.slice(-6).includes(searchTerm)
        );

        sortedInvoices.sort((a, b) => {
            let aValue, bValue;

            if (sortConfig.key === 'total') {
                aValue = a.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
                bValue = b.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
            } else {
                aValue = a[sortConfig.key as keyof Invoice];
                bValue = b[sortConfig.key as keyof Invoice];
            }

            const normalize = (value: Invoice[keyof Invoice] | number) => {
                if (sortConfig.key === 'issueDate' || sortConfig.key === 'dueDate') {
                    return new Date(String(value ?? '')).getTime();
                }
                if (typeof value === 'number') return value;
                return String(value ?? '');
            };

            const aNorm = normalize(aValue as Invoice[keyof Invoice] | number);
            const bNorm = normalize(bValue as Invoice[keyof Invoice] | number);

            if (aNorm < bNorm) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aNorm > bNorm) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return sortedInvoices;
    }, [invoices, searchTerm, sortConfig]);

    const requestSort = (key: keyof Invoice | 'total') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Invoice | 'total') => {
        if (sortConfig.key !== key) return ' ';
        return sortConfig.direction === 'ascending' ? 'â–²' : 'â–¼';
    };
    
    const handleDelete = (id: string, clientName: string) => {
        if (window.confirm(t('invoicesPage.deleteConfirm', { clientName }))) {
            onDeleteInvoice(id);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="flex flex-col gap-4 sm:flex-row justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('invoicesPage.title')}</h1>
                <button
                    onClick={() => onNavigateToInvoice()}
                    className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                    <AddIcon />
                    <span>{t('invoicesPage.new')}</span>
                </button>
            </div>

            {invoices.length > 0 && (
                 <div className="mb-6">
                    <input
                        type="text"
                        placeholder={t('invoicesPage.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-md bg-white dark:bg-brand-secondary border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                    />
                </div>
            )}
           
            {filteredAndSortedInvoices.length > 0 ? (
                <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-md dark:shadow-lg">
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 sm:pl-6">
                                        <button onClick={() => requestSort('id')} className="flex items-center gap-2">{t('invoicesPage.invoiceNo')} <span className="text-gray-400 dark:text-brand-muted">{getSortIndicator('id')}</span></button>
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                        <button onClick={() => requestSort('clientName')} className="flex items-center gap-2">{t('invoicesPage.client')} <span className="text-gray-400 dark:text-brand-muted">{getSortIndicator('clientName')}</span></button>
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                        <button onClick={() => requestSort('dueDate')} className="flex items-center gap-2">{t('invoicesPage.dueDate')} <span className="text-gray-400 dark:text-brand-muted">{getSortIndicator('dueDate')}</span></button>
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                        <button onClick={() => requestSort('total')} className="flex items-center gap-2">{t('invoicesPage.total')} <span className="text-gray-400 dark:text-brand-muted">{getSortIndicator('total')}</span></button>
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                                         <button onClick={() => requestSort('status')} className="flex items-center gap-2">{t('general.status')} <span className="text-gray-400 dark:text-brand-muted">{getSortIndicator('status')}</span></button>
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">{t('general.actions')}</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {(invoices ?? []).map((invoice) => {
                                    const total = invoice.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
                                    return (
                                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-brand-accent sm:pl-6">#{invoice.id.slice(-6)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800 dark:text-gray-200">{invoice.clientName}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-brand-muted">{new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString()}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(invoice.status)}`}>{t(`general.${invoice.status.toLowerCase()}`, {defaultValue: invoice.status})}</span></td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <button onClick={(e) => { e.stopPropagation(); onNavigateToInvoice(invoice.id); }} className="text-brand-accent hover:text-blue-400 p-1 mr-2"><EditIcon /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id, invoice.clientName); }} className="text-brand-red hover:text-red-400 p-1"><DeleteIcon /></button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden p-4 space-y-4">
                        {(invoices ?? []).map((invoice) => {
                            const total = invoice.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
                            return (
                                <div key={invoice.id} className="p-4 rounded-lg shadow-sm border bg-gray-50 dark:bg-brand-primary border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.clientName}</p>
                                            <p className="text-sm text-brand-accent">#{invoice.id.slice(-6)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                             <button onClick={(e) => { e.stopPropagation(); onNavigateToInvoice(invoice.id); }} className="text-brand-accent hover:text-blue-400 p-1"><EditIcon /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id, invoice.clientName); }} className="text-brand-red hover:text-red-400 p-1"><DeleteIcon /></button>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-brand-muted">{t('invoicesPage.dueDate')}: {new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString()}</p>
                                            <p><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(invoice.status)}`}>{invoice.status}</span></p>
                                        </div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                 <EmptyState
                    Icon={InvoiceIcon}
                    title={t('invoicesPage.noInvoices')}
                    message={t('invoicesPage.createFirst')}
                    action={{
                        label: t('invoicesPage.new'),
                        onClick: () => onNavigateToInvoice()
                    }}
                />
            )}
        </div>
    );
};

export default InvoicesPage;

