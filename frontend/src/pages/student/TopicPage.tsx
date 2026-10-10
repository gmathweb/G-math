import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getTopic, getTopics } from '../../api/topics';
import { ApiError } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useLocale } from '../../hooks/useLocale';
import { TopicBanner } from '../../components/topic/TopicBanner';
import { SubtopicGlyph } from '../../components/topic/SubtopicGlyph';
import { fallbackSubtopicIcon, readableShade, shadeColor, shadeGradient } from '../../utils/topicColors';
import './TopicPage.css';

const DEFAULT_COLOR = '#6366f1';

export function TopicPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const location = useLocation();
  const { topicSlug = '', subtopicSlug } = useParams();
  const idPrefix = useId();

  const topics = useApi(`topics:${locale}`, () => getTopics(locale));
  const detail = useApi(topicSlug ? `topic:${topicSlug}:${locale}` : null, () => getTopic(topicSlug, locale));

  // Search text and user toggles belong to one topic; switching topics starts fresh.
  const [search, setSearch] = useState({ slug: topicSlug, text: '' });
  const [toggled, setToggled] = useState<{ slug: string; open: Record<string, boolean> }>({ slug: topicSlug, open: {} });
  const query = search.slug === topicSlug ? search.text : '';
  const userToggles = toggled.slug === topicSlug ? toggled.open : {};
  const isExpanded = (slug: string) => userToggles[slug] ?? slug === subtopicSlug;
  const toggle = (slug: string) => {
    const open = !isExpanded(slug);
    setToggled(prev => ({ slug: topicSlug, open: { ...(prev.slug === topicSlug ? prev.open : {}), [slug]: open } }));
  };

  const cards = useRef(new Map<string, HTMLElement>());
  const cardRef = (slug: string) => (element: HTMLElement | null) => {
    if (element) cards.current.set(slug, element);
    else cards.current.delete(slug);
  };

  // Deep link /:topic/:subtopic: once its card exists, bring it into view (once per navigation).
  const topic = detail.data;
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!subtopicSlug || !topic || scrolledFor.current === location.key) return;
    const card = cards.current.get(subtopicSlug);
    if (!card) return;
    scrolledFor.current = location.key;
    const fits = card.getBoundingClientRect().height < window.innerHeight * 0.7;
    card.scrollIntoView({ block: fits ? 'center' : 'start' });
  }, [subtopicSlug, topic, location.key]);

  const summary = topics.data?.find(item => item.slug === topicSlug);
  const notFound = detail.error instanceof ApiError && detail.error.status === 404;
  const color = topic?.color || summary?.color || DEFAULT_COLOR;
  const title = topic?.name ?? summary?.name ?? (notFound ? t('tree.notFound') : t('loading'));

  const needle = query.trim().toLocaleLowerCase();
  const matches = (text: string) => text.toLocaleLowerCase().includes(needle);
  const subtopics = topic?.subtopics ?? [];
  const visible = subtopics
    .map((subtopic, index) => {
      const lessons = !needle || matches(subtopic.name)
        ? subtopic.lessons
        : subtopic.lessons.filter(lesson => matches(lesson.name));
      return { subtopic, index, lessons };
    })
    .filter(({ subtopic, lessons }) => !needle || matches(subtopic.name) || lessons.length > 0);

  return (
    <div className="topic-page" style={{ '--c': color, '--hover-c': readableShade(color) } as CSSProperties}>
      <h1 className="sr-only">{title}</h1>
      <TopicBanner topics={topics.data ?? []} currentSlug={topicSlug} color={color} />

      {detail.loading && <p className="state-msg" role="status">{t('loading')}</p>}

      {notFound && (
        <div className="state-msg" role="alert">
          <p>{t('tree.notFound')}</p>
          <Link to="/" className="state-action">{t('tree.backHome')}</Link>
        </div>
      )}

      {detail.error !== undefined && !notFound && (
        <div className="state-msg" role="alert">
          <p>{t('tree.loadError')}</p>
          <button
            type="button"
            onClick={() => {
              detail.retry();
              if (topics.error !== undefined) topics.retry();
            }}
          >
            {t('tree.retry')}
          </button>
        </div>
      )}

      {topic && (
        <>
          {subtopics.length > 0 && (
            <div className="tp-bar" role="search">
              <div className="tp-search">
                <label htmlFor={`${idPrefix}search`} className="sr-only">{t('tree.searchLabel')}</label>
                <input
                  id={`${idPrefix}search`}
                  type="search"
                  className="tp-si"
                  placeholder={t('tree.search')}
                  value={query}
                  onChange={event => setSearch({ slug: topicSlug, text: event.target.value })}
                />
              </div>
            </div>
          )}

          <div role="status">
            {needle && visible.length === 0 && (
              <p className="state-msg">
                <span><span aria-hidden="true">🔍 </span>{t('tree.noMatches')}</span>
              </p>
            )}
          </div>
          {subtopics.length === 0 && (
            <div className="state-msg">
              {topic.description && <p>{topic.description}</p>}
              <p>{t('tree.noSubtopics')}</p>
            </div>
          )}

          {visible.length > 0 && (
            <ul className="tp-grid">
              {visible.map(({ subtopic, index, lessons }) => {
                const expanded = isExpanded(subtopic.slug);
                const lessonsId = `${idPrefix}lessons-${index}`;
                return (
                  <li key={subtopic.id} className="fu" style={{ '--si': index } as CSSProperties}>
                    <article ref={cardRef(subtopic.slug)} className={expanded ? 'tp-card expanded' : 'tp-card'}>
                      <h2 className="tp-card-h">
                        <button
                          type="button"
                          className="tp-card-toggle"
                          aria-expanded={expanded}
                          aria-controls={lessonsId}
                          onClick={() => toggle(subtopic.slug)}
                        >
                          <span
                            className="tp-card-img"
                            style={{ background: shadeGradient(color, index, subtopics.length) }}
                            aria-hidden="true"
                          >
                            <SubtopicGlyph icon={subtopic.icon || fallbackSubtopicIcon(index)} />
                          </span>
                          <span className="tp-card-body">
                            <span className="tp-card-name">{subtopic.name}</span>
                            <span className="tp-card-meta">
                              <span
                                className="tp-card-dot"
                                style={{ background: shadeColor(color, index, subtopics.length) }}
                                aria-hidden="true"
                              />
                              {t('tree.lessonsCount', { count: subtopic.lessons.length })}
                            </span>
                          </span>
                        </button>
                      </h2>
                      <div id={lessonsId} className="tp-lessons">
                        <div className="tp-lessons-clip">
                          <div className="tp-lessons-inner">
                            <p className="tp-lessons-title" aria-hidden="true">📋 {t('tree.lessonsButton')}</p>
                            {lessons.length > 0 ? (
                              <ul className="tp-llist">
                                {lessons.map(lesson => (
                                  <li key={lesson.id}>
                                    <Link
                                      to={`/${topicSlug}/${subtopic.slug}/${lesson.slug}`}
                                      className="tp-lbtn"
                                    >
                                      {lesson.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="tp-lessons-none">{t('tree.noLessons')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
