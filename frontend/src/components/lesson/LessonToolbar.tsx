import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { PublicLessonSummary } from '../../types';
import { Icon } from '../ui/Icon';

interface LessonToolbarProps {
  lessons: readonly PublicLessonSummary[];
  index: number;
  basePath: string;
  /** Where the last lesson's "next" leads (the subtopic's lesson list). */
  doneTo: string;
  /** The lessons dialog button only exists where the persistent sidebar does not. */
  showLessonsButton: boolean;
  drawerId: string;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  toggleRef: Ref<HTMLButtonElement>;
}

/** Lesson navigation: previous/next lesson with visible names and, below desktop width, the lessons dialog toggle. */
export function LessonToolbar({
  lessons, index, basePath, doneTo, showLessonsButton, drawerId, drawerOpen, onOpenDrawer, toggleRef,
}: LessonToolbarProps) {
  const { t } = useTranslation();
  const previous = index > 0 ? lessons[index - 1] : undefined;
  const next = index < lessons.length - 1 ? lessons[index + 1] : undefined;

  return (
    <nav className="lesson-nav" aria-label={t('tree.lessonNavigation')}>
      {previous ? (
        <Link className="btn btn--secondary nb nb--prev" to={`${basePath}/${previous.slug}`} title={previous.name}>
          <Icon name="arrow-start" />
          <span className="nb-text">
            <span className="nb-label">{t('tree.previousLesson')}</span>
            <bdi className="nb-name">{previous.name}</bdi>
          </span>
        </Link>
      ) : (
        <button type="button" className="btn btn--secondary nb nb--prev" disabled>
          <Icon name="arrow-start" />
          <span className="nb-text"><span className="nb-label">{t('tree.previousLesson')}</span></span>
        </button>
      )}
      {showLessonsButton && (
        <button
          ref={toggleRef}
          type="button"
          className="btn btn--secondary nb-lessons"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          onClick={onOpenDrawer}
        >
          <Icon name="list" />
          <span className="nb-lessons-label">{t('tree.lessonsButton')}</span>
          <span className="ls-count">{lessons.length}</span>
        </button>
      )}
      {next ? (
        <Link className="btn btn--primary nb nb--next" to={`${basePath}/${next.slug}`} title={next.name}>
          <span className="nb-text">
            <span className="nb-label">{t('tree.nextLesson')}</span>
            <bdi className="nb-name">{next.name}</bdi>
          </span>
          <Icon name="arrow-end" />
        </Link>
      ) : (
        <Link className="btn btn--primary nb nb--next" to={doneTo}>
          <span className="nb-text"><span className="nb-label">{t('tree.lastLessonDone')}</span></span>
          <Icon name="list" />
        </Link>
      )}
    </nav>
  );
}
