import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../types';
import { SunIcon, MoonIcon, DesktopComputerIcon as SystemIcon, ChevronDownIcon } from './Icons';

interface ThemeSwitcherProps {
    theme: Theme;
    onSetTheme: (theme: Theme) => void;
}

const themeOptions = [
    { value: 'light' as Theme, label: 'Light', icon: SunIcon },
    { value: 'dark' as Theme, label: 'Dark', icon: MoonIcon },
    { value: 'system' as Theme, label: 'System', icon: SystemIcon },
];

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onSetTheme }) => {
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

    const handleSelectTheme = (newTheme: Theme) => {
        onSetTheme(newTheme);
        setIsOpen(false);
    };
    
    const CurrentThemeIcon = themeOptions.find(opt => opt.value === theme)?.icon || SystemIcon;

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white bg-gray-200 dark:bg-brand-primary hover:bg-gray-300 dark:hover:bg-gray-800 p-2 rounded-lg"
                aria-label={`Current theme: ${theme}. Change theme.`}
            >
                <CurrentThemeIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-brand-secondary rounded-lg shadow-2xl z-40 border border-gray-200 dark:border-gray-700">
                    <div className="p-1">
                        {(\ ?? []).map(option => (
                             <button
                                key={option.value}
                                onClick={() => handleSelectTheme(option.value)}
                                className={`w-full text-left flex items-center gap-3 p-2 text-sm rounded-md ${
                                    theme === option.value 
                                    ? 'bg-brand-accent text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <option.icon className="w-5 h-5" />
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcher;
