import type { PublicAboutContent } from '../../types';
import { splitHighlight } from '../../utils/highlight';
import { ContentLink } from '../common/ContentLink';
import { TreeIllustration } from './TreeIllustration';

export function AboutSection({ about }: { about: PublicAboutContent }) {
  const paragraphs = about.body.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean);
  return (
    <section id="about" className="about-sec fu" tabIndex={-1} aria-labelledby="about-title">
      <div className="about-img">
        <TreeIllustration />
      </div>
      <div className="about-txt">
        <h2 id="about-title">
          {splitHighlight(about.title, /(G-math)/i).map((part, index) =>
            part.highlighted ? <span key={index} className="hl">{part.text}</span> : part.text,
          )}
        </h2>
        {paragraphs.map((text, index) => <p key={index}>{text}</p>)}
        {about.button_text && about.button_link && (
          <ContentLink href={about.button_link} className="about-btn">
            <span>{about.button_text}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </ContentLink>
        )}
      </div>
    </section>
  );
}
