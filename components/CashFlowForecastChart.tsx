import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CashFlowPoint, Theme, Transaction, TransactionType } from '../types';
import { generateCashFlowForecast } from '../services/geminiService';
import { SparklesIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';
import { formatCurrency, getLocaleCode } from '../utils/intl';

interface CashFlowForecastChartProps {
    transactions: Transaction[];
    theme: Theme;
    currency: string;
}

const CashFlowForecastChart: React.FC<CashFlowForecastChartProps> = ({ transactions, theme, currency }) => {
    const { t, locale } = useI18n();
    const localeCode = getLocaleCode(locale);
    const [forecastData, setForecastData] = useState<CashFlowPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const historicalData = useMemo(() => {
        const monthlyMap = new Map<string, CashFlowPoint & { monthKey: string }>();
        const now = new Date();

        for (let i = 5; i >= 0; i -= 1) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

            monthlyMap.set(monthKey, {
                monthKey,
                month: monthFormatter.format(monthDate),
                historicalAmount: 0,
                forecastAmount: 0,
                isForecast: false,
            });
        }

        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyMap.has(monthKey)) {
                return;
            }

            const bucket = monthlyMap.get(monthKey)!;
            if (transaction.type === TransactionType.INCOME) {
                bucket.historicalAmount = (bucket.historicalAmount ?? 0) + transaction.amount;
            } else {
                bucket.historicalAmount = (bucket.historicalAmount ?? 0) - transaction.amount;
            }

            bucket.forecastAmount = bucket.historicalAmount;
        });

        return [...monthlyMap.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    }, [monthFormatter, transactions]);

    const chartData = useMemo(() => {
        if (forecastData.length === 0) {
            return historicalData;
        }

        return [...historicalData, ...forecastData];
    }, [forecastData, historicalData]);

    const handleGenerateForecast = async () => {
        const populatedMonths = historicalData.filter(point => (point.historicalAmount ?? 0) !== 0).length;

        if (populatedMonths < 2) {
            setError(t('dashboard.forecast.notEnoughData'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const inputForAi = historicalData.map(point => ({
                month: point.month,
                netFlow: point.historicalAmount ?? 0,
            }));
            const result = await generateCashFlowForecast(inputForAi);
            setForecastData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('general.error.unknown'));
        } finally {
            setIsLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) {
            return null;
        }

        const dataPoint = payload[0].payload as CashFlowPoint;
        const value = dataPoint.isForecast ? dataPoint.forecastAmount : dataPoint.historicalAmount;

        return (
            <div className={`max-w-[240px] rounded-2xl border p-4 shadow-2xl ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
                <p className="text-sm font-semibold">{label}</p>
                <p className={`mt-2 text-lg font-bold ${(value ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(value ?? 0, currency, locale, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    })}
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-brand-muted">
                    {dataPoint.isForecast ? t('dashboard.forecast.projectedLabel') : t('dashboard.forecast.historyLabel')}
                </p>
                {dataPoint.isForecast && dataPoint.reasoning && (
                    <div className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        <p className="mb-1 font-semibold uppercase tracking-[0.18em] text-indigo-500">{t('dashboard.forecast.aiReasoning')}</p>
                        <p>{dataPoint.reasoning}</p>
                    </div>
                )}
            </div>
        );
    };

    const lastHistoricalMonth = historicalData[historicalData.length - 1]?.month;

    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
            <header className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.forecast.title')}</h3>
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                                {t('dashboard.forecast.aiBadge')}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('dashboard.forecast.subtitle')}</p>
                    </div>
                    <button
                        onClick={handleGenerateForecast}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-b-white" />
                        ) : (
                            <SparklesIcon className="h-4 w-4 text-white" />
                        )}
                        {forecastData.length > 0 ? t('dashboard.forecast.refresh') : t('dashboard.forecast.generate')}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        {t('dashboard.forecast.historyLabel')}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        {t('dashboard.forecast.projectedLabel')}
                    </span>
                </div>
            </header>

            {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="mt-6 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
                        <defs>
                            <linearGradient id="historicalForecastFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.24} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="projectedForecastFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.28} />
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} vertical={false} />
                        <XAxis
                            dataKey="month"
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
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke={isDarkMode ? '#4B5563' : '#CBD5E1'} />
                        <Area
                            type="monotone"
                            dataKey="historicalAmount"
                            stroke="#3B82F6"
                            strokeWidth={2.5}
                            fill="url(#historicalForecastFill)"
                            fillOpacity={1}
                            connectNulls
                        />
                        <Area
                            type="monotone"
                            dataKey="forecastAmount"
                            stroke="#6366F1"
                            strokeWidth={2.5}
                            strokeDasharray="6 6"
                            fill="url(#projectedForecastFill)"
                            fillOpacity={1}
                            connectNulls
                            data={chartData.map(point => (
                                point.isForecast || point.month === lastHistoricalMonth
                                    ? point
                                    : { ...point, forecastAmount: null }
                            ))}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};

export default CashFlowForecastChart;
