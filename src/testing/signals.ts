import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/**
 * Flushes pending effects and waits for the application to settle. Wraps the
 * common `TestBed.tick()` + `ApplicationRef.whenStable()` pattern used by every
 * spec that drives an httpResource or a signal-backed effect.
 */
export async function waitForEffects(): Promise<void> {
  TestBed.tick();
  await TestBed.inject(ApplicationRef).whenStable();
}
