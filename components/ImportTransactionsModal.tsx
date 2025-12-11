import React, { useState, useCallback } from 'react';
import { Transaction, TransactionType } from '../types';
import { XIcon, ImportIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface ImportTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (transactions: Omit<Transaction, 'id'>[]) => void;
}

const ImportTransactionsModal: React.FC<ImportTransactionsModalProps> = ({ isOpen, onClose, onImport }) => {
    const { t } = useI18n();
    const [parsedData, setParsedData] = useState<Omit<Transaction, 'id'>[]>([]);
    const [error, setError] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError('');
        setParsedData([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) {
                setError(t('modals.receiptScanner.errorReadFile'));
                return;
            }
            parseCSV(text);
        };
        reader.onerror = () => {
            setError(t('modals.receiptScanner.errorReadFile'));
        };
        reader.readAsText(file);
    };

    const parseCSV = (csvText: string) => {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        const headers = lines.shift()?.toLowerCase().split(',').map(h => h.trim()) || [];
        
        const requiredHeaders = ['date', 'description', 'amount', 'type', 'category'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            setError(t('modals.import.errorHeaders'));
            return;
        }

        const transactions: Omit<Transaction, 'id'>[] = [];
        for (let i = 0; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            
            try {
                const amount = parseFloat(row.amount);
                if (isNaN(amount)) throw new Error(t('modals.import.errorAmount', {line: i + 2}));
                
                const type = (row.type.trim().charAt(0).toUpperCase() + row.type.trim().slice(1).toLowerCase()) as TransactionType;
                if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
                     throw new Error(t('modals.import.errorType', {line: i + 2}));
                }

                if (!Date.parse(row.date)) throw new Error(t('modals.import.errorDate', {line: i + 2}));

                transactions.push({
                    date: new Date(row.date).toISOString(),
                    description: row.description || '',
                    amount,
                    type,
                    category: row.category || 'Uncategorized'
                });

            } catch(e) {
                if (e instanceof Error) setError(e.message);
                else setError(t('general.error.unknown'));
                setParsedData([]);
                return;
            }
        }
        setParsedData(transactions);
    };

    const handleConfirmImport = () => {
        if (parsedData.length > 0) {
            onImport(parsedData);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ImportIcon /> {t('modals.import.title')}
                    </h2>
                    <button onClick={onClose} aria-label="Close" className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                        <XIcon />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r-lg">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300">{t('modals.import.instructionsTitle')}</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {t('modals.import.instructionsBody')}
                        </p>
                        <code className="block mt-2 p-2 bg-gray-100 dark:bg-brand-primary rounded-md text-xs text-gray-600 dark:text-gray-400">
                            date,description,amount,type,category<br/>
                            2024-07-20,Client Project A,5000,Income,Service Fees<br/>
                            2024-07-19,Monthly Software Subscription,75,Expense,Software & Subscriptions
                        </code>
                    </div>

                    <div>
                        <label htmlFor="csv-upload" className="w-full cursor-pointer inline-flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                            <ImportIcon />
                            {fileName || t('modals.import.selectFile')}
                        </label>
                        <input id="csv-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
                    </div>

                    {error && <p className="text-sm text-red-600 dark:text-brand-red text-center" role="alert">{error}</p>}
                    
                    {parsedData.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-200">{t('modals.import.preview', {count: parsedData.length})}</h4>
                            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-brand-primary sticky top-0"><tr className="text-left"><th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2">Amount</th><th className="p-2">Type</th></tr></thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {parsedData.slice(0, 10).map((t, i) => (
                                            <tr key={i}><td className="p-2">{new Date(t.date).toLocaleDateString()}</td><td className="p-2">{t.description}</td><td className="p-2">{t.amount}</td><td className="p-2">{t.type}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {parsedData.length > 10 && <p className="text-xs text-center text-gray-500 mt-1">...and {parsedData.length - 10} more rows.</p>}
                        </div>
                    )}
                </div>

                <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-4 rounded-b-xl flex-shrink-0">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold">{t('general.cancel')}</button>
                    <button type="button" onClick={handleConfirmImport} disabled={parsedData.length === 0 || !!error} className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">{t('modals.import.confirm', {count: parsedData.length})}</button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ImportTransactionsModal;

