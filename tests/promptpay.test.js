import { describe, expect, it } from 'vitest';

import { formatAmount } from '../src/amount.js';
import { generatePayload } from '../src/promptpay.js';
import { formatTarget, getTargetType, sanitizeTarget } from '../src/target.js';
import * as promptpay from '../src/index.js';
import { amountVectors, payloadVectors, targetVectors } from './fixtures.js';

describe('sanitizeTarget', () => {
  it('keeps only ASCII digits, exactly like the PHP sanitizer', () => {
    expect(sanitizeTarget('089-999-9999')).toBe('0899999999');
    expect(sanitizeTarget('089 999 9999')).toBe('0899999999');
    expect(sanitizeTarget('089.999-9999')).toBe('0899999999');
    expect(sanitizeTarget('tel:0899999999')).toBe('0899999999');
    expect(sanitizeTarget('0123456789012')).toBe('0123456789012');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a number', 899999999],
    ['an empty string', ''],
    ['an under-length target', '089-999-'],
  ])('rejects %s', (_label, value) => {
    expect(() => sanitizeTarget(value)).toThrow(TypeError);
  });
});

describe('formatTarget', () => {
  it.each(targetVectors)('formats $note: $target -> $formatted', ({ target, formatted }) => {
    expect(formatTarget(target)).toBe(formatted);
  });

  it('is idempotent for already formatted targets', () => {
    expect(formatTarget(formatTarget('089-999-9999'))).toBe('0066899999999');
  });

  it('rejects targets that are not a 10-digit phone, 13-digit tax id or 15-digit e-wallet id', () => {
    expect(() => formatTarget('899999999')).toThrow(/PromptPay target/);
    expect(() => formatTarget('123456789012')).toThrow(/PromptPay target/);
    expect(() => formatTarget('08999999990')).toThrow(/PromptPay target/);
    expect(() => formatTarget('00499900028850')).toThrow(/PromptPay target/);
  });
});

describe('getTargetType', () => {
  it('selects the merchant account type from the normalized digit length', () => {
    expect(getTargetType('0899999999')).toBe('01');
    expect(getTargetType('089-999-9999')).toBe('01');
    expect(getTargetType('1234567890123')).toBe('02');
    expect(getTargetType('0123456789012')).toBe('02');
    expect(getTargetType('004999000288505')).toBe('03');
  });
});

describe('formatAmount', () => {
  it.each(amountVectors)('formats $amount -> $formatted', ({ amount, formatted }) => {
    expect(formatAmount(amount)).toBe(formatted);
  });

  it('accepts decimal strings without losing precision', () => {
    expect(formatAmount('420')).toBe('420.00');
    expect(formatAmount('13371337.75')).toBe('13371337.75');
    expect(formatAmount('2.675')).toBe('2.68');
    expect(formatAmount('1.004')).toBe('1.00');
    expect(formatAmount('  420  ')).toBe('420.00');
  });

  it('rounds half away from zero and pads to two decimals', () => {
    expect(formatAmount(420)).toBe('420.00');
    expect(formatAmount('0.005')).toBe('0.01');
    expect(formatAmount('9.999')).toBe('10.00');
    expect(formatAmount('99.995')).toBe('100.00');
  });

  it.each([
    ['zero', 0],
    ['the string "0"', '0'],
    ['the signed string "+0"', '+0'],
    ['the whitespace-padded signed string "+0"', ' +0 '],
    ['a negative number', -420],
    ['a negative decimal string', '-420.00'],
    ['a value that rounds to 0.00', '0.001'],
  ])('rejects %s as an amount', (_label, value) => {
    expect(() => formatAmount(value)).toThrow(RangeError);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a boolean', true],
    ['an object', { value: 420 }],
    ['a non-decimal string', '420abc'],
    ['a thousands-separated string', '1,337.75'],
    ['an exponent-notation string', '1e3'],
    ['an empty string', ''],
  ])('rejects %s as an amount', (_label, value) => {
    expect(() => formatAmount(value)).toThrow(TypeError);
  });

  it('rejects amounts larger than the EMV tag 54 field can carry', () => {
    expect(() => formatAmount('999999999999.99')).toThrow(RangeError);
  });
});

describe('generatePayload', () => {
  it.each(payloadVectors)('$note', ({ target, amount, payload }) => {
    const result = amount === undefined ? generatePayload(target) : generatePayload(target, amount);

    expect(result).toBe(payload);
  });

  it('documents the README example for a numeric amount', () => {
    expect(generatePayload('089-999-9999', 420)).toBe(
      '00020101021229370016A000000677010111011300668999999995802TH53037645406420.006304CF9E',
    );
  });

  it('creates a static QR without tag 54 when the amount is omitted', () => {
    const payload = generatePayload('0899999999');

    expect(payload).toContain('010211');
    expect(payload).not.toContain('5406');
    expect(payload).toBe('00020101021129370016A000000677010111011300668999999995802TH53037646304FE29');
  });

  it('creates a dynamic QR with tag 54 when an amount is supplied', () => {
    const payload = generatePayload('0899999999', '420');

    expect(payload).toContain('010212');
    expect(payload).toContain('5406420.00');
  });

  it('treats an omitted amount and undefined identically', () => {
    expect(generatePayload('0899999999', undefined)).toBe(generatePayload('0899999999'));
    expect(generatePayload('0899999999', null)).toBe(generatePayload('0899999999'));
  });

  it('rejects an explicit zero amount instead of silently building a static QR', () => {
    expect(() => generatePayload('0899999999', 0)).toThrow(RangeError);
    expect(() => generatePayload('0899999999', '0')).toThrow(RangeError);
    expect(() => generatePayload('0899999999', '+0')).toThrow(RangeError);
    expect(() => generatePayload('0899999999', ' +0 ')).toThrow(RangeError);
  });

  it('propagates target validation errors instead of emitting a payload', () => {
    expect(() => generatePayload('')).toThrow(TypeError);
    expect(() => generatePayload(undefined)).toThrow(TypeError);
    expect(() => generatePayload('089-999-')).toThrow(TypeError);
  });

  it('serializes merchant information in the PHP field order', () => {
    const payload = generatePayload('004999000288505', '100.25');

    expect(payload.indexOf('29390016A0000006770101110315004999000288505')).toBeGreaterThan(0);
    expect(payload.indexOf('5802TH')).toBeLessThan(payload.indexOf('5303764'));
    expect(payload.indexOf('5303764')).toBeLessThan(payload.indexOf('5406100.25'));
    expect(payload.endsWith('6304369A')).toBe(true);
  });
});

describe('package surface', () => {
  it('exports the documented public API', () => {
    expect(Object.keys(promptpay).sort()).toEqual(['crc16', 'formatAmount', 'formatTarget', 'generatePayload']);
    for (const exported of Object.values(promptpay)) {
      expect(typeof exported).toBe('function');
    }
  });

  it('keeps the core modules free of Node.js globals', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const sourceDir = new URL('../src/', import.meta.url);

    for (const file of readdirSync(sourceDir)) {
      const code = readFileSync(new URL(file, sourceDir), 'utf8');

      expect([file, code]).toSatisfy(
        ([, text]) => !/\brequire\s*\(|\bBuffer\b|\bprocess\.|\b__dirname\b|\bmodule\.exports\b/.test(text),
      );
    }
  });
});
