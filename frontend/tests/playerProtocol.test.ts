import assert from 'node:assert/strict';
import test from 'node:test';
import { isPlayerMessage } from '../src/components/content/playerProtocol.ts';

const state = {
  scope: 'gmath.presentation.v1', session: '1234567890123456',
  kind: 'state', count: 10, index: 0, previous: false, next: true,
};

test('accepts real page state and initial page preparation', () => {
  assert.equal(isPlayerMessage(state), true);
  assert.equal(isPlayerMessage({ ...state, index: -1 }), true);
});

test('rejects invalid or excessive page counts', () => {
  for (const count of [0, -1, 2001, Infinity, NaN, 1.5, '10']) {
    assert.equal(isPlayerMessage({ ...state, count }), false);
  }
});

test('rejects out-of-range indexes and nonboolean navigation', () => {
  for (const index of [-2, 10, 100, 0.5, '0']) {
    assert.equal(isPlayerMessage({ ...state, index }), false);
  }
  assert.equal(isPlayerMessage({ ...state, previous: 'true' }), false);
});

test('requires the known protocol and a bounded session', () => {
  for (const value of [null, [], 'state', { ...state, scope: 'other' },
    { ...state, session: '' }, { ...state, session: 'x'.repeat(101) }]) {
    assert.equal(isPlayerMessage(value), false);
  }
});

test('accepts native fallback and explicit navigation errors', () => {
  assert.equal(isPlayerMessage({ ...state, kind: 'native' }), true);
  assert.equal(isPlayerMessage({ ...state, kind: 'error', message: 'Page failed' }), true);
  assert.equal(isPlayerMessage({ ...state, kind: 'error', message: '' }), false);
  assert.equal(isPlayerMessage({ ...state, kind: 'error', message: 'x'.repeat(501) }), false);
  assert.equal(isPlayerMessage({ ...state, kind: 'unknown' }), false);
});
