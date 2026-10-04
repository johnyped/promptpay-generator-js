import {
  BOT_ID_MERCHANT_EWALLET_ID,
  BOT_ID_MERCHANT_PHONE_NUMBER,
  BOT_ID_MERCHANT_TAX_ID,
  PHONE_COUNTRY_CODE,
  PHONE_PREFIX_ZERO,
  PHONE_TARGET_DIGITS,
  TARGET_LENGTH_EWALLET_ID,
  TARGET_LENGTH_PHONE,
  TARGET_LENGTH_TAX_ID,
} from './constants.js';

const PHONE_TARGET = `a ${TARGET_LENGTH_PHONE}-digit mobile number starting with ${PHONE_PREFIX_ZERO} (for example 089-999-9999)`;
const TAX_ID_TARGET = `a ${TARGET_LENGTH_TAX_ID}-digit tax or national ID (for example 1234567890123)`;
const EWALLET_TARGET = `a ${TARGET_LENGTH_EWALLET_ID}-digit e-wallet ID (for example 004999000288505)`;

/**
 * Strip every non-ASCII-digit character from a PromptPay target, exactly like
 * PHP's `preg_replace('/[^0-9]/', '', $str)`, then validate its shape.
 *
 * @param {string} target mobile number, tax ID or e-wallet ID.
 * @returns {string} digits only.
 * @throws {TypeError} when the target is not a string, has no digits, or does
 *   not match one of the three supported PromptPay target shapes.
 */
export function sanitizeTarget(target) {
  if (typeof target !== 'string') {
    throw new TypeError(
      `PromptPay target must be a string, received ${target === null ? 'null' : typeof target}. ` +
        `Supported targets are ${PHONE_TARGET}, ${TAX_ID_TARGET} or ${EWALLET_TARGET}.`,
    );
  }

  const digits = target.replace(/[^0-9]/g, '');

  if (digits.length === 0) {
    throw new TypeError(
      `PromptPay target "${target}" contains no digits. Supported targets are ${PHONE_TARGET}, ${TAX_ID_TARGET} or ${EWALLET_TARGET}.`,
    );
  }

  const isValidPhone = digits.length === TARGET_LENGTH_PHONE && digits.startsWith(PHONE_PREFIX_ZERO);
  const isTaxId = digits.length === TARGET_LENGTH_TAX_ID;
  const isEwalletId = digits.length === TARGET_LENGTH_EWALLET_ID;

  if (!isValidPhone && !isTaxId && !isEwalletId) {
    throw new TypeError(
      `PromptPay target "${target}" is not supported (${digits.length} digits after removing punctuation). ` +
        `Supported targets are ${PHONE_TARGET}, ${TAX_ID_TARGET} or ${EWALLET_TARGET}.`,
    );
  }

  return digits;
}

/**
 * Which merchant account type (EMV tag `29` sub-tag) a target belongs to.
 * Length comparison mirrors the PHP implementation.
 *
 * @param {string} target
 * @returns {'01'|'02'|'03'}
 */
export function getTargetType(target) {
  const digits = sanitizeTarget(target);

  if (digits.length >= TARGET_LENGTH_EWALLET_ID) {
    return BOT_ID_MERCHANT_EWALLET_ID;
  }

  return digits.length >= TARGET_LENGTH_TAX_ID ? BOT_ID_MERCHANT_TAX_ID : BOT_ID_MERCHANT_PHONE_NUMBER;
}

/**
 * Convert a target into the value PromptPay expects inside tag `29`:
 * phone numbers become the `00` + `66` + subscriber form, tax and e-wallet IDs
 * are passed through untouched so leading zeroes survive.
 *
 * @param {string} target
 * @returns {string} 13 digits
 */
export function formatTarget(target) {
  const digits = sanitizeTarget(target);

  if (digits.length >= TARGET_LENGTH_TAX_ID) {
    return digits;
  }

  const withoutLeadingZero = PHONE_COUNTRY_CODE + digits.slice(1);

  return withoutLeadingZero.padStart(PHONE_TARGET_DIGITS, '0').slice(-PHONE_TARGET_DIGITS);
}
