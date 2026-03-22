import React, { useMemo } from 'react';
import { Frequency, RecurringTransaction, Transaction } from '../types';
import { RepeatIcon, SettingsIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';
import { formatCurrency, formatDate } from '../utils/intl';

interface UpcomingRecurringProps {
    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
    currency: string;
    onNavigateToSettings: () => void;
}

const getNextDueDate = (currentDate: Date, frequency: Frequency, interval: number): Date => {
    const nextDate = new Date(currentDate);

    switch (frequency) {
        case Frequency.DAILY:
            nextDate.setDate(nextDate.getDate() + interval);
            break;
        case Frequency.WEEKLY:
            nextDate.setDate(nextDate.getDate() + 7 * interval);
            break;
        case Frequency.MONTHLY:
            nextDate.setMonth(nextDate.getMonth() + interval);
            break;
        case Frequency.YEARLY:
            nextDate.setFullYear(nextDate.getFullYear() + interval);
            break;
    }

    return nextDate;
};

const getPaymentStatus = (
    date: Date,
    t: (key: string, params?: { [key: string]: string | number | undefined }) => string,
) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            text: t('dashboard.upcomingRecurring.statusOverdue'),
            className: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        };
    }

    if (diffDays <= 3) {
        return {
            text: t('dashboard.upcomingRecurring.statusDue'),
            className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        };
    }

    return {
        text: t('dashboard.upcomingRecurring.statusUpcoming'),
        className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    };
};

const UpcomingRecurring: React.FC<UpcomingRecurringProps> = ({ transactions, recurringTransactions, currency, onNavigateToSettings }) => {
    const { t, locale } = useI18n();

    const upcomingPayments = useMemo(() => {
        const now = new Date();
        const allTransactionsSorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return recurringTransactions
            .map(rule => {
                const lastInstanceDate = allTransactionsSorted.find(transaction => transaction.recurringTransactionId === rule.id)?.date;
                let cursorDate = lastInstanceDate ? new Date(lastInstanceDate) : new Date(`${rule.startDate}T00:00:00`);
                let nextDueDate = getNextDueDate(cursorDate, rule.frequency, rule.interval);

                while (nextDueDate < now) {
                    cursorDate = nextDueDate;
                    nextDueDate = getNextDueDate(cursorDate, rule.frequency, rule.interval);
                }

                if (rule.endDate && nextDueDate > new Date(`${rule.endDate}T23:59:59`)) {
                    return null;
                }

                return { ...rule, nextDueDate };
            })
            .filter(payment => payment !== null)
            .sort((a, b) => a!.nextDueDate.getTime() - b!.nextDueDate.getTime())
            .slice(0, 5) as (RecurringTransaction & { nextDueDate: Date })[];
    }, [recurringTransactions, transactions]);

    return (
        <section className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.upcomingRecurring.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('dashboard.upcomingRecurring.subtitle')}</p>
                </div>
                <button
                    onClick={onNavigateToSettings}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-700 transition hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    aria-label={t('dashboard.upcomingRecurring.manage')}
                >
                    <SettingsIcon className="h-5 w-5" />
                </button>
            </header>

            {upcomingPayments.length > 0 ? (
                <ul className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto">
                    {upcomingPayments.map(payment => {
                        const status = getPaymentStatus(payment.nextDueDate, t);
                        const nextBillingDate = formatDate(payment.nextDueDate, locale, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        });
                        const frequencyLabel = t(`modals.addTransaction.${payment.frequency}`, {
                            defaultValue: payment.frequency,
                        });

                        return (
                            <li key={payment.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-brand-primary/50">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 gap-3">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20">
                                            <RepeatIcon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-base font-semibold text-gray-900 dark:text-white">{payment.description}</p>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">
                                                {t('dashboard.upcomingRecurring.dueOn', { date: nextBillingDate })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                                        {status.text}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-end justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-brand-muted">
                                            {t('general.amount')}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-red-600 dark:text-brand-red">
                                            {formatCurrency(payment.amount, currency, locale, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 capitalize dark:text-brand-muted">{frequencyLabel}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-brand-primary dark:text-gray-500">
                        <RepeatIcon className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-gray-800 dark:text-white">{t('dashboard.upcomingRecurring.noUpcoming')}</p>
                </div>
            )}
        </section>
    );
};

export default UpcomingRecurring;
