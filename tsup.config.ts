import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    runtime: 'src/runtime-api.ts',
    react: 'src/react/NanaSprite.tsx',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['vite', 'image-size', 'react', 'react-dom', 'virtual:nana-sprite:manifest'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
