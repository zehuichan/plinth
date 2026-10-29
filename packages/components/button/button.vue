<script setup lang="ts">
import { createNamespace, cx } from '@internal/utils';

defineOptions({ name: 'PlButton' });

const props = withDefaults(
  defineProps<{
    /** 按钮视觉类型 */
    type?: 'primary' | 'default';
    /** 是否禁用按钮 */
    disabled?: boolean;
  }>(),
  {
    type: 'default',
    disabled: false,
  },
);

const emit = defineEmits<{
  /** 点击未禁用的按钮时触发 */
  click: [event: MouseEvent];
}>();

defineSlots<{
  /** 按钮内容 */
  default?: () => unknown;
}>();

const ns = createNamespace('button');
</script>

<template>
  <button
    :class="cx(ns.b(), ns.m(props.type), ns.is('disabled', props.disabled))"
    :disabled="props.disabled"
    type="button"
    @click="emit('click', $event)"
  >
    <span :class="ns.e('content')">
      <slot />
    </span>
  </button>
</template>

<style>
.pl-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border: 1px solid var(--pl-color-border);
  border-radius: 6px;
  background: var(--pl-color-bg);
  color: var(--pl-color-text);
  font: inherit;
  cursor: pointer;
}

.pl-button__content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pl-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pl-button--primary {
  background: var(--pl-color-primary);
  border-color: var(--pl-color-primary);
  color: var(--pl-color-primary-text);
}
</style>
