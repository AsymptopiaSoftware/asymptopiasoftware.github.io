<script setup>
import { ref } from 'vue';
const clicks = ref(0);
</script>

<template>
  <div class="vue-check">
    <span>Astro + Vue connected</span>
    <button type="button" @click="clicks++">
      Test Vue interaction: {{ clicks }}
    </button>
  </div>
</template>

<style scoped>
.vue-check { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; color: #636b75; font-size: .85rem; }
button { color: #263042; background: white; border: 1px solid #d9dde2; border-radius: 6px; padding: .45rem .7rem; cursor: pointer; font: inherit; }
button:hover { border-color: #6b7280; }
button:focus-visible { outline: 2px solid #334155; outline-offset: 3px; }
</style>
