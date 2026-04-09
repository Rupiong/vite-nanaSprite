import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';
import { nanaSprite } from '../src/plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmp = path.join(__dirname, '.tmp-build');

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('vite plugin integration', () => {
  it('bundles virtual manifest with resolved frame metadata', async () => {
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    const spritePath = path.join(tmp, 'sprite.png');
    writeFileSync(spritePath, tinyPng);
    writeFileSync(
      path.join(tmp, 'entry.js'),
      `import m from 'virtual:nana-sprite:manifest';\nexport default m;\n`,
    );

    const result = await build({
      root: tmp,
      configFile: false,
      logLevel: 'silent',
      plugins: [
        nanaSprite({
          sprites: [
            {
              url: './sprite.png',
              items: [
                {
                  name: 'dot',
                  width: 1,
                  height: 1,
                  positionX: 0,
                  positionY: 0,
                },
              ],
            },
          ],
        }),
      ],
      build: {
        lib: {
          entry: path.join(tmp, 'entry.js'),
          name: 'T',
          formats: ['es'],
          fileName: () => 'out.js',
        },
        outDir: path.join(tmp, 'dist'),
        emptyOutDir: false,
      },
    });

    const rollupOut = Array.isArray(result) ? result[0] : result;
    const items = rollupOut.output as Array<{ type: string; code?: string }>;
    const chunk = items.find((o) => o.type === 'chunk' && o.code?.includes('sheets'));
    expect(chunk?.code).toBeTruthy();
    expect(chunk!.code).toContain('dot');
    expect(chunk!.code).toContain('imageWidth');
    const written = readFileSync(path.join(tmp, 'dist', 'out.js'), 'utf8');
    expect(written).toContain('dot');
  });

  it('accepts frame dimensions and offsets as unitless or px strings', async () => {
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    const spritePath = path.join(tmp, 'sprite.png');
    writeFileSync(spritePath, tinyPng);
    writeFileSync(
      path.join(tmp, 'entry.js'),
      `import m from 'virtual:nana-sprite:manifest';\nexport default m;\n`,
    );

    await build({
      root: tmp,
      configFile: false,
      logLevel: 'silent',
      plugins: [
        nanaSprite({
          sprites: [
            {
              url: './sprite.png',
              sheetWidth: '1px',
              sheetHeight: '1',
              items: [
                {
                  name: 'dot',
                  width: '1px',
                  height: 1,
                  positionX: '0px',
                  positionY: '0',
                },
              ],
            },
          ],
        }),
      ],
      build: {
        lib: {
          entry: path.join(tmp, 'entry.js'),
          name: 'T',
          formats: ['es'],
          fileName: () => 'out.js',
        },
        outDir: path.join(tmp, 'dist'),
        emptyOutDir: false,
      },
    });

    const written = readFileSync(path.join(tmp, 'dist', 'out.js'), 'utf8');
    expect(written).toMatch(/\bwidth:\s*1\b/);
    expect(written).toMatch(/\bheight:\s*1\b/);
    expect(written).toMatch(/\bpositionX:\s*0\b/);
    expect(written).toMatch(/\bpositionY:\s*0\b/);
  });

  it('parses negative px strings (e.g. background-position offsets)', async () => {
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    const spritePath = path.join(tmp, 'sprite.png');
    writeFileSync(spritePath, tinyPng);
    writeFileSync(
      path.join(tmp, 'entry.js'),
      `import m from 'virtual:nana-sprite:manifest';\nexport default m;\n`,
    );

    await build({
      root: tmp,
      configFile: false,
      logLevel: 'silent',
      plugins: [
        nanaSprite({
          sprites: [
            {
              url: './sprite.png',
              items: [
                {
                  name: 'slice',
                  width: 1,
                  height: 1,
                  positionX: '-311px',
                  positionY: '-50px',
                },
              ],
            },
          ],
        }),
      ],
      build: {
        lib: {
          entry: path.join(tmp, 'entry.js'),
          name: 'T',
          formats: ['es'],
          fileName: () => 'out.js',
        },
        outDir: path.join(tmp, 'dist'),
        emptyOutDir: false,
      },
    });

    const written = readFileSync(path.join(tmp, 'dist', 'out.js'), 'utf8');
    expect(written).toMatch(/\bpositionX:\s*-311\b/);
    expect(written).toMatch(/\bpositionY:\s*-50\b/);
  });
});
