declare module 'virtual:nana-sprite:manifest' {
  type Manifest = import('vite-nana-sprite').NanaSpriteManifest;
  const manifest: Manifest;
  export default manifest;
}

export {};
