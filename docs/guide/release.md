# 发布

Plinth 使用 changesets 管理版本，并由 `scripts/release.mjs` 编排验证、提交、发布与打标签。

## 发布前准备

1. 确认 `packages/core/package.json` 中的包名和 `publishConfig` 正确。
2. 确认 `.npmrc` 指向目标 registry。
3. 登录 registry，并验证身份：

```bash
npm whoami --registry https://your-registry.example/
```

认证 token 应放在用户级 `~/.npmrc` 或环境变量中，不要提交到仓库。

## 记录变更

每个影响公开行为、类型或导出面的变更都应带一个 changeset：

```bash
pnpm changeset
```

选择要发布的包和版本级别：

- `patch`：兼容的修复
- `minor`：兼容的新功能
- `major`：破坏性变更

changeset 摘要会进入 CHANGELOG，应直接描述使用方能感知到的变化。

## 执行发布

发布前先提交业务代码和 changeset，并保持 Git 工作区干净：

```bash
git status
pnpm release
```

脚本按固定顺序执行：

1. 拒绝脏工作区
2. `changeset version` 更新版本与 CHANGELOG
3. `pnpm verify` 执行完整验证
4. 暂存并提交版本文件（含首次发布时新建的 `CHANGELOG.md`），提交信息形如 `chore: release @plinth/ui@1.2.3`
5. `pnpm -r publish --access public --no-git-checks` 发布所有非私有工作区包
6. `changeset tag` 创建标签，并确认标签指向刚才的发布提交

脚本不会推送远端。发布成功后手动执行：

```bash
git push --follow-tags
```

## 预览版本变化

```bash
pnpm release:dry
```

该命令会运行 `changeset version`，然后跳过验证、提交、发布和标签。它会在本地留下版本文件变更，适合检查版本号和 CHANGELOG；检查完成后请自行处理这些改动，再进行正式发布。

## 发布失败怎么办

- `Working tree is not clean`：提交或暂存无关改动后重试
- `npm whoami` 失败：检查 registry 和用户级 token
- `pnpm verify` 失败：修复错误并提交，重新从干净工作区发布
- 包已发布但后续步骤失败：先确认 registry 与 Git 的实际状态，不要直接重跑
- 发布了错误版本：优先发布补丁版本修复；确需撤回时遵循公司 registry 策略

::: warning 不要手工拆开发布流程
正式发布请只运行 `pnpm release`。不要单独执行 `changeset publish` 或先手工打标签，否则标签可能不指向发布提交。
:::
