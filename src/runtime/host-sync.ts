import type { NanaSpriteManifest, SpriteSheetManifest } from '../types';
import { backgroundFromLayout, computeObjectFitLayout } from './object-fit';

const SPRITE_LAYER_CLASS = 'nana-sprite__layer';

function removeSpriteLayers(el: HTMLElement): void {
  el.querySelectorAll(`:scope > .${SPRITE_LAYER_CLASS}`).forEach((n) => n.remove());
}

function getOrCreateSpriteLayer(el: HTMLElement): HTMLElement {
  for (const child of el.children) {
    if (child instanceof HTMLElement && child.classList.contains(SPRITE_LAYER_CLASS)) return child;
  }
  const layer = document.createElement('div');
  layer.className = SPRITE_LAYER_CLASS;
  layer.setAttribute('aria-hidden', 'true');
  el.appendChild(layer);
  return layer;
}

function resolveSheet(m: NanaSpriteManifest, sheetKey: string | null | undefined): SpriteSheetManifest | undefined {
  if (sheetKey == null || sheetKey === '') {
    return m.sheets[0];
  }
  return m.sheets.find((s) => s.key === sheetKey);
}

function parseCssSize(attr: string | null | undefined): string | null {
  if (attr == null || attr.trim() === '') return null;
  const v = attr.trim();
  if (/^-?\d+(\.\d+)?$/.test(v)) return `${v}px`;
  return v;
}

export type NanaSpriteHostProps = {
  name: string;
  sheetKey?: string;
  width?: string;
  height?: string;
};

/**
 * 将雪碧帧同步到普通宿主元素（`display: block` 的 div），逻辑与原 Web Component 一致。
 */
export function syncNanaSpriteHost(
  el: HTMLElement,
  manifest: NanaSpriteManifest,
  props: NanaSpriteHostProps,
): void {
  const name = props.name;
  const sheet = resolveSheet(manifest, props.sheetKey ?? null);
  const frame = name && sheet ? sheet.frames[name] : undefined;

  if (!sheet || !frame) {
    removeSpriteLayers(el);
    el.style.backgroundImage = '';
    el.style.backgroundRepeat = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.clipPath = '';
    return;
  }

  const iw = frame.width;
  const ih = frame.height;
  const hasW = props.width !== undefined && props.width !== null;
  const hasH = props.height !== undefined && props.height !== null;
  const wParsed = parseCssSize(props.width ?? null);
  const hParsed = parseCssSize(props.height ?? null);

  if (!hasW && !hasH) {
    el.style.width = `${iw}px`;
    el.style.height = `${ih}px`;
    el.style.aspectRatio = '';
  } else if (hasW && !hasH) {
    el.style.width = wParsed ?? '';
    el.style.height = 'auto';
    el.style.aspectRatio = `${iw} / ${ih}`;
  } else if (!hasW && hasH) {
    el.style.width = 'auto';
    el.style.height = hParsed ?? '';
    el.style.aspectRatio = `${iw} / ${ih}`;
  } else {
    el.style.width = wParsed ?? '';
    el.style.height = hParsed ?? '';
    el.style.aspectRatio = '';
  }

  const defaultFrameSize = !hasW && !hasH;
  const W = defaultFrameSize ? iw : el.clientWidth;
  const H = defaultFrameSize ? ih : el.clientHeight;
  if (!(W > 0 && H > 0)) {
    el.style.clipPath = '';
    const layer = el.querySelector(`:scope > .${SPRITE_LAYER_CLASS}`);
    if (layer instanceof HTMLElement) layer.style.display = 'none';
    return;
  }

  const fitMode = hasW && hasH ? 'fill' : 'contain';
  const layout = computeObjectFitLayout(iw, ih, W, H, fitMode);
  const { sizeW, sizeH, shiftX, shiftY } = backgroundFromLayout(
    layout,
    sheet.imageWidth,
    sheet.imageHeight,
    frame.positionX,
    frame.positionY,
    frame.width,
    frame.height,
  );

  const { drawW, drawH, offsetX, offsetY } = layout;

  if (getComputedStyle(el).position === 'static') {
    el.style.position = 'relative';
  }

  el.style.backgroundImage = '';
  el.style.backgroundRepeat = '';
  el.style.backgroundSize = '';
  el.style.backgroundPosition = '';
  el.style.clipPath = '';

  const layer = getOrCreateSpriteLayer(el);
  layer.style.display = 'block';
  layer.style.position = 'absolute';
  layer.style.left = `${offsetX}px`;
  layer.style.top = `${offsetY}px`;
  layer.style.width = `${drawW}px`;
  layer.style.height = `${drawH}px`;
  layer.style.overflow = 'hidden';
  layer.style.boxSizing = 'border-box';
  layer.style.margin = '0';
  layer.style.padding = '0';
  layer.style.border = 'none';
  layer.style.direction = 'ltr';
  layer.style.backgroundImage = `url(${JSON.stringify(sheet.url)})`;
  layer.style.backgroundRepeat = 'no-repeat';
  layer.style.backgroundSize = `${sizeW}px ${sizeH}px`;
  layer.style.backgroundPosition = `${shiftX}px ${shiftY}px`;
}

export type NanaSpriteHostBinding = {
  disconnect: () => void;
};

/**
 * 挂载 ResizeObserver，在尺寸与 props 变化时由调用方重新 `bind` 或在上层 effect 中再次调用本函数。
 */
export function bindNanaSpriteHost(
  el: HTMLElement,
  manifest: NanaSpriteManifest,
  getProps: () => NanaSpriteHostProps,
): NanaSpriteHostBinding {
  if (!el.style.display) {
    el.style.display = 'block';
  }
  const ro = new ResizeObserver(() => {
    syncNanaSpriteHost(el, manifest, getProps());
  });
  ro.observe(el);
  syncNanaSpriteHost(el, manifest, getProps());
  // 首帧常见 clientWidth/clientHeight 为 0（尚未完成布局）；双 rAF 再同步一次，避免一直等到 ResizeObserver
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncNanaSpriteHost(el, manifest, getProps());
    });
  });
  return {
    disconnect: () => {
      ro.disconnect();
    },
  };
}
