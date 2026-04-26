import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './clipboard.utils';

describe('copyToClipboard', () => {
  let originalClipboard: PropertyDescriptor | undefined;
  let originalExecCommand: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    /*
      jsdom omits `document.execCommand` entirely (deprecated API), so a
      bare `vi.spyOn(document, 'execCommand', …)` throws "property is not
      defined". Install a no-op default before each test so spies have a
      concrete property to wrap; the afterEach restores whatever jsdom had
      to keep test isolation honest.
    */
    originalExecCommand = Object.getOwnPropertyDescriptor(document, 'execCommand');
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      writable: true,
      value: () => false,
    });
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      // jsdom may have started without one — restore by deleting our stub.
      delete (navigator as unknown as { clipboard?: unknown }).clipboard;
    }
    if (originalExecCommand) {
      Object.defineProperty(document, 'execCommand', originalExecCommand);
    } else {
      delete (document as unknown as { execCommand?: unknown }).execCommand;
    }
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const exec = vi.spyOn(document, 'execCommand').mockImplementation(() => true);

    const ok = await copyToClipboard('payload');
    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');

    exec.mockRestore();
  });

  it('returns false when both paths fail', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    const exec = vi.spyOn(document, 'execCommand').mockImplementation(() => false);

    const ok = await copyToClipboard('nope');
    expect(ok).toBe(false);

    exec.mockRestore();
  });
});
