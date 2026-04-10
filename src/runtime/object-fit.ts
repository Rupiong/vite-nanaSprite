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

/**
 * Background scale and sprite-only offsets (`shiftX` / `shiftY`, typically ≤ 0).
 * Contain/cover 的留白用宿主上的子层 `left`/`top` 表达，不把 `offsetX` 混进 `background-position`，
 * 这样与工具导出的负像素位移一致。
 */
export function backgroundFromLayout(
  layout: ObjectFitLayout,
  sheetW: number,
  sheetH: number,
  frameX: number,
  frameY: number,
  frameW: number,
  frameH: number,
): { sizeW: number; sizeH: number; shiftX: number; shiftY: number } {
  const ax = Math.abs(frameX);
  const ay = Math.abs(frameY);

  if (layout.isFill) {
    const Bw = sheetW * layout.scaleX;
    const Bh = sheetH * layout.scaleY;
    const shiftX = (-ax / sheetW) * Bw;
    const shiftY = (-ay / sheetH) * Bh;
    return { sizeW: Bw, sizeH: Bh, shiftX, shiftY };
  }

  const s = layout.uniformScale;
  const Bw = sheetW * s;
  const Bh = sheetH * s;
  const shiftX = (-ax / sheetW) * Bw;
  const shiftY = (-ay / sheetH) * Bh;
  return { sizeW: Bw, sizeH: Bh, shiftX, shiftY };
}
