import { formatAmount, isAmountProvided } from './amount.js';
import { crc16 } from './crc16.js';
import {
  CRC_LENGTH,
  COUNTRY_CODE_TH,
  GUID_PROMPTPAY,
  ID_COUNTRY_CODE,
  ID_CRC,
  ID_MERCHANT_INFORMATION_BOT,
  ID_PAYLOAD_FORMAT,
  ID_POI_METHOD,
  ID_TRANSACTION_AMOUNT,
  ID_TRANSACTION_CURRENCY,
  MERCHANT_INFORMATION_TEMPLATE_ID_GUID,
  PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE,
  POI_METHOD_DYNAMIC,
  POI_METHOD_STATIC,
  TRANSACTION_CURRENCY_THB,
} from './constants.js';
import { formatTarget, getTargetType, sanitizeTarget } from './target.js';

const MAX_FIELD_VALUE_BYTES = 99;
const MAX_FIELD_ID_BYTES = 2;

/**
 * Serialize one EMV tag-length-value triplet.
 *
 * @param {string} id two-character field identifier, for example `54`.
 * @param {string} value field value.
 * @returns {string} for example `5406420.00`.
 */
export function field(id, value) {
  if (typeof id !== 'string' || id.length !== MAX_FIELD_ID_BYTES) {
    throw new TypeError(`PromptPay field id must be a ${MAX_FIELD_ID_BYTES}-character string, received "${id}".`);
  }

  if (typeof value !== 'string') {
    throw new TypeError(`PromptPay field ${id} expects a string value, received ${value === null ? 'null' : typeof value}.`);
  }

  const byteLength = new TextEncoder().encode(value).length;

  if (byteLength > MAX_FIELD_VALUE_BYTES) {
    throw new RangeError(`PromptPay field ${id} is ${byteLength} bytes; EMV tag-length encoding supports at most ${MAX_FIELD_VALUE_BYTES}.`);
  }

  return `${id}${String(byteLength).padStart(2, '0')}${value}`;
}

/**
 * @param {string[]} fields serialized tag-length-value strings.
 * @returns {string}
 */
export function serialize(fields) {
  return fields.join('');
}

/**
 * Build a PromptPay (EMV QR CoIN) payload string, byte-compatible with
 * `kittinan/php-promptpay-qr`.
 *
 * * `generatePayload(target)` → static QR, point-of-initiation method `11`,
 *   no amount field.
 * * `generatePayload(target, amount)` → dynamic QR, method `12`, amount
 *   field `54` included.
 *
 * Presence is decided with a nullish check, never with truthiness, so an
 * explicit `0` is reported as an invalid amount instead of quietly becoming a
 * static QR (the PHP `$amount ? … : …` behaviour).
 *
 * @param {string} target 10-digit phone number, 13-digit tax ID or 15-digit e-wallet ID.
 * @param {number|string} [amount] amount in THB, omitted for a static QR.
 * @returns {string} the payload to encode in a QR code.
 * @throws {TypeError|RangeError} when the target or amount is invalid.
 */
export function generatePayload(target, amount) {
  const digits = sanitizeTarget(target);
  const hasAmount = isAmountProvided(amount);
  const fieldsList = [
    field(ID_PAYLOAD_FORMAT, PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE),
    field(ID_POI_METHOD, hasAmount ? POI_METHOD_DYNAMIC : POI_METHOD_STATIC),
    field(ID_MERCHANT_INFORMATION_BOT, serialize([
      field(MERCHANT_INFORMATION_TEMPLATE_ID_GUID, GUID_PROMPTPAY),
      field(getTargetType(digits), formatTarget(digits)),
    ])),
    field(ID_COUNTRY_CODE, COUNTRY_CODE_TH),
    field(ID_TRANSACTION_CURRENCY, TRANSACTION_CURRENCY_THB),
  ];

  if (hasAmount) {
    fieldsList.push(field(ID_TRANSACTION_AMOUNT, formatAmount(amount)));
  }

  const payloadToChecksum = serialize(fieldsList) + ID_CRC + CRC_LENGTH;

  fieldsList.push(field(ID_CRC, crc16(payloadToChecksum)));

  return serialize(fieldsList);
}
