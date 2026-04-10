<script setup lang="ts">
import { bindNanaSpriteHost } from 'vite-nana-sprite/runtime';
import manifest from 'virtual:nana-sprite:manifest';
import { onBeforeUnmount, ref, useAttrs, watch } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  name: string;
  sheetKey?: string;
  /** CSS 长度，如 `100%`、`80px`；不传则使用雪碧帧配置的宽高 */
  width?: string;
  height?: string;
}>();

const attrs = useAttrs();
const root = ref<HTMLElement | null>(null);

let binding: ReturnType<typeof bindNanaSpriteHost> | null = null;

watch(
  () =>
    [root.value, props.name, props.sheetKey, props.width, props.height] as const,
  () => {
    const el = root.value;
    if (!el) {
      binding?.disconnect();
      binding = null;
      return;
    }
    binding?.disconnect();
    binding = bindNanaSpriteHost(el, manifest, () => ({
      name: props.name,
      sheetKey: props.sheetKey,
      width: props.width,
      height: props.height,
    }));
  },
  { flush: 'post', immediate: true },
);

onBeforeUnmount(() => {
  binding?.disconnect();
  binding = null;
});
</script>

<template>
  <div ref="root" v-bind="attrs" />
</template>
