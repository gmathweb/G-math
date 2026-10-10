import { useEffect, useState } from 'react';
import type { CSSProperties, FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ContentLink } from '../common/ContentLink';
import { splitHighlight } from '../../utils/highlight';

export interface HeroMessage {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
}

const INTERVAL_MS = 5000;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export function HeroCarousel({ slides }: { slides: HeroMessage[] }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  // Users who ask for reduced motion get no auto-rotation but can still pick a message.
  const [reducedMotion] = useState(prefersReducedMotion);
  const [held, setHeld] = useState(false);

  const count = slides.length;
  const index = active < count ? active : 0;
  const rotating = count > 1 && !reducedMotion && !held;

  // Re-armed on every change of index, so picking a message restarts the full interval.
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setActive((index + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, index, count]);

  // Only keyboard focus holds the current message; a mouse click on a dot shouldn't stop the rotation.
  const hold = (event: FocusEvent<HTMLDivElement>) => {
    if (event.target.matches(':focus-visible')) setHeld(true);
  };
  const release = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
  };

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('tree.heroCarousel')}
      onFocus={hold}
      onBlur={release}
    >
      <div className="hero-viewport">
        <div className="hero-track" style={{ '--slide': index } as CSSProperties} aria-live={rotating ? 'off' : 'polite'}>
          {slides.map((slide, i) => {
            const Title = i === 0 ? 'h1' : 'p';
            return (
              <div
                key={slide.id}
                className="hero-slide"
                role="group"
                aria-roledescription="slide"
                aria-label={count > 1 ? t('tree.heroSlide', { index: i + 1, total: count }) : undefined}
                inert={i !== index}
              >
                <Title className="hero-title">
                  {splitHighlight(slide.title, /(GMath)/).map((part, k) =>
                    part.highlighted ? <span key={k}>{part.text}</span> : part.text,
                  )}
                </Title>
                {slide.subtitle && <p className="sub">{slide.subtitle}</p>}
                {slide.button_text && slide.button_link && (
                  <ContentLink href={slide.button_link} className="hero-btn">{slide.button_text}</ContentLink>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="hero-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              className="hero-dot"
              aria-label={t('tree.heroSlide', { index: i + 1, total: count })}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
