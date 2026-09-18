<script setup lang="ts">
import { PlButton } from '@plinth/ui';
</script>

<template>
  <div class="button-demo">
    <PlButton>默认按钮</PlButton>
    <PlButton type="primary">主要按钮</PlButton>
    <PlButton disabled>禁用按钮</PlButton>
  </div>
</template>

<style scoped>
.button-demo {
  display: flex;
  gap: 8px;
}
</style>
