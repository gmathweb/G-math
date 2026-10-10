import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { getTopics } from '../../api/topics';
import { getHeroSlides } from '../../api/hero';
import { getSiteContent } from '../../api/siteContent';
import { useApi } from '../../hooks/useApi';
import { useLocale } from '../../hooks/useLocale';
import { TrustCards } from '../../components/home/TrustCards';
import { AboutSection } from '../../components/home/AboutSection';
import { HeroCarousel } from '../../components/home/HeroCarousel';
import type { HeroMessage } from '../../components/home/HeroCarousel';
import { fallbackSiteContent } from '../../utils/siteContentDefaults';
import './HomePage.css';

export function HomePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const location = useLocation();

  const topics = useApi(`topics:${locale}`, () => getTopics(locale));
  const hero = useApi(`hero-slides:${locale}`, () => getHeroSlides(locale));
  const siteContent = useApi(`site-content:${locale}`, () => getSiteContent(locale));

  // Built-in defaults only replace admin content when the request failed, never while loading,
  // so visitors don't see text the admin has replaced flash before the real content.
  const content = siteContent.data ?? (siteContent.error !== undefined ? fallbackSiteContent(t) : null);
  const heroReady = !hero.loading;
  const heroSlides: HeroMessage[] = hero.data?.length
    ? hero.data
    : [{
      id: 'fallback',
      title: heroReady ? t('tree.heroTitle') : '\u00a0',
      subtitle: heroReady ? t('tree.heroSubtitle') : '',
      button_text: '',
      button_link: '',
    }];

  const topicList = topics.data ?? [];
  const totalSubtopics = topicList.reduce((sum, topic) => sum + (topic.subtopic_count || 0), 0);
  const totalLessons = topicList.reduce((sum, topic) => sum + (topic.lesson_count || 0), 0);

  // React Router does not scroll to fragments (footer links /#about, /#topics). Wait until
  // everything above the target has loaded so the position is final, and handle each
  // navigation once so later re-renders don't yank the page back.
  const settled = !topics.loading && !hero.loading && !siteContent.loading;
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!location.hash || !settled || scrolledFor.current === location.key) return;
    let id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      // Malformed percent-encoding: look the raw fragment up instead.
    }
    const target = document.getElementById(id);
    if (!target) return;
    scrolledFor.current = location.key;
    target.scrollIntoView();
    target.focus({ preventScroll: true });
  }, [location.hash, location.key, settled]);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hc" aria-busy={!heroReady}>
          <HeroCarousel slides={heroSlides} />
          {topics.data && (
            <ul className="stb">
              <li><strong>{topicList.length}</strong> {t('tree.statTopics')}</li>
              <li><strong>{totalSubtopics}</strong> {t('tree.statSubtopics')}</li>
              <li><strong>{totalLessons}</strong> {t('tree.statLessons')}</li>
              <li><strong>{t('tree.statFree')}</strong></li>
            </ul>
          )}
        </div>
        <div className="hero-img" aria-hidden="true" />
      </section>

      {content ? (
        <>
          <TrustCards cards={content.trust_cards} />
          <AboutSection about={content.about} />
        </>
      ) : (
        <p className="state-msg" role="status">{t('loading')}</p>
      )}

      <section id="topics" className="tsc" tabIndex={-1} aria-labelledby="topics-title">
        <h2 id="topics-title"><span aria-hidden="true">📚 </span>{t('tree.topicsHeading')}</h2>
        {topics.loading && <p className="state-msg" role="status">{t('loading')}</p>}
        {topics.error !== undefined && (
          <div className="state-msg" role="alert">
            <p>{t('tree.loadError')}</p>
            <button type="button" onClick={topics.retry}>{t('tree.retry')}</button>
          </div>
        )}
        {topics.data && (
          <ul className="tg">
            {topicList.map((topic, index) => (
              <li key={topic.id} className="fu" style={{ '--si': index } as CSSProperties}>
                <Link to={`/${topic.slug}`} className="tc" style={{ '--cc': topic.color } as CSSProperties}>
                  <span className="tci" style={{ background: topic.bg_color }} aria-hidden="true">{topic.icon}</span>
                  <div className="tcn">
                    <h3>{topic.name}</h3>
                    {topic.description && <p>{topic.description}</p>}
                    {topic.lesson_count > 0 && (
                      <span className="tc-meta">{t('tree.lessonsCount', { count: topic.lesson_count })}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
