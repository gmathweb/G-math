import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { isPlayerMessage, isRecord, PLAYER_SCOPE, type PageState, type PlayerMessage } from './playerProtocol';

interface Reply {
  session: string;
  message: PlayerMessage | null;
  pages: PageState | null;
}

export function usePresentationPlayer(
  iframe: RefObject<HTMLIFrameElement | null>, source: string, attempt: number,
) {
  const identity = useMemo(() => ({
    source, attempt,
    session: Array.from(crypto.getRandomValues(new Uint8Array(16)),
      byte => byte.toString(16).padStart(2, '0')).join(''),
  }), [source, attempt]);
  const session = identity.session;
  const [reply, setReply] = useState<Reply>({ session: '', message: null, pages: null });
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const receive = (event: MessageEvent<unknown>) => {
      const data = event.data;
      if (event.source !== iframe.current?.contentWindow || event.origin !== 'null'
        || !isRecord(data) || data.scope !== PLAYER_SCOPE || data.session !== session) return;
      window.clearTimeout(timer.current);
      const message: PlayerMessage = isPlayerMessage(data) ? data : {
        scope: PLAYER_SCOPE, session, kind: 'error', message: 'Invalid presentation navigation data',
      };
      setReply(previous => ({
        session, message,
        pages: message.kind === 'state' ? message : previous.session === session ? previous.pages : null,
      }));
    };
    window.addEventListener('message', receive);
    return () => {
      window.removeEventListener('message', receive);
      window.clearTimeout(timer.current);
    };
  }, [iframe, session]);

  const initialize = useCallback(() => {
    // Sandboxed HTML has an opaque origin, so the target origin must be "*".
    iframe.current?.contentWindow?.postMessage({ scope: PLAYER_SCOPE, session, kind: 'init' }, '*');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReply(previous => previous.session === session
      && previous.message ? previous : {
        session, pages: null, message: { scope: PLAYER_SCOPE, session, kind: 'native' },
      }), 1500);
  }, [iframe, session]);

  const command = useCallback((action: 'next' | 'previous' | 'goto', index?: number) => {
    iframe.current?.contentWindow?.postMessage({
      scope: PLAYER_SCOPE, session, kind: 'command', action, index,
    }, '*');
  }, [iframe, session]);

  const current = reply.session === session ? reply : null;
  return {
    pages: current?.pages ?? null,
    error: current?.message?.kind === 'error' ? current.message.message : '',
    native: current?.message?.kind === 'native',
    initialize, command,
  };
}
