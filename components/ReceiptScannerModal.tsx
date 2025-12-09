


import React, { useState, useCallback, useEffect } from 'react';
import { XIcon, CameraIcon } from './Icons';
import { analyzeReceipt } from '../services/geminiService';
import { ReceiptAnalysisResult } from '../types';
import { useI18n } from '../hooks/useI18n';

interface ReceiptScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (result: ReceiptAnalysisResult) => void;
}

const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // When the modal opens, request camera permission.
            // This is more user-friendly than requesting on app load.
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        // Permission granted. Stop the stream as we don't need to display it.
                        stream.getTracks().forEach(track => track.stop());
                    })
                    .catch(err => {
                        // User likely denied permission. We won't show an error,
                        // as they can still upload a file from their system.
                        console.warn('Camera permission was not granted:', err.message);
                    });
            }
        }
    }, [isOpen]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                processReceipt(base64String, file.type);
            };
            reader.onerror = () => {
                setError(t('modals.receiptScanner.errorReadFile'));
            };
            reader.readAsDataURL(file);
        }
    };

    const processReceipt = useCallback(async (base64Image: string, mimeType: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeReceipt(base64Image, mimeType);
            onSuccess(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('general.error.unknown'));
        } finally {
            setIsLoading(false);
        }
    }, [onSuccess, t]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300 p-4" aria-modal="true" role="dialog" aria-labelledby="scanner-title">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="scanner-title" className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CameraIcon />
                        <span>{t('modals.receiptScanner.title')}</span>
                    </h2>
                    <button onClick={onClose} aria-label={t('general.close')} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 text-center">
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto"></div>
                            <p className="text-gray-500 dark:text-brand-muted">{t('modals.receiptScanner.analyzing')}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">{t('modals.receiptScanner.analyzingWait')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-brand-muted">{t('modals.receiptScanner.description')}</p>
                            <div className="mt-4">
                                <label htmlFor="receipt-upload" className="cursor-pointer w-full inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                                    <CameraIcon />
                                    {t('modals.receiptScanner.selectImage')}
                                </label>
                                <input id="receipt-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                            </div>
                            {error && (
                                <div className="mt-4 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-brand-red text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                                    <p className="font-semibold">{t('modals.receiptScanner.analysisFailed')}</p>
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                 <div className="bg-gray-100 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-4 rounded-b-xl">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors" disabled={isLoading}>
                        {t('general.cancel')}
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

export default ReceiptScannerModal;