import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, TransactionType, Theme } from '../types';

interface OverviewChartProps {
    transactions: Transaction[];
    theme: Theme;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ transactions, theme }) => {
    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return theme === 'dark';
    }, [theme]);
    
    const data = useMemo(() => {
        const monthlyData: { [key: string]: { name: string; Income: number; Expenses: number } } = {};

        transactions.forEach(t => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!monthlyData[month]) {
                monthlyData[month] = { name: month, Income: 0, Expenses: 0 };
            }

            if (t.type === TransactionType.INCOME) {
                monthlyData[month].Income += t.amount;
            } else {
                monthlyData[month].Expenses += t.amount;
            }
        });

        // Sort data chronologically
        return Object.values(monthlyData).sort((a, b) => {
            const dateA = new Date(`1 ${a.name.replace(" '", " 20")}`);
            const dateB = new Date(`1 ${b.name.replace(" '", " 20")}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [transactions]);

    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex-shrink-0">Income vs Expenses Overview</h3>
            <div className="flex-grow w-full overflow-hidden min-h-[300px]" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                        <XAxis dataKey="name" stroke={isDarkMode ? "#8B949E" : "#6b7280"} />
                        <YAxis stroke={isDarkMode ? "#8B949E" : "#6b7280"} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDarkMode ? '#161B22' : '#ffffff',
                                borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                                color: isDarkMode ? '#E5E7EB' : '#1f2937'
                            }}
                            cursor={{ fill: 'rgba(139, 148, 158, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151', paddingBottom: '20px' }}/>
                        <Bar dataKey="Income" fill="#2DA44E" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Expenses" fill="#E5534B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default OverviewChart;
