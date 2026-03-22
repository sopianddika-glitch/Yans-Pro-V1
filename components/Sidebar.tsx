
import React from 'react';
import { Page } from '../types';
import { DashboardIcon, TransactionsIcon, ReportsIcon, SettingsIcon, LogoIcon, XIcon, BudgetIcon, InvoiceIcon, ChevronLeftIcon, ChevronRightIcon, FlagIcon, TagIcon, StorefrontIcon, TrendingUpIcon, BriefcaseIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface SidebarProps {
    isMobileOpen: boolean;
    onMobileClose: () => void;
    isMini: boolean;
    setIsMini: (isMini: boolean | ((prev: boolean) => boolean)) => void;
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

const NavLink: React.FC<{
    page: Page;
    label: string;
    Icon: React.FC<{ className?: string }>;
    isActive: boolean;
    isMini: boolean;
    onClick: (page: Page) => void;
}> = ({ page, label, Icon, isActive, isMini, onClick }) => (
    <li>
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                onClick(page);
            }}
            className={`group relative flex w-full items-center rounded-2xl px-3 py-3 text-left transition-all duration-200 ${
                isActive
                    ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            } ${isMini ? 'lg:justify-center' : ''}`}
        >
            <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                    isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-white dark:bg-gray-800 dark:text-gray-300 dark:group-hover:bg-gray-700'
                }`}
            >
                <Icon className="h-5 w-5" />
            </span>
            <span
                className={`ml-3 text-sm font-medium transition-all duration-200 ${
                    isMini ? 'lg:invisible lg:w-0 lg:opacity-0' : 'lg:visible lg:w-auto lg:opacity-100'
                }`}
            >
                {label}
            </span>
            {isMini && (
                <span className="absolute left-full ml-4 hidden lg:group-hover:block bg-brand-secondary text-white text-xs font-bold py-1 px-2 rounded-md whitespace-nowrap">
                    {label}
                </span>
            )}
        </button>
    </li>
);

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose, isMini, setIsMini, currentPage, onNavigate }) => {
    const { t } = useI18n();

    const navItems = [
        { page: 'dashboard' as Page, label: t('sidebar.dashboard'), icon: DashboardIcon },
        { page: 'pos' as Page, label: t('sidebar.pos'), icon: StorefrontIcon },
        { page: 'transactions' as Page, label: t('sidebar.transactions'), icon: TransactionsIcon },
        { page: 'invoices' as Page, label: t('sidebar.invoices'), icon: InvoiceIcon },
        { page: 'investments' as Page, label: t('sidebar.investments'), icon: TrendingUpIcon },
        { page: 'enterprise' as Page, label: t('enterprise.menu'), icon: BriefcaseIcon },
        { page: 'products' as Page, label: t('sidebar.products'), icon: TagIcon },
        { page: 'budgets' as Page, label: t('sidebar.budgets'), icon: BudgetIcon },
        { page: 'goals' as Page, label: t('sidebar.goals'), icon: FlagIcon },
        { page: 'reports' as Page, label: t('sidebar.reports'), icon: ReportsIcon },
    ];

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-60 z-30 transition-opacity lg:hidden ${
                    isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onMobileClose}
                aria-hidden="true"
            ></div>
            
            <aside className={`fixed top-0 left-0 z-40 flex h-full flex-col border-r border-gray-200 bg-white/95 backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-brand-secondary/95 ${isMini ? 'lg:w-20' : 'lg:w-64'} ${isMobileOpen ? 'w-64 translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className={`flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-700 ${isMini ? 'lg:justify-center lg:px-0' : ''}`}>
                    <div className="flex items-center gap-3">
                        <LogoIcon />
                        <div className={`${isMini ? 'lg:hidden' : ''}`}>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{t('appName')}</p>
                            <p className="text-xs text-gray-500 dark:text-brand-muted">{t('sidebar.navigation')}</p>
                        </div>
                    </div>
                    <button onClick={onMobileClose} className="ml-auto p-1 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white lg:hidden">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label={t('sidebar.navigation')}>
                    <ul className="space-y-2.5">
                        {navItems.map(item => (
                            <NavLink
                                key={item.page}
                                page={item.page}
                                label={item.label}
                                Icon={item.icon}
                                isActive={currentPage === item.page || (currentPage === 'invoice-editor' && item.page === 'invoices')}
                                isMini={isMini}
                                onClick={onNavigate}
                             />
                        ))}
                    </ul>
                </nav>
                <div className="mt-auto border-t border-gray-200 px-4 py-5 dark:border-gray-700">
                    <ul className="space-y-2.5">
                        <NavLink
                            page="settings"
                            label={t('sidebar.settings')}
                            Icon={SettingsIcon}
                            isActive={currentPage === 'settings'}
                            isMini={isMini}
                            onClick={onNavigate}
                        />
                    </ul>
                </div>
                <div className="hidden items-center justify-center border-t border-gray-200 p-2 dark:border-gray-700 lg:flex">
                    <button
                        onClick={() => setIsMini(prev => !prev)}
                        className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        aria-label={isMini ? t('sidebar.expand') : t('sidebar.collapse')}
                    >
                       {isMini ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

