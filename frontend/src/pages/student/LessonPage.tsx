import { useId, useRef, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLesson } from '../../api/lessons';
import { getTopic } from '../../api/topics';
import { ApiError } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useLocale } from '../../hooks/useLocale';
import { PresentationViewer, type ViewerLabels } from '../../components/content/PresentationViewer';
import { LessonToolbar } from '../../components/lesson/LessonToolbar';
import { LessonDrawer } from '../../components/lesson/LessonDrawer';
import './LessonPage.css';

export function LessonPage() {
  const { topicSlug = '', subtopicSlug = '', lessonSlug = '' } = useParams();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const drawerId = `lessons-${useId().replace(/[^\w-]/g, '')}`;
  const drawerToggle = useRef<HTMLButtonElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const lessonQuery = useApi(lessonSlug ? `lesson:${lessonSlug}:${locale}` : null, () => getLesson(lessonSlug, locale));
  const lesson = lessonQuery.data;
  const topicKey = lesson?.topic_slug ?? topicSlug;
  // Siblings come from the topic tree; if it fails only the toolbar and drawer are hidden.
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
  const labels: ViewerLabels = {
    fullPage: t('lesson.fullPage'),
    exitFullPage: t('lesson.exitFullPage'),
    expanded: t('lesson.expanded'),
    loading: t('lesson.loadingPresentation'),
    slow: t('lesson.slow'),
    retry: t('lesson.reload'),
    open: t('lesson.open'),
    unsupported: t('lesson.unsupported'),
    controls: t('lesson.controls'),
    navigation: t('lesson.navigation'),
    expandNavigation: t('lesson.expandNavigation'),
    collapseNavigation: t('lesson.collapseNavigation'),
    page: t('lesson.page'),
    previousPage: t('lesson.previousPage'),
    nextPage: t('lesson.nextPage'),
    nativeNavigation: t('lesson.nativeNavigation'),
    navigationError: t('lesson.navigationError'),
    resources: t('lesson.resources'),
  };

  function selectPresentation(id: string) {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('presentation', id);
      return next;
    }, { replace: true });
  }

  function closeDrawer() {
    setDrawerOpen(false);
    drawerToggle.current?.focus();
  }

  return (
    <div className="lesson-page">
      <nav className="bc" aria-label={t('tree.breadcrumb')}>
        <ol>
          <li><Link to="/"><span aria-hidden="true">🏠 </span>{t('home')}</Link></li>
          <li><Link to={topicPath}>{topicName}</Link></li>
          <li><Link to={subtopicPath}>{subtopicName}</Link></li>
          {lessonName && <li><span aria-current="page"><bdi>{lessonName}</bdi></span></li>}
        </ol>
      </nav>

      <div className="lp-wrap">
        <div className="lp-title">
          <h1><bdi>{lessonName ?? (notFound ? t('tree.lessonNotFound') : failed ? t('lesson.loadError') : t('loading'))}</bdi></h1>
          {presentations.length > 0 && (
            <span className="pb">{t('tree.presentationsBadge', { count: presentations.length })}</span>
          )}
        </div>

        {lessonQuery.loading && lessonName && <p className="state-msg" role="status">{t('loading')}</p>}

        {notFound && (
          <div className="state-msg" role="alert">
            <p>{t('tree.lessonNotFoundHint')}</p>
            <Link to={subtopicPath} className="state-action">{t('lesson.back')}</Link>
            <Link to="/">{t('tree.backHome')}</Link>
          </div>
        )}

        {failed && (
          <div className="state-msg" role="alert">
            {lessonName && <p>{t('lesson.loadError')}</p>}
            <button type="button" onClick={lessonQuery.retry}>{t('lesson.retry')}</button>
            <Link to={subtopicPath}>{t('lesson.back')}</Link>
          </div>
        )}

        {lesson && (
          <div className="vf">
            {active ? (
              <div className="lesson-player">
                <PresentationViewer url={active.file_url} title={active.display_name} labels={labels}
                  files={presentations} activeId={active.id} onSelect={selectPresentation} resources={resources} />
              </div>
            ) : (
              <section className="lesson-empty">
                <span className="vi" aria-hidden="true">📄</span>
                <h2>{t('lesson.noPresentations')}</h2>
                <p>{t('lesson.noPresentationsHint')}</p>
                {resources.map(file => <a key={file.id} href={file.file_url}
                  target="_blank" rel="noopener noreferrer">{file.display_name}</a>)}
              </section>
            )}
          </div>
        )}

        {summary && (
          <LessonToolbar
            lessons={siblings}
            index={index}
            basePath={subtopicPath}
            drawerId={drawerId}
            drawerOpen={drawerOpen}
            onOpenDrawer={() => setDrawerOpen(true)}
            toggleRef={drawerToggle}
          />
        )}
      </div>

      {summary && (
        <LessonDrawer
          id={drawerId}
          open={drawerOpen}
          onClose={closeDrawer}
          lessons={siblings}
          currentSlug={lessonSlug}
          basePath={subtopicPath}
        />
      )}
    </div>
  );
}
