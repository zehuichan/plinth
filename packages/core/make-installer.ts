import type { App, Component, Plugin } from 'vue';

const INSTALLED_KEY = Symbol.for('plinth:installed');

type Installable = Component | Plugin;

export function makeInstaller(components: Installable[] = []) {
  const install = (app: App) => {
    const installed = app as App & { [INSTALLED_KEY]?: boolean };
    if (installed[INSTALLED_KEY]) return;
    installed[INSTALLED_KEY] = true;

    for (const comp of components) {
      if (
        comp &&
        typeof comp === 'object' &&
        'install' in comp &&
        typeof comp.install === 'function'
      ) {
        app.use(comp as Plugin);
        continue;
      }
      const candidate = comp as Component & { name?: string };
      if (candidate.name) app.component(candidate.name, candidate);
    }
  };

  return {
    version: '0.0.0',
    install,
  };
}
