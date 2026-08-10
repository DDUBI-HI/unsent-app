interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  message,
  confirmLabel = '삭제',
  cancelLabel = '취소',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-xs rounded-2xl bg-white p-5 dark:bg-neutral-800">
        <p className="whitespace-pre-wrap text-center text-sm text-neutral-800 dark:text-neutral-100">
          {message}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium text-white ${
              danger ? 'bg-red-500' : 'bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
