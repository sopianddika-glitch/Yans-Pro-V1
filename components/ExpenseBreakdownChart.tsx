<div style={{ width: '100%', height: 400 }}>

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction, TransactionType, Theme } from '../types';

interface ExpenseBreakdownChartProps {
    transactions: Transaction[];
    theme: Theme;
}

const COLORS = ['#2F81F7', '#2DA44E', '#E5534B', '#A371F7', '#DB6D28', '#087D9A'];

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ transactions, theme }) => {
    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return theme === 'dark';
    }, [theme]);
    
    const data = useMemo(() => {
        const expenseData: { [key: string]: number } = {};
        transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                if (!expenseData[t.category]) {
                    expenseData[t.category] = 0;
                }
                expenseData[t.category] += t.amount;
            });
        
        return Object.entries(expenseData).map(([name, value]) => ({ name, value }));
    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md dark:shadow-lg h-96 flex flex-col justify-center items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Expense Breakdown</h3>
                <p className="text-gray-500 dark:text-brand-muted">No expense data available.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex-shrink-0">Expense Breakdown</h3>
            <div className="flex-grow w-full overflow-hidden min-h-[300px]" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 40 }}>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                );
                            }}
                        >
                            {(\ ?? []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDarkMode ? '#161B22' : '#ffffff',
                                borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            }}
                        />
                        <Legend wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151', paddingBottom: '20px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ExpenseBreakdownChart;


</div>
