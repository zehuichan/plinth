<!-- template:foundation-start -->

# Plinth

Plinth 是一个 Vue 3 组件库底座（GitHub 模板仓库）。构建（tsdown）、文档站（VitePress）、组件生成器、契约校验、发布流程（changesets）都已经装好并互相打通，你只需要跑一次改名脚本，就能得到一套属于自己的组件库工程。

适合谁：要从零起一套 Vue 3 组件库，但不想重新踩一遍打包、d.ts、按需引入、文档站、发版这些坑。

## 环境要求

| 要求    | 版本     | 检查命令        |
| ------- | -------- | --------------- |
| Node.js | >= 20.19 | `node -v`       |
| pnpm    | >= 10    | `pnpm -v`       |
| Git     | 任意     | `git --version` |

只能用 pnpm，`preinstall` 会拦住 npm 和 yarn。没有 pnpm 时先执行 `npm i -g pnpm`。

## 第一步：从模板建自己的仓库

在 GitHub 页面点 **Use this template**，或者用 `gh`：

```bash
gh repo create acme/ui --template zehuichan/plinth --private
git clone git@github.com:acme/ui.git
cd ui
pnpm install
```

仓库若还没标成 Template，也可以直接 clone 再改 remote。`pnpm install` 必须在 `bootstrap` 之前做：改名脚本依赖仓库里已经装好的 `@clack/prompts`。

## 第二步：跑 `pnpm bootstrap` 改名

```bash
pnpm bootstrap
```

交互式会依次问下面几项：

| 问题             | 含义                                                         | 示例                                      |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------- |
| Package name     | 发布用的包名                                                 | `@acme/ui` 或 `acme-ui`                   |
| Component prefix | 组件名前缀，PascalCase 且至少 2 个字符                       | `Ac`，组件就叫 `AcButton`                 |
| CSS prefix       | 类名和 CSS 变量前缀                                          | `ac`，得到 `ac-button`、`--ac-color-text` |
| Installer name   | 默认导出和 Resolver 名                                       | `Acme` → `app.use(Acme)`、`AcmeResolver`  |
| npm registry URL | 必填，写进 `.npmrc` 和 `publishConfig`                       | `https://registry.npmjs.org/`             |
| UI framework     | `none` / `antdv` / `antdv-next` / `element-plus` / `tdesign` | `none`                                    |
| CSS preprocessor | 源码语法，`none` / `scss` / `less`                           | `none`（纯 CSS）                          |
| CI               | `github` / `gitlab` / `none`                                 | `github`                                  |
| Keep playground  | 是否保留本地调试工程                                         | `yes`                                     |
| License SPDX     | 许可证标识                                                   | `MIT`                                     |

`--installer` 的默认值是**未加作用域的包名**转 PascalCase：`@acme/ui` → `Ui`，`acme-ui` → `AcmeUi`。想得到示例里的 `Acme` / `AcmeResolver`，必须显式填写或传入 `--installer Acme`。

不想逐项回答就一条命令搞定：

```bash
pnpm bootstrap --yes --name @acme/ui --prefix Ac --installer Acme --registry https://registry.npmjs.org/ --ui none --preprocessor none
```

`--yes` 模式下 `--name`、`--prefix`、`--registry` 必填。其余默认：`--css-prefix` 取前缀小写，`--installer` 按上面的规则推导，`--ui none`，`--preprocessor none`，`--ci github`，`--license MIT`。加 `--no-playground` 会删掉 `playground/`，之后不要再跑 `pnpm dev`。

UI 选项对应的 npm 包：

| `--ui`         | 写入 peer / catalog 的包 | 文档站与 playground 引入        |
| -------------- | ------------------------ | ------------------------------- |
| `none`         | 无                       | 空的 `installUi`                |
| `antdv`        | `ant-design-vue`         | 全量注册 + `dist/reset.css`     |
| `antdv-next`   | `antdv-next`             | 全量注册 + `dist/reset.css`     |
| `element-plus` | `element-plus`           | 全量注册 + `dist/index.css`     |
| `tdesign`      | `tdesign-vue-next`       | 全量注册 + `es/style/index.css` |

选 `scss` 时基座会装 `sass-embedded` 并让生成器写出 `lang="scss"`；选 `less` 同理。

这一步实际顺序是：

1. 批量替换模板占位符：包名、组件前缀、`pl-` 类名、`--pl-` 变量、installer / Resolver 名。
2. 重写 `lib.config.ts`、`packages/utils/src/css-prefix.ts`、`.npmrc`、`packages/core/package.json`、`AGENTS.md`；按 UI 选择写入 `peerDependencies`、catalog，以及文档站和 playground 的 `installUi`。若选了预处理器，写入编译链依赖，并把已有库组件的 `<style>` 补上对应 `lang`。
3. 删掉模板自测工作流 `.github/workflows/template-e2e.yml` 和 plinth 自己的文档站部署 `.github/workflows/docs.yml`；按 CI 选择只保留 GitHub 或 GitLab 配置；若 `--no-playground` 则删除 `playground/`。
4. 裁掉本 README 里「底座教程」这一段，只留下下面给使用方看的库说明。
5. 扫描全仓（跳过 `scripts/bootstrap/`），确认没有 `@plinth/ui`、`PlinthResolver`、`PlButton`、`--pl-`、`Plinth` 残留。
6. 删掉 `scripts/bootstrap/` 和根目录 `package.json` 里的 `bootstrap` 脚本——**只能跑一次，跑完就自我删除**。

## 第三步：重装依赖并验证

```bash
pnpm install
pnpm verify
```

包名和依赖被改过了，所以要再装一次。`pnpm verify` 依次跑类型检查、lint、单元测试、契约校验、文档覆盖校验和构建，全绿说明底座没被改坏。构建末尾出现 `attw` 提示 `style.css`、`tokens.css` 无类型解析是已知噪音，可以忽略。`check:cspell` 不在 `verify` 里，需要时单独跑。

## 第四步：写第一个组件

```bash
pnpm gen component
```

回答两个问题（不带前缀的组件名、单文件组件是否带 `<style>`）。样式语言不在这里问，它来自 `lib.config.ts` 的 `preprocessor`。生成器会写好四个文件并自动同步契约：

```
packages/components/date-picker/index.ts
packages/components/date-picker/date-picker.vue
docs/components/date-picker/index.md
docs/components/date-picker/demo/basic.vue
```

测试文件要自己加，生成器不会猜业务行为。

也支持非交互：`pnpm gen component date-picker --style`（或 `--no-style`）。组合式函数用 `pnpm gen hook`。

接着 `pnpm dev` 在 playground 里调组件，`pnpm dev:docs` 看文档站效果，最后 `pnpm verify` 收口。更完整的日常流程见 `docs/guide/getting-started.md`。

## 样式：出厂纯 CSS，预处理器在 bootstrap 里选

基座**出厂不装**预处理器。作者在 `pnpm bootstrap` 时选 `none` / `scss` / `less`（`--preprocessor`），基座会写好依赖和 `lib.config.ts`。之后 `pnpm gen component` 读取这个字段，带样式的骨架自动带上对应 `lang`，不必再手改各包依赖。完整说明见 `docs/guide/styling.md`。

出厂（`none`）写法：

```vue
<style>
.pl-button {
  color: var(--pl-color-text);
}
</style>
```

不要加 `scoped`。隔离靠类名前缀。换肤改 `packages/core/styles/tokens.css`。按需引入的使用方还要单独引 `@scope/pkg/tokens.css`（完整引入的 `style.css` 已包含）。

选 `scss` 或 `less` 不会改变对外契约：发布物仍是 CSS，使用方不装预处理器。不要根据 Ant Design Vue、Antdv Next、Element Plus 或 TDesign 的源码语言来选。

初始化之后若要改选择：步骤见 `docs/guide/styling.md`。

## 日常命令

| 命令                 | 用途                                                  |
| -------------------- | ----------------------------------------------------- |
| `pnpm dev`           | 启动 playground，快速调组件                           |
| `pnpm dev:docs`      | 启动 VitePress 文档站                                 |
| `pnpm gen component` | 新增组件（源码 + 文档 + 示例 + 契约同步）             |
| `pnpm gen hook`      | 新增组合式函数                                        |
| `pnpm gen sync`      | 只重新生成契约文件                                    |
| `pnpm build`         | 构建发布包                                            |
| `pnpm verify`        | 合并前的总闸：类型 + lint + 测试 + 契约 + 文档 + 构建 |
| `pnpm lint:fix`      | 自动修 lint                                           |
| `pnpm format`        | 格式化全仓                                            |
| `pnpm changeset`     | 记录一次要发布的变更                                  |
| `pnpm release`       | 升版本、验证、提交、发布、打标签（不推送）            |
| `pnpm release:dry`   | 只跑 `changeset version`，不验证、不提交、不发布      |
| `pnpm clean`         | 清理缓存（`.turbo` / `.cache` / coverage / 文档缓存） |
| `pnpm clean:hard`    | 额外删除 `dist`、`es` 和 `node_modules`               |

## 目录结构

```
packages/
  core/          发布包：入口、resolver、makeInstaller、设计令牌
  components/    组件源码（私有包 @internal/components）
  hooks/         组合式函数（私有包 @internal/hooks）
  utils/         内部工具（私有包 @internal/utils）
internal/
  build/         tsdown 构建 + 契约层（derive / sync / check）
  tsconfig/      共享 tsconfig
docs/            VitePress 文档站，侧边栏由文件系统推导
playground/      本地调试工程
scripts/
  gen/           pnpm gen 生成器
  bootstrap/     pnpm bootstrap（用完自删）
  release.mjs    发布编排
lib.config.ts    包名、前缀、预处理器、构建形态的唯一来源
```

## 契约层：别手改生成的文件

组件清单不靠手写维护，而是扫描 `packages/components/` 和 `packages/hooks/src/` 推导出来，再生成这些文件：

- `packages/components/index.ts`
- `packages/hooks/src/index.ts`
- `packages/core/component.ts`
- `packages/core/resolver-map.ts`
- `packages/utils/src/css-prefix.ts`
- `internal/build/src/generated-entries.ts`
- `typings/global.d.ts`

它们头部都带 `// generated by contract:sync`。改组件目录后跑 `pnpm gen sync` 重新生成即可，`pnpm verify` 里的 `check:contract` 会拦住忘记同步的情况。

## 发布

```bash
pnpm changeset
pnpm release
git push --follow-tags
```

`pnpm release` 会升版本、跑 `pnpm verify`、提交版本文件（含首次出现的 `CHANGELOG.md`）、以 `--access public --no-git-checks` 发布非私有包、打标签，但**不会**自动推送。注册地址取自 `.npmrc` 和 `publishConfig`，不硬编码。工作区必须干净。不要单独跑 `changeset publish` 或先手工打标签。

## 常见问题

**`preinstall` 报 `only-allow pnpm`**：这个仓只认 pnpm，把 `npm install` 换成 `pnpm install`。

**bootstrap 报 `--prefix must be PascalCase and at least 2 characters`**：前缀要大写开头且至少两个字符，`Ac` 可以，`A` 和 `ac` 不行。

**bootstrap 报 `--registry is required`**：注册地址没有默认值，必须显式给；只在本地玩可以先填 `https://registry.npmjs.org/`。

**默认导出变成了 `Ui`**：`--installer` 从 `@acme/ui` 推导出的是 `Ui`。加上 `--installer Acme`。

**想再跑一次 bootstrap**：它已经把自己删了，重新从模板建一个仓库即可。

**`pnpm dev` 失败、找不到 playground**：初始化时选了不要 playground，或加了 `--no-playground`。调组件改用 `pnpm dev:docs`。

**文档站组件页报 `Failed to resolve import`**：`packages/components/<seg>/` 和 `docs/components/<seg>/` 必须成对存在。删组件时两边都要删，然后 `pnpm gen sync` + `pnpm verify`。

**想用 SCSS / Less**：在 `pnpm bootstrap` 时用 `--preprocessor scss` 或 `less`。基座会装编译器，`pnpm gen component` 会带上 `lang`。接 Ant Design Vue / TDesign 不等于必须装 Less，接 Antdv Next 也不等于必须改预处理器。

初始化之后的文档入口是 `docs/guide/`：快速开始、新增组件、样式规范、使用组件库、UI 框架、发布、拆分组合式函数。

---

下面这一节是 `pnpm bootstrap` 之后保留下来的 README 正文，里面的占位符会被替换成你自己的名字。

<!-- template:foundation-end -->

<!-- template:library-start -->

# @plinth/ui

基于 Vue 3 的组件库。要求业务项目使用 Vue 3。若本库在初始化时接入了第三方 UI 框架，业务项目还需安装对应的 `peerDependencies`。

## 安装

```bash
pnpm add @plinth/ui
```

## 完整引入

```ts
import { createApp } from 'vue';
import Plinth from '@plinth/ui';
import '@plinth/ui/style.css';

createApp(App).use(Plinth).mount('#app');
```

`style.css` 已包含设计令牌。全量注册后若要让模板里的 `<PlButton />` 有类型提示，在业务项目 `tsconfig.json` 的 `compilerOptions.types` 中加入 `@plinth/ui/global`。

## 按需引入

配合 `unplugin-vue-components` 自动按需引入。默认构建是 `styles: 'inject'`：分包 JS 会自己引入组件 CSS，保持 `resolveStyle: false`，也不要再引 `style.css`。

```ts
import Components from 'unplugin-vue-components/vite';
import { PlinthResolver } from '@plinth/ui/resolver';

export default {
  plugins: [Components({ resolvers: [PlinthResolver()] })],
};
```

按需引入时在应用入口补一次设计令牌（完整引入不必再写）：

```ts
import '@plinth/ui/tokens.css';
```

也可以只引单个分包入口：

```ts
import { PlButton } from '@plinth/ui/es/button';
```

从 `@plinth/ui` 具名导入会走到主包入口，不是按需分包。

## 参与开发

```bash
pnpm install
pnpm dev           # playground 调组件（若初始化时保留了 playground）
pnpm dev:docs      # 文档站
pnpm gen component # 新增组件
pnpm verify        # 提交前的总闸
```

带 `// generated by contract:sync` 标记的文件由 `pnpm gen sync` 生成，不要手改。

组件样式不要写 `scoped`。类名走 `createNamespace`，变量用 `--pl-*`。预处理器以 `lib.config.ts` 的 `preprocessor` 为准，`pnpm gen component` 按它生成 `lang`。不要把 `.scss` / `.less` 写进发布 `exports`。约定见 `docs/guide/styling.md`。

<!-- template:library-end -->
