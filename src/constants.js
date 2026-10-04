/**
 * EMV QR CoIN Presentation Mode identifiers used by PromptPay.
 * Values are byte-identical to the constants in `src/PromptPay.php`.
 */

/** Field identifiers (EMV "data object IDs"). */
export const ID_PAYLOAD_FORMAT = '00';
export const ID_POI_METHOD = '01';
export const ID_MERCHANT_INFORMATION_BOT = '29';
export const ID_TRANSACTION_CURRENCY = '53';
export const ID_TRANSACTION_AMOUNT = '54';
export const ID_COUNTRY_CODE = '58';
export const ID_CRC = '63';

/** Fixed field values. */
export const PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE = '01';
export const POI_METHOD_STATIC = '11';
export const POI_METHOD_DYNAMIC = '12';
export const MERCHANT_INFORMATION_TEMPLATE_ID_GUID = '00';
export const BOT_ID_MERCHANT_PHONE_NUMBER = '01';
export const BOT_ID_MERCHANT_TAX_ID = '02';
export const BOT_ID_MERCHANT_EWALLET_ID = '03';
export const GUID_PROMPTPAY = 'A000000677010111';
export const TRANSACTION_CURRENCY_THB = '764';
export const COUNTRY_CODE_TH = 'TH';

/** Length of the CRC field value, and the EMV maximum length of tag `54`. */
export const CRC_LENGTH = '04';
export const MAX_AMOUNT_FIELD_LENGTH = 13;

/** PromptPay target shapes, in digits. */
export const TARGET_LENGTH_PHONE = 10;
export const TARGET_LENGTH_TAX_ID = 13;
export const TARGET_LENGTH_EWALLET_ID = 15;

/** The identifier that starts every PromptPay merchant account string. */
export const PHONE_COUNTRY_CODE = '66';
export const PHONE_PREFIX_ZERO = '0';
export const PHONE_TARGET_DIGITS = 13;
