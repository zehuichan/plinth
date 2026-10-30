# 给 AI 助手

本页面向使用 Cursor、Claude Code、Codex 等 AI 编码助手的开发者。完成后，你会让助手按组件库真实的接口写代码，而不是凭其他组件库的经验猜属性名。

组件库构建时会从源码和文档里生成三份给 AI 读的资料。它们都是生成物，不需要手写，也不需要额外发布包。

| 资料                             | 形态                                     | 适合                                     |
| -------------------------------- | ---------------------------------------- | ---------------------------------------- |
| [Skills](/guide/ai/skills)       | 随包发布的 `SKILL.md` 与组件接口参考     | 助手支持技能机制，希望离线、版本一致     |
| [LLMs.txt](/guide/ai/llms)       | 文档站根目录的 `llms.txt`、单页 Markdown | 助手能读取网页，或要把文档喂给任意模型   |
| [Design.md](/guide/ai/design-md) | 从设计令牌生成的 `design.md`             | 让助手遵守配色、圆角、间距，而不是自创值 |

## 最快的接入方式

在业务项目里安装组件库后，把下面这段话发给助手即可：

```text
请使用 @plinth/ui 组件库。写代码前先阅读它随包发布的技能：
node_modules/@plinth/ui/dist/skills/ 下的 SKILL.md。
需要某个组件的属性、事件、插槽时，打开 references 里对应的文件，
不要凭其他组件库的经验猜接口。主题只通过 CSS 变量调整。
```

技能目录名由包名派生，例如 `@acme/ui` 对应 `acme-ui`，所以提示词里只写到 `skills/` 这一层，让助手自己列目录。

## 让助手自动发现技能

支持 `skills` 命令行工具的助手可以一条命令把依赖里的技能同步到项目：

```bash
npx skills experimental_sync -y
```

它会扫描 `node_modules` 里每个依赖的 `dist/skills/`，把技能链接到 `.agents/skills/` 等助手读取的目录。组件库升级后重新执行一次，技能就会跟着换成新版本。

不想用这个命令，也可以直接复制 `dist/skills/` 下的整个目录到助手读取技能的位置。详细说明见 [Skills](/guide/ai/skills)。

## 没有技能机制时

把站点上的 `llms.txt` 地址贴进对话，助手会按索引读取需要的页面：

```text
<站点地址>/llms.txt
```

也可以直接给单个组件的 Markdown，例如 `<站点地址>/components/button.md`。细节见 [LLMs.txt](/guide/ai/llms)。

## 怎么选

- 日常写业务代码：用 **Skills**。它在本地，不依赖网络，版本和你安装的包完全一致。
- 临时问一个问题，或工具不认识技能：用 **LLMs.txt**。
- 要让助手生成界面、做配色或写主题：额外让它读 **Design.md**，它已经包含在技能的参考里。

## 给组件库作者

这些资料的质量完全来自你写的源码和文档：

- 组件的每个 prop、emit、slot 的 JSDoc，决定助手看到的接口说明。
- `docs/components/<seg>/index.md` 的 API 表和示例，决定参考文件的内容。
- `packages/core/styles/tokens.css` 的令牌命名，决定 `design.md` 的结构。

所以补全文档和注释，就是在改善助手的表现。生成物不要手改：`dist/skills/` 和 `docs/public/` 下的文件下次构建都会被覆盖。新增组件时的文档要求见[新增组件](/guide/component-sop)。
