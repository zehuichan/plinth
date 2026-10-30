# Skills

Skill 是 AI 编码助手读取的一组说明文件：一个入口 `SKILL.md`，加上按需打开的参考文档。组件库把它随包发布，助手装好依赖就能拿到与当前版本一致的接口说明。

## 产物结构

`pnpm build` 会在发布包里生成技能目录：

```text
node_modules/@plinth/ui/dist/skills/<技能名>/
├── SKILL.md
└── references/
    ├── design.md
    ├── components/<组件目录>.md
    ├── hooks/<函数名>.md
    └── guide/consumer.md
```

- `SKILL.md` 是入口。它说明如何安装和注册、有哪些约定，并列出所有组件与组合式函数，每一项链接到对应的参考文件。助手先读它，再按需打开参考文件。
- `references/components/` 和 `references/hooks/` 来自文档站的页面，包含属性、事件、插槽表，以及示例代码。
- `references/guide/consumer.md` 是[使用组件库](/guide/consumer)，覆盖私有源、按需引入和常见问题。
- `references/design.md` 是[设计令牌](/guide/ai/design-md)。

## 技能名

技能名由包名派生：转为小写，去掉开头的 `@`，其余字母和数字以外的字符（包括 `/`）统一换成 `-`，最长 64 个字符。`@acme/ui` 对应 `acme-ui`。目录名与 `SKILL.md` 里的 `name` 一致，这是技能规范的要求。

## 内容从哪里来

没有任何内容是手写的，也不需要维护第二份：

| 位置                             | 来源                                                   |
| -------------------------------- | ------------------------------------------------------ |
| `SKILL.md` 的安装与注册说明      | `lib.config.ts` 里的包名、安装器名、组件前缀、CSS 前缀 |
| `SKILL.md` 的组件、函数列表      | 与全局类型、resolver 同源的组件契约                    |
| `references/components`、`hooks` | `docs/components`、`docs/hooks` 页面，示例源码已内联   |
| `references/design.md`           | `packages/core/styles/tokens.css` 与组件样式           |

文档里的 VitePress 容器（例如提示块）会转成普通引用块，站内链接会改写成相对路径，保证脱离文档站也能读。

## 使用技能

### 自动同步

```bash
npx skills experimental_sync -y
```

命令会扫描依赖，发现 `dist/skills/` 下的技能，并链接到项目里助手读取的目录。组件库升级后重新执行即可。

### 手动复制

把 `dist/skills/<技能名>/` 整个目录复制到助手读取技能的位置，常见的是项目下的 `.agents/skills/` 或 `.claude/skills/`。手动复制不会随依赖升级自动更新，升级后需要重新复制。

## 更新与发布

技能跟随包版本发布，不需要单独的流程：

1. 修改组件、文档或令牌。
2. 执行 `pnpm build`，技能会重新生成。
3. 照常[发布](/guide/release)。

`packages/core/package.json` 的 `files` 已包含 `dist`，所以技能会自动进入发布包。构建缓存也把文档目录算作输入：只改了文档、没改源码，`pnpm build` 同样会重新生成技能。

## 注意

- `dist/skills/` 是生成物，不要手改，也不要提交。
- 没有写在文档里的 API，助手就看不到。新增或修改组件时，同步更新 `docs/components/<组件目录>/index.md`。缺少文档页时 `pnpm check:docs` 会失败，但它只检查页面是否存在，不检查内容是否完整。
- 技能只覆盖组件、组合式函数和使用指南，不包含开发这个仓库本身的规范。仓库内的协作约定见根目录 `AGENTS.md`。
