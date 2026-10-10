const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function playerHarness() {
  const listeners = new Map();
  const messages = [];
  const parent = { postMessage: (data, origin) => messages.push({ data, origin }) };
  const window = { parent, addEventListener: (name, handler) => listeners.set(name, handler) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app/static/presentation-player.js'), 'utf8'), { window, Error, Number });
  let index = -1;
  let changed;
  let restricted;
  let block = false;
  const controller = {
    currentSlideIndex: () => index,
    previousSlideIndex: () => index > 0 ? index - 1 : -1,
    nextSlideIndex: () => index >= 0 && index < 9 ? index + 1 : -1,
    slideChangeEvent: () => ({ addHandler: handler => { changed = handler; } }),
    navigationRestrictedEvent: () => ({ addHandler: handler => { restricted = handler; } }),
    gotoFirstSlide: () => { index = 0; changed(); },
    gotoNextSlide: () => { index++; changed(); },
    gotoPreviousSlide: () => { index--; changed(); },
    gotoSlide: next => {
      if (block) { restricted?.(); return; }
      index = next; changed();
    },
  };
  window.gmathPresentationBridge.register({
    view: () => ({ playbackController: () => controller }),
    presentation: () => ({ slides: () => ({ count: () => 10 }) }),
  });
  const session = '1234567890123456';
  function message(data, origin = 'https://gmath.example', source = parent) {
    listeners.get('message')({ source, origin, data: { scope: 'gmath.presentation.v1', session, ...data } });
  }
  message({ kind: 'init' });
  return { messages, message, session, index: () => index, block: () => { block = true; } };
}

test('starts first real page and reports SDK navigation', () => {
  const h = playerHarness();
  assert.equal(h.index(), 0);
  assert.equal(h.messages.at(-1).data.count, 10);
  assert.equal(h.messages.at(-1).origin, 'https://gmath.example');
  h.message({ kind: 'command', action: 'next' });
  assert.equal(h.index(), 1);
  assert.equal(h.messages.at(-1).data.index, 1);
  h.message({ kind: 'command', action: 'goto', index: 9 });
  assert.equal(h.messages.at(-1).data.next, false);
});

test('ignores other windows, origins and stale sessions', () => {
  const h = playerHarness();
  h.message({ kind: 'command', action: 'goto', index: 4 }, 'https://other.example');
  h.message({ kind: 'command', action: 'goto', index: 4 }, 'https://gmath.example', {});
  h.message({ kind: 'command', action: 'goto', index: 4, session: 'another-session-value' });
  assert.equal(h.index(), 0);
});

test('rejects invalid page commands without inventing progress', () => {
  const h = playerHarness();
  h.message({ kind: 'command', action: 'goto', index: 10 });
  assert.equal(h.index(), 0);
  assert.equal(h.messages.at(-1).data.kind, 'error');
  h.message({ kind: 'command', action: 'executeScript' });
  assert.equal(h.messages.at(-1).data.kind, 'error');
});

test('reports authored navigation restrictions rather than silently staying put', () => {
  const h = playerHarness();
  h.block();
  h.message({ kind: 'command', action: 'goto', index: 5 });
  assert.equal(h.index(), 0);
  assert.equal(h.messages.at(-1).data.kind, 'error');
});
