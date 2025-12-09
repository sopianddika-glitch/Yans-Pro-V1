
import React, { useMemo, useState } from 'react';
import { Transaction, FinancialSummary, EnterpriseMetrics, Anomaly } from '../types';
import { calculateEnterpriseMetrics, detectAnomalies } from '../services/enterpriseService';
import { generateExecutiveSummary } from '../services/geminiService';
import { useI18n } from '../hooks/useI18n';
import { BriefcaseIcon, TrendingUpIcon, AlertTriangleIcon, SparklesIcon, CheckIcon } from '../components/Icons';

interface EnterprisePageProps {
    transactions: Transaction[];
    summary: FinancialSummary;
    currency: string;
    profileName: string;
}

const EnterprisePage: React.FC<EnterprisePageProps> = ({ transactions, summary, currency, profileName }) => {
    const { t } = useI18n();
    const [summaryText, setSummaryText] = useState<string>('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);

    // Calculate metrics on render
    const metrics: EnterpriseMetrics = useMemo(() => {
        return calculateEnterpriseMetrics(transactions, summary.balance);
    }, [transactions, summary.balance]);

    const anomalies: Anomaly[] = useMemo(() => {
        return detectAnomalies(transactions);
    }, [transactions]);

    const handleGenerateReport = async () => {
        setIsLoadingSummary(true);
        const report = await generateExecutiveSummary(metrics, anomalies, profileName);
        setSummaryText(report);
        setIsLoadingSummary(false);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full space-y-8">
            
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900 rounded-lg text-white">
                    <BriefcaseIcon className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('enterprise.title')}</h1>
                    <p className="text-sm text-gray-500 dark:text-brand-muted">{t('enterprise.subtitle')}</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Valuation */}
                <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md border-t-4 border-purple-500 flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('enterprise.metrics.valuation')}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(metrics.valuation)}</p>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                        {t('enterprise.metrics.valuationNote')}
                    </div>
                </div>

                {/* Runway */}
                <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md border-t-4 border-blue-500 flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('enterprise.metrics.runway')}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {metrics.runwayMonths >= 99 ? '∞' : metrics.runwayMonths.toFixed(1)} <span className="text-lg font-medium text-gray-500">{t('enterprise.metrics.months')}</span>
                        </p>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{t('enterprise.metrics.burnRate')}</span>
                            <span className="font-mono text-red-500">-{formatCurrency(metrics.burnRate)}/mo</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full ${metrics.runwayMonths < 3 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                style={{ width: `${Math.min(metrics.runwayMonths * 5, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Health Score */}
                <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md border-t-4 border-green-500 flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('enterprise.metrics.healthScore')}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className={`text-4xl font-bold ${metrics.healthScore > 75 ? 'text-green-500' : metrics.healthScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {metrics.healthScore}
                            </p>
                            <span className="text-sm text-gray-400">/ 100</span>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        {metrics.healthScore > 75 ? t('enterprise.metrics.healthGood') : t('enterprise.metrics.healthNeedsWork')}
                    </div>
                </div>

                {/* EBITDA Est */}
                <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md border-t-4 border-orange-500 flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('enterprise.metrics.ebitda')}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(metrics.ebitdaEst)}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-green-500">
                        <TrendingUpIcon className="w-4 h-4" />
                        <span>{t('enterprise.metrics.trailing12m')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Anomaly Detection */}
                <div className="lg:col-span-2 bg-white dark:bg-brand-secondary rounded-xl shadow-md overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <AlertTriangleIcon className="w-5 h-5 text-red-500" />
                            {t('enterprise.anomalies.title')}
                        </h3>
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full dark:bg-red-900 dark:text-red-200">
                            {anomalies.length} {t('enterprise.anomalies.detected')}
                        </span>
                    </div>
                    {anomalies.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                            <CheckIcon className="w-12 h-12 text-green-500 mb-2" />
                            <p>{t('enterprise.anomalies.none')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3">{t('enterprise.anomalies.type')}</th>
                                        <th className="px-6 py-3">{t('enterprise.anomalies.description')}</th>
                                        <th className="px-6 py-3">{t('enterprise.anomalies.severity')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {anomalies.map(anom => (
                                        <tr key={anom.id} className="bg-white dark:bg-brand-secondary border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {anom.type === 'high_value' ? 'High Value' : 'Duplicate?'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                                                {anom.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${anom.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {anom.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Executive Summary */}
                <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-xl shadow-xl flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <SparklesIcon className="w-6 h-6 text-purple-400" />
                        <h3 className="text-lg font-bold">{t('enterprise.summary.title')}</h3>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto min-h-[200px] mb-4 text-sm leading-relaxed text-gray-300 space-y-2">
                        {summaryText ? (
                            <div dangerouslySetInnerHTML={{ 
                                __html: summaryText
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                    .replace(/\n/g, '<br/>')
                            }} />
                        ) : (
                            <p className="italic opacity-50 text-center mt-10">{t('enterprise.summary.placeholder')}</p>
                        )}
                    </div>

                    <button 
                        onClick={handleGenerateReport}
                        disabled={isLoadingSummary}
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {isLoadingSummary && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>}
                        {t('enterprise.summary.generate')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnterprisePage;
