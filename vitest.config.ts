import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['scripts/**/*.test.mjs', 'internal/**/*.test.ts'],
        },
      },
      {
        plugins: [vue()],
        test: {
          name: 'dom',
          environment: 'happy-dom',
          include: ['packages/**/*.test.ts'],
        },
      },
    ],
  },
});
