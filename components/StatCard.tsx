
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
        <div className="bg-white dark:bg-brand-secondary p-5 rounded-xl shadow-md dark:shadow-lg flex items-center space-x-4 transition-transform transform hover:scale-105">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-brand-muted">{title}</p>
                <p className={`text-2xl font-bold ${valueColorClass}`}>{formattedValue}</p>
            </div>
        </div>
    );
};

export default StatCard;
