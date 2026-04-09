import type { ObjectFitMode } from '../types';

/** Object-fit layout for intrinsic size (iw, ih) inside box (W, H). All in CSS pixels. */
export interface ObjectFitLayout {
  /** Uniform scale (meaningful for contain, cover, none, scale-down). */
  uniformScale: number;
  /** For fill: horizontal and vertical scale on the logical image. */
  scaleX: number;
  scaleY: number;
  /** Drawn size of logical image inside box. */
  drawW: number;
  drawH: number;
  /** Offset from box top-left where drawn rect starts. */
  offsetX: number;
  offsetY: number;
  /** True when non-uniform scaling is used (fill). */
  isFill: boolean;
}

export function computeObjectFitLayout(
  iw: number,
  ih: number,
  W: number,
  H: number,
  mode: ObjectFitMode,
): ObjectFitLayout {
  if (!(iw > 0 && ih > 0 && W >= 0 && H >= 0)) {
    return {
      uniformScale: 1,
      scaleX: 1,
      scaleY: 1,
      drawW: iw,
      drawH: ih,
      offsetX: (W - iw) / 2,
      offsetY: (H - ih) / 2,
      isFill: false,
    };
  }

  if (mode === 'fill') {
    const scaleX = W / iw;
    const scaleY = H / ih;
    return {
      uniformScale: Math.min(scaleX, scaleY),
      scaleX,
      scaleY,
      drawW: W,
      drawH: H,
      offsetX: 0,
      offsetY: 0,
      isFill: true,
    };
  }

  let s: number;
  if (mode === 'none') {
    s = 1;
  } else if (mode === 'contain') {
    s = Math.min(W / iw, H / ih);
  } else if (mode === 'cover') {
    s = Math.max(W / iw, H / ih);
  } else {
    // scale-down
    s = Math.min(1, Math.min(W / iw, H / ih));
  }

  const drawW = iw * s;
  const drawH = ih * s;
  const offsetX = (W - drawW) / 2;
  const offsetY = (H - drawH) / 2;

  return {
    uniformScale: s,
    scaleX: s,
    scaleY: s,
    drawW,
    drawH,
    offsetX,
    offsetY,
    isFill: false,
  };
}

/** Convert layout + sheet frame to CSS background-size (px) and background-position (px). */
export function backgroundFromLayout(
  layout: ObjectFitLayout,
  sheetW: number,
  sheetH: number,
  frameX: number,
  frameY: number,
  frameW: number,
  frameH: number,
): { sizeW: number; sizeH: number; posX: number; posY: number } {
  if (layout.isFill) {
    const Bw = sheetW * layout.scaleX;
    const Bh = sheetH * layout.scaleY;
    const posX = (-frameX / sheetW) * Bw;
    const posY = (-frameY / sheetH) * Bh;
    return { sizeW: Bw, sizeH: Bh, posX, posY };
  }

  const s = layout.uniformScale;
  const Bw = sheetW * s;
  const Bh = sheetH * s;
  const posX = layout.offsetX - (frameX / sheetW) * Bw;
  const posY = layout.offsetY - (frameY / sheetH) * Bh;
  return { sizeW: Bw, sizeH: Bh, posX, posY };
}
