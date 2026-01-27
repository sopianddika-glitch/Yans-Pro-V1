
import React, { useMemo } from 'react';
import { Transaction, FinancialSummary, Invoice, InvoiceStatus, Theme, RecurringTransaction, Profile, Budget, Category, Page } from '../types';
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
import { AddIcon, RevenueIcon, ExpenseIcon, ProfitIcon, BalanceIcon, CameraIcon, InvoiceIcon, AlertTriangleIcon } from '../components/Icons';
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
    transactions, invoices, recurringTransactions, budgets, categories, summary, activeProfile, 
    onAddTransactionClick, onAddFromReceiptClick, onNavigateToInvoice, onNavigateToSettings, onNavigate, 
    theme, onOpenInstallModal 
}) => {
    const { t } = useI18n();
    
    const invoiceSummary = useMemo(() => {
        const outstanding = invoices
            .filter(inv => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE)
            .reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);
        
        const overdue = invoices
            .filter(inv => inv.status === InvoiceStatus.OVERDUE)
            .reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);
            
        return { outstanding, overdue };
    }, [invoices]);

    const statCards = [
        { title: t('dashboard.stats.totalRevenue'), value: summary.totalRevenue, icon: <RevenueIcon />, currency: activeProfile.currency },
        { title: t('dashboard.stats.totalExpenses'), value: summary.totalExpenses, icon: <ExpenseIcon />, isExpense: true, currency: activeProfile.currency },
        { title: t('dashboard.stats.netProfit'), value: summary.netProfit, icon: <ProfitIcon />, currency: activeProfile.currency },
        { title: t('dashboard.stats.outstanding'), value: invoiceSummary.outstanding, icon: <InvoiceIcon className="h-6 w-6 text-yellow-400" />, currency: activeProfile.currency },
        { title: t('dashboard.stats.overdue'), value: invoiceSummary.overdue, icon: <AlertTriangleIcon className="h-6 w-6 text-brand-red" />, isExpense: true, currency: activeProfile.currency },
        { title: t('dashboard.stats.balance'), value: summary.balance, icon: <BalanceIcon />, currency: activeProfile.currency }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
             <style>{`
                @keyframes slide-in-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-in-up { animation: slide-in-up 0.5s ease-out forwards; }
            `}</style>
            <div className="flex flex-col gap-4 sm:flex-row justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('dashboard.title')}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={onAddFromReceiptClick}
                        className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                        <CameraIcon />
                        <span className="hidden sm:inline">{t('dashboard.addFromReceipt')}</span>
                    </button>
                    <button
                        onClick={onAddTransactionClick}
                        className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                        <AddIcon />
                        <span>{t('dashboard.addTransaction')}</span>
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-6">
                {statCards.map((card, index) => (
                    <div key={card.title} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}>
                        <StatCard {...card} />
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 min-w-0 overflow-hidden">
                    <OverviewChart transactions={transactions} theme={theme}/>
                </div>
                <div className="lg:col-span-1 min-w-0 overflow-hidden">
                    <CashFlowForecastChart transactions={transactions} theme={theme} currency={activeProfile.currency} />
                </div>
                
                <div className="min-h-[24rem]">
                    <UpcomingInvoices invoices={invoices} currency={activeProfile.currency} onNavigateToInvoice={onNavigateToInvoice} profileName={activeProfile.name} />
                </div>
                <div className="min-h-[24rem]">
                    <UpcomingRecurring transactions={transactions} recurringTransactions={recurringTransactions} currency={activeProfile.currency} onNavigateToSettings={onNavigateToSettings} />
                </div>
                <div className="min-h-[24rem]">
                    <BudgetDashboardWidget budgets={budgets} categories={categories} transactions={transactions} currency={activeProfile.currency} onNavigate={onNavigate} />
                </div>
                
                <div className="lg:col-span-2">
                     <RecentTransactions transactions={transactions} currency={activeProfile.currency} />
                </div>
                <div className="lg:col-span-1">
                     <FinancialInsight transactions={transactions} summary={summary} />
                </div>
                <div className="lg:col-span-3 min-w-0 overflow-hidden">
                     <ExpenseBreakdownChart transactions={transactions} theme={theme} />
                </div>
                 <div className="lg:col-span-3">
                     <PlatformDownload onInstallClick={onOpenInstallModal} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
