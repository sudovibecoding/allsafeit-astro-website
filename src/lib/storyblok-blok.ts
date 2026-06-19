import type { SbBlokData } from '@storyblok/astro';

/** Map nested Storyblok bloks to plain objects by field name. */
export function mapBlokFields<T extends Record<string, unknown>>(
  bloks: SbBlokData[] | undefined,
): T[] {
  return (bloks ?? []) as T[];
}
