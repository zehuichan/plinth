export interface LibConfig {
  name: string;
  installerName: string;
  installer: { skip: string[] };
  componentPrefix: string;
  cssPrefix: string;
  /** Source style language. Published CSS is unchanged. Default `none`. */
  preprocessor: 'none' | 'scss' | 'less';
  formats: Array<'es' | 'cjs'>;
  styles: 'inject' | 'sideEffects';
}

export function defineLibConfig(config: LibConfig): LibConfig {
  if (!config.name) throw new Error('lib.config: name is required');
  if (!config.installerName) throw new Error('lib.config: installerName is required');
  if (!/^[A-Z][A-Za-z0-9]+$/.test(config.componentPrefix) || config.componentPrefix.length < 2) {
    throw new Error('lib.config: componentPrefix must be PascalCase and at least 2 characters');
  }
  if (!config.cssPrefix) throw new Error('lib.config: cssPrefix is required');
  if (!config.formats?.length) throw new Error('lib.config: formats is required');
  if (config.styles !== 'inject' && config.styles !== 'sideEffects') {
    throw new Error('lib.config: styles must be inject | sideEffects');
  }
  const preprocessor = config.preprocessor ?? 'none';
  if (preprocessor !== 'none' && preprocessor !== 'scss' && preprocessor !== 'less') {
    throw new Error('lib.config: preprocessor must be none | scss | less');
  }
  return { ...config, preprocessor };
}
