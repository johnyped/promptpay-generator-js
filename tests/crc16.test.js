import { describe, expect, it } from 'vitest';

import { crc16 } from '../src/crc16.js';
import { crcVectors } from './fixtures.js';

describe('crc16', () => {
  it.each(crcVectors)('matches the PHP vector for $crc', ({ data, crc }) => {
    expect(crc16(data)).toBe(crc);
  });

  it('pads the result to four uppercase hexadecimal characters', () => {
    expect(crc16('')).toBe('FFFF');
    expect(crc16('00')).toMatch(/^[0-9A-F]{4}$/);
  });

  it('rejects non-string input', () => {
    // @ts-expect-error deliberate misuse
    expect(() => crc16(6304)).toThrow(TypeError);
    expect(() => crc16(undefined)).toThrow(TypeError);
  });
});
