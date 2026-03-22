
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
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick(page);
            }}
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 group ${
                isActive 
                ? 'bg-brand-accent text-white font-semibold shadow-md' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            } ${isMini ? 'lg:justify-center' : ''}`}
        >
            <Icon className="w-6 h-6 flex-shrink-0" />
            <span
                className={`ml-4 text-md transition-all duration-200 ${
                isMini ? 'lg:opacity-0 lg:w-0 lg:invisible' : 'lg:opacity-100 lg:w-auto lg:visible'
                }`}
            >
                {label}
            </span>
             {isMini && (
                <span className="absolute left-full ml-4 hidden lg:group-hover:block bg-brand-secondary text-white text-xs font-bold py-1 px-2 rounded-md whitespace-nowrap">
                    {label}
                </span>
            )}
        </a>
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
            {/* Overlay for mobile */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-60 z-30 transition-opacity lg:hidden ${
                    isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onMobileClose}
                aria-hidden="true"
            ></div>
            
            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full bg-white dark:bg-brand-secondary border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col transition-all duration-300 ease-in-out ${isMini ? 'lg:w-20' : 'lg:w-64'} ${isMobileOpen ? 'w-64 translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className={`flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 ${isMini ? 'lg:px-0 lg:justify-center' : ''}`}>
                    <div className="flex items-center gap-3">
                        <LogoIcon />
                        <span className={`text-xl font-bold text-gray-800 dark:text-white ${isMini ? 'lg:hidden' : ''}`}>{t('appName')}</span>
                    </div>
                     <button onClick={onMobileClose} className="lg:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white ml-auto">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    <ul className="space-y-2">
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
                <div className="px-4 py-6 mt-auto border-t border-gray-200 dark:border-gray-700">
                    <ul className="space-y-2">
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
                 <div className="hidden lg:flex items-center justify-center p-2 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setIsMini(prev => !prev)} 
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label={isMini ? "Expand sidebar" : "Collapse sidebar"}
                    >
                       {isMini ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;

