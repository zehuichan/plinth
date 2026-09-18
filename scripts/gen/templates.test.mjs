import { describe, expect, it } from 'vitest';
import { componentSfc } from './templates.mjs';

const base = { prefix: 'Pl', cssPrefix: 'pl', name: 'tag', withStyle: true };

describe('componentSfc', () => {
  it('emits plain style when preprocessor is none', () => {
    const text = componentSfc({ ...base, preprocessor: 'none' });
    expect(text).toContain('<style>');
    expect(text).not.toContain('<style lang=');
  });

  it('emits lang=scss from lib.config', () => {
    const text = componentSfc({ ...base, preprocessor: 'scss' });
    expect(text).toContain('<style lang="scss">');
  });

  it('emits lang=less from lib.config', () => {
    const text = componentSfc({ ...base, preprocessor: 'less' });
    expect(text).toContain('<style lang="less">');
  });

  it('omits style when withStyle is false', () => {
    const text = componentSfc({ ...base, withStyle: false, preprocessor: 'scss' });
    expect(text).not.toContain('<style');
  });
});
