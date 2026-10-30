# 快速开始

本页面向第一次接触此仓库的开发者。完成后，你会启动本地环境、修改示例组件，并知道一次组件变更如何通过验证。

::: tip 还没有初始化仓库？
如果仓库中仍然存在 `pnpm bootstrap`，请先按照根目录 `README.md` 完成一次性初始化，再回到这里。初始化会设置包名、组件前缀、注册地址、UI 框架，以及 CSS 预处理器（`none` / `scss` / `less`）。预处理器选完后，`pnpm gen component` 会按 `lib.config.ts` 写出对应的 `<style lang>`。
:::

## 环境准备

- Node.js `>= 20.19`
- pnpm `>= 10`
- Git

```bash
node -v
pnpm -v
git --version
```

此仓库只允许使用 pnpm。第一次拉取代码后安装依赖：

```bash
pnpm install
```

## 启动开发环境

组件开发通常同时使用两个入口：

```bash
# 启动 playground，适合快速调试组件
pnpm dev

# 启动 VitePress，检查文档与示例
pnpm dev:docs
```

终端会打印本地访问地址。两个命令需要分别占用一个终端。

## 认识示例代码

仓库预置了最小的 `PlButton` 和 `useToggle`，用于证明整条链路可用：

- `packages/components/button/`：组件源码与单元测试
- `packages/hooks/src/use-toggle/`：组合式函数源码
- `docs/components/button/`：组件文档和可运行示例
- `docs/hooks/use-toggle/`：组合式函数文档

它们是实验品，不代表业务设计规范。建立自己的组件库后，可以改写或删除。

## 新增第一个组件

```bash
pnpm gen component
```

例如输入 `date-picker`。组件前缀由 `lib.config.ts` 的 `componentPrefix` 决定，不要在输入时重复写 `Pl`。样式语言由同一份配置里的 `preprocessor` 决定：bootstrap 选了 `scss` 或 `less` 时，生成的 SFC 会带上对应 `lang`；选 `none` 则是纯 `<style>`。

生成器会创建源码、文档和示例，并自动同步公开导出、resolver 和全局类型。随后：

1. 在 `packages/components/date-picker/date-picker.vue` 实现组件。
2. 新建 `date-picker.test.ts`，覆盖最重要的交互和边界。
3. 在 `docs/components/date-picker/index.md` 写清用途、示例和 API。
4. 在 playground 中调试，在文档站中检查示例。

完整规范见[新增组件](/guide/component-sop)。

## 提交前验证

```bash
pnpm verify
```

该命令会依次执行：

1. TypeScript 与 Vue 类型检查
2. ESLint
3. Vitest
4. 源码与生成契约的一致性检查
5. 文档覆盖检查
6. 发布包构建与包结构检查

只有全部通过，才说明这次变更具备进入主分支的基本条件。

## 接下来

- 要在业务项目里安装组件库：阅读[使用组件库](/guide/consumer)
- 要新增或删除组件：阅读[新增组件](/guide/component-sop)
- 要写类名、主题变量或接 SCSS / Less：阅读[样式规范](/guide/styling)
- 要封装 Ant Design Vue / Antdv Next / Element Plus / TDesign：阅读[UI 框架](/guide/ui-framework)
- 要让 AI 助手按真实接口使用组件库：阅读[给 AI 助手](/guide/ai/for-agents)
- 要准备版本：阅读[发布](/guide/release)
- 要把 hooks 拆成独立公开包：阅读[拆分组合式函数](/guide/split-hooks)
