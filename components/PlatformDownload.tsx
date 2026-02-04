import React from 'react';
import { WindowsIcon, GooglePlayIcon, AppleIcon, MacOSIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface PlatformDownloadProps {
    onInstallClick: (platform: 'windows' | 'macos' | 'android' | 'ios') => void;
}

const PlatformDownload: React.FC<PlatformDownloadProps> = ({ onInstallClick }) => {
    const { t } = useI18n();

    return (
        <div className="bg-white dark:bg-brand-secondary p-4 sm:p-6 rounded-xl shadow-md dark:shadow-lg min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center break-words">{t('dashboard.platformDownload.title')}</h3>
            <p className="text-center text-sm sm:text-base text-gray-500 dark:text-brand-muted mb-6 break-words">{t('dashboard.platformDownload.description')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => onInstallClick('windows')}
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-brand-primary p-4 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                    <WindowsIcon className="w-6 h-6 text-blue-500" />
                    <span>{t('dashboard.platformDownload.windows')}</span>
                </button>
                <button
                    onClick={() => onInstallClick('macos')}
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-brand-primary p-4 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                    <MacOSIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    <span>{t('dashboard.platformDownload.macOS')}</span>
                </button>
                <button
                    onClick={() => onInstallClick('android')}
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-brand-primary p-4 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                    <GooglePlayIcon className="w-6 h-6 text-green-500" />
                    <span>{t('dashboard.platformDownload.googlePlay')}</span>
                </button>
                <button
                    onClick={() => onInstallClick('ios')}
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-brand-primary p-4 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                    <AppleIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    <span>{t('dashboard.platformDownload.appStore')}</span>
                </button>
            </div>
        </div>
    );
};

export default PlatformDownload;
