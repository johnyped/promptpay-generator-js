/**
 * Compatibility fixtures ported byte-for-byte from `tests/PromptPayTest.php`.
 *
 * Every `payload` / `crc` value below is copied verbatim from the PHP test
 * suite so that a JavaScript regression can never silently drift away from the
 * behaviour that existing PromptPay integrations depend on.
 */

/** CRC-16/CCITT vectors from `PromptPayTest::testCrc16()`. */
export const crcVectors = [
  {
    source: 'tests/PromptPayTest.php::testCrc16 (https://www.blognone.com/node/95133)',
    data: '00020101021129370016A000000677010111011300660000000005802TH53037646304',
    crc: '8956',
  },
  {
    source: 'tests/PromptPayTest.php::testCrc16',
    data: '00020101021129370016A000000677010111011300668999999995802TH53037646304',
    crc: 'FE29',
  },
];

/** `formatTarget()` vectors from `PromptPayTest::testFormatTarget()`. */
export const targetVectors = [
  { target: '0899999999', formatted: '0066899999999', note: 'mobile number' },
  { target: '089-999-9999', formatted: '0066899999999', note: 'punctuated mobile number' },
  { target: '1234567890123', formatted: '1234567890123', note: '13-digit identifier' },
  { target: '0123456789012', formatted: '0123456789012', note: 'corporate tax id, leading zero kept' },
];

/** `formatAmount()` vectors from `PromptPayTest::testformatAmount()`. */
export const amountVectors = [
  { amount: 1337.1337, formatted: '1337.13', note: 'truncates extra precision' },
  { amount: 1337.1387, formatted: '1337.14', note: 'rounds half away from zero' },
];

/** `f()` (TLV field) vectors from `PromptPayTest::testF()`. */
export const fieldVectors = [
  { id: '00', value: '01', field: '000201' },
  { id: '05', value: '420', field: '0503420' },
];

/** `generatePayload()` vectors from `PromptPayTest::testGeneratePayload()`. */
export const payloadVectors = [
  {
    target: '0899999999',
    amount: undefined,
    payload: '00020101021129370016A000000677010111011300668999999995802TH53037646304FE29',
    note: 'static QR, mobile number',
  },
  {
    target: '0891234567',
    amount: undefined,
    payload: '00020101021129370016A000000677010111011300668912345675802TH5303764630429C1',
    note: 'static QR, mobile number',
  },
  {
    target: '0000000000',
    amount: undefined,
    payload: '00020101021129370016A000000677010111011300660000000005802TH530376463048956',
    note: 'static QR, all-zero mobile number',
  },
  {
    target: '1234567890123',
    amount: undefined,
    payload: '00020101021129370016A000000677010111021312345678901235802TH53037646304EC40',
    note: 'static QR, 13-digit tax id',
  },
  {
    target: '089-123-4567',
    amount: '13371337.75',
    payload: '00020101021229370016A000000677010111011300668912345675802TH5303764541113371337.756304B7D7',
    note: 'dynamic QR, punctuated mobile number, string amount',
  },
  {
    target: '1234567890123',
    amount: '420',
    payload: '00020101021229370016A000000677010111021312345678901235802TH53037645406420.006304BF7B',
    note: 'dynamic QR, tax id',
  },
  {
    target: '004999000288505',
    amount: undefined,
    payload: '00020101021129390016A00000067701011103150049990002885055802TH530376463041521',
    note: 'static QR, K Plus e-wallet id',
  },
  {
    target: '004999000288505',
    amount: '100.25',
    payload: '00020101021229390016A00000067701011103150049990002885055802TH53037645406100.256304369A',
    note: 'dynamic QR, K Plus e-wallet id',
  },
  {
    target: '004000006579718',
    amount: undefined,
    payload: '00020101021129390016A00000067701011103150040000065797185802TH53037646304FBB5',
    note: 'static QR, K Plus Shop e-wallet id',
  },
  {
    target: '004000006579718',
    amount: '200.50',
    payload: '00020101021229390016A00000067701011103150040000065797185802TH53037645406200.5063048A37',
    note: 'dynamic QR, K Plus Shop e-wallet id',
  },
];
