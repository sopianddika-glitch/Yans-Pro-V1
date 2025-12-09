import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { XIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface ProfileManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profileData: Omit<Profile, 'id'>, profileId?: string) => void;
    existingProfile: Profile | null;
}

const supportedCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'IDR'];

const ProfileManagerModal: React.FC<ProfileManagerModalProps> = ({ isOpen, onClose, onSave, existingProfile }) => {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [taxId, setTaxId] = useState('');
    
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(existingProfile?.name || '');
            setCurrency(existingProfile?.currency || 'USD');
            setAddress(existingProfile?.address || '');
            setPhone(existingProfile?.phone || '');
            setEmail(existingProfile?.email || '');
            setWebsite(existingProfile?.website || '');
            setTaxId(existingProfile?.taxId || '');
            setError('');
        }
    }, [isOpen, existingProfile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError(t('modals.profileManager.errorEmptyName'));
            return;
        }
        
        const profileData = {
            name: name.trim(),
            currency,
            address: address.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            website: website.trim() || undefined,
            taxId: taxId.trim() || undefined,
        };

        onSave(profileData, existingProfile?.id);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{existingProfile ? t('modals.profileManager.editTitle') : t('modals.profileManager.addTitle')}</h2>
                        <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.profileManager.name')}</label>
                                <input
                                    id="profile-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                    placeholder={t('modals.profileManager.namePlaceholder')}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label htmlFor="profile-currency" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.profileManager.currency')}</label>
                                <select
                                    id="profile-currency"
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                >
                                    {supportedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="profile-tax" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.profileManager.taxId')}</label>
                                <input
                                    id="profile-tax"
                                    type="text"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                    placeholder="12.345.678.9"
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-brand-muted uppercase tracking-wider mb-3">Contact Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label htmlFor="profile-address" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.profileManager.address')}</label>
                                    <textarea
                                        id="profile-address"
                                        rows={2}
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                        placeholder="123 Business Rd, City..."
                                    />
                                </div>
                                <div>
                                    <label htmlFor="profile-email" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.profileManager.email')}</label>
                                    <input
                                        id="profile-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                        placeholder="info@business.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.profileManager.phone')}</label>
                                    <input
                                        id="profile-phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                                 <div className="sm:col-span-2">
                                    <label htmlFor="profile-website" className="block text-sm font-medium text-gray-600 dark:text-brand-muted mb-1">{t('modals.profileManager.website')}</label>
                                    <input
                                        id="profile-website"
                                        type="url"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        className="w-full bg-white dark:bg-brand-primary border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 dark:text-brand-red">{error}</p>}
                    </div>
                    
                    <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-4 rounded-b-xl flex-shrink-0">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors">{t('general.cancel')}</button>
                        <button type="submit" className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold transition-colors">
                            {existingProfile ? t('general.save') : t('modals.profileManager.create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileManagerModal;