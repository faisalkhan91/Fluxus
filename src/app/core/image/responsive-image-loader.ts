import { IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import type { Provider } from '@angular/core';
import { IMAGE_VARIANTS } from './image-variants.generated';

/**
 * NgOptimizedImage loader that rewrites srcset entries to pre-generated WebP
 * width variants (see scripts/build-image-variants.mjs).
 *
 * Angular calls this once per breakpoint when building the `srcset` (and once
 * with no width for the `src` fallback). For an image with variants we return
 * the smallest variant whose width covers the requested breakpoint; if the
 * request is larger than every variant — or the image has no variants at all
 * (avatars, icons, badges, animated WebP) — we return the original `src`
 * untouched, so nothing ever points at a file that wasn't generated.
 */
export function responsiveImageLoader(config: ImageLoaderConfig): string {
  const { src, width } = config;
  const widths = IMAGE_VARIANTS[src];
  if (!widths || !width) return src;

  const pick = widths.find((w) => w >= width);
  if (pick === undefined) return src; // requested larger than any variant

  const dot = src.lastIndexOf('.');
  return `${src.slice(0, dot)}-${pick}w${src.slice(dot)}`;
}

export function provideResponsiveImageLoader(): Provider {
  return { provide: IMAGE_LOADER, useValue: responsiveImageLoader };
}
