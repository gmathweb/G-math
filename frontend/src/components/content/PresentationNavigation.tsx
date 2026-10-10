import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { PageState } from './playerProtocol';
import type { ViewerLabels } from './PresentationViewer';

export interface PresentationChoice {
  id: string;
  display_name: string;
  file_url: string;
}

type IconName = 'presentation' | 'check' | 'previous' | 'next' | 'expand' | 'exit';
const paths: Record<IconName, string> = {
  presentation: 'M4 6h13v13H4zM8 2h13v13',
  check: 'm5 12 4 4L19 6',
  previous: 'M5 5v14M18 5l-9 7 9 7V5',
  next: 'M19 5v14M6 5l9 7-9 7V5',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  exit: 'M9 3v6H3m12-6v6h6M3 15h6v6m12-6h-6v6',
};

function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={paths[name]} />
  </svg>;
}

interface Props {
  expanded: boolean;
  onToggle: () => void;
  panelId: string;
  labels: ViewerLabels;
  title: string;
  pages: PageState | null;
  native: boolean;
  onPage: (action: 'next' | 'previous', index?: number) => void;
  enlarged: boolean;
  fullPageLabel: string;
  fullPageButton: RefObject<HTMLButtonElement | null>;
  onFullPage: () => void;
  files: readonly PresentationChoice[];
  activeId?: string;
  onSelect?: (id: string) => void;
  resources: readonly PresentationChoice[];
}

type Control = 'menu' | 'previous' | 'next' | 'expand';

export function PresentationNavigation({
  expanded, onToggle, panelId, labels, title, pages, native, onPage,
  enlarged, fullPageLabel, fullPageButton, onFullPage,
  files, activeId, onSelect, resources,
}: Props) {
  const panel = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(false);
  const [focusedControl, setFocusedControl] = useState<Control>('menu');
  const hasMenu = files.length > 0 || resources.length > 0;
  const activeControl = !hasMenu && focusedControl === 'menu' ? 'expand'
    : !pages && (focusedControl === 'previous' || focusedControl === 'next')
      ? (hasMenu ? 'menu' : 'expand') : focusedControl;
  const toggleLabel = expanded ? labels.collapseNavigation : labels.expandNavigation;

  useEffect(() => {
    if (expanded) {
      panel.current?.querySelector<HTMLButtonElement>('button[aria-current]')?.focus();
    } else if (wasExpanded.current) {
      menuButton.current?.focus();
    }
    wasExpanded.current = expanded;
  }, [expanded]);

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
      || !(event.target instanceof HTMLButtonElement)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <>
      <aside ref={panel} id={panelId} dir="auto" className="presentation-navigation"
        aria-label={labels.navigation} hidden={!expanded}
        onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}>
        <div className="navigation-heading">
          <h2>{labels.navigation}</h2>
          {files.length > 0 && <span className="presentation-count">{files.length}</span>}
        </div>
        <div className="navigation-scroll">
          <ul className="presentation-file-list">
            {files.map(file => (
              <li key={file.id}>
                <button type="button" disabled={!onSelect} title={file.display_name}
                  aria-current={file.id === activeId ? 'true' : undefined}
                  onClick={() => onSelect?.(file.id)}>
                  <Icon name="presentation" />
                  <bdi className="presentation-file-name">{file.display_name}</bdi>
                  {file.id === activeId && <Icon name="check" />}
                </button>
              </li>
            ))}
          </ul>
          {resources.length > 0 && <section className="navigation-resources">
            <h2>{labels.resources}</h2>
            {resources.map(file => (
              <a className="navigation-resource" key={file.id} href={file.file_url}
                target="_blank" rel="noopener noreferrer"><bdi>{file.display_name}</bdi></a>
            ))}
          </section>}
        </div>
      </aside>
      <div className="presentation-bottom-bar" dir="ltr" role="toolbar" aria-label={labels.controls}
        onKeyDown={moveFocus}>
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
          <button ref={menuButton} type="button" className={`player-icon-button ${expanded ? 'is-active' : ''}`}
            onClick={onToggle} disabled={!hasMenu} aria-label={toggleLabel} title={toggleLabel}
            aria-expanded={expanded} aria-controls={panelId}
            tabIndex={activeControl === 'menu' ? 0 : -1} onFocus={() => setFocusedControl('menu')}>
            <Icon name="presentation" />
          </button>
          <button ref={fullPageButton} type="button" className="player-icon-button"
            onClick={onFullPage} aria-label={fullPageLabel} title={fullPageLabel} aria-pressed={enlarged}
            tabIndex={activeControl === 'expand' ? 0 : -1} onFocus={() => setFocusedControl('expand')}>
            <Icon name={enlarged ? 'exit' : 'expand'} />
          </button>
        </div>
      </div>
    </>
  );
}
