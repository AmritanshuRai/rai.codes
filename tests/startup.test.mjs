import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/assets/intro.js', import.meta.url), 'utf8');
for (const [name, seen, reduced] of [['first visit', false, false], ['refresh', true, false], ['reduced motion', false, true]]) {
  test(`startup hides unfinished layout on ${name} and fails open`, () => {
    const classes = new Set();
    const shell = { inert: true };
    const timers = [];
    vm.runInNewContext(source, {
      document: {
        documentElement: { classList: {
          add: (...values) => values.forEach(value => classes.add(value)),
          remove: (...values) => values.forEach(value => classes.delete(value)),
        } },
        querySelector: () => shell,
      },
      matchMedia: () => ({ matches: reduced }),
      sessionStorage: { getItem: () => seen ? '1' : null, setItem() {} },
      setTimeout: (fn, delay) => timers.push({ fn, delay }),
    });
    assert.equal(classes.has('app-loading'), true);
    assert.equal(classes.has('intro-active'), !seen && !reduced);
    assert.equal(timers[0].delay, 5000);
    timers[0].fn();
    assert.equal(classes.size, 0);
    assert.equal(shell.inert, false);
  });
}
