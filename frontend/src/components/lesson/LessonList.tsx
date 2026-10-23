import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { PublicLessonSummary } from '../../types';

/** Filtering only helps once the list is long enough to need it. */
const FILTER_THRESHOLD = 8;

interface LessonListProps {
  id: string;
  lessons: readonly PublicLessonSummary[];
  currentSlug: string;
  basePath: string;
  /** Numbers only (sidebar rail); names move to the accessible name and tooltip. */
  compact?: boolean;
  onNavigate?: () => void;
}

/** Numbered lessons of a subtopic with current/next markers; shared by the sidebar and the dialog. */
export function LessonList({ id, lessons, currentSlug, basePath, compact = false, onNavigate }: LessonListProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const needle = filter.trim().toLocaleLowerCase();
  const showFilter = !compact && lessons.length > FILTER_THRESHOLD;
  const currentIndex = lessons.findIndex(lesson => lesson.slug === currentSlug);
  const visible = lessons
    .map((lesson, index) => ({ lesson, index }))
    .filter(({ lesson }) => !needle || lesson.name.toLocaleLowerCase().includes(needle));

  // Centre the current lesson inside the list only; scrollIntoView could also scroll the page.
  useEffect(() => {
    const list = scroller.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !item) return;
    const listBox = list.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    list.scrollTop += itemBox.top - listBox.top - (list.clientHeight - itemBox.height) / 2;
  }, [currentSlug, compact]);

  return (
    <>
      {showFilter && (
        <div className="ls-search" role="search">
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
      )}
      <div ref={scroller} className={compact ? 'ls-list ls-list--compact' : 'ls-list'}>
        <div role="status">
          {visible.length === 0 && <p className="ls-empty">{t('tree.noMatches')}</p>}
        </div>
        {visible.length > 0 && (
          <ul>
            {visible.map(({ lesson, index }) => {
              const current = lesson.slug === currentSlug;
              const next = currentIndex >= 0 && index === currentIndex + 1;
              return (
                <li key={lesson.id}>
                  <Link
                    to={`${basePath}/${lesson.slug}`}
                    className={current ? 'ls-item ls-item--current' : 'ls-item'}
                    aria-current={current ? 'page' : undefined}
                    aria-label={compact ? lesson.name : undefined}
                    title={compact ? lesson.name : undefined}
                    onClick={onNavigate}
                  >
                    <span className="ls-num" aria-hidden="true">{index + 1}</span>
                    {!compact && (
                      <>
                        <span className="ls-name"><bdi>{lesson.name}</bdi></span>
                        {current && <span className="ls-tag ls-tag--now" title={t('tree.currentLesson')}>{t('tree.nowTag')}</span>}
                        {next && <span className="ls-tag ls-tag--next">{t('tree.nextTag')}</span>}
                      </>
                    )}
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
