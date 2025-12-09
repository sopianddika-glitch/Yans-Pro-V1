
import React from 'react';
import { LogoIcon, MenuIcon } from './Icons';
import ProfileSwitcher from './ProfileSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { Profile, Theme } from '../types';
import { useI18n } from '../hooks/useI18n';

interface HeaderProps {
    onMenuClick: () => void;
    profiles: Profile[];
    activeProfile: Profile;
    onSwitchProfile: (profileId: string) => void;
    onManageProfiles: () => void;
    theme: Theme;
    onSetTheme: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, profiles, activeProfile, onSwitchProfile, onManageProfiles, theme, onSetTheme }) => {
    const { t } = useI18n();
    return (
        <header className="bg-white/80 dark:bg-brand-secondary/80 backdrop-blur-lg sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden mr-3 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent"
                            aria-label="Open sidebar"
                        >
                            <MenuIcon />
                        </button>
                        <div className="flex-shrink-0 flex items-center lg:hidden">
                           <LogoIcon />
                           <span className="ml-3 text-2xl font-bold text-gray-800 dark:text-white hidden sm:block">{t('appName')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <ThemeSwitcher theme={theme} onSetTheme={onSetTheme} />
                        <ProfileSwitcher
                            activeProfile={activeProfile}
                            profiles={profiles}
                            onSwitchProfile={onSwitchProfile}
                            onManageProfiles={onManageProfiles}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
