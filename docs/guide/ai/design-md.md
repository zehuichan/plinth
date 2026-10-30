# Design.md

[DESIGN.md](https://github.com/google-labs-code/design.md) 是一种描述设计系统的格式：开头的 YAML 写机器可读的设计令牌（颜色、字体、圆角、间距），后面的 Markdown 写人和模型都能读懂的使用说明。助手读到它，生成界面时就会沿用库里的配色和尺寸，而不是自己编一套。

## 产物

构建时会从组件库自己的令牌层生成一份 `design.md`：

- 文档站：`/design.md`，见 [LLMs.txt](/guide/ai/llms)。
- 随包技能：`references/design.md`，见 [Skills](/guide/ai/skills)。

生成来源是 `packages/core/styles/tokens.css`，以及组件样式里引用了哪些变量。令牌之间形如 `var(--pl-color-primary)` 的引用会被展开成最终值，所以 YAML 里写的是确定的值，同时正文里仍保留变量名，助手知道该覆盖哪个变量。

## 文件结构

```text
---
version: alpha
name: "@acme/ui"
description: ...
colors:
  primary: "#1677ff"
omitted:
  - section: typography
    reason: ...
---

# @acme/ui design language

## Overview
## Colors
## Components
## Do's and Don'ts
```

正文章节顺序遵循规范：Overview、Colors、Typography、Layout、Shapes、Components、Do's and Don'ts。没有对应令牌的分组不会生成章节，并在 `omitted` 里声明，这样官方检查工具不会提示缺失。`components` 一项始终声明为省略：组件的样式用正文里的 Components 章节描述，不写成 YAML 令牌。

## 令牌命名约定

生成器按去掉前缀后的变量名决定令牌归属。下面是识别规则：

| 变量名                                                                         | 归入                    | 示例                        |
| ------------------------------------------------------------------------------ | ----------------------- | --------------------------- |
| `color-*`                                                                      | `colors`                | `--pl-color-primary`        |
| `radius-*` 或 `rounded-*`                                                      | `rounded`               | `--pl-radius-md: 6px`       |
| `space-*` 或 `spacing-*`                                                       | `spacing`               | `--pl-space-md: 16px`       |
| `font-size-<层级>`，可选搭配全局的 `font-family`、`font-weight`、`line-height` | `typography`            | `--pl-font-size-body: 14px` |
| 其他                                                                           | 正文末尾的 Other Tokens | `--pl-z-modal: 1000`        |

值需要能被规范表达，否则会降级到 Other Tokens：

- 颜色必须是合法的 CSS 颜色。引用其他令牌的写法会先展开再判断。
- 尺寸用 `px`、`em` 或 `rem`。
- 字号层级要有 `font-size-<层级>` 这样的名字，层级名会成为排版令牌的名字，例如 `body`、`title`。

当前模板只有 5 个颜色令牌（`primary`、`primary-text`、`text`、`bg`、`border`），所以 `typography`、`rounded`、`spacing` 会被标为省略。新增令牌后重新构建，对应章节会自动出现，不需要改生成器。

## 组件对应的令牌

`Components` 章节列出每个组件的样式引用了哪些变量。这部分是扫描组件样式里形如 `var(--pl-color-primary)` 的引用得到的，所以组件样式应当读取令牌，不要硬编码颜色。硬编码的值助手看不到，用户也无法通过覆盖变量来主题化。

## 校验

官方提供了检查工具，可以验证令牌引用、颜色格式和章节顺序：

```bash
pnpm build:ai
npx @google/design.md lint docs/public/design.md
```

没有错误和警告就说明格式合规。提示级别的信息（例如声明了省略的分组）属于正常输出。

## 注意

- `design.md` 是生成物，不要手改，下次构建会覆盖。想改内容，改 `tokens.css` 的变量或组件样式。
- 它描述的是令牌层，不替代组件文档。具体组件的属性和用法见各组件页面。
