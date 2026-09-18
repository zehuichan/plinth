import { CSS_PREFIX } from './css-prefix';

const ELEMENT = '__';
const MODIFIER = '--';
const STATE = 'is-';

export interface Namespace {
  /** Configured library prefix, for example `pl`. */
  readonly prefix: string;
  /** Block name without the prefix, for example `button`. */
  readonly block: string;
  /** `pl-button`, or `pl-button-group` when a suffix is given. */
  b(blockSuffix?: string): string;
  /** `pl-button__icon` */
  e(element: string): string;
  /** `pl-button--primary` */
  m(modifier: string): string;
  /** `pl-button-group__item` */
  be(blockSuffix: string, element: string): string;
  /** `pl-button__icon--large` */
  em(element: string, modifier: string): string;
  /** `is-disabled`, or an empty string when the condition is false. */
  is(state: string, condition?: boolean): string;
  /** `--pl-color-primary` */
  cssVar(name: string): string;
  /** `--pl-button-bg` */
  cssVarBlock(name: string): string;
}

export function createNamespace(block: string, prefix: string = CSS_PREFIX): Namespace {
  const base = `${prefix}-${block}`;
  return {
    prefix,
    block,
    b: (blockSuffix) => (blockSuffix ? `${base}-${blockSuffix}` : base),
    e: (element) => `${base}${ELEMENT}${element}`,
    m: (modifier) => `${base}${MODIFIER}${modifier}`,
    be: (blockSuffix, element) => `${base}-${blockSuffix}${ELEMENT}${element}`,
    em: (element, modifier) => `${base}${ELEMENT}${element}${MODIFIER}${modifier}`,
    is: (state, condition = true) => (condition ? `${STATE}${state}` : ''),
    cssVar: (name) => `--${prefix}-${name}`,
    cssVarBlock: (name) => `--${prefix}-${block}-${name}`,
  };
}
