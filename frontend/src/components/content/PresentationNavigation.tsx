import { useState, type KeyboardEvent, type RefObject } from 'react';
import { Icon } from '../ui/Icon';
import type { PageState } from './playerProtocol';
import type { ViewerLabels } from './PresentationViewer';

interface Props {
  labels: ViewerLabels;
  title: string;
  pages: PageState | null;
  native: boolean;
  onPage: (action: 'next' | 'previous', index?: number) => void;
  enlarged: boolean;
  fullPageButton: RefObject<HTMLButtonElement | null>;
  onFullPage: () => void;
}

type Control = 'previous' | 'next' | 'expand';

/**
 * Slide controls bar. The bar follows the document direction (title at the start, full-screen
 * button at the end) while the slide transport cluster stays physically LTR, so "previous"
 * is always on the left like the slide content; arrow keys move focus by visual position.
 */
export function PresentationNavigation({
  labels, title, pages, native, onPage, enlarged, fullPageButton, onFullPage,
}: Props) {
  const [focusedControl, setFocusedControl] = useState<Control | null>(null);
  const activeControl: Control = !pages ? 'expand' : focusedControl ?? 'previous';
  const fullPageLabel = enlarged ? labels.exitFullScreen : labels.fullScreen;

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
      || !(event.target instanceof HTMLButtonElement)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    if (!buttons.includes(event.target)) return;
    let target: HTMLButtonElement | undefined;
    if (event.key === 'Home') target = buttons[0];
    else if (event.key === 'End') target = buttons[buttons.length - 1];
    else {
      const visual = [...buttons].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      const step = event.key === 'ArrowRight' ? 1 : -1;
      target = visual[(visual.indexOf(event.target) + step + visual.length) % visual.length];
    }
    event.preventDefault();
    target?.focus();
  }

  return (
    <div className="presentation-bottom-bar" role="toolbar" aria-label={labels.controls} onKeyDown={moveFocus}>
      <div className="player-presentation">
        <bdi className="player-title" title={title}>{title}</bdi>
      </div>
      {pages ? (
        <div className="player-transport" dir="ltr">
          <button type="button" className="player-icon-button" aria-disabled={!pages.previous}
            onClick={() => { if (pages.previous) onPage('previous'); }}
            aria-label={labels.previousPage} title={labels.previousPage}
            tabIndex={activeControl === 'previous' ? 0 : -1} onFocus={() => setFocusedControl('previous')}>
            <Icon name="previous" />
          </button>
          <div className="presentation-page-position" role="status" dir="ltr"
            aria-label={pages.index >= 0 ? `${labels.page} ${pages.index + 1} / ${pages.count}` : labels.loading}>
            <strong>{pages.index >= 0 ? pages.index + 1 : '—'}</strong>
            <span>/ {pages.count}</span>
          </div>
          <button type="button" className="player-icon-button" aria-disabled={!pages.next}
            onClick={() => { if (pages.next) onPage('next'); }}
            aria-label={labels.nextPage} title={labels.nextPage}
            tabIndex={activeControl === 'next' ? 0 : -1} onFocus={() => setFocusedControl('next')}>
            <Icon name="next" />
          </button>
        </div>
      ) : native && <span className="player-native-hint" dir="auto">{labels.nativeNavigation}</span>}
      <div className="player-actions">
        <button ref={fullPageButton} type="button"
          className={enlarged ? 'btn btn--primary player-fullscreen' : 'btn btn--secondary player-fullscreen'}
          onClick={onFullPage} title={fullPageLabel} aria-pressed={enlarged}
          tabIndex={activeControl === 'expand' ? 0 : -1} onFocus={() => setFocusedControl('expand')}>
          <Icon name={enlarged ? 'exit' : 'expand'} />
          <span>{fullPageLabel}</span>
          {enlarged && <kbd className="player-kbd">{labels.escKey}</kbd>}
        </button>
      </div>
    </div>
  );
}
