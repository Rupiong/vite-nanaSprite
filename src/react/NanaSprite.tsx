import type { CSSProperties, HTMLAttributes } from 'react';
import { createElement, forwardRef } from 'react';

export type NanaSpriteProps = HTMLAttributes<HTMLElement> & {
  /** Frame id from Vite sprite config */
  name: string;
  /** Matches `key` on the sprite sheet; omit to use the first sheet. Use `sheetKey`, not React's `key`. */
  sheetKey?: string;
  /** CSS length, e.g. `100%` / `80px`; omit to use frame dimensions from the sprite config */
  width?: string;
  height?: string;
  /** Passed to the host as `class` (custom element). */
  className?: string;
  style?: CSSProperties;
};

/**
 * Thin wrapper over the `nana-sprite` custom element. Call `defineNanaSprite` (via `vite-nana-sprite/register`) first.
 */
export const NanaSprite = forwardRef<HTMLElement, NanaSpriteProps>(function NanaSprite(
  { name, sheetKey, width, height, className, style, ...rest },
  ref,
) {
  return createElement('nana-sprite', {
    ...rest,
    ref,
    class: className,
    style,
    name,
    ...(sheetKey != null ? { 'sheet-key': sheetKey } : {}),
    ...(width != null ? { width } : {}),
    ...(height != null ? { height } : {}),
  });
});
