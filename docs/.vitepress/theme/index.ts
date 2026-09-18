import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { installUi } from './ui';
import './styles/layout.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    installUi(app);
  },
} satisfies Theme;
