import { useEffect, useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { PublicTopic } from '../../types';
import { bannerStops, contrastText } from '../../utils/topicColors';

interface TopicBannerProps {
  topics: PublicTopic[];
  currentSlug: string | undefined;
  color: string;
}

const GRID_COLUMNS = Array.from({ length: 25 }, (_, index) => index * 50);
const GRID_ROWS = Array.from({ length: 5 }, (_, index) => index * 50);

/** Mockup topic banner (math artwork tinted with the topic colour), topic tabs and back link. */
export function TopicBanner({ topics, currentSlug, color }: TopicBannerProps) {
  const { t } = useTranslation();
  const gradientId = `tp-banner-${useId().replace(/[^\w-]/g, '')}`;
  const nav = useRef<HTMLUListElement>(null);
  const [light, base, deep] = bannerStops(color);

  // On narrow screens the tab strip scrolls; bring the current tab into view without
  // moving the page (scrollIntoView would also scroll the window).
  useEffect(() => {
    const list = nav.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !current || list.scrollWidth <= list.clientWidth) return;
    const listBox = list.getBoundingClientRect();
    const tabBox = current.getBoundingClientRect();
    list.scrollLeft += tabBox.left + tabBox.width / 2 - (listBox.left + listBox.width / 2);
  }, [currentSlug, topics]);

  return (
    <>
      <div className="tp-banner">
        <svg
          className="tp-banner-bg"
          viewBox="0 0 1200 200"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={light} />
              <stop offset="50%" stopColor={base} />
              <stop offset="100%" stopColor={deep} />
            </linearGradient>
          </defs>
          <rect width="1200" height="200" fill={`url(#${gradientId})`} />
          <g stroke="rgba(255,255,255,.06)" strokeWidth=".5">
            {GRID_COLUMNS.map(x => <line key={`c${x}`} x1={x} y1="0" x2={x} y2="200" />)}
            {GRID_ROWS.map(y => <line key={`r${y}`} x1="0" y1={y} x2="1200" y2={y} />)}
          </g>
          <g stroke="rgba(255,255,255,.12)" strokeWidth="1.5">
            <line x1="100" y1="20" x2="100" y2="180" />
            <line x1="20" y1="140" x2="260" y2="140" />
            <polygon points="100,18 96,28 104,28" fill="rgba(255,255,255,.12)" />
            <polygon points="262,140 252,136 252,144" fill="rgba(255,255,255,.12)" />
          </g>
          <path d="M40 160 Q100 20 160 160" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2" />
          <path
            d="M300 100 C330 50 360 50 390 100 S450 150 480 100 S540 50 570 100 S630 150 660 100"
            fill="none"
            stroke="rgba(255,255,255,.15)"
            strokeWidth="2"
          />
          <circle cx="820" cy="100" r="60" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1.5" />
          <line x1="820" y1="100" x2="870" y2="70" stroke="rgba(255,255,255,.12)" strokeWidth="1.5" />
          <g fontFamily="serif">
            <text x="835" y="78" fill="rgba(255,255,255,.15)" fontSize="14">r</text>
            <polygon points="950,160 1050,160 1000,60" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1.5" />
            <text x="985" y="110" fill="rgba(255,255,255,.1)" fontSize="16">△</text>
            <text x="130" y="50" fill="rgba(255,255,255,.1)" fontSize="18">f(x) = ax² + bx + c</text>
            <text x="380" y="170" fill="rgba(255,255,255,.1)" fontSize="16">sin²θ + cos²θ = 1</text>
            <text x="680" y="45" fill="rgba(255,255,255,.1)" fontSize="20">e^iπ + 1 = 0</text>
            <text x="900" y="185" fill="rgba(255,255,255,.1)" fontSize="15">a² + b² = c²</text>
            <text x="1050" y="80" fill="rgba(255,255,255,.08)" fontSize="40">∫</text>
            <text x="1100" y="140" fill="rgba(255,255,255,.08)" fontSize="36">Σ</text>
            <text x="270" y="60" fill="rgba(255,255,255,.08)" fontSize="34">π</text>
            <text x="570" y="60" fill="rgba(255,255,255,.08)" fontSize="30">∞</text>
          </g>
          <circle cx="200" cy="80" r="3" fill="rgba(255,255,255,.15)" />
          <circle cx="450" cy="40" r="2.5" fill="rgba(255,255,255,.12)" />
          <circle cx="750" cy="50" r="3" fill="rgba(255,255,255,.1)" />
          <circle cx="1000" cy="30" r="2" fill="rgba(255,255,255,.12)" />
          <circle cx="600" cy="170" r="2.5" fill="rgba(255,255,255,.1)" />
        </svg>
        {topics.length > 0 && (
          <nav className="tp-nav" aria-label={t('tree.topicTabs')}>
            <ul ref={nav}>
              {topics.map(topic => {
                const current = topic.slug === currentSlug;
                return (
                  <li
                    key={topic.id}
                    className={current ? 'tp-nav-btn on' : 'tp-nav-btn'}
                    style={{ '--nav-c': topic.color, '--nav-fg': contrastText(topic.color) } as CSSProperties}
                  >
                    <Link to={`/${topic.slug}`} className="tp-nav-link" aria-current={current ? 'page' : undefined}>
                      <span className="tp-nav-icon" aria-hidden="true">{topic.icon}</span>
                      <span className="tp-nav-label">{topic.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
      <Link to="/" className="tp-back">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
        <span>{t('tree.backToTopics')}</span>
      </Link>
    </>
  );
}
