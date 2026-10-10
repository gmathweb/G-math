import { useEffect, useCallback, useRef, useId } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'אישור',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => cancelRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-[fadeIn_150ms_ease-out]"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-lg shadow-xl animate-[slideUp_200ms_ease-out] p-6">
        <h3
          id={`${id}-title`}
          className={`text-lg font-bold mb-2 ${isDanger ? 'text-red-600' : ''}`}
        >
          {title}
        </h3>
        <p id={`${id}-message`} className="text-sm text-[var(--ts)] mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[var(--ts)] hover:text-[var(--tp)] transition-colors"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-semibold text-white rounded transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[var(--g-green)] hover:bg-[var(--g-green)]/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
