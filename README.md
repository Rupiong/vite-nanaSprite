# vite-nana-sprite

Vite 插件 + **Vue 3 / React** 组件：用背景图与 `clip-path` 展示雪碧图帧，并按元素盒子的尺寸做缩放（内部沿用 `object-fit` 的 **fill** / **contain** 算法）。

## 配套：雪碧图生成器

拼合雪碧图、切分帧时，可搭配 **[NanaSprite 雪碧图生成器](https://rupiong.github.io/nanaSprite/)** 使用：工具支持 **一键导出** 本插件所需的雪碧图配置 JSON（含图片与各帧矩形元数据），将导出内容对接下方 `nanaSprite({ sprites: [...] })` 的 `url` 与 `items`（`name`、`width`、`height`、`positionX`、`positionY`）即可——生成器侧重产出资源与元数据，本包负责在 Vite 中接入并在页面里渲染。

## 本地 playground

仓库根目录为 pnpm workspace（根包 + `playground/`）：

```bash
pnpm install
pnpm playground
```

会先执行 `pnpm run build` 再启动 `playground/` 下的 Vue + Vite 页面（默认开发服务器端口 **3333**），用于切换 `sheet-key`、帧名、`width`/`height` 与容器尺寸做联调。单测：`pnpm test`。

## 安装

```bash
pnpm add -D vite-nana-sprite
```

- **必需** peer：`vite`（`^5` 或 `^6`）。
- 使用 `./react` 入口时需安装 `react`（`^18` 或 `^19`，对主包而言为可选 peer）。

## Vite 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { nanaSprite } from 'vite-nana-sprite';

export default defineConfig({
  plugins: [
    nanaSprite({
      sprites: [
        {
          url: './src/assets/icons.png',
          // 多张雪碧图时必填且唯一；仅一张时可省略（等价 key 为空字符串，省略 sheetKey 时用第一张）
          key: 'icons',
          items: [
            {
              name: 'copy-icon',
              width: 24,
              height: 24,
              positionX: 0,
              positionY: 0,
            },
            // 坐标可为数字或带 px 的字符串（含负数，如 CSS background-position）
            // { name: 'other', width: 140, height: 145, positionX: '-311px', positionY: '-50px' },
          ],
        },
      ],
    }),
  ],
});
```

- 每项 `width` / `height` / `positionX` / `positionY` 支持**数字**或 **`"12"` / `"12px"`** 形式（含负数）。
- 构建时会读取雪碧图自然尺寸；若探测失败，可在该项上设置 `sheetWidth` / `sheetHeight`。
- 多张图时每一项必须带**非空且互不重复**的 `key`；仅一张图时 `key` 可省略。
- `url` 可走 Vite 解析（相对路径、`path.resolve`、常见图片格式等）。

### TypeScript

Vue / React 组件会在构建时解析 `virtual:nana-sprite:manifest`。在 `vite-env.d.ts` 中可加入：

```ts
/// <reference types="vite-nana-sprite/register-types" />
```

（`register-types` 仅提供该虚拟模块的类型声明，无需再 `import` 任何注册脚本。）

## 组件属性（Vue / React 通用语义）

- **name**：帧名称（必填）。
- **sheetKey**：对应配置里的 `key`；省略时使用**配置中的第一张**雪碧图。（Vue 模板里为 `sheet-key`。）
- **width** / **height**：可选。值为 CSS 长度（如 `32px`、`100%`）；纯数字会被当作 `px`。不传时，元素宽高使用**雪碧配置里该帧的宽高**。

缩放规则（由是否传入宽高组合决定）：

| width | height | 行为 |
|--------|--------|------|
| 不传 | 不传 | 盒子等于帧固有尺寸。 |
| 只传一侧 | 另一侧不传 | 已传侧用属性值，另一侧为 `auto`，并保持帧的 **aspect-ratio**（类 **contain**）。 |
| 都传 | 都传 | 在盒子内铺满，**允许非等比拉伸**（类 **fill**）。 |

宿主为 `display: block` 的 `div`，可用外层 CSS 控制布局尺寸。

## Vue 3

```vue
<script setup lang="ts">
import NanaSprite from 'vite-nana-sprite/vue/NanaSprite.vue';
</script>

<template>
  <NanaSprite name="copy-icon" sheet-key="icons" width="48px" height="48px" class="icon" />
</template>
```

组件会将 `class`、样式等未声明属性透传到根 `div`。

## React

使用 `sheetKey` 表示雪碧图 `key`。**不要**用 React 保留字 `key` 传业务含义。

```tsx
import { NanaSprite } from 'vite-nana-sprite/react';

export function Icon() {
  return (
    <NanaSprite
      name="copy-icon"
      sheetKey="icons"
      width="32px"
      height="32px"
      className="icon"
    />
  );
}
```

可选传入 `width` / `height`（字符串，与 Vue 侧一致）。

## SSR

组件依赖构建时注入的 manifest 与浏览器中的尺寸计算；若使用 SSR，请仅在客户端渲染使用到雪碧组件的树，或确保对应 chunk 仅在客户端加载。

## API

- `nanaSprite(options)`：从 `vite-nana-sprite` 主入口导入（**仅含 Node 侧插件代码**，可在 `vite.config` 中安全使用）。
- `bindNanaSpriteHost` / `syncNanaSpriteHost`：从 `vite-nana-sprite/runtime` 导入（在已有 `HTMLElement` 上同步背景与裁剪；一般直接使用 Vue/React 封装即可）。

类型导出见包内 `SpriteFrameItem`、`SpriteSheetUserConfig`、`NanaSpriteManifest` 等。

## 许可证

MIT
