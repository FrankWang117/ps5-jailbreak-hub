import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
test('page check only updates local status, with no model/firmware detection', () => {
  let click;
  const result = { textContent: '' };
  const document = {
    getElementById: (id) =>
      id === 'result'
        ? result
        : {
            addEventListener: (event, fn) => {
              assert.equal(event, 'click');
              click = fn;
            },
          },
  };
  runInNewContext(
    readFileSync(new URL('./public/main.js', import.meta.url), 'utf8'),
    {
      document,
    },
  );
  click();
  assert.match(result.textContent, /兼容性仍为未知/);
});
test('page script tolerates missing DOM elements', () => {
  runInNewContext(
    readFileSync(new URL('./public/main.js', import.meta.url), 'utf8'),
    {
      document: { getElementById: () => null },
    },
  );
});
