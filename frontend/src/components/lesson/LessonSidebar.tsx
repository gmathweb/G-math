import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { PublicContentFile, PublicLessonSummary } from '../../types';
import { Icon } from '../ui/Icon';
import { LessonList } from './LessonList';

interface LessonSidebarProps {
  id: string;
  lessons: readonly PublicLessonSummary[];
  currentSlug: string;
  basePath: string;
  collapsed: boolean;
  onToggle: () => void;
  presentations?: readonly PublicContentFile[];
  activePresentationId?: string;
  presentationHref?: (id: string) => string;
}

/** Persistent list panel for desktop: the lesson's presentations on top, subtopic lessons below. Collapses to a rail. */
export function LessonSidebar({
  id, lessons, currentSlug, basePath, collapsed, onToggle,
  presentations = [], activePresentationId, presentationHref,
}: LessonSidebarProps) {
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
        <button type="button" className="btn btn--ghost btn--icon rail-toggle" aria-expanded={!collapsed} aria-controls={`${id}-list`}
          aria-label={toggleLabel} title={toggleLabel} onClick={onToggle}>
          <Icon name="chevron" />
        </button>
      </div>
      <div id={`${id}-list`} className="ls-body">
        {presentations.length > 1 && presentationHref && (
          <div className="ls-section" aria-label={t('lesson.navigation')}>
            <h3 className="ls-sub">{t('lesson.navigation')}</h3>
            <ul className="ls-pres">
              {presentations.map(file => (
                <li key={file.id}>
                  <Link to={presentationHref(file.id)} replace
                    className={file.id === activePresentationId ? 'ls-pres-item ls-pres-item--current' : 'ls-pres-item'}
                    aria-current={file.id === activePresentationId ? 'true' : undefined}>
                    <Icon name="presentation" size={18} />
                    <bdi>{file.display_name}</bdi>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <LessonList id={id} lessons={lessons} currentSlug={currentSlug} basePath={basePath} compact={collapsed} />
      </div>
    </nav>
  );
}
