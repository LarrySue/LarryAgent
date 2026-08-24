<script setup lang="ts">
// LarryAgent 品牌文字：逐字母配色（多色混搭方案，2026-08-24 老大在调试台定稿）
const text = "LarryAgent";
const colors = [
  "#f0f0f0", // L
  "#707070", // a
  "#707070", // r
  "#707070", // r
  "#707070", // y
  "#5cadff", // A（锚点蓝）
  "#707070", // g
  "#707070", // e
  "#707070", // n
  "#c83c3c", // t（朱红）
];
</script>

<template>
  <span class="brand-text" aria-label="LarryAgent">
    <span v-for="(c, i) in colors" :key="i" :style="{ color: c }">{{ text[i] }}</span>
  </span>
</template>

<style scoped>
.brand-text {
  white-space: nowrap;
}
</style>
