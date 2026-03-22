
import React from 'react';
import { useI18n } from '../hooks/useI18n';

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    currency: string;
    isExpense?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, currency, isExpense = false }) => {
    const { locale } = useI18n();
    
    // Map supported locales to standard codes if needed
    const localeCode = locale === 'id' ? 'id-ID' : 'en-US';

    const formattedValue = new Intl.NumberFormat(localeCode, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

    let valueColorClass = 'text-green-600 dark:text-brand-green';
    if(isExpense) {
        valueColorClass = 'text-red-600 dark:text-brand-red';
    } else if (value < 0) {
        valueColorClass = 'text-red-600 dark:text-brand-red';
    }

    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-5 rounded-xl shadow-md dark:shadow-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 transition-transform transform sm:hover:scale-[1.02]">
            <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-brand-muted leading-snug break-words">{title}</p>
                <p className={`text-base sm:text-2xl font-bold ${valueColorClass} leading-tight break-words whitespace-normal`}>
                    {formattedValue}
                </p>
            </div>
        </div>
    );
};

export default StatCard;
