import { useTranslation } from 'react-i18next';
import type { PublicLessonSummary } from '../../types';
import { Icon } from '../ui/Icon';
import { LessonList } from './LessonList';

interface LessonSidebarProps {
  id: string;
  lessons: readonly PublicLessonSummary[];
  currentSlug: string;
  basePath: string;
  collapsed: boolean;
  onToggle: () => void;
}

/** Persistent lessons list for desktop; collapses to a rail of numbers. */
export function LessonSidebar({ id, lessons, currentSlug, basePath, collapsed, onToggle }: LessonSidebarProps) {
  const { t } = useTranslation();
  const titleId = `${id}-title`;
  const toggleLabel = collapsed ? t('tree.showSidebar') : t('tree.hideSidebar');

  return (
    <nav id={id} className={collapsed ? 'lesson-sidebar lesson-sidebar--rail' : 'lesson-sidebar'} aria-labelledby={titleId}>
      <div className="ls-hdr">
        <h2 id={titleId} className={collapsed ? 'sr-only' : undefined}>
          {t('tree.sidebarTitle')}
          <span className="ls-count">{lessons.length}</span>
        </h2>
        <button type="button" className="btn btn--ghost btn--icon" aria-expanded={!collapsed} aria-controls={`${id}-list`}
          aria-label={toggleLabel} title={toggleLabel} onClick={onToggle}>
          <Icon name="panel" />
        </button>
      </div>
      <div id={`${id}-list`} className="ls-body">
        <LessonList id={id} lessons={lessons} currentSlug={currentSlug} basePath={basePath} compact={collapsed} />
      </div>
    </nav>
  );
}
