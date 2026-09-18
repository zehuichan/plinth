# Changelog

## Unreleased

First usable template: Vue 3 + tsdown + filesystem contract + `pnpm gen` + VitePress + changesets + `pnpm bootstrap`.

Class names come from `createNamespace` (BEM) in `@internal/utils`; the css prefix lives only in `lib.config.ts` and is generated into `packages/utils/src/css-prefix.ts` by `pnpm gen sync`.

The design tokens ship twice: bundled into `./style.css` for full installs, and standalone as `./tokens.css` for on-demand consumers (`es/*` chunks carry component rules only). `./global` is exported (types-only) so consumers can add `@plinth/ui/global` to `compilerOptions.types` for template-level component typing.

BEM naming and CSS preprocessor choice live in one guide: `docs/guide/styling.md`.

`pnpm bootstrap --ui` accepts `none` | `antdv` | `antdv-next` | `element-plus` | `tdesign`. `antdv-next` installs the `antdv-next` package and `dist/reset.css` for docs and playground. `tdesign` installs `tdesign-vue-next` and `es/style/index.css`.

### Intentional gaps vs a production Ant Design Vue kit (e.g. company libraries)

These are documented, not missing by accident:

- No web-types / VS Code custom data (add later from SFC AST).
- No CJS until `lib.config.ts` `formats` includes `cjs`.
- Hooks stay private (`@internal/hooks`); split with `docs/guide/split-hooks.md`.
- Resolver is `@plinth/ui/resolver`, not a third published package.
- No locale package, no antdv wrapper seeds (`api-select` and friends). Add those as library components after bootstrap `--ui antdv` or `--ui antdv-next`.
- attw warns on the CSS exports (`./style.css`, `./tokens.css`) because CSS has no types; treat as known noise.
- No Less/SCSS in the template by default. The library author picks `preprocessor` at bootstrap (`none` | `scss` | `less`); `pnpm gen component` emits the matching `lang`. See `docs/guide/styling.md`.
