/**
 * CRC-16/CCITT (CRC-16/CCITT-FALSE) used by the EMV QR CoIN Presentation Mode
 * payload that PromptPay is built on.
 *
 *   polynomial 0x1021, initial value 0xFFFF, input/output not reflected,
 *   final XOR 0x0000, output as four uppercase hexadecimal characters.
 *
 * Byte-identical to the PHP implementation, which delegates to
 * `mermshaus\CRC\CRC16CCITT` (`kittinan/php-crc`).
 */

const POLYNOMIAL = 0x1021;
const INITIAL_VALUE = 0xffff;

/**
 * @param {string} data ASCII (or UTF-8 encodable) payload string.
 * @returns {string} four uppercase hexadecimal characters, e.g. `FE29`.
 */
export function crc16(data) {
  if (typeof data !== 'string') {
    throw new TypeError(`crc16(data) expects a string, received ${data === null ? 'null' : typeof data}.`);
  }

  const bytes = new TextEncoder().encode(data);
  let crc = INITIAL_VALUE;

  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i] << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ POLYNOMIAL) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}
