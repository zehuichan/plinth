import type { LibConfig } from '@internal/build';

const config: LibConfig = {
  name: '@plinth/ui',
  installerName: 'Plinth',
  installer: { skip: [] },
  componentPrefix: 'Pl',
  cssPrefix: 'pl',
  preprocessor: 'none',
  formats: ['es'],
  styles: 'inject',
};

export default config;
