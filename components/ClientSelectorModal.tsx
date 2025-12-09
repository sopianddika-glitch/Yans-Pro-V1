
import React, { useState, useEffect } from 'react';
import { XIcon, InvoiceIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface ClientSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (clientName: string) => void;
    existingClients: string[];
}

const ClientSelectorModal: React.FC<ClientSelectorModalProps> = ({ isOpen, onClose, onConfirm, existingClients }) => {
    const { t } = useI18n();
    const [clientName, setClientName] = useState('');
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setClientName('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!clientName.trim()) {
            setError(t('general.error.requiredFields'));
            return;
        }
        onConfirm(clientName.trim());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 p-4" aria-modal="true" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <InvoiceIcon />
                        <span>{t('modals.clientSelector.title')}</span>
                    </h2>
                    <button onClick={onClose} aria-label={t('general.close')} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-hidden flex flex-col">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <p className="text-sm text-gray-600 dark:text-brand-muted">{t('modals.clientSelector.description')}</p>
                        
                        <div>
                            <label htmlFor="client-name" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.clientSelector.clientName')}</label>
                            <input 
                                type="text" 
                                id="client-name" 
                                value={clientName} 
                                onChange={e => setClientName(e.target.value)} 
                                required 
                                autoFocus 
                                list="existing-clients"
                                className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" 
                                placeholder={t('modals.clientSelector.clientNamePlaceholder')}
                            />
                            <datalist id="existing-clients">
                                {existingClients.map(client => <option key={client} value={client} />)}
                            </datalist>
                        </div>
                        
                        {error && <p className="text-sm text-red-600 dark:text-brand-red text-center" role="alert">{error}</p>}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-4 rounded-b-xl flex-shrink-0">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors">{t('general.cancel')}</button>
                        <button type="submit" className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold transition-colors">{t('modals.clientSelector.confirm')}</button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ClientSelectorModal;
