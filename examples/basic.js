import QRCodeDefault from 'qrcode';
import { formatAmount as formatAmountDefault, generatePayload as generatePayloadDefault } from '../src/index.js';

export const DEMO_CASES = [
  { label: 'Phone · static', target: '089-999-9999', amount: '', mode: 'static', amountField: null },
  { label: 'Phone · dynamic', target: '089-999-9999', amount: '420', mode: 'dynamic', amountField: '5406420.00' },
  { label: 'Tax ID · static', target: '0123456789012', amount: '', mode: 'static', amountField: null },
  { label: 'Tax ID · dynamic', target: '1234567890123', amount: '420', mode: 'dynamic', amountField: '5406420.00' },
  { label: 'E-wallet · static', target: '004999000288505', amount: '', mode: 'static', amountField: null },
  { label: 'E-wallet · dynamic', target: '004999000288505', amount: '100.25', mode: 'dynamic', amountField: '5406100.25' },
];

export const INVALID_DEMO_CASES = [
  { label: 'Empty target', target: '', amount: '' },
  { label: 'Malformed target', target: '089-999', amount: '' },
  { label: 'Zero amount', target: '089-999-9999', amount: '0' },
  { label: 'Negative amount', target: '089-999-9999', amount: '-1' },
  { label: 'Invalid decimal', target: '089-999-9999', amount: '1,337.75' },
];

export function mountPromptPayExample({
  document = globalThis.document,
  QRCode = QRCodeDefault,
  formatAmount = formatAmountDefault,
  generatePayload = generatePayloadDefault,
} = {}) {
  const form = document.getElementById('form');
  const targetInput = document.getElementById('target');
  const amountInput = document.getElementById('amount');
  const canvas = document.getElementById('canvas');
  const payloadOut = document.getElementById('payload');
  const modeOut = document.getElementById('mode');
  const statusOut = document.getElementById('status');
  let renderVersion = 0;

  function setStatus(message, isError) {
    statusOut.textContent = message;
    statusOut.dataset.error = String(Boolean(isError));
  }

  async function render() {
    const currentVersion = ++renderVersion;
    const amount = amountInput.value.trim();
    canvas.hidden = true;

    let payload;
    try {
      // An empty amount must call the one-argument form: no tag 54 at all.
      payload = amount === '' ? generatePayload(targetInput.value) : generatePayload(targetInput.value, amount);
    } catch (error) {
      modeOut.dataset.mode = 'error';
      modeOut.textContent = 'Invalid input';
      payloadOut.textContent = '—';
      setStatus(`${error.name}: ${error.message}`, true);
      return;
    }

    const isDynamic = amount !== '';
    modeOut.dataset.mode = isDynamic ? 'dynamic' : 'static';
    modeOut.textContent = isDynamic ? `Dynamic QR · ${formatAmount(amount)} THB` : 'Static QR';
    payloadOut.textContent = payload;
    setStatus(
      isDynamic
        ? 'Field 54 is present, so the payer must confirm this amount.'
        : 'Field 54 is omitted, so the payer chooses the amount.',
      false,
    );

    try {
      await QRCode.toCanvas(canvas, payload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 220,
        color: { dark: '#12213a', light: '#ffffff' },
      });
      if (currentVersion === renderVersion) {
        canvas.hidden = false;
      }
    } catch (error) {
      if (currentVersion === renderVersion) {
        modeOut.dataset.mode = 'error';
        modeOut.textContent = 'Rendering failed';
        setStatus(`${error.name}: ${error.message}`, true);
      }
    }
  }

  form.addEventListener('input', () => {
    void render();
  });

  async function selectExample({ target, amount }) {
    targetInput.value = target;
    amountInput.value = amount ?? '';
    await render();
  }

  for (const button of document.querySelectorAll('[data-demo-kind]')) {
    button.addEventListener('click', () => {
      const examples = button.dataset.demoKind === 'invalid' ? INVALID_DEMO_CASES : DEMO_CASES;
      void selectExample(examples[Number(button.dataset.demoIndex)]);
    });
  }

  return { render, selectExample };
}
