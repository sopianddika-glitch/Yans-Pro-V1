
import React from 'react';
import { Goal, Page } from '../types';
import { AddIcon, FlagIcon, EditIcon, DeleteIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import { useI18n } from '../hooks/useI18n';

interface GoalsPageProps {
    goals: Goal[];
    currency: string;
    onOpenGoalModal: (goal: Goal | null) => void;
    onDeleteGoal: (id: string) => void;
    onOpenFundsModal: (goal: Goal) => void;
    onNavigate: (page: Page) => void;
}

const formatCurrency = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const GoalCard: React.FC<{ goal: Goal; currency: string; onEdit: () => void; onDelete: () => void; onAddFunds: () => void; }> = 
({ goal, currency, onEdit, onDelete, onAddFunds }) => {
    const { t } = useI18n();
    const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    
    let progressBarColor = 'bg-brand-accent';
    if (percentage >= 100) progressBarColor = 'bg-brand-green';

    return (
        <div className="bg-white dark:bg-brand-secondary p-5 rounded-xl shadow-md dark:shadow-lg flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
            <div>
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex-grow">{goal.name}</h3>
                    <div className="flex items-center flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-gray-500 dark:text-gray-400 hover:text-brand-accent transition-colors"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-gray-500 dark:text-gray-400 hover:text-brand-red transition-colors"><DeleteIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                {goal.targetDate ? (
                    <p className="text-xs text-gray-500 dark:text-brand-muted mt-1">{t('goalsPage.targetDate', { date: new Date(goal.targetDate + 'T00:00:00Z').toLocaleDateString() })}</p>
                ) : (
                     <p className="text-xs text-gray-500 dark:text-brand-muted mt-1">{t('goalsPage.noTargetDate')}</p>
                )}

                <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{formatCurrency(goal.currentAmount, currency)}</span>
                        <span className="text-sm text-gray-500 dark:text-brand-muted">{formatCurrency(goal.targetAmount, currency)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-brand-primary rounded-full h-3">
                        <div className={`${progressBarColor} h-3 rounded-full transition-width duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                    <p className="text-right text-xs font-semibold text-gray-500 dark:text-brand-muted mt-1">{Math.floor(percentage)}%</p>
                </div>
            </div>
            <div className="mt-4">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onAddFunds(); }}
                    className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-400"
                    disabled={goal.currentAmount >= goal.targetAmount}
                 >
                    {t('goalsPage.addFunds')}
                </button>
            </div>
        </div>
    );
};


const GoalsPage: React.FC<GoalsPageProps> = ({ goals, currency, onOpenGoalModal, onDeleteGoal, onOpenFundsModal, onNavigate }) => {
    const { t } = useI18n();
    
    const handleDelete = (id: string, name: string) => {
        if(window.confirm(t('goalsPage.deleteConfirm', { goalName: name }))) {
            onDeleteGoal(id);
        }
    };

    const sortedGoals = [...goals].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="flex flex-col gap-4 sm:flex-row justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('goalsPage.title')}</h1>
                <button
                    onClick={() => onOpenGoalModal(null)}
                    className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                    <AddIcon />
                    <span>{t('goalsPage.create')}</span>
                </button>
            </div>

            {sortedGoals.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedGoals.map(goal => (
                        <GoalCard 
                            key={goal.id} 
                            goal={goal} 
                            currency={currency} 
                            onEdit={() => onOpenGoalModal(goal)}
                            onDelete={() => handleDelete(goal.id, goal.name)}
                            onAddFunds={() => onOpenFundsModal(goal)}
                        />
                    ))}
                 </div>
            ) : (
                <EmptyState
                    Icon={FlagIcon}
                    title={t('goalsPage.noGoals')}
                    message={t('goalsPage.getStarted')}
                    action={{
                        label: t('goalsPage.create'),
                        onClick: () => onOpenGoalModal(null)
                    }}
                />
            )}
        </div>
    );
};

export default GoalsPage;

