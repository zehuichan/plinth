import { describe, expect, it } from 'vitest';
import { CSS_PREFIX } from './css-prefix';
import { createNamespace } from './namespace';

describe('createNamespace', () => {
  const ns = createNamespace('button', 'pl');

  it('builds block, element and modifier names', () => {
    expect(ns.b()).toBe('pl-button');
    expect(ns.b('group')).toBe('pl-button-group');
    expect(ns.e('icon')).toBe('pl-button__icon');
    expect(ns.m('primary')).toBe('pl-button--primary');
    expect(ns.be('group', 'item')).toBe('pl-button-group__item');
    expect(ns.em('icon', 'large')).toBe('pl-button__icon--large');
  });

  it('emits state classes only when the condition holds', () => {
    expect(ns.is('disabled')).toBe('is-disabled');
    expect(ns.is('disabled', true)).toBe('is-disabled');
    expect(ns.is('disabled', false)).toBe('');
  });

  it('builds css variable names', () => {
    expect(ns.cssVar('color-primary')).toBe('--pl-color-primary');
    expect(ns.cssVarBlock('bg')).toBe('--pl-button-bg');
  });

  it('defaults to the configured library prefix', () => {
    const configured = createNamespace('button');
    expect(configured.prefix).toBe(CSS_PREFIX);
    expect(configured.b()).toBe(`${CSS_PREFIX}-button`);
  });
});
