import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { nanaSprite } from 'vite-nana-sprite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3333,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    nanaSprite({
      sprites: [
        {
          url: path.resolve(__dirname, 'src/assets/css_sprites_icon.png'),
          key: 'icons',
          items: [
            { name: 'swatch-a', width: 260, height: 260, positionX: 0, positionY: 0 },
            { name: 'more', width: 140, height: 145, positionX: '-311px', positionY: '-50px' },
            { name: 'date', width: 136, height: 167, positionX: '-559px', positionY: '36px' },
          ],
        },
        {
          url: path.resolve(__dirname, 'src/assets/badges.svg'),
          key: 'badges',
          items: [
            { name: 'badge-left', width: 24, height: 24, positionX: 0, positionY: 0 },
            { name: 'badge-right', width: 24, height: 24, positionX: 24, positionY: 0 },
          ],
        },
      ],
    }),
  ],
});
