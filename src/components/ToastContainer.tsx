import { Toast } from '../App';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastContainerProps = {
  toasts: Toast[];
  onRemove: (id: string) => void;
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const iconComponents = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
  };

  const styles = {
    success: 'bg-green-50 border-green-300 text-green-800',
    error: 'bg-red-50 border-red-300 text-red-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
  };

  return (
    <div className="fixed top-20 right-5 z-[1000] flex flex-col gap-3">
      {toasts.map((toast) => {
        const IconComponent = iconComponents[toast.type];
        return (
          <div
            key={toast.id}
            className={`${styles[toast.type]} border rounded-xl px-5 py-4 min-w-[300px] max-w-[400px] shadow-lg animate-[slideInRight_0.3s_ease] flex items-center gap-3`}
          >
            <IconComponent className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              className="bg-none border-none text-current opacity-60 cursor-pointer p-0 w-6 h-6 flex items-center justify-center flex-shrink-0 hover:opacity-100 transition-opacity"
              onClick={() => onRemove(toast.id)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
