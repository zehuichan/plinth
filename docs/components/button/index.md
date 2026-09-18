---
title: 按钮
group: 基础组件
order: 1
---

# 按钮

用于触发即时操作，例如提交、保存或确认。它是验证组件源码、样式、文档示例、类型和分包构建是否贯通的最小示例。

## 基础用法

<demo vue="./demo/basic.vue" />

## API

### Props

| 名称       | 说明         | 类型                     | 默认值      |
| ---------- | ------------ | ------------------------ | ----------- |
| `type`     | 按钮视觉类型 | `'default' \| 'primary'` | `'default'` |
| `disabled` | 是否禁用按钮 | `boolean`                | `false`     |

### Events

| 名称    | 说明                   | 参数                  |
| ------- | ---------------------- | --------------------- |
| `click` | 点击未禁用的按钮时触发 | `(event: MouseEvent)` |

### Slots

| 名称      | 说明     |
| --------- | -------- |
| `default` | 按钮内容 |

## 设计令牌

Button 使用以下全局 CSS 变量，可以在应用主题中覆盖：

| 变量                      | 用途               |
| ------------------------- | ------------------ |
| `--pl-color-primary`      | 主要按钮背景与边框 |
| `--pl-color-primary-text` | 主要按钮文字       |
| `--pl-color-text`         | 默认按钮文字       |
| `--pl-color-bg`           | 默认按钮背景       |
| `--pl-color-border`       | 默认按钮边框       |

这些变量定义在令牌层。完整引入的 `style.css` 自带，按需引入时需要单独引入 `@plinth/ui/tokens.css`，见[使用组件库](/guide/consumer)。

::: info 示例组件
PlButton 是底座中的实验组件，不是完整设计系统的 Button。实际项目可以在保留工程契约的前提下重写它。`pnpm bootstrap` 若选择了 `scss` 或 `less`，它的 `<style>` 会被补上对应 `lang`；新组件由 `pnpm gen component` 按 `lib.config.ts` 生成。
:::
