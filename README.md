# promptpay-generator-js

Dependency-free JavaScript library for generating PromptPay EMV QR Code payloads in browsers, Node.js, and edge runtimes. QR image rendering stays separate from the core package.

The generated payloads are byte-compatible with the fixtures from the original PHP implementation.

## Install from this repository

The package is not published yet. Build it locally:

```bash
git clone https://github.com/johnyped/promptpay-generator-js.git
cd promptpay-generator-js
npm install
npm run build
```

To test it as an installed package from another project:

```bash
npm pack
npm install /path/to/promptpay-generator-js/promptpay-generator-js-1.0.0.tgz
```

## Usage

```js
import { generatePayload } from 'promptpay-generator-js';

// Static QR: the payer enters the amount.
const staticPayload = generatePayload('089-999-9999');

// Dynamic QR: the amount is fixed.
const dynamicPayload = generatePayload('089-999-9999', 420);
```

CommonJS is also supported:

```js
const { generatePayload } = require('promptpay-generator-js');
```

When working directly from this checkout, import `./dist/index.js` for ESM or require `./dist/index.cjs` for CommonJS.

## Render a QR code in the browser

The core package returns a payload string. Use a renderer such as [`qrcode`](https://www.npmjs.com/package/qrcode) to draw it:

```html
<canvas id="qr"></canvas>

<script type="module">
  import QRCode from 'https://cdn.jsdelivr.net/npm/qrcode/+esm';
  import { generatePayload } from './dist/index.js';

  const payload = generatePayload('089-999-9999', '420');
  await QRCode.toCanvas(document.querySelector('#qr'), payload, { width: 320 });
</script>
```

Run the complete interactive demo with:

```bash
npm run dev:example
```

Then open `http://127.0.0.1:5173/basic.html`. The demo covers phone, tax ID, and e-wallet targets; static and dynamic QR codes; validation failures; custom input; Canvas rendering; and integration snippets.

## API

| Export | Signature | Description |
|---|---|---|
| `generatePayload` | `(target, amount?) => string` | Generates a complete PromptPay payload with CRC. |
| `formatTarget` | `(target) => string` | Normalizes a phone, tax ID, or e-wallet ID. |
| `formatAmount` | `(amount) => string` | Validates and formats an amount to two decimals. |
| `crc16` | `(data) => string` | Returns a four-character uppercase CRC-16/CCITT checksum. |

### Static and dynamic QR codes

```js
generatePayload('0899999999');          // static: POI 11, no field 54
generatePayload('0899999999', '420');   // dynamic: POI 12, field 54 = 420.00
```

Amount presence uses an explicit nullish check. Omitted, `undefined`, and `null` amounts create static payloads. Explicit zero amounts are rejected instead of being treated as omitted.

### Supported targets

| Target | Example | PromptPay sub-tag |
|---|---|---|
| Thai mobile number | `089-999-9999` | `01` |
| Tax or national ID | `0123456789012` | `02` |
| E-wallet ID | `004999000288505` | `03` |

Punctuation is removed from phone numbers. Tax and e-wallet identifiers preserve leading zeroes.

### Amounts

Amounts accept numbers or plain decimal strings and are rounded half away from zero:

```js
formatAmount(420);          // "420.00"
formatAmount('1337.1387');  // "1337.14"
```

Prefer decimal strings for financial values when exact source digits matter. Zero, negative, non-finite, empty, exponent-notation, and thousands-separated values are rejected with clear errors.

## Development

```bash
npm install
npm test              # unit, compatibility, validation, and demo tests
npm run build         # dist/index.js + dist/index.cjs
npm run verify        # verify both bundles against PHP compatibility fixtures
npm run check         # test + build + verify
npm pack --dry-run    # inspect publishable package contents
npm run dev:example   # run the browser demo
```

## License

[MIT](LICENSE)
