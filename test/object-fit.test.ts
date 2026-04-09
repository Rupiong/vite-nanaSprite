import { describe, expect, it } from 'vitest';
import { backgroundFromLayout, computeObjectFitLayout } from '../src/runtime/object-fit';

describe('computeObjectFitLayout', () => {
  it('fill stretches to box', () => {
    const l = computeObjectFitLayout(20, 10, 100, 50, 'fill');
    expect(l.isFill).toBe(true);
    expect(l.scaleX).toBe(5);
    expect(l.scaleY).toBe(5);
    expect(l.drawW).toBe(100);
    expect(l.drawH).toBe(50);
    expect(l.offsetX).toBe(0);
    expect(l.offsetY).toBe(0);
  });

  it('contain fits inside', () => {
    const l = computeObjectFitLayout(40, 40, 100, 50, 'contain');
    expect(l.uniformScale).toBe(1.25);
    expect(l.drawW).toBe(50);
    expect(l.drawH).toBe(50);
    expect(l.offsetX).toBe(25);
    expect(l.offsetY).toBe(0);
  });

  it('cover fills box', () => {
    const l = computeObjectFitLayout(40, 40, 100, 50, 'cover');
    expect(l.uniformScale).toBe(2.5);
    expect(l.drawW).toBe(100);
    expect(l.drawH).toBe(100);
    expect(l.offsetX).toBe(0);
    expect(l.offsetY).toBe(-25);
  });

  it('none keeps intrinsic size', () => {
    const l = computeObjectFitLayout(20, 10, 100, 50, 'none');
    expect(l.uniformScale).toBe(1);
    expect(l.drawW).toBe(20);
    expect(l.drawH).toBe(10);
    expect(l.offsetX).toBe(40);
    expect(l.offsetY).toBe(20);
  });
});

describe('backgroundFromLayout', () => {
  it('maps frame for contain-like uniform scale', () => {
    const layout = computeObjectFitLayout(20, 10, 100, 50, 'contain');
    const bg = backgroundFromLayout(layout, 200, 100, 10, 5, 20, 10);
    expect(bg.sizeW).toBe(200 * layout.uniformScale);
    expect(bg.sizeH).toBe(100 * layout.uniformScale);
    const expectedPosX = layout.offsetX - (10 / 200) * bg.sizeW;
    const expectedPosY = layout.offsetY - (5 / 100) * bg.sizeH;
    expect(bg.posX).toBeCloseTo(expectedPosX);
    expect(bg.posY).toBeCloseTo(expectedPosY);
  });
});
