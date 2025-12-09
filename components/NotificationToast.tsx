
import React, { useEffect } from 'react';
import { CheckIcon, XIcon, AlertTriangleIcon } from './Icons';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
}

interface NotificationToastProps {
    notification: Notification | null;
    onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    if (!notification) return null;

    const bgColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    };

    const icons = {
        success: <CheckIcon className="w-5 h-5 text-white" />,
        error: <XIcon className="w-5 h-5 text-white" />,
        info: <AlertTriangleIcon className="w-5 h-5 text-white" />
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-up">
            <div className={`${bgColors[notification.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}>
                <div className="flex-shrink-0">
                    {icons[notification.type]}
                </div>
                <p className="font-medium text-sm flex-grow">{notification.message}</p>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
            <style>{`
                @keyframes slide-in-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-in-up { animation: slide-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default NotificationToast;
