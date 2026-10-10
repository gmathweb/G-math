import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  closeDisabled?: boolean;
  fitHeight?: boolean;
}

export default function Modal({ open, onClose, title, children, footer, wide = false, closeDisabled = false, fitHeight = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${title.replace(/\s+/g, '-')}`;

  // Focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement || dialogRef.current?.querySelector('.presentation-viewer-expanded')) return;
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  useLayoutEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const el = dialogRef.current?.querySelector<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    el?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={`relative z-10 w-full ${wide ? 'max-w-5xl' : 'max-w-lg'} max-h-[95dvh] ${fitHeight ? 'h-[95dvh] flex flex-col overflow-hidden' : 'overflow-auto'} bg-white shadow-xl animate-[slideUp_200ms_ease-out]`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--bd)] px-6 py-4">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="min-h-11 min-w-11 text-xl leading-none text-[var(--ts)] hover:text-[var(--tp)] transition-colors"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={`px-6 py-4 ${fitHeight ? 'flex-1 min-h-0 overflow-hidden' : ''}`}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[var(--bd)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
