import { useCallback, useId, useRef, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLesson } from '../../api/lessons';
import { getTopic } from '../../api/topics';
import { ApiError } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useLocale } from '../../hooks/useLocale';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { PresentationViewer, type ViewerLabels } from '../../components/content/PresentationViewer';
import { LessonToolbar } from '../../components/lesson/LessonToolbar';
import { LessonDrawer } from '../../components/lesson/LessonDrawer';
import { LessonSidebar } from '../../components/lesson/LessonSidebar';
import { Icon } from '../../components/ui/Icon';
import type { PublicContentFile } from '../../types';
import './LessonPage.css';

const SIDEBAR_KEY = 'gm.lesson.sidebar';

/** Remembers the student's sidebar choice; the sidebar starts open on every desktop width. */
function useSidebarCollapsed(): [boolean, () => void] {
  const [stored, setStored] = useState<'open' | 'collapsed' | null>(() => {
    try {
      const value = window.localStorage.getItem(SIDEBAR_KEY);
      return value === 'open' || value === 'collapsed' ? value : null;
    } catch {
      return null;
    }
  });
  const collapsed = stored === 'collapsed';
  const toggle = useCallback(() => {
    const next = collapsed ? 'open' : 'collapsed';
    setStored(next);
    try {
      window.localStorage.setItem(SIDEBAR_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit only.
    }
  }, [collapsed]);
  return [collapsed, toggle];
}

export function LessonPage() {
  const { topicSlug = '', subtopicSlug = '', lessonSlug = '' } = useParams();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchParams] = useSearchParams();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapsed();
  const listId = `lessons-${useId().replace(/[^\w-]/g, '')}`;
  const drawerId = `${listId}-dialog`;
  const drawerToggle = useRef<HTMLButtonElement>(null);
  const materials = useRef<HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const lessonQuery = useApi(lessonSlug ? `lesson:${lessonSlug}:${locale}` : null, () => getLesson(lessonSlug, locale));
  const lesson = lessonQuery.data;
  const topicKey = lesson?.topic_slug ?? topicSlug;
  // Siblings come from the topic tree; if it fails only the lesson navigation and list are hidden.
  const topicQuery = useApi(topicKey ? `topic:${topicKey}:${locale}` : null, () => getTopic(topicKey, locale));
  const topic = topicQuery.data;
  const subtopic = topic?.subtopics.find(item => item.slug === (lesson?.subtopic_slug ?? subtopicSlug));
  const siblings = subtopic ? [...subtopic.lessons].sort((a, b) => a.sort_order - b.sort_order) : [];
  const index = siblings.findIndex(item => item.slug === lessonSlug);
  const summary = index >= 0 ? siblings[index] : undefined;

  const notFound = lessonQuery.error instanceof ApiError && lessonQuery.error.status === 404;
  const failed = lessonQuery.error !== undefined && !notFound;
  const lessonName = lesson?.name ?? summary?.name;
  const topicName = lesson?.topic_name ?? topic?.name ?? topicSlug;
  const subtopicName = lesson?.subtopic_name ?? subtopic?.name ?? subtopicSlug;
  const topicPath = `/${topic?.slug ?? topicSlug}`;
  const subtopicPath = `${topicPath}/${subtopic?.slug ?? subtopicSlug}`;

  const presentations = lesson?.content_files.filter(file => file.file_type === 'presentation') ?? [];
  const resources = lesson?.content_files.filter(file => file.file_type !== 'presentation') ?? [];
  const selectedId = searchParams.get('presentation');
  const active = presentations.find(file => file.id === selectedId) ?? presentations[0];
  const showSidebar = desktop && summary !== undefined;
  const labels: ViewerLabels = {
    fullScreen: t('lesson.fullScreen'),
    exitFullScreen: t('lesson.exitFullScreen'),
    escKey: t('lesson.escKey'),
    expanded: t('lesson.expanded'),
    loading: t('lesson.loadingPresentation'),
    slow: t('lesson.slow'),
    retry: t('lesson.reload'),
    open: t('lesson.open'),
    unsupported: t('lesson.unsupported'),
    controls: t('lesson.controls'),
    page: t('lesson.page'),
    previousPage: t('lesson.previousPage'),
    nextPage: t('lesson.nextPage'),
    nativeNavigation: t('lesson.nativeNavigation'),
    navigationError: t('lesson.navigationError'),
  };

  function presentationHref(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set('presentation', id);
    return `?${next.toString()}`;
  }

  function closeDrawer() {
    setDrawerOpen(false);
    drawerToggle.current?.focus();
  }

  function jumpToMaterials() {
    const section = materials.current;
    if (!section) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    section.focus({ preventScroll: true });
  }

  function resourceType(file: PublicContentFile) {
    if (file.file_type === 'worksheet') return t('lesson.worksheet');
    if (file.file_type === 'geogebra') return t('lesson.activity');
    if (file.file_type === 'video') return t('lesson.video');
    return t('lesson.resources');
  }

  const resourceLinks = (
    <ul className="lm-list">
      {resources.map(file => (
        <li key={file.id}>
          <a className="lm-card" href={file.file_url} target="_blank" rel="noopener noreferrer">
            <span className="lm-icon" aria-hidden="true"><Icon name="file" size={22} /></span>
            <span className="lm-text">
              <span className="lm-type">{resourceType(file)}</span>
              <bdi className="lm-name">{file.display_name}</bdi>
            </span>
            <Icon name="arrow-end" size={18} className="lm-go" />
            <span className="sr-only">{t('lesson.opensInNewTab')}</span>
          </a>
        </li>
      ))}
    </ul>
  );

  const stateActions = (
    <div className="lesson-state-actions">
      <Link to={subtopicPath} className="btn btn--primary">
        <Icon name="arrow-start" />{t('lesson.back')}
      </Link>
      <Link to="/" className="btn btn--secondary">{t('tree.backHome')}</Link>
    </div>
  );

  return (
    <div className="lesson-page">
      <div className="lh-top">
        <Link to={subtopicPath} className="btn btn--secondary lh-back">
          <Icon name="arrow-start" />
          <span className="lh-back-text">{t('lesson.backTo', { name: subtopicName })}</span>
        </Link>
        <nav className="bc" aria-label={t('tree.breadcrumb')}>
          <ol>
            <li>
              <Link to="/#topics"><Icon name="home" size={16} />{t('lesson.allTopics')}</Link>
            </li>
            <li>
              <Icon name="chevron" size={14} className="bc-sep" />
              <Link to={topicPath}><bdi>{topicName}</bdi></Link>
            </li>
            <li>
              <Icon name="chevron" size={14} className="bc-sep" />
              <Link to={subtopicPath}><bdi>{subtopicName}</bdi></Link>
            </li>
            {lessonName && (
              <li>
                <Icon name="chevron" size={14} className="bc-sep" />
                <span aria-current="page"><bdi>{lessonName}</bdi></span>
              </li>
            )}
          </ol>
        </nav>
      </div>
      <div className="lesson-screen">
        <div className="lesson-head">
          <div className="lh-main">
            <div className="lh-title">
              <div className="lh-title-row">
                <h1><bdi>{lessonName ?? (notFound ? t('tree.lessonNotFound') : failed ? t('lesson.loadError') : t('loading'))}</bdi></h1>
                {presentations.length > 0 && (
                  <span className="pb">{t('tree.presentationsBadge', { count: presentations.length })}</span>
                )}
              </div>
              {(summary || resources.length > 0) && (
                <p className="lh-meta">
                  {summary && <span>{t('tree.lessonPosition', { current: index + 1, total: siblings.length })}</span>}
                  {resources.length > 0 && active && (
                    <button type="button" className="btn btn--ghost lh-jump" onClick={jumpToMaterials}>
                      <Icon name="file" size={18} />{t('lesson.jumpToResources', { count: resources.length })}
                    </button>
                  )}
                </p>
              )}
            </div>
            {summary && (
              <LessonToolbar
                lessons={siblings}
                index={index}
                basePath={subtopicPath}
                doneTo={subtopicPath}
                showLessonsButton={!desktop}
                drawerId={drawerId}
                drawerOpen={drawerOpen}
                onOpenDrawer={() => setDrawerOpen(true)}
                toggleRef={drawerToggle}
              />
            )}
          </div>
        </div>

        {notFound && (
          <div className="lesson-state" role="alert">
            <p>{t('tree.lessonNotFoundHint')}</p>
            {stateActions}
          </div>
        )}

        {failed && (
          <div className="lesson-state" role="alert">
            {lessonName && <p>{t('lesson.loadError')}</p>}
            <div className="lesson-state-actions">
              <button type="button" className="btn btn--primary" onClick={lessonQuery.retry}>{t('lesson.retry')}</button>
              <Link to={subtopicPath} className="btn btn--secondary">{t('lesson.back')}</Link>
            </div>
          </div>
        )}

        {!notFound && !failed && (
          <div className={showSidebar ? (sidebarCollapsed ? 'lesson-body lesson-body--rail' : 'lesson-body lesson-body--side') : 'lesson-body'}>
            {showSidebar && (
              <LessonSidebar
                id={listId}
                lessons={siblings}
                currentSlug={lessonSlug}
                basePath={subtopicPath}
                collapsed={sidebarCollapsed}
                onToggle={toggleSidebar}
                presentations={presentations}
                activePresentationId={active?.id}
                presentationHref={presentationHref}
              />
            )}
            <div className="lesson-main">
              {presentations.length > 1 && !showSidebar && (
                <nav className="lesson-tabs" aria-label={t('lesson.navigation')}>
                  {presentations.map(file => (
                    <Link
                      key={file.id}
                      to={presentationHref(file.id)}
                      replace
                      className="lesson-tab"
                      aria-current={file.id === active?.id ? 'true' : undefined}
                    >
                      <Icon name="presentation" size={18} />
                      <bdi>{file.display_name}</bdi>
                    </Link>
                  ))}
                </nav>
              )}
              <div className="lesson-stage">
                {!lesson && (
                  <div className="lesson-skeleton" role="status" aria-busy="true">
                    <span className="sr-only">{t('loading')}</span>
                  </div>
                )}
                {lesson && active && (
                  <PresentationViewer url={active.file_url} title={active.display_name} labels={labels} />
                )}
                {lesson && !active && (
                  <section className="lesson-empty">
                    <span className="lesson-empty-icon" aria-hidden="true"><Icon name="file" size={32} /></span>
                    <h2>{t('lesson.noPresentations')}</h2>
                    <p>{t('lesson.noPresentationsHint')}</p>
                    {resources.length > 0 && resourceLinks}
                    {stateActions}
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {lesson && active && resources.length > 0 && (
        <section ref={materials} className="lesson-materials" aria-labelledby={`${listId}-materials`} tabIndex={-1}>
          <h2 id={`${listId}-materials`}>{t('lesson.resources')}</h2>
          {resourceLinks}
        </section>
      )}

      {summary && (
        <LessonDrawer
          id={drawerId}
          open={drawerOpen && !desktop}
          onClose={closeDrawer}
          lessons={siblings}
          currentSlug={lessonSlug}
          basePath={subtopicPath}
        />
      )}
    </div>
  );
}
