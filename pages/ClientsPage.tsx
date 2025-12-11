
import React, { useState, useMemo } from 'react';
import { Client, Transaction, TransactionType } from '../types';
import { UsersIcon, AddIcon, EditIcon, DeleteIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import AddClientModal from '../components/AddClientModal';
import { useI18n } from '../hooks/useI18n';

interface ClientsPageProps {
    clients: Client[];
    transactions: Transaction[];
    currency: string;
    onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
    onUpdateClient: (client: Client) => void;
    onDeleteClient: (id: string) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, transactions, currency, onAddClient, onUpdateClient, onDeleteClient }) => {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const clientData = useMemo(() => {
        return clients.map(client => {
            const clientTransactions = transactions.filter(t => t.clientId === client.id && t.type === TransactionType.INCOME);
            const totalSpent = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const lastTransactionDate = clientTransactions.length > 0 
                ? clientTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
                : null;
            
            return {
                ...client,
                totalSpent,
                lastTransactionDate
            };
        });
    }, [clients, transactions]);

    const filteredClients = useMemo(() => {
        return clientData.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [clientData, searchTerm]);

    const handleOpenModal = (client: Client | null = null) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleSave = (data: Omit<Client, 'id' | 'createdAt'>, clientId?: string) => {
        if (clientId) {
            const original = clients.find(c => c.id === clientId);
            if (original) onUpdateClient({ ...original, ...data });
        } else {
            onAddClient(data);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('clientsPage.deleteConfirm'))) {
            onDeleteClient(id);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-brand-primary min-h-full">
            <div className="flex flex-col gap-4 sm:flex-row justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('clientsPage.title')}</h1>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                    <AddIcon />
                    <span>{t('clientsPage.addClient')}</span>
                </button>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder={t('clientsPage.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md bg-white dark:bg-brand-secondary border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                />
            </div>

            {filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map(client => (
                        <div key={client.id} className="bg-white dark:bg-brand-secondary p-5 rounded-xl shadow-md dark:shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-lg">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{client.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-brand-muted">{client.email || client.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} className="p-1 text-gray-500 hover:text-brand-accent transition-colors"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }} className="p-1 text-gray-500 hover:text-brand-red transition-colors"><DeleteIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-brand-muted">{t('clientsPage.ltv')}</span>
                                        <span className="font-bold text-brand-green">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(client.totalSpent)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-brand-muted">{t('clientsPage.lastTransaction')}</span>
                                        <span className="text-gray-800 dark:text-gray-300">
                                            {client.lastTransactionDate ? new Date(client.lastTransactionDate).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    Icon={UsersIcon}
                    title={t('clientsPage.noClients')}
                    message={t('clientsPage.getStarted')}
                    action={{
                        label: t('clientsPage.addClient'),
                        onClick: () => handleOpenModal(null)
                    }}
                />
            )}

            <AddClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                existingClient={editingClient}
            />
        </div>
    );
};

export default ClientsPage;
