import { camel, kebab, pascal } from './naming.mjs';

export function componentIndex({ prefix, name }) {
  const seg = kebab(name);
  return `export { default } from './${seg}.vue';
export { default as ${prefix}${pascal(name)} } from './${seg}.vue';
`;
}

export function componentSfc({ prefix, cssPrefix, name, withStyle, preprocessor = 'none' }) {
  const block = kebab(name);
  const cls = `${cssPrefix}-${block}`;
  const lang =
    preprocessor === 'scss' ? ' lang="scss"' : preprocessor === 'less' ? ' lang="less"' : '';
  const style = withStyle
    ? `
<style${lang}>
.${cls} {
  color: var(--${cssPrefix}-color-text);
}
</style>
`
    : '';
  return `<script setup lang="ts">
import { createNamespace } from '@internal/utils';

defineOptions({ name: '${prefix}${pascal(name)}' });

const ns = createNamespace('${block}');
</script>

<template>
  <div :class="ns.b()">
    <slot />
  </div>
</template>
${style}`;
}

export function componentDocs({ prefix, name }) {
  return `---
title: ${pascal(name)}
group: 基础组件
order: 100
---

# ${prefix}${pascal(name)}

请在此说明组件用途和不适用场景。

## 基础用法

<demo vue="./demo/basic.vue" />

## API

### Props

请在此补充属性说明。

### Events

请在此补充事件说明。

### Slots

请在此补充插槽说明。
`;
}

export function componentDemo({ prefix, pkgName, name }) {
  const comp = `${prefix}${pascal(name)}`;
  return `<script setup lang="ts">
import { ${comp} } from '${pkgName}';
</script>

<template>
  <${comp} />
</template>
`;
}

export function hookIndex({ name }) {
  return `export function ${camel(name)}() {
  return true;
}
`;
}

export function hookDocs({ name }) {
  return `---
title: ${camel(name)}
group: 组合式函数
order: 100
---

# ${camel(name)}

请在此说明组合式函数的用途。

## 基础用法

\`\`\`ts
import { ${camel(name)} } from '@plinth/ui';
\`\`\`

## API

请在此补充参数与返回值说明。
`;
}
