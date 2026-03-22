import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '../types';
import { BriefcaseIcon, ChevronDownIcon, CheckIcon, SettingsIcon } from './Icons';

interface ProfileSwitcherProps {
    activeProfile: Profile;
    profiles: Profile[];
    onSwitchProfile: (profileId: string) => void;
    onManageProfiles: () => void;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ activeProfile, profiles, onSwitchProfile, onManageProfiles }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

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
    }
    
    const handleManage = () => {
        onManageProfiles();
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white bg-gray-200 dark:bg-brand-primary hover:bg-gray-300 dark:hover:bg-gray-800 p-2 rounded-lg"
            >
                <BriefcaseIcon className="w-5 h-5 text-brand-accent" />
                <span className="hidden md:inline">{activeProfile.name}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-brand-secondary rounded-lg shadow-2xl z-40 border border-gray-200 dark:border-gray-700">
                    <div className="p-2">
                        <p className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-brand-muted uppercase">Switch Profile</p>
                        <ul className="max-h-60 overflow-y-auto">
                            {profiles.map(profile => (
                                <li key={profile.id}>
                                    <button
                                        onClick={() => handleSwitch(profile.id)}
                                        className="w-full text-left flex items-center justify-between p-2 text-sm rounded-md text-gray-800 dark:text-gray-200 hover:bg-brand-accent hover:text-white"
                                    >
                                        <span>{profile.name}</span>
                                        {profile.id === activeProfile.id && <CheckIcon className="w-5 h-5 text-brand-green" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                         <button
                            onClick={handleManage}
                            className="w-full text-left flex items-center gap-2 p-2 text-sm rounded-md text-gray-600 dark:text-brand-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        >
                            <SettingsIcon className="w-5 h-5" />
                            <span>Manage Profiles</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSwitcher;
