# JavaScript PromptPay Browser Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the PHP PromptPay payload generator into a dependency-light JavaScript library that works in HTML browsers and supports both static QR codes without an amount and dynamic QR codes with an amount.

**Architecture:** Keep PromptPay payload generation as a pure, browser-safe module with no QR-rendering dependency. Expose the generated payload so applications can render it with a browser QR library such as `qrcode`; include a working HTML example that renders to a `<canvas>`. Preserve the existing PHP payload outputs as compatibility fixtures while adding explicit validation and correct handling of omitted amounts.

**Tech Stack:** Modern JavaScript, ESM/CJS package exports, Vitest, tsup, npm, browser Canvas example, `qrcode` only for the example/integration layer.

**Spec:** The approved design in the conversation, based on `README.md`, `src/PromptPay.php`, and `tests/PromptPayTest.php`.

## Global Constraints

- `generatePayload(target)` must create a static PromptPay payload and omit tag `54`.
- `generatePayload(target, amount)` must create a dynamic PromptPay payload and include tag `54`.
- Amount presence must be determined by `amount !== undefined && amount !== null`, never by truthiness; an omitted amount creates a static QR and an explicit `0` is rejected as invalid.
- Existing PHP payload fixtures for phone numbers, tax IDs, e-wallet IDs, and amounts must remain byte-for-byte compatible.
- The core package must run in browsers without Node.js globals and without a QR-rendering dependency.
- QR rendering must be demonstrated in HTML using the generated payload.
- Inputs must be validated with clear errors instead of silently producing payloads for empty or malformed targets.

## Review Focus

- Omitted amount: the result is static, has POI method `11`, and has no amount tag.
- Amount `0`: an explicit zero amount is rejected consistently rather than being changed by JavaScript truthiness.
- Decimal precision and rounding: formatting is deterministic and tested against the PHP-compatible examples.
- Target normalization: phone punctuation is removed, phone numbers are converted to the 13-digit PromptPay representation, and 13/15-digit identifiers preserve leading zeroes.
- Browser execution: importing the built module and rendering its payload from an HTML page works without `window`/`document` access in the core module.

## File Map

- Create `package.json`: npm metadata, exports, scripts, and build/test dependencies.
- Create `src/constants.js`: PromptPay field identifiers and fixed values.
- Create `src/crc16.js`: CRC-16/CCITT implementation returning uppercase four-character hexadecimal output.
- Create `src/target.js`: target sanitization, validation, type selection, and PromptPay target formatting.
- Create `src/amount.js`: amount validation and deterministic two-decimal formatting.
- Create `src/promptpay.js`: public payload assembly and TLV field serialization.
- Create `src/index.js`: public package exports.
- Create `tests/fixtures.js`: payload and CRC compatibility vectors copied from the PHP tests.
- Create `tests/promptpay.test.js`: payload, target, amount, and validation tests.
- Create `tests/crc16.test.js`: CRC test vectors.
- Create `examples/basic.html`: browser demonstration with target input, optional amount input, and Canvas QR rendering.
- Create `README.md` or replace the existing README: npm installation, browser usage, API, static/dynamic behavior, and migration notes.

### Task 1: Add JavaScript package and test foundation

**Files:**
- Create: `package.json`
- Create: `tests/fixtures.js`

**Interfaces:**
- Produces npm scripts `test`, `test:watch`, `build`, and `check`.
- Produces compatibility fixtures containing the exact expected payloads currently asserted in `tests/PromptPayTest.php`.

- [ ] **Step 1: Define the package contract**

  Set the package to ESM-first with a CommonJS fallback, export `src/index.js` during development and `dist/index.js`/`dist/index.cjs` after build. The standalone repository uses the package name `promptpay-generator-js`.

- [ ] **Step 2: Add test/build tooling**

  Add Vitest for unit tests and tsup for producing browser-compatible ESM and CJS bundles. Keep the core runtime dependency-free; place `qrcode` under example/dev dependencies only.

- [ ] **Step 3: Port the PHP test vectors**

  Copy the expected CRC and payload strings from `tests/PromptPayTest.php` into structured fixture data without changing any digits or checksum values.

- [ ] **Step 4: Verify the empty foundation**

  Run `npm test`. Expected result: the test runner starts successfully, with no application tests yet.

- [ ] **Step 5: Commit**

  ```bash
  git add package.json tests/fixtures.js
  git commit -m "chore: scaffold javascript promptpay package"
  ```

### Task 2: Implement CRC-16/CCITT

**Files:**
- Create: `src/crc16.js`
- Create: `tests/crc16.test.js`

**Interfaces:**
- Produces `crc16(data: string): string`.
- Returns uppercase hexadecimal such as `FE29`, matching the PHP implementation.

- [ ] **Step 1: Write failing CRC tests**

  Test the two existing vectors: the zero-like target input must produce `8956`, and the `0899999999` input must produce `FE29`.

- [ ] **Step 2: Run the focused test**

  Run `npm test -- tests/crc16.test.js`. Expected result: FAIL because `src/crc16.js` does not exist.

- [ ] **Step 3: Implement `crc16(data)`**

  Implement CRC-16/CCITT using the same initial value, polynomial, byte processing, and two-byte hexadecimal output required by the PHP vectors. Use ASCII/UTF-8 byte values; all current payload data is ASCII.

- [ ] **Step 4: Run the focused test**

  Run `npm test -- tests/crc16.test.js`. Expected result: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/crc16.js tests/crc16.test.js
  git commit -m "feat: add promptpay crc16 ccitt implementation"
  ```

### Task 3: Implement target and amount normalization

**Files:**
- Create: `src/constants.js`
- Create: `src/target.js`
- Create: `src/amount.js`
- Create: `tests/promptpay.test.js`

**Interfaces:**
- Produces `sanitizeTarget(target: string): string`.
- Produces `formatTarget(target: string): string`.
- Produces `getTargetType(target: string): '01' | '02' | '03'`.
- Produces `formatAmount(amount: number | string): string`.

- [ ] **Step 1: Write failing target tests**

  Cover `0899999999` and `089-999-9999` mapping to `0066899999999`, a 13-digit tax ID preserving its leading zero, and a 15-digit e-wallet ID preserving all digits. Add rejection tests for non-string, empty, and punctuation-only targets.

- [ ] **Step 2: Write failing amount tests**

  Cover `1337.1337 -> "1337.13"`, `1337.1387 -> "1337.14"`, string input such as `"420" -> "420.00"`, and rejection of `0`, negative, non-finite, and empty values. Accept extra decimal precision and round to exactly two decimal places to preserve the PHP behavior.

- [ ] **Step 3: Run focused tests**

  Run `npm test -- tests/promptpay.test.js`. Expected result: FAIL because normalization modules are not implemented.

- [ ] **Step 4: Implement target normalization**

  Remove non-digits, validate the resulting value, preserve identifiers of 13 digits or more, and convert shorter phone targets using the existing `0` to `66` rule and 13-digit left padding. Select target type by normalized digit length to preserve PHP compatibility.

- [ ] **Step 5: Implement deterministic amount formatting**

  Normalize number/string inputs to exactly two decimal places with documented rounding behavior. Do not use a truthiness check to decide whether an amount was supplied.

- [ ] **Step 6: Run focused tests**

  Run `npm test -- tests/promptpay.test.js`. Expected result: PASS for target and amount normalization tests.

- [ ] **Step 7: Commit**

  ```bash
  git add src/constants.js src/target.js src/amount.js tests/promptpay.test.js
  git commit -m "feat: normalize promptpay targets and amounts"
  ```

### Task 4: Implement payload generation

**Files:**
- Create: `src/promptpay.js`
- Create: `src/index.js`
- Modify: `tests/promptpay.test.js`

**Interfaces:**
- Produces `generatePayload(target: string, amount?: number | string): string`.
- Exports `generatePayload`, `formatTarget`, `formatAmount`, and `crc16` from `src/index.js`.

- [ ] **Step 1: Write failing payload tests**

  Port every existing PHP payload assertion for phone, tax ID, e-wallet ID, static QR, and dynamic QR. Add explicit tests that `generatePayload(target)` omits `54` and uses POI method `11`, while `generatePayload(target, amount)` includes `54` and uses POI method `12`.

- [ ] **Step 2: Add omitted-amount and zero-amount regression tests**

  Assert that an omitted amount and `undefined` produce the same static payload. Assert that an explicit `0` throws a validation error so future refactors cannot reintroduce the PHP/JavaScript truthiness bug.

- [ ] **Step 3: Run the focused tests**

  Run `npm test -- tests/promptpay.test.js`. Expected result: FAIL because `generatePayload` is not implemented.

- [ ] **Step 4: Implement TLV serialization and payload assembly**

  Build fields in the existing order: payload format, POI method, merchant account information, country, currency, optional amount, then CRC placeholder. Serialize field lengths as two decimal digits, calculate CRC over the payload ending in `6304`, and append the CRC field.

- [ ] **Step 5: Run all unit tests**

  Run `npm test`. Expected result: PASS for all PHP compatibility and new regression tests.

- [ ] **Step 6: Commit**

  ```bash
  git add src/promptpay.js src/index.js tests/promptpay.test.js
  git commit -m "feat: generate promptpay payloads in javascript"
  ```

### Task 5: Add browser QR example

**Files:**
- Create: `examples/basic.html`
- Modify: `package.json`

**Interfaces:**
- Consumes `generatePayload(target, amount?)`.
- Produces a browser example with target input, optional amount input, generated payload text, and QR Canvas output.

- [ ] **Step 1: Define the browser behavior**

  The amount field is optional. An empty amount input calls `generatePayload(target)`; a filled amount calls `generatePayload(target, amount)`. The page must display whether the QR is static or dynamic and show validation errors in the page.

- [ ] **Step 2: Add the example dependency and command**

  Add `qrcode` for Canvas rendering and add a `dev:example` command using a small Vite setup or equivalent local static server that supports module imports.

- [ ] **Step 3: Implement the HTML example**

  Import the built/source package, call `QRCode.toCanvas(canvas, payload)`, and avoid putting browser-specific code into the core package.

- [ ] **Step 4: Verify manually**

  Run `npm run dev:example`, open the page, generate a QR with no amount, then generate one with `420`. Confirm the first payload has no tag `54`, the second contains `5406420.00`, and both render visibly to Canvas.

- [ ] **Step 5: Commit**

  ```bash
  git add examples/basic.html package.json
  git commit -m "docs: add browser promptpay qr example"
  ```

### Task 6: Build, documentation, and package verification

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Create: `.gitignore` if needed

**Interfaces:**
- Produces documented npm and browser usage.
- Produces distributable `dist/index.js` and `dist/index.cjs` bundles.

- [ ] **Step 1: Document the public API**

  Explain installation, `generatePayload(target)`, `generatePayload(target, amount)`, omitted amounts, static versus dynamic QR behavior, browser Canvas rendering, supported target formats, validation errors, and the fact that QR rendering is supplied by `qrcode` in the example.

- [ ] **Step 2: Add build metadata**

  Configure package `main`, `module`, `exports`, `files`, `sideEffects`, and the `build` script. Ensure test files and examples are not accidentally published as runtime files unless intentionally included.

- [ ] **Step 3: Run final verification**

  Run:

  ```bash
  npm test
  npm run build
  npm pack --dry-run
  ```

  Expected result: all tests pass, both bundles build, and the dry-run package contains the intended runtime files and README.

- [ ] **Step 4: Perform compatibility review**

  Compare all generated payloads against the original PHP fixture list and verify that the static path is the default when the amount is omitted.

- [ ] **Step 5: Commit**

  ```bash
  git add README.md package.json .gitignore
  git commit -m "docs: document javascript promptpay library"
  ```

## Checkpoints

### After Tasks 1–4

- [ ] All compatibility and regression tests pass.
- [ ] `generatePayload(target)` works without an amount.
- [ ] The core package has no browser globals or QR-rendering dependency.

### After Task 5

- [ ] An HTML page renders both static and dynamic PromptPay QR codes.
- [ ] Empty amount input does not add field `54`.

### Completion

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm pack --dry-run` contains the intended package files.
- [ ] README documents the browser integration and optional amount behavior.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| JavaScript floating-point rounding differs from PHP | Incorrect amount or CRC | Test decimal fixtures and normalize amounts deterministically; recommend decimal strings for financial values. |
| Truthiness treats `0` as omitted | Wrong POI method or inconsistent payload | Use explicit nullish presence checks and regression tests. |
| Browser bundling accidentally introduces Node APIs | Library fails in HTML | Keep core modules dependency-free and run the browser example against the built bundle. |
| PromptPay target classification is heuristic | Wrong merchant account type | Preserve current compatibility behavior, document the length rules, and add validation. |
| External QR decoding tests are flaky | False test failures | Test payloads locally and keep browser rendering as a manual/integration check. |

## Open Questions

- None for implementation. Omitted amounts are static, explicit zero amounts are invalid, and the standalone package name is `promptpay-generator-js`.
