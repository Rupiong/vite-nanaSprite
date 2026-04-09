import type { NanaSpriteManifest, SpriteSheetManifest } from '../types';
import { backgroundFromLayout, computeObjectFitLayout } from './object-fit';

let manifest: NanaSpriteManifest | null = null;

function getManifest(): NanaSpriteManifest {
  if (!manifest) {
    throw new Error(
      '[nana-sprite] Manifest not loaded. Import `vite-nana-sprite/register` after adding the Vite plugin.',
    );
  }
  return manifest;
}

function resolveSheet(m: NanaSpriteManifest, sheetKeyAttr: string | null): SpriteSheetManifest | undefined {
  if (sheetKeyAttr == null || sheetKeyAttr === '') {
    return m.sheets[0];
  }
  return m.sheets.find((s) => s.key === sheetKeyAttr);
}

function parseCssSize(attr: string | null): string | null {
  if (attr == null || attr.trim() === '') return null;
  const v = attr.trim();
  if (/^-?\d+(\.\d+)?$/.test(v)) return `${v}px`;
  return v;
}

export class NanaSpriteElement extends HTMLElement {
  static observedAttributes = ['name', 'sheet-key', 'width', 'height'];

  #resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    if (!this.style.display) {
      this.style.display = 'block';
    }
    this.#resizeObserver = new ResizeObserver(() => this.#render());
    this.#resizeObserver.observe(this);
    this.#render();
  }

  disconnectedCallback(): void {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #render(): void {
    const name = this.getAttribute('name');
    const sheetKeyAttr = this.getAttribute('sheet-key');

    const m = getManifest();
    const sheet = resolveSheet(m, sheetKeyAttr);
    const frame = name && sheet ? sheet.frames[name] : undefined;

    if (!sheet || !frame) {
      this.style.backgroundImage = '';
      this.style.backgroundRepeat = '';
      this.style.backgroundSize = '';
      this.style.backgroundPosition = '';
      this.style.clipPath = '';
      return;
    }

    const iw = frame.width;
    const ih = frame.height;
    const hasW = this.hasAttribute('width');
    const hasH = this.hasAttribute('height');
    const wParsed = parseCssSize(this.getAttribute('width'));
    const hParsed = parseCssSize(this.getAttribute('height'));

    if (!hasW && !hasH) {
      this.style.width = `${iw}px`;
      this.style.height = `${ih}px`;
      this.style.aspectRatio = '';
    } else if (hasW && !hasH) {
      this.style.width = wParsed ?? '';
      this.style.height = 'auto';
      this.style.aspectRatio = `${iw} / ${ih}`;
    } else if (!hasW && hasH) {
      this.style.width = 'auto';
      this.style.height = hParsed ?? '';
      this.style.aspectRatio = `${iw} / ${ih}`;
    } else {
      this.style.width = wParsed ?? '';
      this.style.height = hParsed ?? '';
      this.style.aspectRatio = '';
    }

    const defaultFrameSize = !hasW && !hasH;
    const W = defaultFrameSize ? iw : this.clientWidth;
    const H = defaultFrameSize ? ih : this.clientHeight;
    if (!(W > 0 && H > 0)) {
      this.style.clipPath = '';
      return;
    }

    const fitMode = hasW && hasH ? 'fill' : 'contain';
    const layout = computeObjectFitLayout(iw, ih, W, H, fitMode);
    const { sizeW, sizeH, posX, posY } = backgroundFromLayout(
      layout,
      sheet.imageWidth,
      sheet.imageHeight,
      frame.positionX,
      frame.positionY,
      frame.width,
      frame.height,
    );

    const { drawW, drawH, offsetX, offsetY } = layout;
    const top = Math.max(0, offsetY);
    const right = Math.max(0, W - offsetX - drawW);
    const bottom = Math.max(0, H - offsetY - drawH);
    const left = Math.max(0, offsetX);
    this.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;

    this.style.backgroundImage = `url(${JSON.stringify(sheet.url)})`;
    this.style.backgroundRepeat = 'no-repeat';
    this.style.backgroundSize = `${sizeW}px ${sizeH}px`;
    this.style.backgroundPosition = `${posX}px ${posY}px`;
  }
}

export function defineNanaSprite(m: NanaSpriteManifest): void {
  manifest = m;
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get('nana-sprite')) {
    customElements.define('nana-sprite', NanaSpriteElement);
  }
}
