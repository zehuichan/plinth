import { describe, expect, it } from 'vitest';
import { CSS_PREFIX } from './css-prefix';
import { createNamespace } from './namespace';

describe('createNamespace', () => {
  // Not the template prefix `pl`: bootstrap rewrites `pl-` in the expectations below but not this bare argument.
  const ns = createNamespace('button', 'ac');

  it('builds block, element and modifier names', () => {
    expect(ns.b()).toBe('ac-button');
    expect(ns.b('group')).toBe('ac-button-group');
    expect(ns.e('icon')).toBe('ac-button__icon');
    expect(ns.m('primary')).toBe('ac-button--primary');
    expect(ns.be('group', 'item')).toBe('ac-button-group__item');
    expect(ns.em('icon', 'large')).toBe('ac-button__icon--large');
  });

  it('emits state classes only when the condition holds', () => {
    expect(ns.is('disabled')).toBe('is-disabled');
    expect(ns.is('disabled', true)).toBe('is-disabled');
    expect(ns.is('disabled', false)).toBe('');
  });

  it('builds css variable names', () => {
    expect(ns.cssVar('color-primary')).toBe('--ac-color-primary');
    expect(ns.cssVarBlock('bg')).toBe('--ac-button-bg');
  });

  it('defaults to the configured library prefix', () => {
    const configured = createNamespace('button');
    expect(configured.prefix).toBe(CSS_PREFIX);
    expect(configured.b()).toBe(`${CSS_PREFIX}-button`);
  });
});
