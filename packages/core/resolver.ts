import { COMPONENT_MAP } from './resolver-map';

export interface PlinthComponentResolver {
  type: 'component';
  resolve: (
    name: string,
  ) => undefined | { from: string; name: string; sideEffects?: string[] | string };
}

export interface PlinthResolverOptions {
  exclude?: ReadonlyArray<RegExp | string> | RegExp | null | string;
  importFrom?: string;
  resolveStyle?: boolean;
}

function matches(name: string, pattern: RegExp | string): boolean {
  return typeof pattern === 'string' ? name === pattern : pattern.test(name);
}

function isExclude(name: string, exclude: PlinthResolverOptions['exclude']): boolean {
  if (!exclude) return false;
  if (typeof exclude === 'string' || exclude instanceof RegExp) return matches(name, exclude);
  return exclude.some((item) => matches(name, item));
}

export function PlinthResolver(options: PlinthResolverOptions = {}): PlinthComponentResolver {
  const importFrom = options.importFrom ?? '@plinth/ui/es';
  const resolveStyle = options.resolveStyle ?? false;
  return {
    type: 'component',
    resolve(name) {
      if (isExclude(name, options.exclude)) return undefined;
      const item = COMPONENT_MAP[name as keyof typeof COMPONENT_MAP];
      if (!item) return undefined;
      const result: { from: string; name: string; sideEffects?: string } = {
        from: `${importFrom}/${item.seg}`,
        name,
      };
      if (resolveStyle && item.hasStyle) {
        result.sideEffects = `${importFrom}/${item.seg}/index.css`;
      }
      return result;
    },
  };
}
