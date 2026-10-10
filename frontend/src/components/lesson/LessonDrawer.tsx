import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { PublicLessonSummary } from '../../types';

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
  const [filter, setFilter] = useState('');
  const needle = filter.trim().toLocaleLowerCase();
  const visible = lessons
    .map((lesson, index) => ({ lesson, index }))
    .filter(({ lesson }) => !needle || lesson.name.toLocaleLowerCase().includes(needle));

  return (
    <>
      <div className="ov-hdr">
        <h2 id={titleId}><span aria-hidden="true">📋</span> {t('tree.lessonsButton')}</h2>
        <button type="button" className="ov-close" aria-label={t('tree.close')} onClick={close}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="ov-srch" role="search">
        <label htmlFor={`${id}-filter`} className="sr-only">{t('tree.filterLessons')}</label>
        <input
          id={`${id}-filter`}
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          placeholder={t('tree.filterLessons')}
          value={filter}
          onChange={event => setFilter(event.target.value)}
        />
      </div>
      <div className="ov-list">
        <div role="status">
          {visible.length === 0 && <p className="ov-empty">{t('tree.noMatches')}</p>}
        </div>
        {visible.length > 0 && (
          <ul>
            {visible.map(({ lesson, index }) => {
              const current = lesson.slug === currentSlug;
              return (
                <li key={lesson.id}>
                  <Link
                    to={`${basePath}/${lesson.slug}`}
                    className={current ? 'ov-it on' : 'ov-it'}
                    aria-current={current ? 'page' : undefined}
                    onClick={close}
                  >
                    <span className="ov-it-num" aria-hidden="true">{index + 1}</span>
                    <span className="ov-it-info">
                      <span className="ov-it-name">{lesson.name}</span>
                      {current && <span className="ov-now">{t('tree.currentLesson')}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

/**
 * Mockup lessons overlay (.ov-panel) as a native modal <dialog>: the browser traps focus,
 * makes the page inert and closes on Escape. The body only mounts while open, so the
 * filter starts empty each time.
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
