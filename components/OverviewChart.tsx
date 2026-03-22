import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction, TransactionType, Theme } from '../types';
import { useI18n } from '../hooks/useI18n';
import { formatCurrency, getLocaleCode } from '../utils/intl';

interface OverviewChartProps {
    transactions: Transaction[];
    theme: Theme;
    currency: string;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ transactions, theme, currency }) => {
    const { t, locale } = useI18n();
    const localeCode = getLocaleCode(locale);

    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        return theme === 'dark';
    }, [theme]);

    const monthFormatter = useMemo(() => {
        return new Intl.DateTimeFormat(localeCode, { month: 'short', year: '2-digit' });
    }, [localeCode]);

    const axisFormatter = useMemo(() => {
        return new Intl.NumberFormat(localeCode, {
            notation: 'compact',
            maximumFractionDigits: 1,
        });
    }, [localeCode]);

    const data = useMemo(() => {
        const monthlyMap = new Map<string, { monthKey: string; name: string; income: number; expenses: number }>();

        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    monthKey,
                    name: monthFormatter.format(monthDate),
                    income: 0,
                    expenses: 0,
                });
            }

            const bucket = monthlyMap.get(monthKey)!;
            if (transaction.type === TransactionType.INCOME) {
                bucket.income += transaction.amount;
            } else {
                bucket.expenses += transaction.amount;
            }
        });

        return [...monthlyMap.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    }, [monthFormatter, transactions]);

    const cardClasses = 'rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6';

    if (data.length === 0) {
        return (
            <section className={cardClasses}>
                <header className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.overviewChart.title')}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('dashboard.overviewChart.emptyDescription')}</p>
                    </div>
                </header>
                <div className="mt-10 flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 text-center dark:border-gray-700 dark:bg-brand-primary/40">
                    <p className="text-base font-semibold text-gray-800 dark:text-white">{t('dashboard.overviewChart.emptyTitle')}</p>
                    <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-brand-muted">{t('dashboard.overviewChart.emptyDescription')}</p>
                </div>
            </section>
        );
    }

    return (
        <section className={cardClasses}>
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.overviewChart.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('dashboard.overviewChart.subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                        {t('dashboard.overviewChart.incomeLegend')}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        {t('dashboard.overviewChart.expensesLegend')}
                    </span>
                </div>
            </header>

            <div className="mt-6 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            width={72}
                            stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value: number) => axisFormatter.format(value)}
                        />
                        <Tooltip
                            cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }}
                            contentStyle={{
                                backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
                                borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                borderRadius: '16px',
                                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                            }}
                            formatter={(value: number, name: string) => [
                                formatCurrency(value, currency, locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                                name,
                            ]}
                        />
                        <Bar
                            dataKey="income"
                            name={t('dashboard.overviewChart.incomeLegend')}
                            fill="#16A34A"
                            radius={[12, 12, 0, 0]}
                            maxBarSize={42}
                        />
                        <Bar
                            dataKey="expenses"
                            name={t('dashboard.overviewChart.expensesLegend')}
                            fill="#EF4444"
                            radius={[12, 12, 0, 0]}
                            maxBarSize={42}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};

export default OverviewChart;
