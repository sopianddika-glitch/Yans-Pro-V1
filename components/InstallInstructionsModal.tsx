import React, { useState, useEffect, useMemo } from 'react';
import { XIcon, WindowsIcon, MacOSIcon, GooglePlayIcon, AppleIcon, InstallIcon, AddIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

type Platform = 'windows' | 'macos' | 'android' | 'ios';

interface InstallInstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    platform: Platform | null;
}

const InstallInstructionsModal: React.FC<InstallInstructionsModalProps> = ({ isOpen, onClose, platform }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<Platform>('windows');

    useEffect(() => {
        if (isOpen) {
            if (platform) {
                setActiveTab(platform);
            } else {
                // Auto-detect platform if not specified
                const userAgent = window.navigator.userAgent;
                if (/Windows/i.test(userAgent)) setActiveTab('windows');
                else if (/Macintosh/i.test(userAgent)) setActiveTab('macos');
                else if (/Android/i.test(userAgent)) setActiveTab('android');
                else if (/iPhone|iPad|iPod/i.test(userAgent)) setActiveTab('ios');
            }
        }
    }, [isOpen, platform]);

    if (!isOpen) return null;

    const tabs: { id: Platform; name: string; icon: React.FC<{ className?: string }>; }[] = [
        { id: 'windows', name: t('dashboard.platformDownload.windows'), icon: WindowsIcon },
        { id: 'macos', name: t('dashboard.platformDownload.macOS'), icon: MacOSIcon },
        { id: 'android', name: t('dashboard.platformDownload.googlePlay'), icon: GooglePlayIcon },
        { id: 'ios', name: t('dashboard.platformDownload.appStore'), icon: AppleIcon },
    ];

    const instructionSteps = {
        windows: [
            { text: t('modals.installGuide.step1_chrome'), icon: <InstallIcon className="w-8 h-8 text-brand-accent"/> },
            { text: t('modals.installGuide.step2_chrome'), icon: <div className="font-bold text-lg bg-brand-accent text-white rounded-md px-4 py-1">{t('general.add')}</div> },
            { text: t('modals.installGuide.step3_desktop') },
        ],
        macos: [
             { text: t('modals.installGuide.step1_chrome'), icon: <InstallIcon className="w-8 h-8 text-brand-accent"/> },
             { text: t('modals.installGuide.step2_chrome'), icon: <div className="font-bold text-lg bg-brand-accent text-white rounded-md px-4 py-1">{t('general.add')}</div> },
             { text: t('modals.installGuide.step3_desktop') },
        ],
        android: [
            { text: t('modals.installGuide.step1_android'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" /></svg> },
            { text: t('modals.installGuide.step2_android') },
            { text: t('modals.installGuide.step3_android') },
        ],
        ios: [
            { text: t('modals.installGuide.step1_safari'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg> },
            { text: t('modals.installGuide.step2_safari'), icon: <div className="text-brand-accent"><AddIcon className="w-7 h-7" /></div> },
            { text: t('modals.installGuide.step3_safari'), icon: <div className="font-bold text-lg bg-brand-accent text-white rounded-md px-4 py-1">{t('general.add')}</div> },
        ],
    };

    const renderContent = () => {
        const steps = instructionSteps[activeTab] || [];
        let title = t('modals.installGuide.chrome_windows');
        if (activeTab === 'ios') title = t('modals.installGuide.safari_ios');
        if (activeTab === 'android') title = t('modals.installGuide.android');

        return (
            <div className="p-6 space-y-6">
                 <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-white">{title}</h3>
                 <ol className="space-y-4">
                    {(\ ?? []).map((step, index) => (
                        <li key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-brand-accent text-white font-bold text-lg rounded-full flex items-center justify-center">{index + 1}</div>
                            <div className="flex-grow pt-1">
                                <p className="text-gray-700 dark:text-gray-300">{step.text}</p>
                                {step.icon && <div className="mt-3 p-2 bg-gray-100 dark:bg-brand-primary rounded-md flex justify-center items-center h-16">{step.icon}</div>}
                            </div>
                        </li>
                    ))}
                 </ol>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 p-4" aria-modal="true" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-800 dark:text-white">{t('modals.installGuide.title', { appName: 'Yans Pro' })}</h2>
                    <button onClick={onClose} aria-label={t('general.close')} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 px-4">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        {(\ ?? []).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
                                        ? 'border-brand-accent text-brand-accent'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                                } group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {renderContent()}
                </div>

                <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-4 rounded-b-xl flex-shrink-0">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-brand-accent hover:bg-blue-600 text-white font-semibold transition-colors">
                        {t('general.close')}
                    </button>
                </div>
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

export default InstallInstructionsModal;
