export const PLAYER_SCOPE = 'gmath.presentation.v1';

interface Envelope {
  scope: typeof PLAYER_SCOPE;
  session: string;
}

export interface PageState extends Envelope {
  kind: 'state';
  count: number;
  index: number;
  previous: boolean;
  next: boolean;
}

export type PlayerMessage = PageState
  | (Envelope & { kind: 'native' })
  | (Envelope & { kind: 'error'; message: string });

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPlayerMessage(value: unknown): value is PlayerMessage {
  if (!isRecord(value) || value.scope !== PLAYER_SCOPE
    || typeof value.session !== 'string' || value.session.length < 16
    || value.session.length > 100) return false;
  if (value.kind === 'native') return true;
  if (value.kind === 'error') {
    return typeof value.message === 'string'
      && value.message.length > 0 && value.message.length <= 500;
  }
  return value.kind === 'state'
    && typeof value.count === 'number' && Number.isSafeInteger(value.count)
    && value.count > 0 && value.count <= 2000
    && typeof value.index === 'number' && Number.isInteger(value.index)
    && value.index >= -1 && value.index < value.count
    && typeof value.previous === 'boolean' && typeof value.next === 'boolean';
}
