import type { CSSProperties, HTMLAttributes, MutableRefObject } from 'react';
import { createElement, forwardRef, useLayoutEffect, useRef } from 'react';
import manifest from 'virtual:nana-sprite:manifest';
import { bindNanaSpriteHost } from '../runtime/host-sync';

export type NanaSpriteProps = HTMLAttributes<HTMLDivElement> & {
  /** Frame id from Vite sprite config */
  name: string;
  /** Matches `key` on the sprite sheet; omit to use the first sheet. Use `sheetKey`, not React's `key`. */
  sheetKey?: string;
  /** CSS length, e.g. `100%` / `80px`; omit to use frame dimensions from the sprite config */
  width?: string;
  height?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Renders a `div` with background + clip-path from the Vite-generated manifest.
 * Requires `nanaSprite()` in `vite.config` and resolves `virtual:nana-sprite:manifest` at build time.
 */
export const NanaSprite = forwardRef<HTMLDivElement, NanaSpriteProps>(function NanaSprite(
  { name, sheetKey, width, height, className, style, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const binding = bindNanaSpriteHost(el, manifest, () => ({
      name,
      sheetKey,
      width,
      height,
    }));
    return () => binding.disconnect();
  }, [name, sheetKey, width, height]);

  return createElement('div', {
    ...rest,
    ref: (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as MutableRefObject<HTMLDivElement | null>).current = node;
    },
    className,
    style,
  });
});
