import React, { useMemo } from 'react';
import { Budget, Category, Page, Transaction, TransactionType } from '../types';
import { AlertTriangleIcon, BudgetIcon, ChevronRightIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';
import { formatCurrency } from '../utils/intl';

interface BudgetDashboardWidgetProps {
    budgets: Budget[];
    categories: Category[];
    transactions: Transaction[];
    currency: string;
    onNavigate: (page: Page) => void;
}

const BudgetDashboardWidget: React.FC<BudgetDashboardWidgetProps> = ({ budgets, categories, transactions, currency, onNavigate }) => {
    const { t, locale } = useI18n();

    const budgetStatus = useMemo(() => {
        const now = new Date();
        const categoryMap = new Map<string, Category>(categories.map(category => [category.id, category]));

        return budgets
            .map(budget => {
                const category = categoryMap.get(budget.categoryId);
                if (!category) {
                    return null;
                }

                const relevantCategoryIds = new Set([budget.categoryId]);
                if (!category.parentId) {
                    categories.filter(item => item.parentId === budget.categoryId).forEach(item => relevantCategoryIds.add(item.id));
                }

                const relevantCategoryNames = new Set<string>();
                relevantCategoryIds.forEach(id => {
                    const item = categoryMap.get(id);
                    if (item) {
                        relevantCategoryNames.add(item.name);
                    }
                });

                const spent = transactions
                    .filter(transaction => {
                        if (transaction.type !== TransactionType.EXPENSE || !relevantCategoryNames.has(transaction.category)) {
                            return false;
                        }

                        const transactionDate = new Date(transaction.date);
                        if (budget.period === 'monthly') {
                            return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
                        }

                        return transactionDate.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, transaction) => sum + transaction.amount, 0);

                const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

                return {
                    ...budget,
                    categoryName: category.name,
                    spent,
                    percent,
                    remaining: budget.amount - spent,
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => b!.percent - a!.percent)
            .slice(0, 4);
    }, [budgets, categories, transactions]);

    if (budgets.length === 0) {
        return (
            <section className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-brand-secondary">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-brand-primary dark:text-gray-500">
                    <BudgetIcon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{t('budgetsPage.noBudgets')}</h3>
                <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-brand-muted">{t('budgetsPage.getStarted')}</p>
                <button
                    onClick={() => onNavigate('budgets')}
                    className="mt-5 inline-flex items-center justify-center rounded-2xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
                >
                    {t('budgetsPage.create')}
                </button>
            </section>
        );
    }

    return (
        <section className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-brand-secondary sm:p-6">
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('budgetsPage.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{t('budgetsPage.usage')}</p>
                </div>
                <button
                    onClick={() => onNavigate('budgets')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-700 transition hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    aria-label={t('sidebar.budgets')}
                >
                    <ChevronRightIcon className="h-5 w-5" />
                </button>
            </header>

            <div className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
                {budgetStatus.map(item => {
                    if (!item) {
                        return null;
                    }

                    const isOver = item.percent > 100;
                    const isWarning = !isOver && item.percent >= 85;
                    const progressTone = isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500';

                    return (
                        <article key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-brand-primary/50">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-base font-semibold text-gray-900 dark:text-white">{item.categoryName}</p>
                                        {isOver && <AlertTriangleIcon className="h-4 w-4 text-red-500" />}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">
                                        {formatCurrency(item.spent, currency, locale, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                        {' / '}
                                        {formatCurrency(item.amount, currency, locale, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                </div>
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    isOver
                                        ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                                        : isWarning
                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                            : 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                                }`}>
                                    {item.percent.toFixed(0)}%
                                </span>
                            </div>

                            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                <div
                                    className={`h-full rounded-full ${progressTone}`}
                                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                                />
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                                <p className="text-gray-500 dark:text-brand-muted">
                                    {isOver ? t('budgetsPage.overBy') : t('budgetsPage.remaining')}
                                </p>
                                <p className={`font-semibold ${
                                    isOver ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'
                                }`}>
                                    {formatCurrency(Math.abs(item.remaining), currency, locale, {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default BudgetDashboardWidget;
