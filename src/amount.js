import { MAX_AMOUNT_FIELD_LENGTH } from './constants.js';

const DECIMAL_STRING = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

/**
 * True when the caller actually supplied an amount. Amount presence must never
 * rely on JavaScript truthiness: `0` means "dynamic QR with an invalid amount",
 * not "static QR" the way PHP's `$amount ? … : …` read it.
 *
 * @param {number|string|null|undefined} amount
 * @returns {boolean}
 */
export function isAmountProvided(amount) {
  return amount !== undefined && amount !== null;
}

/**
 * Format a PromptPay transaction amount (EMV tag `54`) as exactly two decimal
 * places, rounding half away from zero like PHP's `number_format($amount, 2)`.
 *
 * Decimal strings are the recommended input for money: they are rounded from
 * their exact digits instead of from a binary float.
 *
 * @param {number|string} amount
 * @returns {string} for example `420.00`
 * @throws {TypeError} for values that are not a positive decimal number.
 * @throws {RangeError} for values that are zero, negative, or out of range.
 */
export function formatAmount(amount) {
  if (!isAmountProvided(amount)) {
    throw new TypeError('formatAmount(amount) requires an amount; omit the argument to generatePayload() for a static QR.');
  }

  const decimal = toDecimalString(amount);
  const negative = decimal.startsWith('-');
  const unsigned = negative ? decimal.slice(1) : decimal;
  const digitsOnly = unsigned.replace('.', '');

  if (digitsOnly.length === 0) {
    throw new TypeError(describe(amount, 'is not a decimal number'));
  }

  if (negative) {
    throw new RangeError(describe(amount, 'must be greater than zero'));
  }

  const formatted = roundToTwoDecimals(unsigned);

  if (formatted === '0.00') {
    throw new RangeError(describe(amount, 'rounds to 0.00; the smallest supported amount is 0.01'));
  }

  if (formatted.length > MAX_AMOUNT_FIELD_LENGTH) {
    throw new RangeError(
      describe(amount, `is too large; a PromptPay amount must fit in ${MAX_AMOUNT_FIELD_LENGTH} characters (for example 999999999.99)`),
    );
  }

  return formatted;
}

function describe(amount, problem) {
  const shown = typeof amount === 'string' ? `"${amount}"` : String(amount);

  return `PromptPay amount ${shown} ${problem}.`;
}

function toDecimalString(amount) {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) {
      throw new TypeError(`PromptPay amount ${String(amount)} is not a finite number.`);
    }

    const text = String(Math.abs(amount) === 0 ? 0 : amount);

    if (text.includes('e') || text.includes('E')) {
      throw new TypeError(
        `PromptPay amount ${String(amount)} is outside the range a JavaScript number can express as a plain decimal; pass a decimal string such as "${amount.toPrecision(6)}".`,
      );
    }

    return text;
  }

  if (typeof amount === 'string') {
    const text = amount.trim();

    if (!DECIMAL_STRING.test(text)) {
      throw new TypeError(`PromptPay amount "${amount}" is not a plain decimal number. Use a value such as "420" or "1337.75".`);
    }

    return text.startsWith('+') ? text.slice(1) : text;
  }

  throw new TypeError(`PromptPay amount must be a number or a decimal string, received ${amount === null ? 'null' : typeof amount}.`);
}

/**
 * Round a positive plain decimal string to two places, half away from zero,
 * using digit arithmetic so no binary float is ever involved.
 */
function roundToTwoDecimals(decimal) {
  const [wholeText, fractionText = ''] = decimal.split('.');
  const whole = wholeText.replace(/^0+(?=\d)/, '');
  const kept = (fractionText + '00').slice(0, 2);
  const dropped = fractionText.slice(2);
  let digits = whole + kept;

  if (dropped.length > 0 && dropped[0] >= '5') {
    digits = incrementDigits(digits);
  }

  const padded = digits.padStart(3, '0');

  return `${padded.slice(0, -2).replace(/^0+(?=\d)/, '')}.${padded.slice(-2)}`;
}

function incrementDigits(digits) {
  const chars = digits.split('');

  for (let i = chars.length - 1; i >= 0; i -= 1) {
    if (chars[i] === '9') {
      chars[i] = '0';
    } else {
      chars[i] = String(Number(chars[i]) + 1);

      return chars.join('');
    }
  }

  return `1${chars.join('')}`;
}
