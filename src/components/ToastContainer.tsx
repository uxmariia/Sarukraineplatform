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

  const borderColors = {
    success: 'border-[rgba(34,197,94,0.5)]',
    error: 'border-[rgba(239,68,68,0.5)]',
    info: 'border-[rgba(59,130,246,0.5)]',
  };

  return (
    <div className="fixed top-20 right-5 z-[1000] flex flex-col gap-3">
      {toasts.map((toast) => {
        const IconComponent = iconComponents[toast.type];
        return (
          <div
            key={toast.id}
            className={`bg-[rgba(30,41,59,0.98)] backdrop-blur-[20px] border ${borderColors[toast.type]} rounded-xl px-5 py-4 min-w-[300px] max-w-[400px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-[slideInRight_0.3s_ease] flex items-center gap-3`}
          >
            <IconComponent className="w-5 h-5 flex-shrink-0" />
            <span className="text-gray-200 flex-1">{toast.message}</span>
            <button
              className="bg-none border-none text-slate-400 cursor-pointer p-0 w-6 h-6 flex items-center justify-center flex-shrink-0 hover:text-white"
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
