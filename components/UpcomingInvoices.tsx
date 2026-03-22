import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { InvoiceIcon, SparklesIcon, EditIcon } from './Icons';
import { getInvoiceReminderDraft } from '../services/geminiService';
import { useI18n } from '../hooks/useI18n';

interface UpcomingInvoicesProps {
    invoices: Invoice[];
    currency: string;
    onNavigateToInvoice: (invoiceId: string) => void;
    profileName: string;
}

const getStatusInfo = (status: InvoiceStatus, dueDate: string, t: (key: string, params?: { [key: string]: string | number }) => string): { text: string; className: string } => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDate + 'T00:00:00Z');
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (status === InvoiceStatus.OVERDUE) {
        return { text: t('invoice.overdueBy', {days: Math.abs(diffDays)}) , className: 'text-red-600 dark:text-brand-red' };
    }
    if (status === InvoiceStatus.SENT) {
        if (diffDays < 0) return { text: t('invoice.overdueBy', {days: Math.abs(diffDays)}), className: 'text-red-600 dark:text-brand-red' };
        if (diffDays === 0) return { text: t('invoice.dueToday'), className: 'text-yellow-500 dark:text-yellow-400' };
        return { text: t('invoice.dueIn', {days: diffDays}), className: 'text-gray-500 dark:text-brand-muted' };
    }
    return { text: t(`general.${status.toLowerCase()}`, {defaultValue: status}), className: 'text-gray-500 dark:text-brand-muted' };
};

const UpcomingInvoices: React.FC<UpcomingInvoicesProps> = ({ invoices, currency, onNavigateToInvoice, profileName }) => {
    const { t } = useI18n();
    const [aiReminder, setAiReminder] = useState<{ [key: string]: string | null }>({});
    const [isLoadingAi, setIsLoadingAi] = useState<string | null>(null);
    
    const relevantInvoices = useMemo(() => {
        return invoices
            .filter(inv => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
    }, [invoices]);

    const handleGetReminder = async (invoice: Invoice) => {
        setIsLoadingAi(invoice.id);
        const reminder = await getInvoiceReminderDraft(invoice, profileName);
        setAiReminder(prev => ({ ...prev, [invoice.id]: reminder }));
        setIsLoadingAi(null);
    };

    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex-shrink-0">{t('dashboard.actionableInvoices.title')}</h3>
            {relevantInvoices.length > 0 ? (
                <ul className="space-y-4 overflow-y-auto flex-grow">
                    {relevantInvoices.map(invoice => {
                        const total = invoice.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
                        const statusInfo = getStatusInfo(invoice.status, invoice.dueDate, t);
                        const isOverdue = invoice.status === InvoiceStatus.OVERDUE;
                        
                        return (
                            <li key={invoice.id} className="bg-gray-50 dark:bg-brand-primary p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-grow truncate min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{invoice.clientName}</p>
                                        <p className={`text-sm font-medium ${statusInfo.className}`}>{statusInfo.text} - <span className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total)}</span></p>
                                    </div>
                                    <div className="flex items-center flex-shrink-0">
                                        {isOverdue && (
                                            <button onClick={() => handleGetReminder(invoice)} disabled={!!isLoadingAi} className="p-1 text-brand-accent hover:text-blue-400 mr-1" aria-label={t('invoice.getReminder')}>
                                                {isLoadingAi === invoice.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <SparklesIcon className="h-4 w-4"/>}
                                            </button>
                                        )}
                                        <button onClick={() => onNavigateToInvoice(invoice.id)} className="p-1 text-gray-500 dark:text-brand-muted hover:text-black dark:hover:text-white" aria-label={t('general.edit')}><EditIcon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                                {aiReminder[invoice.id] && (
                                    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-md text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                                        {aiReminder[invoice.id]}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            ) : (
                <div className="h-full flex flex-col justify-center items-center text-center text-gray-500 dark:text-brand-muted flex-grow">
                    <InvoiceIcon className="h-10 w-10 mb-2"/>
                    <p className="font-semibold text-gray-700 dark:text-gray-400">{t('dashboard.actionableInvoices.allCaughtUp')}</p>
                    <p className="text-sm">{t('dashboard.actionableInvoices.noOutstanding')}</p>
                </div>
            )}
        </div>
    );
};

export default UpcomingInvoices;

