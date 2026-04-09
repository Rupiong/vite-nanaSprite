export interface SpriteFrameItem {
  name: string;
  width: number | string;
  height: number | string;
  positionX: number | string;
  positionY: number | string;
}

export interface SpriteSheetUserConfig {
  url: string;
  /** Optional; use `sheet-key` on the element to select when multiple sheets exist. */
  key?: string;
  /** Optional natural size of full sprite image if dimension probing fails. */
  sheetWidth?: number | string;
  sheetHeight?: number | string;
  items: SpriteFrameItem[];
}

export interface NanaSpritePluginOptions {
  sprites: SpriteSheetUserConfig[];
}

export type ObjectFitMode = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';

export interface NormalizedFrame {
  name: string;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
}

export interface SpriteSheetManifest {
  /** Resolved key; `''` when user omitted `key` (first sheet when no sheet-key). */
  key: string;
  url: string;
  imageWidth: number;
  imageHeight: number;
  frames: Record<string, NormalizedFrame>;
}

export interface NanaSpriteManifest {
  sheets: SpriteSheetManifest[];
}
