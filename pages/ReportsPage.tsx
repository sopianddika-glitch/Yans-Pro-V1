
import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, FinancialSummary, TransactionType } from '../types';
import { ReportsIcon, XIcon, PrintIcon } from '../components/Icons';
import { useI18n } from '../hooks/useI18n';

// --- HELPER FUNCTIONS & SHARED COMPONENTS ---

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value);

const ReportCard: React.FC<{ title: string; description: string; onClick: () => void }> = ({ title, description, onClick }) => {
    const { t } = useI18n();
    return (
        <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md dark:shadow-lg transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-brand-muted text-sm mb-4 flex-grow">{description}</p>
            <button onClick={onClick} className="w-full mt-auto bg-brand-accent hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
                {t('reportsPage.generate')}
            </button>
        </div>
    );
}

const ReportContainer: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
    const { t } = useI18n();
    const handlePrint = () => {
        const printContents = document.getElementById('report-content')?.innerHTML;
        if (printContents) {
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`
                <html>
                    <head>
                        <title>Yans Pro - ${title}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            body { 
                                background-color: white !important; 
                                color: black !important;
                                padding: 2rem;
                                -webkit-print-color-adjust: exact;
                            }
                            .report-header {
                                border-bottom: 2px solid #ccc;
                                padding-bottom: 1rem;
                                margin-bottom: 2rem;
                            }
                        </style>
                    </head>
                    <body class="bg-white">
                        <div class="report-header">
                            <h1 class="text-3xl font-bold">${title}</h1>
                            <p class="text-gray-500">Generated on ${new Date().toLocaleDateString()}</p>
                        </div>
                        ${printContents}
                    </body>
                </html>
            `);
            printWindow?.document.close();
            printWindow?.focus();
            setTimeout(() => { printWindow?.print(); printWindow?.close(); }, 250);
        }
    };
    return (
        <div className="bg-white/50 dark:bg-brand-secondary/50 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 report-print-container">
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 dark:border-gray-600 pb-3">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrint} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg" aria-label={t('reportsPage.print')}>
                        <PrintIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg" aria-label={t('reportsPage.close')}>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <div id="report-content">
                {children}
            </div>
        </div>
    );
};

const PeriodSelector: React.FC<{ onPeriodChange: (p: { start: Date; end: Date } | null) => void }> = ({ onPeriodChange }) => {
    const { t } = useI18n();
    const periods = useMemo(() => [
        { label: t('reportsPage.periods.last30'), value: 30 },
        { label: t('reportsPage.periods.last90'), value: 90 },
        { label: t('reportsPage.periods.ytd'), value: 'ytd' },
        { label: t('reportsPage.periods.all'), value: 'all' },
    ] as const, [t]);

    const [activePeriod, setActivePeriod] = useState<number | 'ytd' | 'all'>(30);

    const handlePeriodClick = useCallback((periodValue: number | 'ytd' | 'all') => {
        setActivePeriod(periodValue);
        const end = new Date();
        let start = new Date();

        if (periodValue === 'all') {
            onPeriodChange(null);
            return;
        } else if (periodValue === 'ytd') {
            start = new Date(end.getFullYear(), 0, 1);
        } else {
            start.setDate(end.getDate() - (periodValue as number));
        }
        onPeriodChange({ start, end });
    }, [onPeriodChange]);

    React.useEffect(() => { // Set initial period
        handlePeriodClick(30);
    }, [handlePeriodClick]);

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {periods.map(p => (
                <button
                    key={p.value}
                    onClick={() => handlePeriodClick(p.value)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activePeriod === p.value ? 'bg-brand-accent text-white' : 'bg-gray-200 dark:bg-brand-primary hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
};

// --- INDIVIDUAL REPORT COMPONENTS ---

const ProfitAndLossReport: React.FC<{ transactions: Transaction[]; currency: string }> = ({ transactions, currency }) => {
    const { t } = useI18n();
    const [period, setPeriod] = useState<{ start: Date; end: Date } | null>(null);

    const data = useMemo(() => {
        const filtered = period ? transactions.filter(t => new Date(t.date).getTime() >= period.start.getTime() && new Date(t.date).getTime() <= period.end.getTime()) : transactions;
        const revenue = filtered.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expenses = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        return { revenue, expenses, netProfit: revenue - expenses };
    }, [transactions, period]);

    return (
        <div>
            <PeriodSelector onPeriodChange={setPeriod} />
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-100 dark:bg-brand-primary p-4 rounded-lg"><div className="text-sm text-gray-500 dark:text-brand-muted">{t('reportsPage.pnl.totalRevenue')}</div><div className="text-2xl font-bold text-green-600 dark:text-brand-green">{formatCurrency(data.revenue, currency)}</div></div>
                    <div className="bg-gray-100 dark:bg-brand-primary p-4 rounded-lg"><div className="text-sm text-gray-500 dark:text-brand-muted">{t('reportsPage.pnl.totalExpenses')}</div><div className="text-2xl font-bold text-red-600 dark:text-brand-red">{formatCurrency(data.expenses, currency)}</div></div>
                    <div className="bg-gray-100 dark:bg-brand-primary p-4 rounded-lg"><div className="text-sm text-gray-500 dark:text-brand-muted">{t('reportsPage.pnl.netProfit')}</div><div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>{formatCurrency(data.netProfit, currency)}</div></div>
                </div>
            </div>
        </div>
    );
};

const ExpenseByCategoryReport: React.FC<{ transactions: Transaction[]; currency: string }> = ({ transactions, currency }) => {
    const { t } = useI18n();
    const [period, setPeriod] = useState<{ start: Date; end: Date } | null>(null);
    
    const data = useMemo(() => {
        const filtered = period ? transactions.filter(t => new Date(t.date).getTime() >= period.start.getTime() && new Date(t.date).getTime() <= period.end.getTime()) : transactions;
        const expenses = filtered.filter(t => t.type === TransactionType.EXPENSE);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        
        const byCategory = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(byCategory)
            .map(([name, amount]) => ({ name, amount: Number(amount), percentage: totalExpenses > 0 ? (Number(amount) / totalExpenses) * 100 : 0 }))
            .sort((a,b) => b.amount - a.amount);
    }, [transactions, period]);

    return (
         <div>
            <PeriodSelector onPeriodChange={setPeriod} />
            {data.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-800/50"><tr><th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">{t('general.category')}</th><th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">{t('reportsPage.expenseByCategory.amount')}</th><th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">{t('reportsPage.expenseByCategory.percentage')}</th></tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">{data.map(item => <tr key={item.name}><td className="py-3 px-4 text-gray-700 dark:text-gray-200">{item.name}</td><td className="py-3 px-4 text-right text-red-600 dark:text-brand-red font-mono">{formatCurrency(item.amount, currency)}</td><td className="py-3 px-4 text-right text-gray-500 dark:text-brand-muted font-mono">{item.percentage.toFixed(2)}%</td></tr>)}</tbody>
                    </table>
                </div>
            ) : <p className="text-center text-gray-500 dark:text-brand-muted py-4">{t('reportsPage.expenseByCategory.noData')}</p>}
        </div>
    );
};

const IncomeBySourceReport: React.FC<{ transactions: Transaction[]; currency: string }> = ({ transactions, currency }) => {
    const { t } = useI18n();
    const [period, setPeriod] = useState<{ start: Date; end: Date } | null>(null);
    
    const data = useMemo(() => {
        const filtered = period ? transactions.filter(t => new Date(t.date).getTime() >= period.start.getTime() && new Date(t.date).getTime() <= period.end.getTime()) : transactions;
        const incomes = filtered.filter(t => t.type === TransactionType.INCOME);
        const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
        
        const byCategory = incomes.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(byCategory)
            .map(([name, amount]) => ({ name, amount: Number(amount), percentage: totalIncome > 0 ? (Number(amount) / totalIncome) * 100 : 0 }))
            .sort((a,b) => b.amount - a.amount);

    }, [transactions, period]);

    return (
         <div>
            <PeriodSelector onPeriodChange={setPeriod} />
             {data.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-800/50"><tr><th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">{t('reportsPage.incomeBySource.source')}</th><th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">{t('general.amount')}</th><th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">{t('reportsPage.expenseByCategory.percentage')}</th></tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">{data.map(item => <tr key={item.name}><td className="py-3 px-4 text-gray-700 dark:text-gray-200">{item.name}</td><td className="py-3 px-4 text-right text-green-600 dark:text-brand-green font-mono">{formatCurrency(item.amount, currency)}</td><td className="py-3 px-4 text-right text-gray-500 dark:text-brand-muted font-mono">{item.percentage.toFixed(2)}%</td></tr>)}</tbody>
                    </table>
                </div>
            ) : <p className="text-center text-gray-500 dark:text-brand-muted py-4">{t('reportsPage.incomeBySource.noData')}</p>}
        </div>
    );
};

const CashFlowReport: React.FC<{ transactions: Transaction[]; currency: string }> = ({ transactions, currency }) => {
    const { t } = useI18n();
    const [period, setPeriod] = useState<{ start: Date; end: Date } | null>(null);

    const data = useMemo(() => {
        const filtered = period ? transactions.filter(t => new Date(t.date).getTime() >= period.start.getTime() && new Date(t.date).getTime() <= period.end.getTime()) : transactions;
        const inflows = filtered.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const outflows = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        return { inflows, outflows, netFlow: inflows - outflows };
    }, [transactions, period]);

    return (
        <div>
            <PeriodSelector onPeriodChange={setPeriod} />
            <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">{t('reportsPage.cashFlow.inflows')}</span><span className="text-xl font-bold text-green-600 dark:text-brand-green">{formatCurrency(data.inflows, currency)}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">{t('reportsPage.cashFlow.outflows')}</span><span className="text-xl font-bold text-red-600 dark:text-brand-red">{formatCurrency(data.outflows, currency)}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="font-semibold text-gray-800 dark:text-white">{t('reportsPage.cashFlow.net')}</span><span className={`text-xl font-bold ${data.netFlow >= 0 ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>{formatCurrency(data.netFlow, currency)}</span>
                </div>
            </div>
        </div>
    );
};

const TaxSummaryReport: React.FC<{ transactions: Transaction[]; currency: string }> = ({ transactions, currency }) => {
    const { t } = useI18n();
    const [year, setYear] = useState(new Date().getFullYear());
    const availableYears = useMemo(() => [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a: number, b: number) => b - a), [transactions]);

    const data = useMemo(() => {
        const filtered = transactions.filter(t => new Date(t.date).getFullYear() === year);
        const income = filtered.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expenses = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        return { income, expenses, net: income - expenses };
    }, [transactions, year]);

    return (
        <div>
            <div className="mb-4">
                <label htmlFor="tax-year" className="block text-sm font-medium text-gray-500 dark:text-brand-muted mb-1">{t('reportsPage.taxSummary.selectYear')}</label>
                <select id="tax-year" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full sm:w-auto bg-gray-50 dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">{t('reportsPage.taxSummary.taxableIncome')}</span><span className="text-xl font-bold text-green-600 dark:text-brand-green">{formatCurrency(data.income, currency)}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">{t('reportsPage.taxSummary.deductibleExpenses')}</span><span className="text-xl font-bold text-red-600 dark:text-brand-red">{formatCurrency(data.expenses, currency)}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="font-semibold text-gray-800 dark:text-white">{t('reportsPage.taxSummary.estimatedNet')}</span><span className={`text-xl font-bold ${data.net >= 0 ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>{formatCurrency(data.net, currency)}</span>
                </div>
            </div>
        </div>
    );
};

const FinancialSnapshotReport: React.FC<{ summary: FinancialSummary; currency: string }> = ({ summary, currency }) => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t('reportsPage.financialSnapshot.asOfToday')}</h3>
            <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg">
                <span className="text-gray-700 dark:text-gray-200">{t('reportsPage.financialSnapshot.assets')}</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.balance, currency)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg">
                <span className="text-gray-700 dark:text-gray-200">{t('reportsPage.financialSnapshot.liabilities')}</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white" title="Liability tracking not implemented">{formatCurrency(0, currency)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-100 dark:bg-brand-primary p-4 rounded-lg border-t-2 border-gray-300 dark:border-gray-600">
                <span className="font-semibold text-gray-800 dark:text-white">{t('reportsPage.financialSnapshot.equity')}</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.balance, currency)}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-brand-muted pt-2">{t('reportsPage.financialSnapshot.simplifiedNote')}</p>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

interface ReportsPageProps {
    transactions: Transaction[];
    summary: FinancialSummary;
    currency: string;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, summary, currency }) => {
    const { t } = useI18n();
    const [activeReport, setActiveReport] = useState<string | null>(null);

    const reportList = useMemo(() => [
        { title: t('reportsPage.pnl.title'), description: t('reportsPage.pnl.description') },
        { title: t('reportsPage.expenseByCategory.title'), description: t('reportsPage.expenseByCategory.description') },
        { title: t('reportsPage.incomeBySource.title'), description: t('reportsPage.incomeBySource.description') },
        { title: t('reportsPage.cashFlow.title'), description: t('reportsPage.cashFlow.description') },
        { title: t('reportsPage.taxSummary.title'), description: t('reportsPage.taxSummary.description') },
        { title: t('reportsPage.financialSnapshot.title'), description: t('reportsPage.financialSnapshot.description') },
    ], [t]);

    const renderActiveReport = () => {
        if (!activeReport) return null;

        const reportComponentMap: Record<string, React.ReactNode> = {
            [t('reportsPage.pnl.title')]: <ProfitAndLossReport transactions={transactions} currency={currency} />,
            [t('reportsPage.expenseByCategory.title')]: <ExpenseByCategoryReport transactions={transactions} currency={currency} />,
            [t('reportsPage.incomeBySource.title')]: <IncomeBySourceReport transactions={transactions} currency={currency} />,
            [t('reportsPage.cashFlow.title')]: <CashFlowReport transactions={transactions} currency={currency} />,
            [t('reportsPage.taxSummary.title')]: <TaxSummaryReport transactions={transactions} currency={currency} />,
            [t('reportsPage.financialSnapshot.title')]: <FinancialSnapshotReport summary={summary} currency={currency} />,
        };

        return (
            <ReportContainer title={activeReport} onClose={() => setActiveReport(null)}>
                {reportComponentMap[activeReport] || <p>Report not found.</p>}
            </ReportContainer>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="flex items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('reportsPage.title')}</h1>
            </div>

            {activeReport ? renderActiveReport() : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reportList.map(report => (
                        <ReportCard
                            key={report.title}
                            title={report.title}
                            description={report.description}
                            onClick={() => setActiveReport(report.title)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
