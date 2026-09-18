# 拆分组合式函数

默认情况下，组合式函数位于私有包 `@internal/hooks`，最终从主包重新导出：

```ts
import { useToggle } from '@plinth/ui';
```

这适合绝大多数组件库：只有一个版本号、一个安装入口和一套发布流程。日常开发请继续从主包导入；只有真的要拆成独立公开包时才需要读完本页。

## 什么时候值得拆包

只有满足以下情况时才建议把 hooks 变成独立公开包：

- 非 UI 项目也要使用这些组合式函数
- hooks 的版本节奏需要与组件库解耦
- 团队愿意承担额外的构建、文档、变更记录和发布维护成本

仅仅为了支持 `import { useFoo }` 不需要拆包，主包已经提供具名导出。

## 拆包需要改什么

这不是只改一个包名。完整迁移至少包括：

1. 将 `packages/hooks/package.json` 改为公开包名，例如 `@acme/ui-hooks`
2. 设置 `"private": false`，设计 `files`、`exports`、`types` 和 `publishConfig`
3. 为 hooks 增加独立构建任务和声明文件产物
4. 在根 `turbo.json` 与 `pnpm build` / `pnpm verify` 中纳入新构建
5. 决定主包继续重新导出，还是要求使用方改为新入口
6. 调整 `@plinth/ui` 的 dependencies / peerDependencies 与 tsdown external 配置
7. 将 changesets 配置为独立版本或 fixed/linked 版本
8. 增加打包产物校验和独立使用示例

::: danger 不要直接把 private 改成 false
当前 `packages/hooks` 没有独立发布产物。只改 `"private": false` 会让 `pnpm release` 尝试发布一个入口不完整的包。
:::

## 推荐决策

组件库起步阶段保持默认结构。等真实使用方提出“只安装 hooks”的需求，再把拆包作为一次有迁移说明的架构变更。
