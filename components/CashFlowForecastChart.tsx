<div style={{ width: '100%', height: 400 }}>

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Transaction, TransactionType, CashFlowPoint, Theme } from '../types';
import { generateCashFlowForecast } from '../services/geminiService';
import { SparklesIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface CashFlowForecastChartProps {
    transactions: Transaction[];
    theme: Theme;
    currency: string;
}

const CashFlowForecastChart: React.FC<CashFlowForecastChartProps> = ({ transactions, theme, currency }) => {
    const { t } = useI18n();
    const [forecastData, setForecastData] = useState<CashFlowPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return theme === 'dark';
    }, [theme]);

    const historicalData = useMemo(() => {
        const monthlyData: { [key: string]: number } = {};
        const now = new Date();
        
        // Go back 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthlyData[key] = 0;
        }

        transactions.forEach(t => {
            const date = new Date(t.date);
            const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (monthlyData.hasOwnProperty(key)) {
                if (t.type === TransactionType.INCOME) {
                    monthlyData[key] += t.amount;
                } else {
                    monthlyData[key] -= t.amount;
                }
            }
        });

        // Convert to array and sort chronologically
        return Object.entries(monthlyData).map(([month, amount]) => ({
            month,
            historicalAmount: amount,
            forecastAmount: amount, // For continuity in the chart line
            isForecast: false,
        })).sort((a, b) => {
             const dateA = new Date(`1 ${a.month.replace(" '", " 20")}`);
             const dateB = new Date(`1 ${b.month.replace(" '", " 20")}`);
             return dateA.getTime() - dateB.getTime();
        });
    }, [transactions]);

    const chartData = useMemo(() => {
        if (forecastData.length === 0) return historicalData;
        
        // Connect the last historical point to the first forecast point for visual continuity
        const lastHistorical = historicalData[historicalData.length - 1];
        const connectedForecast = (\ ?? []).map((point, index) => {
             if (index === 0 && lastHistorical) {
                 // No special handling needed for AreaChart if we structure data right, 
                 // but for strict separation we just append.
             }
             return point;
        });

        return [...historicalData, ...connectedForecast];
    }, [historicalData, forecastData]);

    const handleGenerateForecast = async () => {
        if (historicalData.length < 2) {
            setError(t('dashboard.forecast.notEnoughData'));
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const inputForAi = (\ ?? []).map(d => ({ month: d.month, netFlow: d.historicalAmount || 0 }));
            const result = await generateCashFlowForecast(inputForAi);
            setForecastData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('general.error.unknown'));
        } finally {
            setIsLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload as CashFlowPoint;
            const isForecast = dataPoint.isForecast;
            const value = isForecast ? dataPoint.forecastAmount : dataPoint.historicalAmount;
            
            return (
                <div className={`p-3 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                    <p className={`text-sm ${value && value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value || 0)}
                    </p>
                    {isForecast && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">AI Forecast</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">{dataPoint.reasoning}</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg h-96 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {t('dashboard.forecast.title')}
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300 border border-purple-400">AI Beta</span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-brand-muted mt-1">{t('dashboard.forecast.subtitle')}</p>
                </div>
                <button
                    onClick={handleGenerateForecast}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                    {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <SparklesIcon className="w-4 h-4" />}
                    {forecastData.length > 0 ? t('dashboard.forecast.refresh') : t('dashboard.forecast.generate')}
                </button>
            </div>

            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="flex-grow w-full overflow-hidden min-h-[200px]" style={{ minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2F81F7" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#2F81F7" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} vertical={false} />
                        <XAxis dataKey="month" stroke={isDarkMode ? "#8B949E" : "#6b7280"} tick={{fontSize: 12}} />
                        <YAxis 
                            stroke={isDarkMode ? "#8B949E" : "#6b7280"} 
                            tickFormatter={(value) => `${Number(value) / 1000}k`} 
                            tick={{fontSize: 12}}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke={isDarkMode ? "#4B5563" : "#9CA3AF"} />
                        
                        {/* Historical Data Area */}
                        <Area 
                            type="monotone" 
                            dataKey="historicalAmount" 
                            stroke="#2F81F7" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorHistory)" 
                            connectNulls
                        />

                        {/* Forecast Data Area (Rendered on top) */}
                        <Area 
                            type="monotone" 
                            dataKey="forecastAmount" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fillOpacity={1} 
                            fill="url(#colorForecast)" 
                            connectNulls
                            data={(\ ?? []).map(d => d.isForecast || d.month === historicalData[historicalData.length-1].month ? d : { ...d, forecastAmount: null })}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CashFlowForecastChart;


</div>
