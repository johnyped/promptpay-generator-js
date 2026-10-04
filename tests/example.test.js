import { describe, expect, it, vi } from 'vitest';

import { DEMO_CASES, INVALID_DEMO_CASES, mountPromptPayExample } from '../examples/basic.js';
import { formatAmount, generatePayload } from '../src/index.js';

function createElement(value = '') {
  return {
    dataset: {},
    hidden: false,
    textContent: '',
    value,
    addEventListener: vi.fn(),
  };
}

function createPage({ withDemoButtons = false } = {}) {
  const elements = {
    form: createElement(),
    target: createElement('089-999-9999'),
    amount: createElement(''),
    canvas: createElement(),
    payload: createElement(),
    mode: createElement(),
    status: createElement(),
  };
  const demoButtons = withDemoButtons
    ? [
        ...DEMO_CASES.map((_example, index) => ({ ...createElement(), dataset: { demoKind: 'valid', demoIndex: String(index) } })),
        ...INVALID_DEMO_CASES.map((_example, index) => ({ ...createElement(), dataset: { demoKind: 'invalid', demoIndex: String(index) } })),
      ]
    : [];

  return {
    elements,
    demoButtons,
    document: {
      getElementById(id) {
        return elements[id];
      },
      querySelectorAll() {
        return demoButtons;
      },
    },
  };
}

function mount(page, QRCode) {
  return mountPromptPayExample({
    document: page.document,
    QRCode,
    formatAmount,
    generatePayload,
  });
}

describe('browser example', () => {
  it('hides a previously rendered QR when a later input is invalid', async () => {
    const page = createPage();
    const QRCode = { toCanvas: vi.fn().mockResolvedValue(undefined) };
    const example = mount(page, QRCode);

    await example.render();
    expect(page.elements.canvas.hidden).toBe(false);
    expect(QRCode.toCanvas).toHaveBeenCalledOnce();

    page.elements.amount.value = '+0';
    await example.render();

    expect(page.elements.canvas.hidden).toBe(true);
    expect(page.elements.mode.textContent).toBe('Invalid input');
    expect(page.elements.status.dataset.error).toBe('true');
    expect(QRCode.toCanvas).toHaveBeenCalledOnce();
  });

  it('renders static and dynamic payloads through the Canvas renderer', async () => {
    const page = createPage();
    const QRCode = { toCanvas: vi.fn().mockResolvedValue(undefined) };
    const example = mount(page, QRCode);

    await example.render();
    expect(page.elements.payload.textContent).not.toContain('5406');
    expect(page.elements.mode.textContent).toBe('Static QR');

    page.elements.amount.value = '420';
    await example.render();
    expect(page.elements.payload.textContent).toContain('5406420.00');
    expect(page.elements.mode.textContent).toBe('Dynamic QR · 420.00 THB');
    expect(page.elements.canvas.hidden).toBe(false);
  });

  it.each(DEMO_CASES)('runs the $label use case', async ({ target, amount, mode, amountField }) => {
    const page = createPage();
    const QRCode = { toCanvas: vi.fn().mockResolvedValue(undefined) };
    const example = mount(page, QRCode);

    await example.selectExample({ target, amount });

    expect(page.elements.target.value).toBe(target);
    expect(page.elements.amount.value).toBe(amount ?? '');
    expect(page.elements.mode.dataset.mode).toBe(mode);
    expect(page.elements.canvas.hidden).toBe(false);
    if (amountField) {
      expect(page.elements.payload.textContent).toContain(amountField);
    } else {
      expect(page.elements.payload.textContent).not.toContain('540');
    }
  });

  it.each(INVALID_DEMO_CASES)('shows the $label validation use case', async ({ target, amount }) => {
    const page = createPage();
    const QRCode = { toCanvas: vi.fn().mockResolvedValue(undefined) };
    const example = mount(page, QRCode);

    await example.selectExample({ target, amount });

    expect(page.elements.mode.textContent).toBe('Invalid input');
    expect(page.elements.status.dataset.error).toBe('true');
    expect(page.elements.canvas.hidden).toBe(true);
    expect(QRCode.toCanvas).not.toHaveBeenCalled();
  });

  it('connects every demo button to its valid or invalid use case', async () => {
    const page = createPage({ withDemoButtons: true });
    const QRCode = { toCanvas: vi.fn().mockResolvedValue(undefined) };
    mount(page, QRCode);

    for (const [index, button] of page.demoButtons.entries()) {
      const clickHandler = button.addEventListener.mock.calls.find(([eventName]) => eventName === 'click')?.[1];
      expect(clickHandler).toBeTypeOf('function');
      await clickHandler();

      const expected = index < DEMO_CASES.length ? DEMO_CASES[index] : INVALID_DEMO_CASES[index - DEMO_CASES.length];
      expect(page.elements.target.value).toBe(expected.target);
      expect(page.elements.amount.value).toBe(expected.amount ?? '');
    }
  });
});
