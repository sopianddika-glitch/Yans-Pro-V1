import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Profile } from '../types';
import { BriefcaseIcon, ChevronDownIcon, CheckIcon, SettingsIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface ProfileSwitcherProps {
    activeProfile: Profile;
    profiles: Profile[];
    onSwitchProfile: (profileId: string) => void;
    onManageProfiles: () => void;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ activeProfile, profiles, onSwitchProfile, onManageProfiles }) => {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const initials = useMemo(() => {
        return activeProfile.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() ?? '')
            .join('');
    }, [activeProfile.name]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);
    
    const handleSwitch = (id: string) => {
        onSwitchProfile(id);
        setIsOpen(false);
    };

    const handleManage = () => {
        onManageProfiles();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 text-left shadow-sm transition hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:bg-brand-primary/90 dark:hover:border-gray-600 dark:hover:bg-brand-primary"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-sm font-bold text-brand-accent dark:bg-brand-accent/20">
                    {initials}
                </div>
                <div className="hidden min-w-0 md:block">
                    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400 dark:text-brand-muted">
                        {t('header.workspaceLabel')}
                    </p>
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">{activeProfile.name}</p>
                </div>
                <div className="rounded-full bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="absolute right-0 z-40 mt-3 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-brand-secondary">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-brand-muted">
                            {t('header.switchProfile')}
                        </p>
                    </div>
                    <div className="p-2">
                        <ul className="max-h-72 overflow-y-auto">
                            {profiles.map(profile => (
                                <li key={profile.id}>
                                    <button
                                        onClick={() => handleSwitch(profile.id)}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${
                                            profile.id === activeProfile.id
                                                ? 'bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20'
                                                : 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{profile.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-brand-muted">{profile.currency}</p>
                                        </div>
                                        {profile.id === activeProfile.id && <CheckIcon className="h-5 w-5 text-brand-green" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="border-t border-gray-100 p-2 dark:border-gray-700">
                        <button
                            onClick={handleManage}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-brand-muted dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                            <SettingsIcon className="h-5 w-5" />
                            <span>{t('header.manageProfiles')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSwitcher;
