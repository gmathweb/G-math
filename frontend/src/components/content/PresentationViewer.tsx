import { useEffect, useId, useRef, useState } from 'react';
import { PresentationNavigation } from './PresentationNavigation';
import { usePresentationPlayer } from './usePresentationPlayer';
import './PresentationViewer.css';

export interface ViewerLabels {
  fullScreen: string;
  exitFullScreen: string;
  escKey: string;
  expanded: string;
  loading: string;
  slow: string;
  retry: string;
  open: string;
  unsupported: string;
  controls: string;
  page: string;
  previousPage: string;
  nextPage: string;
  nativeNavigation: string;
  navigationError: string;
}

interface PresentationViewerProps {
  url: string;
  title: string;
  labels: ViewerLabels;
}

export function PresentationViewer({ url, title, labels }: PresentationViewerProps) {
  const presentationOrigin = (import.meta.env.VITE_PRESENTATION_ORIGIN ?? '').replace(/\/$/, '');
  const source = url.startsWith('/api/v1/presentations/') ? `${presentationOrigin}${url}` : url;
  const root = useRef<HTMLDivElement>(null);
  const fullPageButton = useRef<HTMLButtonElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [enlarged, setEnlarged] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [slowKey, setSlowKey] = useState('');
  const [frameError, setFrameError] = useState({ key: '', message: '' });
  const id = useId();
  const unsupported = /\.pptx(?:[?#]|$)/i.test(url);
  const nativePdf = /\.pdf(?:[?#]|$)/i.test(url);
  const frameKey = `${source}:${attempt}`;
  const loading = loadedKey !== frameKey;
  const player = usePresentationPlayer(iframe, source, attempt);
  const playbackError = frameError.key === frameKey ? frameError.message : '';

  useEffect(() => {
    if (!loading || unsupported) return;
    const timer = window.setTimeout(() => setSlowKey(frameKey), 12000);
    return () => window.clearTimeout(timer);
  }, [loading, unsupported, frameKey]);

  useEffect(() => {
    if (!enlarged) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const siblings: { element: HTMLElement; inert: boolean }[] = [];
    let node: HTMLElement | null = root.current;
    while (node?.parentElement) {
      for (const child of node.parentElement.children) {
        if (child !== node && child instanceof HTMLElement && !['SCRIPT', 'STYLE'].includes(child.tagName)) {
          siblings.push({ element: child, inert: child.inert });
          child.setAttribute('inert', '');
        }
      }
      node = node.parentElement;
      if (node === document.body) break;
    }
    fullPageButton.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setEnlarged(false);
      }
    };
    document.addEventListener('keydown', keydown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      siblings.forEach(({ element, inert }) => {
        if (!inert) element.removeAttribute('inert');
      });
      document.removeEventListener('keydown', keydown, true);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [enlarged]);

  function retry() {
    setAttempt(value => value + 1);
  }

  function focusStage() {
    root.current?.querySelector<HTMLElement>(
      '.presentation-stage button, .presentation-stage a[href], .presentation-stage iframe',
    )?.focus();
  }

  function focusControls() {
    root.current?.querySelector<HTMLButtonElement>(
      '.presentation-bottom-bar button[tabindex="0"]',
    )?.focus();
  }

  return (
    <div
      ref={root}
      className={enlarged ? 'presentation-viewer presentation-viewer-expanded' : 'presentation-viewer'}
      role={enlarged ? 'dialog' : 'region'}
      aria-modal={enlarged || undefined}
      aria-labelledby={id}
    >
      <span id={id} className="viewer-sr-only">{title}</span>
      {enlarged && <span tabIndex={0} onFocus={focusControls} className="viewer-focus-guard" />}
      {enlarged && <span role="status" className="viewer-sr-only">{labels.expanded}</span>}
      <div className="presentation-stage">
        {(playbackError || player.error) && (
          <div className="presentation-notice" role="alert">
            <span>{playbackError || labels.navigationError}</span>
            <button type="button" onClick={retry}>{labels.retry}</button>
          </div>
        )}
        {unsupported ? (
          <div className="presentation-unsupported">
            <p>{labels.unsupported}</p>
            <a href={source} target="_blank" rel="noopener noreferrer">{labels.open}</a>
          </div>
        ) : (
          <>
            {loading && (
              <div className="presentation-loading" role="status">
                {slowKey === frameKey ? labels.slow : labels.loading}
              </div>
            )}
            <iframe
              ref={iframe}
              key={frameKey}
              src={source}
              sandbox={nativePdf ? undefined : 'allow-scripts'}
              allow="fullscreen"
              title={title}
              onLoad={() => { setLoadedKey(frameKey); player.initialize(); }}
              onError={() => {
                setLoadedKey(frameKey);
                setFrameError({ key: frameKey, message: labels.slow });
              }}
            />
          </>
        )}
      </div>
      <PresentationNavigation labels={labels} title={title} pages={player.pages} native={player.native}
        onPage={player.command} enlarged={enlarged} fullPageButton={fullPageButton}
        onFullPage={() => setEnlarged(value => !value)} />
      {enlarged && <span tabIndex={0} onFocus={focusStage} className="viewer-focus-guard" />}
    </div>
  );
}
