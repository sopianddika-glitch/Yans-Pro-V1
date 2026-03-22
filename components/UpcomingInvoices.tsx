import React, { useMemo, useState } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { EditIcon, InvoiceIcon, SparklesIcon } from './Icons';
import { getInvoiceReminderDraft } from '../services/geminiService';
import { useI18n } from '../hooks/useI18n';
import { formatCurrency, formatDate } from '../utils/intl';

interface UpcomingInvoicesProps {
    invoices: Invoice[];
    currency: string;
    onNavigateToInvoice: (invoiceId: string) => void;
    profileName: string;
}

const getStatusInfo = (
    status: InvoiceStatus,
    dueDate: string,
    t: (key: string, params?: { [key: string]: string | number | undefined }) => string,
): { text: string; className: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${dueDate}T00:00:00Z`);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === InvoiceStatus.OVERDUE || diffDays < 0) {
        return {
            text: t('invoice.overdueBy', { days: Math.abs(diffDays) }),
            className: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        };
    }

    if (status === InvoiceStatus.SENT && diffDays === 0) {
        return {
            text: t('invoice.dueToday'),
            className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        };
    }

    if (status === InvoiceStatus.SENT) {
        return {
            text: t('invoice.dueIn', { days: diffDays }),
            className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
        };
    }

    return {
        text: t(`general.${status.toLowerCase()}`, { defaultValue: status }),
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
};

const UpcomingInvoices: React.FC<UpcomingInvoicesProps> = ({ invoices, currency, onNavigateToInvoice, profileName }) => {
    const { t, locale } = useI18n();
    const [aiReminder, setAiReminder] = useState<{ [key: string]: string | null }>({});
    const [isLoadingAi, setIsLoadingAi] = useState<string | null>(null);

    const relevantInvoices = useMemo(() => {
        return invoices
            .filter(invoice => invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE)
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
        <section className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.actionableInvoices.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('dashboard.actionableInvoices.subtitle')}</p>
                </div>
                {relevantInvoices.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-accent dark:bg-brand-accent/20">
                        {t('dashboard.actionableInvoices.openCount', { count: relevantInvoices.length })}
                    </span>
                )}
            </header>

            {relevantInvoices.length > 0 ? (
                <ul className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto">
                    {relevantInvoices.map(invoice => {
                        const total = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                        const statusInfo = getStatusInfo(invoice.status, invoice.dueDate, t);
                        const dueDateText = formatDate(`${invoice.dueDate}T00:00:00`, locale, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        });

                        return (
                            <li key={invoice.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-brand-primary/50">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-semibold text-gray-900 dark:text-white">{invoice.clientName}</p>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">
                                            {t('dashboard.actionableInvoices.dueDateLabel', { date: dueDateText })}
                                        </p>
                                    </div>
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
                                        {statusInfo.text}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-end justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-brand-muted">
                                            {t('dashboard.actionableInvoices.amountDue')}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(total, currency, locale, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {invoice.status === InvoiceStatus.OVERDUE && (
                                            <button
                                                onClick={() => handleGetReminder(invoice)}
                                                disabled={isLoadingAi === invoice.id}
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent transition hover:bg-brand-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                aria-label={t('dashboard.actionableInvoices.remindAction')}
                                            >
                                                {isLoadingAi === invoice.id ? (
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-accent/30 border-b-brand-accent" />
                                                ) : (
                                                    <SparklesIcon className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onNavigateToInvoice(invoice.id)}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-700 transition hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                            aria-label={t('general.edit')}
                                        >
                                            <EditIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {aiReminder[invoice.id] && (
                                    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-300">
                                        <p className="mb-2 font-semibold uppercase tracking-[0.18em] text-brand-accent">{t('dashboard.actionableInvoices.remindAction')}</p>
                                        <p className="whitespace-pre-wrap">{aiReminder[invoice.id]}</p>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-brand-primary dark:text-gray-500">
                        <InvoiceIcon className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-gray-800 dark:text-white">{t('dashboard.actionableInvoices.allCaughtUp')}</p>
                    <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-brand-muted">{t('dashboard.actionableInvoices.noOutstanding')}</p>
                </div>
            )}
        </section>
    );
};

export default UpcomingInvoices;
