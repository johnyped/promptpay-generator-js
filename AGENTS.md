# AGENTS.md

## Project

`promptpay-generator-js` is a dependency-free PromptPay EMV QR Code payload generator for browsers, Node.js, and edge runtimes. The core library generates payload strings only; QR image rendering belongs to the example/integration layer.

This is the standalone JavaScript repository. Do not add PHP or Composer files.

## Requirements

- Node.js 18 or newer
- npm with the committed `package-lock.json`
- ESM source with a generated CommonJS fallback
- MIT license

## Commands

```bash
npm ci                 # install exactly from the lockfile
npm test               # run the Vitest suite
npm run build          # build dist/index.js and dist/index.cjs
npm run verify         # compare both bundles with compatibility fixtures
npm run check          # test + build + verify
npm pack --dry-run     # inspect publishable package contents
npm run dev:example    # serve examples/basic.html with Vite
```

Run `npm run check` before committing behavioral or packaging changes.

## Project map

- `src/constants.js` — PromptPay and EMV identifiers and fixed values.
- `src/crc16.js` — browser-safe CRC-16/CCITT implementation.
- `src/target.js` — target sanitization, validation, classification, and formatting.
- `src/amount.js` — amount presence, validation, and deterministic decimal rounding.
- `src/promptpay.js` — TLV serialization and payload assembly.
- `src/index.js` — public package exports.
- `tests/fixtures.js` — byte-for-byte compatibility vectors inherited from the original PHP library.
- `tests/*.test.js` — unit, regression, compatibility, and browser-example tests.
- `examples/basic.html` and `examples/basic.js` — interactive browser integration demo.
- `scripts/verify-package.mjs` — post-build ESM/CJS verification.

## Code conventions

- Use modern JavaScript, ESM imports, named exports, single quotes, semicolons, and two-space indentation.
- Keep modules small and focused. Preserve the current separation between CRC, target, amount, and payload logic.
- Keep `src/` browser-safe: no `window`, `document`, Node built-ins, `Buffer`, `process`, `require`, or QR-rendering dependency.
- Keep the core package runtime dependency-free. `qrcode` is a development/example dependency only.
- Public API changes must be reflected in `src/index.js`, README examples, package verification, and tests.
- Prefer clear `TypeError` or `RangeError` messages over silent coercion.

## Compatibility invariants

- `generatePayload(target)` creates a static QR with POI method `11` and no field `54`.
- `generatePayload(target, amount)` creates a dynamic QR with POI method `12` and field `54`.
- Determine amount presence with an explicit nullish check. Never use truthiness; explicit zero, including signed zero strings, is invalid.
- Preserve all payload and CRC values in `tests/fixtures.js` byte-for-byte unless an approved compatibility change explicitly requires new fixtures.
- Phone targets normalize to the PromptPay 13-digit representation. Tax and e-wallet identifiers preserve leading zeroes.
- Format amounts deterministically to two decimals. Prefer decimal-string test inputs when exact digits matter.
- CRC output is exactly four uppercase hexadecimal characters.

## Testing

- Follow red-green-refactor for behavior changes: add a failing test, verify the expected failure, implement the smallest fix, then run the full suite.
- Test public behavior and literal expected payloads rather than duplicating production logic in assertions.
- Add regression coverage for omitted, `undefined`, `null`, zero, malformed, and boundary inputs when changing validation.
- For browser-demo changes, test valid-to-invalid transitions so stale QR codes cannot remain visible.
- Verify browser-facing changes with `npm run dev:example`; check static, dynamic, and invalid states at desktop and mobile widths when layout or interaction changes.

## Packaging and documentation

- `dist/` is generated and ignored. Do not commit it unless the publication policy changes.
- Do not commit `node_modules/`, coverage output, or generated `.tgz` files.
- Keep `README.md`, the browser demo, and package metadata aligned with the actual package name and exports.
- Use `npm pack --dry-run` to ensure only `LICENSE`, `README.md`, `package.json`, and the two bundles are published.
- The package may be tested locally with `npm pack`; do not claim it is available from npm until publication is verified.

## Git workflow

- Preserve unrelated user changes.
- Keep commits atomic and use conventional prefixes such as `feat:`, `fix:`, `test:`, `docs:`, and `chore:`.
- Inspect staged changes and run `git diff --check` before committing.
- Never commit secrets, credentials, environment files, or generated artifacts.
- Do not push, publish, force-push, rewrite history, or delete branches unless the user explicitly requests it.
