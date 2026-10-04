/**
 * Post-build verification: the published bundles must be behaviour-identical to
 * the source modules and must not lean on any Node-only API, because the core
 * library has to work when a browser loads it straight from a `<script type="module">`.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { generatePayload as generateFromSource } from '../src/index.js';
import { payloadVectors } from '../tests/fixtures.js';

const require = createRequire(import.meta.url);
const here = new URL('.', import.meta.url);
const nodeApis = /\brequire\s*\(\s*['"]node:/;

const esm = await import(fileURLToPath(new URL('../dist/index.js', here)));
const cjs = require(fileURLToPath(new URL('../dist/index.cjs', here)));

for (const [name, bundle] of [['dist/index.js', esm], ['dist/index.cjs', cjs]]) {
  const code = readFileSync(new URL(`../${name}`, here), 'utf8');

  assert.doesNotMatch(code, nodeApis, `${name} must not import Node built-in modules`);
  assert.doesNotMatch(code, /\b(process\.|Buffer\.|__dirname|__filename)/, `${name} must not use Node globals`);
  assert.deepStrictEqual(Object.keys(bundle).sort(), ['crc16', 'formatAmount', 'formatTarget', 'generatePayload'], name);

  for (const vector of payloadVectors) {
    const built = vector.amount === undefined ? bundle.generatePayload(vector.target) : bundle.generatePayload(vector.target, vector.amount);

    assert.equal(built, vector.payload, `${name} drifts from the PHP fixture for ${vector.note}`);
    assert.equal(built, generateFromSource(vector.target, vector.amount), `${name} drifts from src for ${vector.note}`);
  }

  assert.throws(() => bundle.generatePayload('0899999999', 0), RangeError, `${name} must reject an explicit zero amount`);
}

console.log(`verified dist/index.js and dist/index.cjs against ${payloadVectors.length} PHP payload fixtures`);
