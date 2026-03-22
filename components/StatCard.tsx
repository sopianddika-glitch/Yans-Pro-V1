
import React from 'react';
import { useI18n } from '../hooks/useI18n';
import { formatCurrency } from '../utils/intl';

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    currency: string;
    isExpense?: boolean;
    description?: string;
    tone?: 'positive' | 'negative' | 'warning' | 'neutral' | 'accent';
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    currency,
    isExpense = false,
    description,
    tone = 'neutral',
}) => {
    const { locale } = useI18n();
    const formattedValue = formatCurrency(value, currency, locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    const resolvedTone = isExpense || value < 0 ? 'negative' : tone;

    const toneStyles = {
        positive: {
            icon: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-brand-green',
            value: 'text-green-600 dark:text-brand-green',
            accent: 'from-green-500/15 to-transparent',
            border: 'border-green-100 dark:border-green-500/20',
        },
        negative: {
            icon: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-brand-red',
            value: 'text-red-600 dark:text-brand-red',
            accent: 'from-red-500/15 to-transparent',
            border: 'border-red-100 dark:border-red-500/20',
        },
        warning: {
            icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
            value: 'text-amber-600 dark:text-amber-300',
            accent: 'from-amber-500/15 to-transparent',
            border: 'border-amber-100 dark:border-amber-500/20',
        },
        accent: {
            icon: 'bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20 dark:text-blue-300',
            value: 'text-brand-accent dark:text-blue-300',
            accent: 'from-brand-accent/15 to-transparent',
            border: 'border-blue-100 dark:border-brand-accent/20',
        },
        neutral: {
            icon: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200',
            value: 'text-gray-900 dark:text-white',
            accent: 'from-gray-300/20 to-transparent',
            border: 'border-gray-200 dark:border-gray-700',
        },
    }[resolvedTone];

    return (
        <article className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-brand-secondary ${toneStyles.border}`}>
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${toneStyles.accent}`} />
            <div className="relative flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${toneStyles.icon}`}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-brand-muted">{title}</p>
                    <p className={`mt-2 text-2xl font-bold sm:text-[1.75rem] ${toneStyles.value}`}>{formattedValue}</p>
                    {description && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-brand-muted">{description}</p>
                    )}
                </div>
            </div>
        </article>
    );
};

export default StatCard;
