export const UI_FRAMEWORKS = {
  none: {
    peer: {},
    site: {},
    cspell: [],
    uiTs: `import type { App } from 'vue';\n\nexport const installUi = (_app: App) => {};\n`,
  },
  antdv: {
    peer: { 'ant-design-vue': '^4.2.6' },
    site: { 'ant-design-vue': 'catalog:' },
    cspell: ['antd'],
    uiTs: `import type { App } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

export const installUi = (app: App) => {
  app.use(Antd);
};
`,
  },
  'antdv-next': {
    peer: { 'antdv-next': '^1.5.4' },
    site: { 'antdv-next': 'catalog:' },
    cspell: ['antdv'],
    uiTs: `import type { App } from 'vue';
import Antd from 'antdv-next';
import 'antdv-next/dist/reset.css';

export const installUi = (app: App) => {
  app.use(Antd);
};
`,
  },
  'element-plus': {
    peer: { 'element-plus': '^2.11.2' },
    site: { 'element-plus': 'catalog:' },
    cspell: [],
    uiTs: `import type { App } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

export const installUi = (app: App) => {
  app.use(ElementPlus);
};
`,
  },
  tdesign: {
    peer: { 'tdesign-vue-next': '^1.20.8' },
    site: { 'tdesign-vue-next': 'catalog:' },
    cspell: ['tdesign'],
    uiTs: `import type { App } from 'vue';
import TDesign from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';

export const installUi = (app: App) => {
  app.use(TDesign);
};
`,
  },
};

export function catalogVersions() {
  return {
    'ant-design-vue': '^4.2.6',
    'antdv-next': '^1.5.4',
    'element-plus': '^2.11.2',
    'tdesign-vue-next': '^1.20.8',
  };
}
