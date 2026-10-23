import { useEffect, useRef } from 'react';
import { Outlet, Link, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { LanguageSwitcher } from './LanguageSwitcher';
import { TextSizeControl } from './TextSizeControl';

export function AppShell() {
  const { t } = useTranslation();
  const footer = useRef<HTMLElement>(null);
  const onLessonRoute = useMatch('/:topicSlug/:subtopicSlug/:lessonSlug') !== null;

  // The lesson page gives the viewer the full viewport, so there the footer scrolls with the page.
  useEffect(() => {
    if (!onLessonRoute) return;
    const root = document.documentElement;
    root.dataset.footer = 'flow';
    return () => { delete root.dataset.footer; };
  }, [onLessonRoute]);

  // The sticky header height drives the lesson screen's viewport-fit height.
  useEffect(() => {
    const element = document.querySelector<HTMLElement>('.hdr');
    if (!element) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty('--hdr-h', `${Math.ceil(element.getBoundingClientRect().height)}px`);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--hdr-h');
    };
  }, []);

  // The fixed footer wraps at narrow widths and large text sizes; publish its real
  // height so the body padding and sticky lesson toolbar always clear it.
  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty('--footer-h', `${Math.ceil(element.getBoundingClientRect().height)}px`);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--footer-h');
    };
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">{t('skip_to_content')}</a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer ref={footer} className="ftr">
        <div className="fb">
          <b>G-Math</b> · {t('tagline')} · © {new Date().getFullYear()}
        </div>
        <nav className="fn" aria-label={t('footer_nav')}>
          <Link to="/">{t('nav_home')}</Link>
          <Link to="/#about">{t('nav_about')}</Link>
          <Link to="/#topics">{t('nav_topics')}</Link>
        </nav>
        <div className="ft">
          <TextSizeControl />
          <div className="dv" aria-hidden="true" />
          <LanguageSwitcher />
        </div>
      </footer>
    </>
  );
}
