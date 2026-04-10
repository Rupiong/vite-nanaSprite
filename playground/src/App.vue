<script setup lang="ts">
import { computed, ref } from 'vue';
import NanaSprite from 'vite-nana-sprite/vue/NanaSprite.vue';

/** 与 playground/vite.config.ts 中 items 一致，便于对照默认像素尺寸 */
const SHEET_FRAMES = {
  icons: [
    { value: 'swatch-a', label: 'swatch-a（260×260）' },
    { value: 'more', label: 'more（140×145）' },
    { value: 'date', label: 'date（136×167）' },
  ],
  badges: [
    { value: 'badge-left', label: 'badge-left（24×24）' },
    { value: 'badge-right', label: 'badge-right（24×24）' },
  ],
} as const;

const sheetKey = ref<'icons' | 'badges'>('icons');
const frameName = ref('swatch-a');
/** 默认略大于最大图标帧，便于「不传宽高」时一眼看清整张图 */
const boxW = ref(280);
const boxH = ref(280);

/** 与组件 width/height 属性对齐的演示模式 */
const sizeMode = ref<'fill' | 'frame' | 'width100' | 'height100' | 'custom'>('frame');
const customWidth = ref('100%');
const customHeight = ref('100%');

const frameOptions = computed(() => SHEET_FRAMES[sheetKey.value]);

const spriteSizeAttrs = computed(() => {
  switch (sizeMode.value) {
    case 'frame':
      return {};
    case 'fill':
      return { width: '100%' as const, height: '100%' as const };
    case 'width100':
      return { width: '100%' as const };
    case 'height100':
      return { height: '100%' as const };
    case 'custom':
      return { width: customWidth.value, height: customHeight.value };
    default:
      return {};
  }
});

function onSheetChange() {
  const opts = frameOptions.value;
  frameName.value = opts.some((o) => o.value === frameName.value)
    ? frameName.value
    : (opts[0]?.value ?? 'swatch-a');
}

const stageHint = computed(() => {
  switch (sizeMode.value) {
    case 'frame':
      return '不传 width/height：元素尺寸用配置帧宽高，与下方容器大小无关。';
    case 'fill':
      return '双属性 100%：铺满容器，可非等比拉伸。';
    case 'width100':
      return '仅 width：高度随 aspect-ratio 等比。';
    case 'height100':
      return '仅 height：宽度随 aspect-ratio 等比。';
    default:
      return '自定义：可同时设宽高（fill）或试探任意 CSS 长度。';
  }
});
</script>

<template>
  <div class="page">
    <header class="header">
      <h1>vite-nana-sprite playground</h1>
      <p class="hint">
        本地验证 <code>NanaSprite</code>（Vue）：<code>width</code> / <code>height</code> 可选；不传则用
        <strong>配置中的帧宽高</strong>。只传一侧时保持
        <strong>等比</strong>（<code>aspect-ratio</code>）；两侧都传时
        <strong>铺满并允许拉伸</strong>（<code>object-fit: fill</code>）。
      </p>
    </header>

    <section class="controls">
      <label>
        雪碧图（sheet-key）
        <select v-model="sheetKey" @change="onSheetChange">
          <option value="icons">icons</option>
          <option value="badges">badges</option>
        </select>
      </label>
      <label>
        帧名称
        <select v-model="frameName">
          <option v-for="opt in frameOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>
      <label class="size-mode">
        精灵尺寸模式
        <select v-model="sizeMode">
          <option value="frame">默认：不传 width/height（配置像素尺寸）</option>
          <option value="fill">双 100%：铺满下方容器（可非等比拉伸）</option>
          <option value="width100">仅 width 100%，高 auto</option>
          <option value="height100">仅 height 100%，宽 auto</option>
          <option value="custom">自定义 width / height</option>
        </select>
      </label>
      <template v-if="sizeMode === 'custom'">
        <label>
          自定义 width
          <input v-model="customWidth" type="text" spellcheck="false" placeholder="如 100% 或 48px" />
        </label>
        <label>
          自定义 height
          <input v-model="customHeight" type="text" spellcheck="false" placeholder="如 100% 或 48px" />
        </label>
      </template>
      <label class="size">
        演示容器宽
        <input v-model.number="boxW" type="range" min="48" max="400" step="4" />
        <span>{{ boxW }}px</span>
      </label>
      <label class="size">
        演示容器高
        <input v-model.number="boxH" type="range" min="48" max="400" step="4" />
        <span>{{ boxH }}px</span>
      </label>
    </section>

    <section class="demo">
      <div class="panel">
        <h2>Vue &lt;NanaSprite&gt;</h2>
        <p class="panel-hint">{{ stageHint }}</p>
        <div
          class="stage"
          :style="{
            width: `${boxW}px`,
            height: `${boxH}px`,
          }"
        >
          <NanaSprite
            v-bind="spriteSizeAttrs"
            :name="frameName"
            :sheet-key="sheetKey"
            class="sprite"
            :style="{
              border: '1px dashed var(--border)',
              backgroundColor: '#0c0c0f',
            }"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style>
:root {
  --bg: #111014;
  --text: #f4f4f8;
  --muted: #9b9baa;
  --border: #3f3f4d;
  --panel: #1a1920;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
}
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.75rem 1.25rem 3rem;
}
.header h1 {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 0 0 0.35rem;
}
.hint {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.5;
}
.hint code {
  color: #c8c2ff;
  font-size: 0.9em;
}
.hint strong {
  color: var(--text);
  font-weight: 600;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin: 1.5rem 0;
  padding: 1rem 1.25rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.controls label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.controls label.size-mode {
  flex: 1 1 100%;
  max-width: 36rem;
}
.controls select,
.controls input[type='range'],
.controls input[type='text'] {
  min-width: 10rem;
}
.controls input[type='text'] {
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.9rem;
}
.controls .size {
  min-width: 12rem;
}
.controls .size span {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}
.panel {
  padding: 1rem 1.25rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.panel h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
.panel-hint {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--muted);
}
.stage {
  display: block;
  overflow: hidden;
}
.sprite {
  box-sizing: border-box;
}
</style>
