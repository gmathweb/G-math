import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicLessonSummary } from '../../types';
import { Icon } from '../ui/Icon';
import { LessonList } from './LessonList';

interface LessonDrawerProps {
  id: string;
  open: boolean;
  onClose: () => void;
  lessons: readonly PublicLessonSummary[];
  currentSlug: string;
  basePath: string;
}

interface DrawerBodyProps extends Omit<LessonDrawerProps, 'open' | 'onClose'> {
  titleId: string;
  close: () => void;
}

function DrawerBody({ id, titleId, close, lessons, currentSlug, basePath }: DrawerBodyProps) {
  const { t } = useTranslation();

  return (
    <>
      <span className="ov-handle" aria-hidden="true" />
      <div className="ov-hdr">
        <h2 id={titleId}>
          <Icon name="list" />
          {t('tree.sidebarTitle')}
          <span className="ls-count">{lessons.length}</span>
        </h2>
        <button type="button" className="btn btn--ghost btn--icon" aria-label={t('tree.close')} title={t('tree.close')} onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      <LessonList id={id} lessons={lessons} currentSlug={currentSlug} basePath={basePath} onNavigate={close} />
    </>
  );
}

/**
 * Lessons list as a native modal <dialog> for viewports without the persistent sidebar
 * (side panel on tablet, bottom sheet on phones): the browser traps focus, makes the page
 * inert and closes on Escape. The body only mounts while open, so the filter starts empty.
 */
export function LessonDrawer({ id, open, onClose, lessons, currentSlug, basePath }: LessonDrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = `${id}-title`;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      element.querySelector<HTMLInputElement>('input')?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  const close = () => dialog.current?.close();

  // Clicks on the ::backdrop are dispatched to the <dialog> itself, outside its box.
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right
      && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) close();
  };

  return (
    <dialog ref={dialog} id={id} className="ov-panel" aria-labelledby={titleId} onClose={onClose} onClick={closeOnBackdrop}>
      {open && (
        <DrawerBody id={id} titleId={titleId} close={close} lessons={lessons} currentSlug={currentSlug} basePath={basePath} />
      )}
    </dialog>
  );
}
