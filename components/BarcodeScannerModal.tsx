
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { XIcon, CameraIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const { t } = useI18n();
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Slight delay to ensure DOM element exists
            const timer = setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    /* verbose= */ false
                );
                
                scanner.render(
                    (decodedText) => {
                        onScan(decodedText);
                        onClose(); // Auto close on success
                    },
                    (error) => {
                        // console.warn(error); // Scanning errors are common while moving camera
                    }
                );
                scannerRef.current = scanner;
            }, 100);

            return () => clearTimeout(timer);
        } else {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        }
        
        return () => {
             if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [isOpen, onClose, onScan]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-brand-secondary rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-brand-secondary z-10">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CameraIcon />
                        <span>{t('components.scanner.title')}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                        <XIcon />
                    </button>
                </div>
                
                <div className="p-4 bg-black relative min-h-[300px] flex items-center justify-center">
                    <div id="reader" className="w-full text-white"></div>
                </div>
                
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-brand-secondary">
                    {t('components.scanner.instruction')}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;
