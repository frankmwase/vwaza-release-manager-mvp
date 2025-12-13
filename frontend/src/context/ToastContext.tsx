import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Global Event Listener for non-React triggers (like api.ts)
    React.useEffect(() => {
        const handleToastEvent = (e: CustomEvent<{ message: string; type: ToastType }>) => {
            showToast(e.detail.message, e.detail.type);
        };
        window.addEventListener('vwaza-toast' as any, handleToastEvent as any);
        return () => window.removeEventListener('vwaza-toast' as any, handleToastEvent as any);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            layout
                            className={`pointer-events-auto p-4 rounded-lg shadow-lg min-w-[300px] flex items-center justify-between
                                ${toast.type === 'error' ? 'bg-red-600 text-white' :
                                    toast.type === 'success' ? 'bg-green-600 text-white' :
                                        'bg-gray-800 text-white'}`}
                        >
                            <span>{toast.message}</span>
                            <button onClick={() => removeToast(toast.id)} className="ml-4 opacity-70 hover:opacity-100">✕</button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
