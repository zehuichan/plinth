# UI 框架

Plinth 的底层只依赖 Vue。初始化时可以选择不接入 UI 框架，也可以选择 Ant Design Vue、Antdv Next、Element Plus 或 TDesign 作为组件实现的基础。

## 初始化时选择

```bash
pnpm bootstrap --ui none
pnpm bootstrap --ui antdv
pnpm bootstrap --ui antdv-next
pnpm bootstrap --ui element-plus
pnpm bootstrap --ui tdesign
```

| 选项           | 适用情况                            | 自动配置                                                    |
| -------------- | ----------------------------------- | ----------------------------------------------------------- |
| `none`         | 从原生元素开始，或尚未确定技术栈    | 不增加额外依赖                                              |
| `antdv`        | 基于 Ant Design Vue 4 封装          | peer dependency、文档站与 playground 的全量安装和 reset.css |
| `antdv-next`   | 基于 Antdv Next（`antdv-next`）封装 | peer dependency、文档站与 playground 的全量安装和 reset.css |
| `element-plus` | 基于 Element Plus 封装              | peer dependency、文档站与 playground 的全量安装和基础样式   |
| `tdesign`      | 基于 TDesign Vue Next 封装          | peer dependency、文档站与 playground 的全量安装和组件样式   |

选择只负责接通依赖和本地预览环境，不会复制或生成第三方组件。业务组件仍由你决定如何封装。

::: warning bootstrap 之后更换框架
bootstrap 只运行一次。之后若更换 UI 框架，需要手动调整 `packages/core/package.json` 的 `peerDependencies`、工作区 catalog、`docs/.vitepress/theme/ui.ts` 和 `playground/src/ui.ts`。
:::

## 为什么使用 peerDependencies

第三方 UI 框架由使用方提供，组件库不重复打包一份。tsdown 会将 `peerDependencies` 外置，从而避免 Vue 或 UI 框架出现多份实例，也能控制产物体积。

发布前应在文档站与 playground 的 `devDependencies` 中安装同版本依赖，确保本地示例能够运行。

## 封装组件

以 Ant Design Vue 为例：

```vue
<script setup lang="ts">
import { Button } from 'ant-design-vue';

defineOptions({ name: 'PlSubmit' });
</script>

<template>
  <Button type="primary"><slot /></Button>
</template>
```

以 Antdv Next 为例：

```vue
<script setup lang="ts">
import { Button } from 'antdv-next';

defineOptions({ name: 'PlSubmit' });
</script>

<template>
  <Button type="primary"><slot /></Button>
</template>
```

以 Element Plus 为例：

```vue
<script setup lang="ts">
import { ElButton } from 'element-plus';

defineOptions({ name: 'PlSubmit' });
</script>

<template>
  <ElButton type="primary"><slot /></ElButton>
</template>
```

以 TDesign 为例：

```vue
<script setup lang="ts">
import { Button } from 'tdesign-vue-next';

defineOptions({ name: 'PlSubmit' });
</script>

<template>
  <Button theme="primary"><slot /></Button>
</template>
```

公开 API 应使用你自己的命名和业务语义，不要把第三方组件的全部 props 原样透传。这样将来升级或替换底层框架时，影响范围仍然可控。

## 二开组件的样式写法

二开组件同样不使用 `<style scoped>`。给包装元素加一个带库前缀的类名，再从这个类名往下写：

```vue
<script setup lang="ts">
import { createNamespace } from '@internal/utils';
import { Button } from 'ant-design-vue';

defineOptions({ name: 'PlSubmit' });

const ns = createNamespace('submit');
</script>

<template>
  <Button :class="ns.b()" type="primary"><slot /></Button>
</template>

<style>
.pl-submit {
  min-width: 96px;
}

.pl-submit .ant-btn-icon {
  margin-inline-end: 4px;
}
</style>
```

若 `lib.config.ts` 的 `preprocessor` 是 `scss` 或 `less`，把上面的 `<style>` 写成对应 `lang`（`pnpm gen component` 会自动带上）。类名通过 `createNamespace` 派生，库前缀只在 `lib.config.ts` 里配置一次。预处理器在 bootstrap 时选择，不要根据 Ant Design Vue 的源码语言去装 Less，也不要因为 Antdv Next 用 CSS-in-JS 就改发布物格式。详见[样式规范](/guide/styling)。

如果加了 `scoped`，第二条规则就命中不了 Ant Design Vue 内部节点，只能改写成 `:deep(.ant-btn-icon)`；而一旦层级变深，`:deep()` 会迅速堆积并难以维护。前缀类名加上「组件 CSS 随分包入口注入」已经提供了足够的隔离。

需要覆盖第三方内部结构时，把选择器限制在自己的前缀类名之下，不要写全局的 `.ant-*`、`.el-*` 或 `.t-*` 规则。Antdv Next 默认 CSS-in-JS，类名可能带 hash；覆盖前先在文档站里确认实际选择器。

## 设计令牌桥接

全局设计令牌位于 `packages/core/styles/tokens.css`。可以在这里把公司语义令牌映射到框架变量：

```css
:root {
  --pl-color-primary: var(--ant-color-primary);
}
```

组件内部只使用 `--pl-*`，不要直接散落 `--ant-*`、`--el-*` 或 `--td-*`。这样主题切换和框架迁移只需要修改桥接层。Antdv Next 默认走 ConfigProvider token；只有开启 `cssVar` 之后，`--ant-*` 这种映射才稳定可用。TDesign 的品牌色对应 `--td-brand-color`。

这一层会单独发布为 `@plinth/ui/tokens.css`：完整引入的 `style.css` 已经包含它，按需引入的使用方需要在入口单独引一次，见[使用组件库](/guide/consumer)。

## 样式职责

- 文档站和 playground：bootstrap 会全量引入所选框架样式，保证示例可运行
- 组件库产物：第三方框架和其样式不应被重复打包
- 业务项目：负责安装 peer dependency，并按框架官方方式准备基础样式
- Plinth 自有组件：默认由组件分包入口注入自身 CSS
- 预处理器：基座出厂不装。作者在 `pnpm bootstrap` 时选择 `none` / `scss` / `less`，不要根据底层 UI 框架的源码语言来选。主题桥接仍用上一节的 CSS 变量。见[样式规范](/guide/styling)

Element Plus 如果采用按需样式，应由业务项目的构建工具处理，例如 `unplugin-element-plus`；TDesign 同理可用官方 auto-import resolver。这不属于 Plinth resolver 的职责。
