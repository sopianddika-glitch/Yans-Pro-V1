
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowDownIcon, ArrowUpIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface RecentTransactionsProps {
    transactions: Transaction[];
    currency: string;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, currency }) => {
    const { t } = useI18n();
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('dashboard.recentTransactions.title')}</h3>
            
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 sm:pl-6">Transaction</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Category</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {sortedTransactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                            {transaction.type === TransactionType.INCOME ? <ArrowUpIcon className="h-5 w-5 text-brand-green" /> : <ArrowDownIcon className="h-5 w-5 text-brand-red" />}
                                        </div>
                                        <div className="ml-4">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className={`whitespace-nowrap px-3 py-4 text-sm font-semibold ${transaction.type === TransactionType.INCOME ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>
                                    {transaction.type === TransactionType.INCOME ? '+' : '-'}
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(transaction.amount)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-brand-muted">{transaction.category}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-brand-muted">
                                    {new Date(transaction.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {sortedTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-3 rounded-lg bg-gray-50 dark:bg-brand-primary border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                    {transaction.type === TransactionType.INCOME ? <ArrowUpIcon className="h-4 w-4 text-brand-green" /> : <ArrowDownIcon className="h-4 w-4 text-brand-red" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{transaction.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-brand-muted">{transaction.category}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-semibold ${transaction.type === TransactionType.INCOME ? 'text-green-600 dark:text-brand-green' : 'text-red-600 dark:text-brand-red'}`}>
                                    {transaction.type === TransactionType.INCOME ? '+' : '-'}
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(transaction.amount)}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

             {sortedTransactions.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-brand-muted">
                    <p>{t('transactionsPage.noTransactions')}</p>
                </div>
            )}
        </div>
    );
};

export default RecentTransactions;
