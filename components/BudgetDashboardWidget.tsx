
import React, { useMemo } from 'react';
import { Budget, Category, Transaction, TransactionType, Page } from '../types';
import { BudgetIcon, ChevronRightIcon, AlertTriangleIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface BudgetDashboardWidgetProps {
    budgets: Budget[];
    categories: Category[];
    transactions: Transaction[];
    currency: string;
    onNavigate: (page: Page) => void;
}

const BudgetDashboardWidget: React.FC<BudgetDashboardWidgetProps> = ({ budgets, categories, transactions, currency, onNavigate }) => {
    const { t } = useI18n();

    const budgetStatus = useMemo(() => {
        const now = new Date();
        const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

        return budgets.map(budget => {
            const category = categoryMap.get(budget.categoryId);
            if (!category) return null;

            // Find child categories if this is a group
            const relevantCategoryIds = new Set([budget.categoryId]);
            if (!category.parentId) {
                categories.filter(c => c.parentId === budget.categoryId).forEach(c => relevantCategoryIds.add(c.id));
            }
            
            // Re-map to names for transaction matching
            const relevantCategoryNames = new Set<string>();
            relevantCategoryIds.forEach(id => {
                const cat = categoryMap.get(id);
                if (cat) relevantCategoryNames.add(cat.name);
            });

            const spent = transactions
                .filter(t => {
                    if (t.type !== TransactionType.EXPENSE || !relevantCategoryNames.has(t.category)) return false;
                    const tDate = new Date(t.date);
                    if (budget.period === 'monthly') {
                        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                    } else {
                        return tDate.getFullYear() === now.getFullYear();
                    }
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            return {
                ...budget,
                categoryName: category.name,
                spent,
                percent,
                remaining: budget.amount - spent
            };
        })
        .filter(b => b !== null)
        .sort((a, b) => (b!.percent - a!.percent)) // Sort by highest usage (risk) first
        .slice(0, 4); // Show top 4
    }, [budgets, categories, transactions]);

    if (budgets.length === 0) {
        return (
            <div className="bg-white dark:bg-brand-secondary p-6 rounded-xl shadow-md dark:shadow-lg h-full flex flex-col justify-center items-center text-center min-h-[16rem] min-w-0">
                <div className="p-3 bg-gray-100 dark:bg-brand-primary rounded-full mb-3">
                    <BudgetIcon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium">{t('budgetsPage.noBudgets')}</h3>
                <p className="text-sm text-gray-500 dark:text-brand-muted mt-1 mb-4">{t('budgetsPage.getStarted')}</p>
                <button 
                    onClick={() => onNavigate('budgets')}
                    className="text-sm bg-brand-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                    {t('budgetsPage.create')}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg h-full flex flex-col min-h-[16rem] min-w-0">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 break-words">{t('budgetsPage.title')}</h3>
                <button onClick={() => onNavigate('budgets')} className="p-1 text-gray-500 hover:text-brand-accent transition-colors">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="space-y-5 flex-grow overflow-y-auto pr-1 custom-scrollbar">
                {budgetStatus.map(item => {
                    if(!item) return null;
                    const isOver = item.percent > 100;
                    const color = isOver ? 'bg-brand-red' : item.percent > 85 ? 'bg-yellow-500' : 'bg-brand-green';
                    
                    return (
                        <div key={item.id} className="group">
                            <div className="flex justify-between items-end mb-1">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200 truncate max-w-[120px]">{item.categoryName}</span>
                                        {isOver && <AlertTriangleIcon className="w-3.5 h-3.5 text-brand-red" />}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {isOver ? 'Over by ' : 'Left: '} 
                                        <span className={isOver ? 'text-red-500 font-medium' : 'text-green-600 dark:text-green-400'}>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.abs(item.remaining))}
                                        </span>
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    {item.percent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${color}`} 
                                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BudgetDashboardWidget;
