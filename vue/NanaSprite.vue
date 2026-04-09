<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  name: string;
  sheetKey?: string;
  /** CSS 长度，如 `100%`、`80px`；不传则使用雪碧帧配置的宽高 */
  width?: string;
  height?: string;
}>();
</script>

<template>
  <nana-sprite
    v-bind="$attrs"
    :name="name"
    :sheet-key="sheetKey"
    :width="width"
    :height="height"
  />
</template>
