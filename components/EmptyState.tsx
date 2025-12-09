
import React from 'react';
import { AddIcon } from './Icons';

interface EmptyStateProps {
    Icon: React.FC<{ className?: string }>;
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, message, action }) => {
    return (
        <div className="text-center py-16 bg-white dark:bg-brand-secondary rounded-xl shadow-md w-full">
            <Icon className="mx-auto h-12 w-12 text-gray-400 dark:text-brand-muted" />
            <h3 className="mt-2 text-lg font-medium text-gray-800 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-brand-muted">{message}</p>
            {action && (
                <div className="mt-6">
                    <button
                        onClick={action.onClick}
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-accent hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:ring-offset-brand-secondary focus:ring-brand-accent"
                    >
                        <AddIcon />
                        {action.label}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
