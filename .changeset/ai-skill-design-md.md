---
"@plinth/ui": minor
---

Ship an agent skill with the package: `dist/skills/<name>/SKILL.md` plus `references/` for every component, composable and the consumer guide, generated from the docs at build time so it always matches the installed version. `pnpm build` also derives a `design.md` (Google Labs DESIGN.md format) from `tokens.css` into the skill references, and the docs site now publishes `llms.txt`, `llms-full.txt`, `design.md` and per-page Markdown.
