import { describe, expect, it } from 'vitest';
import {
  collectComponentDocs,
  deprecation,
  emitDeprecations,
  emitDescriptions,
  eventArguments,
  hyphenate,
  literalOptions,
  stripUndefined,
} from './collect.ts';

describe('type helpers', () => {
  it('hyphenates component and prop names', () => {
    expect(hyphenate('PlDatePicker')).toBe('pl-date-picker');
    expect(hyphenate('update:modelValue')).toBe('update:model-value');
  });

  it('strips undefined and reads string literal options', () => {
    expect(stripUndefined('"default" | "primary" | undefined')).toBe('"default" | "primary"');
    expect(literalOptions('"default" | "primary"')).toEqual(['default', 'primary']);
    expect(literalOptions('boolean')).toBeUndefined();
    expect(literalOptions('"a" | number')).toBeUndefined();
  });

  it('parses event arguments after the event name', () => {
    expect(eventArguments('(event: "click", event: MouseEvent): void')).toEqual([
      { name: 'event', type: 'MouseEvent' },
    ]);
    expect(
      eventArguments('(event: "change", value: string, cb: (a: number) => void): void'),
    ).toEqual([
      { name: 'value', type: 'string' },
      { name: 'cb', type: '(a: number) => void' },
    ]);
    expect(eventArguments('(event: "close"): void')).toEqual([]);
  });

  it('reads JSDoc from tuple-style defineEmits', () => {
    const sfc = `<script setup lang="ts">
defineEmits<{
  /** fires on change */
  change: [value: string];
  close: [];
}>();
</script>`;
    expect(emitDescriptions(sfc)).toEqual(new Map([['change', 'fires on change']]));
  });

  it('reads @deprecated from JSDoc tags', () => {
    expect(deprecation([{ name: 'since', text: '1.0' }])).toBeUndefined();
    expect(deprecation([{ name: 'deprecated' }])).toBe('');
    expect(deprecation([{ name: 'deprecated', text: ' use `size` instead ' }])).toBe(
      'use `size` instead',
    );
  });

  it('reads @deprecated from tuple-style defineEmits', () => {
    const sfc = `<script setup lang="ts">
defineEmits<{
  /** fires on change */
  change: [value: string];
  /**
   * old event
   * @deprecated use change instead
   */
  update: [value: string];
  /** @deprecated */
  close: [];
}>();
</script>`;
    expect(emitDeprecations(sfc)).toEqual(
      new Map([
        ['update', 'use change instead'],
        ['close', ''],
      ]),
    );
    expect(emitDescriptions(sfc).get('update')).toBe('old event');
  });
});

describe('collectComponentDocs', () => {
  it('extracts PlButton props, events and slots', { timeout: 60_000 }, () => {
    const button = collectComponentDocs().find((d) => d.name === 'PlButton');
    expect(button).toBeDefined();
    expect(button!.tag).toBe('pl-button');

    const type = button!.props.find((p) => p.name === 'type');
    expect(type).toMatchObject({ options: ['default', 'primary'], required: false });
    expect(type!.description).not.toBe('');
    expect(type!.default).toBe('"default"');

    const disabled = button!.props.find((p) => p.name === 'disabled');
    expect(disabled).toMatchObject({ type: 'boolean', default: 'false' });

    expect(button!.props.map((p) => p.name)).not.toContain('class');

    const click = button!.events.find((e) => e.name === 'click');
    expect(click!.description).not.toBe('');
    expect(click!.arguments).toEqual([{ name: 'event', type: 'MouseEvent' }]);

    expect(button!.slots.find((s) => s.name === 'default')?.description).not.toBe('');
  });
});
