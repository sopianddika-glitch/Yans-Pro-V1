import React, { useMemo } from 'react';
import {
    Budget,
    Category,
    FinancialSummary,
    Invoice,
    InvoiceStatus,
    Page,
    Profile,
    RecurringTransaction,
    Theme,
    Transaction,
} from '../types';
import StatCard from '../components/StatCard';
import OverviewChart from '../components/OverviewChart';
import ExpenseBreakdownChart from '../components/ExpenseBreakdownChart';
import RecentTransactions from '../components/RecentTransactions';
import FinancialInsight from '../components/FinancialInsight';
import UpcomingInvoices from '../components/UpcomingInvoices';
import UpcomingRecurring from '../components/UpcomingRecurring';
import PlatformDownload from '../components/PlatformDownload';
import CashFlowForecastChart from '../components/CashFlowForecastChart';
import BudgetDashboardWidget from '../components/BudgetDashboardWidget';
import {
    AddIcon,
    AlertTriangleIcon,
    BalanceIcon,
    CameraIcon,
    ExpenseIcon,
    InvoiceIcon,
    ProfitIcon,
    RevenueIcon,
} from '../components/Icons';
import { useI18n } from '../hooks/useI18n';

interface DashboardProps {
    transactions: Transaction[];
    invoices: Invoice[];
    recurringTransactions: RecurringTransaction[];
    budgets: Budget[];
    categories: Category[];
    summary: FinancialSummary;
    activeProfile: Profile;
    onAddTransactionClick: () => void;
    onAddFromReceiptClick: () => void;
    onNavigateToInvoice: (invoiceId?: string | null) => void;
    onNavigateToSettings: () => void;
    onNavigate: (page: Page) => void;
    theme: Theme;
    onOpenInstallModal: (platform: 'windows' | 'macos' | 'android' | 'ios') => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    transactions,
    invoices,
    recurringTransactions,
    budgets,
    categories,
    summary,
    activeProfile,
    onAddTransactionClick,
    onAddFromReceiptClick,
    onNavigateToInvoice,
    onNavigateToSettings,
    onNavigate,
    theme,
    onOpenInstallModal,
}) => {
    const { t } = useI18n();

    const invoiceSummary = useMemo(() => {
        const outstanding = invoices
            .filter(invoice => invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE)
            .reduce((sum, invoice) => sum + invoice.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);

        const overdue = invoices
            .filter(invoice => invoice.status === InvoiceStatus.OVERDUE)
            .reduce((sum, invoice) => sum + invoice.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);

        return { outstanding, overdue };
    }, [invoices]);

    const statCards = [
        {
            title: t('dashboard.stats.totalRevenue'),
            description: t('dashboard.stats.totalRevenueHint'),
            value: summary.totalRevenue,
            icon: <RevenueIcon />,
            currency: activeProfile.currency,
            tone: 'positive' as const,
        },
        {
            title: t('dashboard.stats.totalExpenses'),
            description: t('dashboard.stats.totalExpensesHint'),
            value: summary.totalExpenses,
            icon: <ExpenseIcon />,
            currency: activeProfile.currency,
            isExpense: true,
            tone: 'negative' as const,
        },
        {
            title: t('dashboard.stats.netProfit'),
            description: t('dashboard.stats.netProfitHint'),
            value: summary.netProfit,
            icon: <ProfitIcon />,
            currency: activeProfile.currency,
            tone: summary.netProfit >= 0 ? 'accent' as const : 'negative' as const,
        },
        {
            title: t('dashboard.stats.outstanding'),
            description: t('dashboard.stats.outstandingHint'),
            value: invoiceSummary.outstanding,
            icon: <InvoiceIcon className="h-6 w-6 text-amber-500" />,
            currency: activeProfile.currency,
            tone: 'warning' as const,
        },
        {
            title: t('dashboard.stats.overdue'),
            description: t('dashboard.stats.overdueHint'),
            value: invoiceSummary.overdue,
            icon: <AlertTriangleIcon className="h-6 w-6 text-brand-red" />,
            currency: activeProfile.currency,
            isExpense: true,
            tone: 'negative' as const,
        },
        {
            title: t('dashboard.stats.balance'),
            description: t('dashboard.stats.balanceHint'),
            value: summary.balance,
            icon: <BalanceIcon />,
            currency: activeProfile.currency,
            tone: summary.balance >= 0 ? 'positive' as const : 'negative' as const,
        },
    ];

    return (
        <div className="min-h-full bg-gray-50 dark:bg-brand-primary">
            <style>{`
                @keyframes slide-in-up {
                    from {
                        transform: translateY(18px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in-up {
                    animation: slide-in-up 0.45s ease-out forwards;
                }
            `}</style>

            <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                <header className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
                    <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-brand-secondary">
                        <div className="bg-gradient-to-r from-brand-accent/10 via-white to-green-50/70 p-6 dark:from-brand-accent/10 dark:via-brand-secondary dark:to-brand-primary/70 sm:p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">{t('header.overview')}</p>
                            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                                {t('dashboard.title')}
                            </h1>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600 dark:text-brand-muted sm:text-base">
                                {t('dashboard.subtitle', { businessName: activeProfile.name })}
                            </p>
                        </div>
                    </section>

                    <aside className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-brand-muted">
                            {t('dashboard.quickActions')}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{activeProfile.name}</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-accent dark:bg-brand-accent/20">
                                {activeProfile.currency}
                            </span>
                            <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-300">
                                {t('header.workspaceLabel')}
                            </span>
                        </div>
                        <div className="mt-5 grid gap-3">
                            <button
                                onClick={onAddFromReceiptClick}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                            >
                                <CameraIcon className="h-5 w-5" />
                                <span>{t('dashboard.addFromReceipt')}</span>
                            </button>
                            <button
                                onClick={onAddTransactionClick}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
                            >
                                <AddIcon className="h-5 w-5" />
                                <span>{t('dashboard.addTransaction')}</span>
                            </button>
                        </div>
                    </aside>
                </header>

                <section aria-label={t('dashboard.title')}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {statCards.map((card, index) => (
                            <div
                                key={card.title}
                                className="animate-slide-in-up"
                                style={{ animationDelay: `${index * 80}ms`, opacity: 0 }}
                            >
                                <StatCard {...card} />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
                    <OverviewChart transactions={transactions} theme={theme} currency={activeProfile.currency} />
                    <CashFlowForecastChart transactions={transactions} theme={theme} currency={activeProfile.currency} />
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <UpcomingInvoices
                        invoices={invoices}
                        currency={activeProfile.currency}
                        onNavigateToInvoice={invoiceId => onNavigateToInvoice(invoiceId)}
                        profileName={activeProfile.name}
                    />
                    <UpcomingRecurring
                        transactions={transactions}
                        recurringTransactions={recurringTransactions}
                        currency={activeProfile.currency}
                        onNavigateToSettings={onNavigateToSettings}
                    />
                    <BudgetDashboardWidget
                        budgets={budgets}
                        categories={categories}
                        transactions={transactions}
                        currency={activeProfile.currency}
                        onNavigate={onNavigate}
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                    <RecentTransactions transactions={transactions} currency={activeProfile.currency} />
                    <div className="grid gap-6">
                        <FinancialInsight transactions={transactions} summary={summary} />
                        <PlatformDownload onInstallClick={onOpenInstallModal} />
                    </div>
                </section>

                <section>
                    <ExpenseBreakdownChart transactions={transactions} theme={theme} />
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
