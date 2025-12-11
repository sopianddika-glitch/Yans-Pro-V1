

import React, { useMemo } from 'react';
import { RecurringTransaction, Frequency, Page, Transaction } from '../types';
import { RepeatIcon, SettingsIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface UpcomingRecurringProps {
    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
    currency: string;
    onNavigateToSettings: () => void;
}

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const getNextDueDate = (currentDate: Date, frequency: Frequency, interval: number): Date => {
    const nextDate = new Date(currentDate);
    switch(frequency) {
        case Frequency.DAILY: nextDate.setDate(nextDate.getDate() + interval); break;
        case Frequency.WEEKLY: nextDate.setDate(nextDate.getDate() + 7 * interval); break;
        case Frequency.MONTHLY: nextDate.setMonth(nextDate.getMonth() + interval); break;
        case Frequency.YEARLY: nextDate.setFullYear(nextDate.getFullYear() + interval); break;
    }
    return nextDate;
};


const UpcomingRecurring: React.FC<UpcomingRecurringProps> = ({ transactions, recurringTransactions, currency, onNavigateToSettings }) => {
    const { t } = useI18n();
    
    const upcomingPayments = useMemo(() => {
        const now = new Date();
        const allTransactionsSorted = [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return recurringTransactions
            .map(rule => {
                const lastInstanceDate = allTransactionsSorted.find(t => t.recurringTransactionId === rule.id)?.date;
                let cursorDate = lastInstanceDate ? new Date(lastInstanceDate) : new Date(rule.startDate + 'T00:00:00');
                
                let nextDueDate = getNextDueDate(cursorDate, rule.frequency, rule.interval);
                
                // If the last known transaction was long ago, we need to find the *next* future due date, not just the one after the last one
                while(nextDueDate < now) {
                    cursorDate = nextDueDate;
                    nextDueDate = getNextDueDate(cursorDate, rule.frequency, rule.interval);
                }

                if (rule.endDate && nextDueDate > new Date(rule.endDate + 'T23:59:59')) {
                    return null;
                }
                
                return { ...rule, nextDueDate };
            })
            .filter(p => p !== null)
            .sort((a, b) => a!.nextDueDate.getTime() - b!.nextDueDate.getTime())
            .slice(0, 5) as (RecurringTransaction & { nextDueDate: Date })[];

    }, [recurringTransactions, transactions]);


    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center flex-shrink-0 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.upcomingRecurring.title')}</h3>
                <button onClick={onNavigateToSettings} className="p-1 text-gray-500 dark:text-brand-muted hover:text-black dark:hover:text-white" aria-label="Manage recurring transactions"><SettingsIcon className="h-5 w-5"/></button>
            </div>
            {upcomingPayments.length > 0 ? (
                <ul className="space-y-3 overflow-y-auto flex-grow">
                    {upcomingPayments.map(payment => (
                        <li key={payment.id} className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-brand-primary">
                                <RepeatIcon className="h-5 w-5 text-brand-accent"/>
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{payment.description}</p>
                                <p className="text-sm text-gray-500 dark:text-brand-muted">{t('dashboard.upcomingRecurring.dueOn', { date: payment.nextDueDate.toLocaleDateString() })}</p>
                            </div>
                            <div className="flex-shrink-0 font-semibold text-red-600 dark:text-brand-red font-mono">
                                {formatCurrency(payment.amount, currency)}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="h-full flex flex-col justify-center items-center text-center text-gray-500 dark:text-brand-muted flex-grow">
                    <RepeatIcon className="h-10 w-10 mb-2"/>
                    <p className="font-semibold text-gray-700 dark:text-gray-400">{t('dashboard.upcomingRecurring.noUpcoming')}</p>
                </div>
            )}
        </div>
    );
};

export default UpcomingRecurring;
