---
title: useToggle
group: 组合式函数
order: 1
---

# useToggle

创建一个布尔类型的响应式引用，并提供切换函数。适合控制弹窗、折叠区和开关状态。

## 基础用法

```vue
<script setup lang="ts">
import { useToggle } from '@plinth/ui';

const { value: visible, toggle } = useToggle();
</script>

<template>
  <button type="button" @click="toggle">
    {{ visible ? '收起' : '展开' }}
  </button>
  <p v-if="visible">现在可以看到这段内容。</p>
</template>
```

## 设置初始值

传入 `true` 可以让状态默认开启：

```ts
const { value, toggle } = useToggle(true);
```

## API

```ts
function useToggle(initial?: boolean): {
  value: Ref<boolean>;
  toggle: () => void;
};
```

### 参数

| 名称      | 说明     | 类型      | 默认值  |
| --------- | -------- | --------- | ------- |
| `initial` | 初始状态 | `boolean` | `false` |

### 返回值

| 名称     | 说明           | 类型           |
| -------- | -------------- | -------------- |
| `value`  | 当前响应式状态 | `Ref<boolean>` |
| `toggle` | 将当前状态取反 | `() => void`   |

::: tip 保持响应性
`value` 是一个 ref。可以重命名解构，但不要读取 `.value` 后再保存成普通布尔值，否则会失去响应性。
:::
