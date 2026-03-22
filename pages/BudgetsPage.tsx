
import React, { useState, useMemo } from 'react';
import { Budget, Category, Transaction, TransactionType, Page } from '../types';
import { AddIcon, BudgetIcon, EditIcon, DeleteIcon, TrendingUpIcon, AlertTriangleIcon, CheckIcon } from '../components/Icons';
import AddBudgetModal from '../components/AddBudgetModal';
import EmptyState from '../components/EmptyState';
import { useI18n } from '../hooks/useI18n';

// Props from App.tsx
interface BudgetsPageProps {
    budgets: Budget[];
    categories: Category[];
    transactions: Transaction[];
    currency: string;
    onAddBudget: (budget: Omit<Budget, 'id'>) => void;
    onUpdateBudget: (budget: Budget) => void;
    onDeleteBudget: (id: string) => void;
    onNavigate: (page: Page) => void;
}

// Helper to format currency
const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const BudgetsPage: React.FC<BudgetsPageProps> = ({ budgets, categories, transactions, currency, onAddBudget, onUpdateBudget, onDeleteBudget, onNavigate }) => {
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

    const budgetDetails = useMemo(() => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - now.getDate();

        return budgets.map(budget => {
            const budgetCategory = categoryMap.get(budget.categoryId);
            if (!budgetCategory) return null;

            const childCategoryNames = budgetCategory.parentId === null
                ? categories.filter(c => c.parentId === budget.categoryId).map(c => c.name)
                : [];
            
            const relevantCategoryNames = new Set([budgetCategory.name, ...childCategoryNames]);

            const relevantTransactions = transactions.filter(t => {
                if (t.type !== TransactionType.EXPENSE || !relevantCategoryNames.has(t.category)) {
                     return false;
                }

                const transactionDate = new Date(t.date);
                if (budget.period === 'monthly') {
                    return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
                }
                if (budget.period === 'yearly') {
                    return transactionDate.getFullYear() === now.getFullYear();
                }
                
                return true;
            });

            const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
            const remaining = budget.amount - spent;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            
            // Safe daily spend calculation
            const safeDailySpend = (remaining > 0 && budget.period === 'monthly' && daysRemaining > 0) 
                ? remaining / daysRemaining 
                : 0;

            return {
                ...budget,
                categoryName: budgetCategory.name,
                spent,
                remaining,
                percentage,
                safeDailySpend
            };
        }).filter(b => b !== null) as (Budget & { categoryName: string; spent: number; remaining: number; percentage: number; safeDailySpend: number })[];
    }, [budgets, categories, transactions, categoryMap]);

    // Calculate Totals for Summary
    const summary = useMemo(() => {
        const totalBudgeted = budgetDetails.reduce((sum, b) => sum + b.amount, 0);
        const totalSpent = budgetDetails.reduce((sum, b) => sum + b.spent, 0);
        const totalRemaining = totalBudgeted - totalSpent;
        const totalPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
        return { totalBudgeted, totalSpent, totalRemaining, totalPercentage };
    }, [budgetDetails]);

    const handleOpenModal = (budget: Budget | null = null) => {
        setEditingBudget(budget);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setEditingBudget(null);
        setIsModalOpen(false);
    }
    
    const handleDelete = (id: string) => {
        if(window.confirm(t('budgetsPage.deleteConfirm'))) {
            onDeleteBudget(id);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="flex flex-col gap-4 sm:flex-row justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('budgetsPage.title')}</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md"
                >
                    <AddIcon />
                    <span>{t('budgetsPage.create')}</span>
                </button>
            </div>

            {budgetDetails.length > 0 ? (
                <div className="space-y-8">
                    {/* Summary Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-brand-accent rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BudgetIcon className="w-32 h-32" />
                        </div>
                        <h2 className="text-lg font-bold mb-4 relative z-10 opacity-90">Current Period Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            <div>
                                <p className="text-xs uppercase font-bold opacity-70">Total Budgeted</p>
                                <p className="text-3xl font-bold">{formatCurrency(summary.totalBudgeted, currency)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-bold opacity-70">Total Spent</p>
                                <p className="text-3xl font-bold">{formatCurrency(summary.totalSpent, currency)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-bold opacity-70">Remaining</p>
                                <p className="text-3xl font-bold">{formatCurrency(summary.totalRemaining, currency)}</p>
                            </div>
                        </div>
                        <div className="mt-6 relative z-10">
                            <div className="flex justify-between text-xs font-semibold mb-1 opacity-90">
                                <span>{summary.totalPercentage.toFixed(1)}% Used</span>
                                <span>{(100 - Math.min(summary.totalPercentage, 100)).toFixed(0)}% Left</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-700 ${summary.totalPercentage > 100 ? 'bg-red-400' : 'bg-white'}`} 
                                    style={{ width: `${Math.min(summary.totalPercentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Budget Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {budgetDetails.map(budget => {
                            const isOverBudget = budget.spent > budget.amount;
                            const isWarning = !isOverBudget && budget.percentage > 85;
                            
                            let statusColor = 'text-brand-green';
                            let progressBarColor = 'bg-brand-green';
                            let statusText = 'On Track';
                            
                            if (isOverBudget) {
                                statusColor = 'text-brand-red';
                                progressBarColor = 'bg-brand-red';
                                statusText = 'Over Budget';
                            } else if (isWarning) {
                                statusColor = 'text-yellow-500';
                                progressBarColor = 'bg-yellow-500';
                                statusText = 'Warning';
                            }

                            return (
                                <div key={budget.id} className="bg-white dark:bg-brand-secondary p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-gray-100 dark:border-gray-800">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isOverBudget ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                                                    <BudgetIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 dark:text-white line-clamp-1" title={budget.categoryName}>{budget.categoryName}</h3>
                                                    <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">{t(`modals.addBudget.${budget.period}`)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal(budget); }} className="p-1.5 text-gray-400 hover:text-brand-accent transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><EditIcon className="w-4 h-4"/></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(budget.id); }} className="p-1.5 text-gray-400 hover:text-brand-red transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><DeleteIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>

                                        <div className="mt-4 mb-2">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className={`text-2xl font-bold ${isOverBudget ? 'text-brand-red' : 'text-gray-900 dark:text-white'}`}>
                                                    {formatCurrency(budget.spent, currency)}
                                                </span>
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">of {formatCurrency(budget.amount, currency)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                <div className={`${progressBarColor} h-2.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${Math.min(budget.percentage, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                {isOverBudget ? <AlertTriangleIcon className="w-4 h-4 text-brand-red" /> : <CheckIcon className="w-4 h-4 text-brand-green" />}
                                                <span className={`text-sm font-bold ${statusColor}`}>
                                                    {statusText}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{isOverBudget ? 'Over by' : 'Remaining'}</p>
                                                <p className={`text-sm font-bold ${isOverBudget ? 'text-brand-red' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {formatCurrency(Math.abs(budget.remaining), currency)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {budget.safeDailySpend > 0 && !isOverBudget && (
                                            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded-md">
                                                <TrendingUpIcon className="w-3 h-3" />
                                                <span>Safe to spend <strong>{formatCurrency(budget.safeDailySpend, currency)}</strong> / day</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                 <EmptyState
                    Icon={BudgetIcon}
                    title={t('budgetsPage.noBudgets')}
                    message={t('budgetsPage.getStarted')}
                    action={{
                        label: t('budgetsPage.create'),
                        onClick: () => handleOpenModal()
                    }}
                />
            )}

            {isModalOpen && (
                 <AddBudgetModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onAddBudget={onAddBudget}
                    onUpdateBudget={onUpdateBudget}
                    categories={categories}
                    transactions={transactions}
                    existingBudget={editingBudget}
                    currency={currency}
                    onDelete={onDeleteBudget}
                 />
            )}
        </div>
    );
};

export default BudgetsPage;

