import fs from 'node:fs';
import path from 'node:path';
import imageSizeFn from 'image-size';
import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import type {
  NanaSpritePluginOptions,
  NormalizedFrame,
  SpriteSheetManifest,
  SpriteSheetUserConfig,
} from './types';

export const VIRTUAL_MODULE_ID = 'virtual:nana-sprite:manifest';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

/** 配置项中的长度：数字、无单位字符串（默认按 px）、或带 px 的字符串；雪碧图坐标仅支持这两种写法（含负数如 -311px；Unicode 减号 U+2212 等在归一化后同样支持）。 */
const PX_OR_UNITLESS = /^(-?\d+(?:\.\d+)?)\s*(px)?$/i;

/** 导出工具常用 Unicode 减号/破折号；零宽与 BOM 常见于复制粘贴，会导致 `-?\\d+` 匹配失败或被其它逻辑误解析成正数。 */
const UNICODE_MINUS_DASH = /[\u2212\u2012\u2013\u2014\uff0d]/g;
const ZERO_WIDTH_AND_BOM = /[\ufeff\u200b-\u200d\u2060]/g;

function normalizeNumericLengthString(raw: string): string {
  return String(raw)
    .trim()
    .replace(ZERO_WIDTH_AND_BOM, '')
    .replace(UNICODE_MINUS_DASH, '-');
}

function toNum(v: number | string, field: string, ctx: string): number {
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) {
      throw new Error(
        `[vite-nana-sprite] ${ctx}: "${field}" must be a finite number (got ${JSON.stringify(v)})`,
      );
    }
    return v;
  }
  const s = normalizeNumericLengthString(v);
  const m = s.match(PX_OR_UNITLESS);
  if (m) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) {
      throw new Error(
        `[vite-nana-sprite] ${ctx}: "${field}" must be a finite number (got ${JSON.stringify(v)})`,
      );
    }
    return n;
  }
  throw new Error(
    `[vite-nana-sprite] ${ctx}: "${field}" must be a finite number, or px length like 12, "12", "12px" (got ${JSON.stringify(v)})`,
  );
}

function validateSprites(sprites: SpriteSheetUserConfig[]) {
  if (!Array.isArray(sprites) || sprites.length === 0) {
    throw new Error('[vite-nana-sprite] `sprites` must be a non-empty array');
  }

  const missingKey = sprites.filter((s) => !s.key || String(s.key).trim() === '');
  if (sprites.length > 1 && missingKey.length > 0) {
    throw new Error(
      '[vite-nana-sprite] When using multiple sprite sheets, each must have a non-empty `key` field',
    );
  }

  const keys = new Set<string>();
  for (const s of sprites) {
    const k = s.key != null && String(s.key).trim() !== '' ? String(s.key).trim() : '';
    if (keys.has(k)) {
      throw new Error(
        `[vite-nana-sprite] duplicate sprite sheet key ${JSON.stringify(k)} — keys must be unique`,
      );
    }
    keys.add(k);
  }
}

function normalizeSheet(
  sheet: SpriteSheetUserConfig,
  sheetIndex: number,
  imageWidth: number,
  imageHeight: number,
): SpriteSheetManifest {
  const ctx = `sprites[${sheetIndex}]`;
  const key = sheet.key != null && String(sheet.key).trim() !== '' ? String(sheet.key).trim() : '';

  const frames: Record<string, NormalizedFrame> = {};
  for (let i = 0; i < sheet.items.length; i++) {
    const item = sheet.items[i];
    const ictx = `${ctx}.items[${i}]`;
    if (!item?.name) throw new Error(`[vite-nana-sprite] ${ictx}: "name" is required`);
    const name = String(item.name);
    if (frames[name]) {
      throw new Error(`[vite-nana-sprite] ${ctx}: duplicate frame name "${name}"`);
    }
    frames[name] = {
      name,
      width: toNum(item.width, 'width', ictx),
      height: toNum(item.height, 'height', ictx),
      positionX: toNum(item.positionX, 'positionX', ictx),
      positionY: toNum(item.positionY, 'positionY', ictx),
    };
  }

  return {
    key,
    url: '',
    imageWidth,
    imageHeight,
    frames,
  };
}

function readImageDimensions(absPath: string, sheet: SpriteSheetUserConfig, sheetIndex: number): {
  width: number;
  height: number;
} {
  const ctx = `sprites[${sheetIndex}]`;
  const fallbackW =
    sheet.sheetWidth != null ? toNum(sheet.sheetWidth, 'sheetWidth', ctx) : null;
  const fallbackH =
    sheet.sheetHeight != null ? toNum(sheet.sheetHeight, 'sheetHeight', ctx) : null;

  try {
    const buf = fs.readFileSync(absPath);
    const r = imageSizeFn(buf);
    if (r.width != null && r.height != null) {
      return { width: r.width, height: r.height };
    }
  } catch {
    // fall through
  }

  if (fallbackW != null && fallbackH != null) {
    return { width: fallbackW, height: fallbackH };
  }

  throw new Error(
    `[vite-nana-sprite] ${ctx}: could not read image dimensions for "${sheet.url}"; set sheetWidth/sheetHeight or fix the file path`,
  );
}

async function buildManifestCode(
  sprites: SpriteSheetUserConfig[],
  resolveUrl: (userUrl: string) => Promise<string>,
): Promise<string> {
  validateSprites(sprites);

  const importLines: string[] = [];
  const sheetBlocks: string[] = [];

  for (let i = 0; i < sprites.length; i++) {
    const sheet = sprites[i];
    if (!sheet.url) {
      throw new Error(`[vite-nana-sprite] sprites[${i}]: "url" is required`);
    }
    if (!Array.isArray(sheet.items) || sheet.items.length === 0) {
      throw new Error(`[vite-nana-sprite] sprites[${i}]: "items" must be a non-empty array`);
    }

    const resolvedImport = await resolveUrl(sheet.url);
    const fsPath = resolvedImport.replace(/\?url$/, '');
    const { width, height } = readImageDimensions(fsPath, sheet, i);
    const normalized = normalizeSheet(sheet, i, width, height);

    const varName = `_nanaspriteUrl${i}`;
    importLines.push(`import ${varName} from ${JSON.stringify(resolvedImport)};`);

    sheetBlocks.push(`{
      key: ${JSON.stringify(normalized.key)},
      url: ${varName},
      imageWidth: ${normalized.imageWidth},
      imageHeight: ${normalized.imageHeight},
      frames: ${JSON.stringify(normalized.frames)}
    }`);
  }

  const manifestExpr = `{
  sheets: [
    ${sheetBlocks.join(',\n    ')}
  ]
}`;

  return `${importLines.join('\n')}\n\nconst manifest = ${manifestExpr};\n\nexport default manifest;\n`;
}

export function nanaSprite(options: NanaSpritePluginOptions): Plugin {
  let root = process.cwd();
  let configFile: string | undefined;
  let cachedCode: string | null = null;

  return {
    name: 'vite-nana-sprite',
    configResolved(config) {
      root = config.root;
      configFile = config.configFile;
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;

      const sprites = options.sprites;
      if (!sprites?.length) {
        throw new Error('[vite-nana-sprite] plugin option `sprites` is required');
      }

      const importer = configFile ?? path.join(root, 'package.json');

      const resolveUrl = async (userUrl: string) => {
        const resolved = await this.resolve(userUrl, importer, {
          skipSelf: true,
        });
        if (!resolved?.id) {
          throw new Error(`[vite-nana-sprite] cannot resolve sprite url: ${JSON.stringify(userUrl)}`);
        }
        const idPath = normalizePath(resolved.id.split('?')[0]);
        return `${idPath}?url`;
      };

      if (!cachedCode) {
        cachedCode = await buildManifestCode(sprites, resolveUrl);
      }
      return cachedCode;
    },
    buildEnd() {
      cachedCode = null;
    },
  };
}
