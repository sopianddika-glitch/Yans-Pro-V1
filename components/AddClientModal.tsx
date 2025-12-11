
import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { XIcon, DeleteIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (clientData: Omit<Client, 'id' | 'createdAt'>, clientId?: string) => void;
    onDelete?: (id: string) => void;
    existingClient: Client | null;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSave, onDelete, existingClient }) => {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const isEditMode = !!existingClient;

    useEffect(() => {
        if (isOpen) {
            setName(existingClient?.name || '');
            setEmail(existingClient?.email || '');
            setPhone(existingClient?.phone || '');
            setAddress(existingClient?.address || '');
            setNotes(existingClient?.notes || '');
            setError('');
        }
    }, [isOpen, existingClient]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError(t('general.error.requiredFields'));
            return;
        }
        onSave({ name, email, phone, address, notes }, existingClient?.id);
        onClose();
    };

    const handleDelete = () => {
        if (onDelete && existingClient) {
            if (window.confirm("Are you sure you want to delete this client?")) {
                onDelete(existingClient.id);
            }
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {isEditMode ? t('modals.addClient.editTitle') : t('modals.addClient.createTitle')}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addClient.name')}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addClient.email')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="john@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addClient.phone')}</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="+1 234 567 890" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.addClient.address')}</label>
                        <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="123 Main St..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('general.notes')}</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="Preferred customer..." />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-between gap-4 pt-4">
                        <div>
                            {isEditMode && onDelete && (
                                <button type="button" onClick={handleDelete} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors" aria-label={t('general.delete')}>
                                    <DeleteIcon />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold">{t('general.cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-brand-accent hover:bg-blue-600 text-white rounded-lg font-semibold">{t('general.save')}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
