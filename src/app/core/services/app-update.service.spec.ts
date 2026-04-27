import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';

import { APP_VERSION } from './app-version.generated';
import { AppUpdateService } from './app-update.service';

@Component({ template: '' })
class HomeComponent {}
@Component({ template: '' })
class AboutComponent {}

interface MockSwUpdate {
  isEnabled: boolean;
  versionUpdates: Subject<{ type: string }>;
  unrecoverable: Subject<{ type: 'UNRECOVERABLE_STATE'; reason: string }>;
  checkForUpdate: ReturnType<typeof vi.fn>;
  activateUpdate: ReturnType<typeof vi.fn>;
}

function createMockSw(enabled: boolean): MockSwUpdate {
  return {
    isEnabled: enabled,
    versionUpdates: new Subject(),
    unrecoverable: new Subject(),
    checkForUpdate: vi.fn().mockResolvedValue(true),
    activateUpdate: vi.fn().mockResolvedValue(true),
  };
}

interface SetupOpts {
  swEnabled?: boolean;
  scrollY?: number;
  fetchResponse?: { ok: boolean; json: () => Promise<unknown> } | Error;
}

/**
 * Overrides the (private) `reload` method on the instance. Vitest can't
 * spy on `window.location.reload` directly under jsdom — the property's
 * descriptor is non-configurable across `vi.restoreAllMocks` resets, so a
 * second test in the same file blows up with "Cannot redefine property:
 * reload". Stubbing the service's own `reload` keeps the spy isolated to
 * each `TestBed` instance and never touches the global Location object.
 */
function stubReload(service: AppUpdateService): ReturnType<typeof vi.fn> {
  const reload = vi.fn();
  (service as unknown as { reload: () => void }).reload = reload;
  return reload;
}

async function setup(opts: SetupOpts = {}) {
  const sw = createMockSw(opts.swEnabled ?? true);
  const cachesDelete = vi.fn().mockResolvedValue(true);
  const cachesKeys = vi.fn().mockResolvedValue(['ngsw:db:control', 'ngsw:1:assets']);

  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => opts.scrollY ?? 0,
  });

  Object.defineProperty(window, 'caches', {
    configurable: true,
    value: {
      keys: cachesKeys,
      delete: cachesDelete,
    },
  });

  const fetchMock = vi.fn().mockImplementation(() => {
    if (opts.fetchResponse instanceof Error) return Promise.reject(opts.fetchResponse);
    return Promise.resolve(opts.fetchResponse ?? { ok: true, json: () => Promise.resolve({}) });
  });
  vi.stubGlobal('fetch', fetchMock);

  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: SwUpdate, useValue: sw },
      provideRouter([
        { path: '', component: HomeComponent },
        { path: 'about', component: AboutComponent },
      ]),
    ],
  });

  const service = TestBed.inject(AppUpdateService);
  const router = TestBed.inject(Router);
  const reload = stubReload(service);

  return { service, sw, router, reload, fetchMock, cachesDelete, cachesKeys };
}

/**
 * Lets every awaited microtask in the service settle. The version-stamp
 * baseline kicks off `fetch().then(json()).then(...)` inside `init()`, so
 * a single `await Promise.resolve()` isn't enough to drain the chain.
 */
async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

describe('AppUpdateService', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('SSR (non-browser platform)', () => {
    it('init() is a no-op', () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: SwUpdate, useValue: createMockSw(true) },
          provideRouter([{ path: '', component: HomeComponent }]),
        ],
      });
      const service = TestBed.inject(AppUpdateService);
      service.init();

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('SwUpdate version path', () => {
    it('reloads immediately when VERSION_READY fires while idle (scrollY === 0)', async () => {
      const { service, sw, reload } = await setup({ scrollY: 0 });
      service.init();
      await flushMicrotasks();

      sw.versionUpdates.next({ type: 'VERSION_READY' });
      await flushMicrotasks();

      expect(sw.activateUpdate).toHaveBeenCalledOnce();
      expect(reload).toHaveBeenCalledOnce();
    });

    it('defers reload on VERSION_READY while user is mid-scroll, then reloads on NavigationEnd', async () => {
      const { service, sw, reload, router } = await setup({ scrollY: 500 });
      service.init();
      await flushMicrotasks();

      sw.versionUpdates.next({ type: 'VERSION_READY' });
      await flushMicrotasks();
      expect(reload).not.toHaveBeenCalled();

      await router.navigate(['/about']);
      expect(reload).toHaveBeenCalledOnce();
    });

    it('ignores non-VERSION_READY events (e.g. VERSION_DETECTED)', async () => {
      const { service, sw, reload } = await setup({ scrollY: 0 });
      service.init();
      await flushMicrotasks();

      sw.versionUpdates.next({ type: 'VERSION_DETECTED' });
      sw.versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED' });
      await flushMicrotasks();

      expect(sw.activateUpdate).not.toHaveBeenCalled();
      expect(reload).not.toHaveBeenCalled();
    });

    it('still reloads if activateUpdate() rejects (best-effort)', async () => {
      const { service, sw, reload } = await setup({ scrollY: 0 });
      sw.activateUpdate.mockRejectedValueOnce(new Error('SW race'));
      service.init();
      await flushMicrotasks();

      sw.versionUpdates.next({ type: 'VERSION_READY' });
      await flushMicrotasks();

      expect(reload).toHaveBeenCalledOnce();
    });

    it('does not subscribe to versionUpdates when SwUpdate.isEnabled is false', async () => {
      const { service, sw } = await setup({ swEnabled: false });
      const subscribeSpy = vi.spyOn(sw.versionUpdates, 'subscribe');
      service.init();
      await flushMicrotasks();

      expect(subscribeSpy).not.toHaveBeenCalled();
    });
  });

  describe('unrecoverable handler', () => {
    it('clears every Cache Storage bucket and reloads', async () => {
      const { service, sw, reload, cachesKeys, cachesDelete } = await setup({ scrollY: 0 });
      service.init();
      await flushMicrotasks();

      sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'Hash mismatch' });
      await flushMicrotasks();

      expect(cachesKeys).toHaveBeenCalledOnce();
      expect(cachesDelete).toHaveBeenCalledTimes(2);
      expect(reload).toHaveBeenCalledOnce();
    });
  });

  describe('version-stamp poll path', () => {
    it('does nothing when /version.json id matches the bundled APP_VERSION', async () => {
      const { service, reload, fetchMock } = await setup({
        scrollY: 0,
        fetchResponse: { ok: true, json: () => Promise.resolve({ id: APP_VERSION }) },
      });
      service.init();
      await flushMicrotasks();

      expect(fetchMock).toHaveBeenCalledWith('/version.json', { cache: 'no-store' });
      expect(reload).not.toHaveBeenCalled();
    });

    it('reloads when /version.json reports a different id (idle path)', async () => {
      const { service, sw, reload } = await setup({
        scrollY: 0,
        fetchResponse: { ok: true, json: () => Promise.resolve({ id: 'something-newer' }) },
      });
      service.init();
      await flushMicrotasks();

      expect(sw.checkForUpdate).toHaveBeenCalledOnce();
      expect(sw.activateUpdate).toHaveBeenCalledOnce();
      expect(reload).toHaveBeenCalledOnce();
    });

    it('still reloads on stamp drift even when the SW is disabled', async () => {
      const { service, sw, reload } = await setup({
        swEnabled: false,
        scrollY: 0,
        fetchResponse: { ok: true, json: () => Promise.resolve({ id: 'something-newer' }) },
      });
      service.init();
      await flushMicrotasks();

      expect(sw.checkForUpdate).not.toHaveBeenCalled();
      expect(sw.activateUpdate).not.toHaveBeenCalled();
      expect(reload).toHaveBeenCalledOnce();
    });

    it('swallows network failures and does not reload', async () => {
      const { service, reload } = await setup({
        scrollY: 0,
        fetchResponse: new Error('offline'),
      });
      service.init();
      await flushMicrotasks();

      expect(reload).not.toHaveBeenCalled();
    });

    it('swallows non-OK responses (e.g. 404 during a partial deploy)', async () => {
      const { service, reload } = await setup({
        scrollY: 0,
        fetchResponse: { ok: false, json: () => Promise.resolve({}) },
      });
      service.init();
      await flushMicrotasks();

      expect(reload).not.toHaveBeenCalled();
    });

    it('swallows responses missing or with a non-string id', async () => {
      const { service, reload } = await setup({
        scrollY: 0,
        fetchResponse: { ok: true, json: () => Promise.resolve({ id: 42 }) },
      });
      service.init();
      await flushMicrotasks();

      expect(reload).not.toHaveBeenCalled();
    });

    it('schedules a 5-minute interval poll', async () => {
      vi.useFakeTimers();
      const { service, fetchMock } = await setup({
        scrollY: 0,
        fetchResponse: { ok: true, json: () => Promise.resolve({ id: APP_VERSION }) },
      });
      service.init();
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(5 * 60_000);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('visibilitychange', () => {
    function fireVisibility(state: DocumentVisibilityState): void {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }

    it('reloads on visible when an update is already pending', async () => {
      const { service, sw, reload } = await setup({ scrollY: 500 });
      service.init();
      await flushMicrotasks();

      sw.versionUpdates.next({ type: 'VERSION_READY' });
      await flushMicrotasks();
      expect(reload).not.toHaveBeenCalled();

      fireVisibility('visible');
      expect(reload).toHaveBeenCalledOnce();
    });

    it('rechecks the version stamp on visible when no update is pending', async () => {
      const { service, fetchMock } = await setup({
        scrollY: 500,
        fetchResponse: { ok: true, json: () => Promise.resolve({ id: APP_VERSION }) },
      });
      service.init();
      await flushMicrotasks();

      fetchMock.mockClear();
      fireVisibility('visible');
      await flushMicrotasks();

      expect(fetchMock).toHaveBeenCalledWith('/version.json', { cache: 'no-store' });
    });

    it('does nothing on visibilitychange to hidden', async () => {
      const { service, fetchMock, reload } = await setup({
        scrollY: 500,
        fetchResponse: { ok: true, json: () => Promise.resolve({ id: APP_VERSION }) },
      });
      service.init();
      await flushMicrotasks();
      fetchMock.mockClear();

      fireVisibility('hidden');
      await flushMicrotasks();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(reload).not.toHaveBeenCalled();
    });
  });
});
