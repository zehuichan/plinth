import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';
import { vitepressDemoPlugin } from 'vitepress-demo-plugin';
import llmstxt from 'vitepress-plugin-llms';
import { deriveSidebar } from './config/sidebar';

const docsRoot = fileURLToPath(new URL('..', import.meta.url));
const pkgRoot = fileURLToPath(new URL('../../packages/core/index.ts', import.meta.url));

export default defineConfig({
  title: '@plinth/ui',
  lang: 'zh-CN',
  description: 'Vue 3 组件库',
  vite: {
    plugins: [llmstxt()],
    resolve: {
      alias: {
        '@plinth/ui': pkgRoot,
      },
    },
  },
  markdown: {
    config(md) {
      md.use(vitepressDemoPlugin);
    },
  },
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '组件', link: '/components/button/' },
      { text: '组合式函数', link: '/hooks/use-toggle/' },
    ],
    sidebar: deriveSidebar(docsRoot),
    socialLinks: [],
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    langMenuLabel: '切换语言',
    skipToContentLabel: '跳转到正文',
    notFound: {
      title: '页面未找到',
      quote: '你访问的页面不存在或已被移动。',
      linkLabel: '返回首页',
      linkText: '返回首页',
    },
  },
});
