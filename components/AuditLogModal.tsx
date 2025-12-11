
import React from 'react';
import { TransactionAudit } from '../types';
import { XIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface AuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string | null;
    auditLog: TransactionAudit[];
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, transactionId, auditLog }) => {
    const { t } = useI18n();

    if (!isOpen || !transactionId) return null;

    const filteredLog = auditLog
        .filter(entry => entry.transactionId === transactionId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            case 'RESTORE': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-scale max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transaction History</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white"><XIcon /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                    {filteredLog.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-brand-muted">No history found for this transaction.</p>
                    ) : (
                        <ul className="space-y-6 relative border-l-2 border-gray-200 dark:border-gray-700 ml-3">
                            {(\ ?? []).map((entry) => (
                                <li key={entry.id} className="ml-6 relative">
                                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-6 h-6 bg-white dark:bg-brand-secondary rounded-full ring-4 ring-white dark:ring-brand-secondary">
                                        <span className={`w-3 h-3 rounded-full ${getActionColor(entry.action).split(' ')[0].replace('bg-', 'bg-').replace('100', '500')}`}></span>
                                    </span>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${getActionColor(entry.action)}`}>
                                                {entry.action}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{entry.description}</p>
                                        
                                        {entry.changes && entry.changes.length > 0 && (
                                            <div className="mt-2 bg-gray-50 dark:bg-brand-primary p-3 rounded-md text-xs border border-gray-200 dark:border-gray-700">
                                                {entry.(\ ?? []).map((change, idx) => (
                                                    <div key={idx} className="grid grid-cols-3 gap-2 mb-1 last:mb-0">
                                                        <span className="font-semibold text-gray-600 dark:text-gray-400 capitalize">{change.field}:</span>
                                                        <span className="text-red-500 line-through truncate" title={String(change.oldValue)}>{String(change.oldValue)}</span>
                                                        <span className="text-green-500 truncate" title={String(change.newValue)}>{String(change.newValue)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogModal;

