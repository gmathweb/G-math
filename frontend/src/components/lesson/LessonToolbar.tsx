import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { PublicLessonSummary } from '../../types';

interface LessonToolbarProps {
  lessons: readonly PublicLessonSummary[];
  index: number;
  basePath: string;
  drawerId: string;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  toggleRef: Ref<HTMLButtonElement>;
}

/** Arrow pointing "back" in the reading direction; CSS mirrors it for RTL and for "next". */
function Arrow({ next = false }: { next?: boolean }) {
  return (
    <svg className={next ? 'nb-arrow nb-arrow-next' : 'nb-arrow'} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

/** Mockup lesson toolbar (.vc): previous/next lesson within the subtopic, position and the lessons drawer toggle. */
export function LessonToolbar({
  lessons, index, basePath, drawerId, drawerOpen, onOpenDrawer, toggleRef,
}: LessonToolbarProps) {
  const { t } = useTranslation();
  const previous = index > 0 ? lessons[index - 1] : undefined;
  const next = index < lessons.length - 1 ? lessons[index + 1] : undefined;

  return (
    <div className="vc">
      <nav className="pn-row" aria-label={t('tree.lessonNavigation')}>
        {previous ? (
          <Link className="nb" to={`${basePath}/${previous.slug}`} title={previous.name}>
            <Arrow />
            <span className="nb-label">{t('tree.previousLesson')}</span>
          </Link>
        ) : (
          <span className="nb" role="link" aria-disabled="true">
            <Arrow />
            <span className="nb-label">{t('tree.previousLesson')}</span>
          </span>
        )}
        <span className="nc">
          <span className="sr-only">{t('tree.lessonPosition', { current: index + 1, total: lessons.length })}</span>
          <span dir="ltr" aria-hidden="true">{index + 1} / {lessons.length}</span>
        </span>
        {next ? (
          <Link className="nb" to={`${basePath}/${next.slug}`} title={next.name}>
            <span className="nb-label">{t('tree.nextLesson')}</span>
            <Arrow next />
          </Link>
        ) : (
          <span className="nb" role="link" aria-disabled="true">
            <span className="nb-label">{t('tree.nextLesson')}</span>
            <Arrow next />
          </span>
        )}
      </nav>
      <div className="va">
        <button
          ref={toggleRef}
          type="button"
          className="ls-btn"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          onClick={onOpenDrawer}
        >
          <span aria-hidden="true">📋</span>
          {t('tree.lessonsButton')}
          <span className="ls-count">({lessons.length})</span>
        </button>
      </div>
    </div>
  );
}
