import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing !== undefined) {
      window.clearTimeout(existing);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      const timer = window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    const map = timersRef.current;
    return () => {
      map.forEach((timer) => window.clearTimeout(timer));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-full pointer-events-none print:hidden"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const isSuccess = t.variant === 'success';
            return (
              <motion.div
                key={t.id}
                role={isSuccess ? 'status' : 'alert'}
                initial={{ opacity: 0, y: -14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={`pointer-events-auto rounded-2xl border backdrop-blur-xl px-4 py-3.5 shadow-[0_18px_42px_rgba(0,0,0,0.65)] flex items-start gap-3 ${
                  isSuccess
                    ? 'bg-[#111916]/95 border-emerald-500/40 text-white'
                    : 'bg-[#1D1214]/95 border-red-500/40 text-white'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold tracking-wide text-white">{t.title}</p>
                  {t.description && (
                    <p className="text-xs text-white/75 leading-relaxed">{t.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  aria-label="Dismiss notification"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
