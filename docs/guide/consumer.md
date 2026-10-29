# 使用组件库

本页面面向组件库的使用方。下面以模板默认名称 `@plinth/ui` 为例；运行 bootstrap 后，请替换为公司实际包名和组件前缀。

## 安装前确认

组件库要求业务项目使用 Vue 3。如果组件库在 bootstrap 时选择了 Ant Design Vue、Antdv Next、Element Plus 或 TDesign，业务项目还需要安装对应的 `peerDependencies`，具体版本以安装时的包管理器提示为准。

无论组件库源码是否使用 SCSS / Less，业务项目都**不必**安装 `sass-embedded` 或 `less`。发布物只有 CSS，按下面「完整引入」或按需引入即可。

## 配置私有源

使用 npm 官方源的公开包可以跳过本节。公司私有源通常需要在业务项目或用户级 `.npmrc` 中配置。

作用域包：

```ini
# .npmrc
@acme:registry=https://your-registry.example/
```

非作用域包：

```ini
# .npmrc
registry=https://your-registry.example/
```

不要把 token 提交到仓库。认证信息应放在用户级 `~/.npmrc` 或 CI Secret 中。

## 安装

```bash
pnpm add @plinth/ui
```

## 完整引入

适合后台系统或不关注首屏体积的应用。在应用入口注册全部组件，并引入完整样式：

```ts
import { createApp } from 'vue';
import Plinth from '@plinth/ui';
import '@plinth/ui/style.css';

createApp(App).use(Plinth).mount('#app');
```

之后可以在任意模板中直接使用：

```vue
<template>
  <PlButton type="primary">保存</PlButton>
</template>
```

## 自动按需引入

推荐对包体积敏感的应用配合 `unplugin-vue-components` 使用。

```bash
pnpm add -D unplugin-vue-components
```

在 `vite.config.ts` 中注册 resolver：

```ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import Components from 'unplugin-vue-components/vite';
import { PlinthResolver } from '@plinth/ui/resolver';

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [PlinthResolver()] })],
});
```

此后模板中的 `PlButton` 会自动解析到 `@plinth/ui/es/button`，无需手写 import。

默认构建模式是 `styles: 'inject'`：每个 `es/<seg>/index.mjs` 已经引入自己的 CSS，因此保持 `resolveStyle: false`，也不要额外引入 `style.css`。只有将 `lib.config.ts` 切换为 `sideEffects` 模式后，才需要开启 `resolveStyle`。

## 按需引入要补一层设计令牌

组件分包只带自己的规则，不带 `--pl-*` 令牌定义。按需引入时在应用入口引入一次令牌层：

```ts
import '@plinth/ui/tokens.css';
```

完整引入的 `style.css` 已经包含这一层，不需要重复引入。缺少它不会报错，只会让组件退回浏览器默认配色。

## 手动按需引入

不想使用 resolver 时，可以直接从分包入口引入：

```ts
import { PlButton } from '@plinth/ui/es/button';
```

该入口会携带 Button 自身的样式，同样需要在入口引入一次 `@plinth/ui/tokens.css`。

## TypeScript 与 IDE 提示

组件公开类型随包一起发布，无需安装额外的 `@types/*`。具名导入、resolver 和分包入口都能直接获得类型提示。

全量注册（`app.use`）后如果想让模板里的 `<PlButton />` 也有类型提示，在业务项目的 `tsconfig.json` 里引入随包发布的全局声明：

```json
{
  "compilerOptions": {
    "types": ["@plinth/ui/global"]
  }
}
```

包里还带了模板标签提示数据，组件名、属性、可选值、事件和插槽说明都来自组件源码的类型与注释：

| 编辑器                        | 数据来源                                                     | 需要配置       |
| ----------------------------- | ------------------------------------------------------------ | -------------- |
| WebStorm 等 JetBrains IDE     | `package.json` 的 `web-types`                                | 无，安装即生效 |
| VS Code + Vue - Official      | 上面的 `@plinth/ui/global` 类型声明                          | 按上文配置     |
| VS Code + Vetur（已停止维护） | `package.json` 的 `vetur`（`tags.json` / `attributes.json`） | 无，安装即生效 |

WebStorm 没有出现提示时，确认依赖已经安装在 `node_modules` 中，再执行一次 File → Invalidate Caches。

## 常见问题

### 找不到包

先运行 `pnpm config get @acme:registry` 检查作用域是否指向正确源，再确认当前账号有下载权限。

### 组件能显示但没有样式

- 完整引入：确认入口包含 `import '@plinth/ui/style.css'`
- 默认按需引入：不要开启 `resolveStyle`，组件 JS 会自行引入样式；颜色和边框发灰通常是漏了 `import '@plinth/ui/tokens.css'`
- 自定义构建模式：以组件库实际的 `lib.config.ts` 和包导出为准

### resolver 没有生效

确认组件名使用正确前缀（例如 `PlButton`），并检查 `Components(...)` 是否确实加入 Vite 的 `plugins`。
