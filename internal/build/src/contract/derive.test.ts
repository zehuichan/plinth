import { describe, expect, it } from 'vitest';
import { derive } from './derive.ts';

describe('derive', () => {
  it('finds PlButton and useToggle', () => {
    const contract = derive();
    expect(contract.components.map((c) => c.exportName)).toContain('PlButton');
    expect(contract.components[0]?.hasStyle).toBe(true);
    expect(contract.hooks.map((h) => h.exportName)).toContain('useToggle');
  });
});
