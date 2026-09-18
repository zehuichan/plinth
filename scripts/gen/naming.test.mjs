import { describe, expect, it } from 'vitest';
import { camel, kebab, pascal } from './naming.mjs';

describe('gen naming', () => {
  it('normalizes mixed input to kebab-case', () => {
    expect(kebab('DatePicker')).toBe('date-picker');
    expect(kebab('date picker')).toBe('date-picker');
    expect(kebab('date_picker')).toBe('date-picker');
    expect(kebab('date--picker')).toBe('date-picker');
  });

  it('derives component and hook identifiers', () => {
    expect(pascal('date-picker')).toBe('DatePicker');
    expect(camel('use-toggle')).toBe('useToggle');
    expect(camel('useToggle')).toBe('useToggle');
  });
});
