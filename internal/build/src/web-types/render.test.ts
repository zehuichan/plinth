import { describe, expect, it } from 'vitest';
import type { ComponentDoc } from './collect.ts';
import { renderVetur, renderWebTypes } from './render.ts';

const docs: ComponentDoc[] = [
  {
    name: 'PlDatePicker',
    seg: 'date-picker',
    tag: 'pl-date-picker',
    description: '',
    props: [
      {
        name: 'size',
        description: 'Size',
        type: '"small" | "large"',
        default: '"small"',
        required: false,
        options: ['small', 'large'],
      },
      { name: 'modelValue', description: '', type: 'string', required: true },
    ],
    events: [
      {
        name: 'update:modelValue',
        description: 'Value changed',
        arguments: [{ name: 'value', type: 'string' }],
      },
    ],
    slots: [{ name: 'default', description: 'Content' }],
  },
];

const pkg = { name: '@acme/ui', version: '1.2.3' };

describe('renderWebTypes', () => {
  it('emits vue-components with source symbols', () => {
    const out = renderWebTypes(docs, pkg) as {
      framework: string;
      name: string;
      version: string;
      contributions: { html: { 'vue-components': Array<Record<string, unknown>> } };
    };
    expect(out).toMatchObject({ framework: 'vue', name: '@acme/ui', version: '1.2.3' });
    const [component] = out.contributions.html['vue-components'];
    expect(component).toEqual({
      name: 'PlDatePicker',
      source: { module: '@acme/ui', symbol: 'PlDatePicker' },
      props: [
        { name: 'size', description: 'Size', type: '"small" | "large"', default: '"small"' },
        { name: 'modelValue', type: 'string', required: true },
      ],
      js: {
        events: [
          {
            name: 'update:modelValue',
            description: 'Value changed',
            arguments: [{ name: 'value', type: 'string' }],
          },
        ],
      },
      slots: [{ name: 'default', description: 'Content' }],
    });
  });

  it('adds doc-url only when docsUrl is set', () => {
    const out = renderWebTypes(docs, { ...pkg, docsUrl: 'https://ui.acme.dev/' }) as {
      contributions: { html: { 'vue-components': Array<Record<string, unknown>> } };
    };
    expect(out.contributions.html['vue-components'][0]!['doc-url']).toBe(
      'https://ui.acme.dev/components/date-picker/',
    );
  });
});

describe('deprecated members', () => {
  const deprecatedDocs: ComponentDoc[] = [
    {
      ...docs[0]!,
      props: [
        {
          name: 'size',
          description: 'Size',
          type: 'string',
          required: false,
          deprecated: 'use `scale`',
        },
        { name: 'flat', description: '', type: 'boolean', required: false, deprecated: '' },
      ],
      events: [
        { name: 'update', description: 'Old event', arguments: [], deprecated: 'use change' },
      ],
      slots: [{ name: 'footer', description: '', deprecated: '' }],
    },
  ];

  it('flags them in web-types and keeps the note in the description', () => {
    const out = renderWebTypes(deprecatedDocs, pkg) as {
      contributions: { html: { 'vue-components': Array<Record<string, unknown>> } };
    };
    const [component] = out.contributions.html['vue-components'];
    expect(component!.props).toEqual([
      {
        name: 'size',
        description: '**已废弃**：use `scale`\n\nSize',
        type: 'string',
        deprecated: true,
      },
      { name: 'flat', description: '**已废弃**', type: 'boolean', deprecated: true },
    ]);
    expect(component!.js).toEqual({
      events: [
        {
          name: 'update',
          description: '**已废弃**：use change\n\nOld event',
          arguments: [],
          deprecated: true,
        },
      ],
    });
    expect(component!.slots).toEqual([
      { name: 'footer', description: '**已废弃**', deprecated: true },
    ]);
  });

  it('puts the note in front of the Vetur description', () => {
    const { attributes } = renderVetur(deprecatedDocs, pkg);
    expect(attributes['pl-date-picker/size']!.description).toBe('**已废弃**：use `scale`\n\nSize');
    expect(attributes['pl-date-picker/flat']!.description).toBe('**已废弃**');
    expect(attributes['pl-date-picker/update']).toEqual({
      type: 'event',
      description: '**已废弃**：use change\n\nOld event',
    });
  });

  it('leaves regular members untouched', () => {
    const { attributes } = renderVetur(docs, pkg);
    expect(attributes['pl-date-picker/size']!.description).toBe('Size\n\n默认值：`"small"`');
  });
});

describe('renderVetur', () => {
  it('emits kebab-case tags and attributes', () => {
    const { tags, attributes } = renderVetur(docs, pkg);
    expect(tags).toEqual({
      'pl-date-picker': { attributes: ['size', 'model-value', 'update:model-value'] },
    });
    expect(attributes['pl-date-picker/size']).toEqual({
      type: '"small" | "large"',
      description: 'Size\n\n默认值：`"small"`',
      options: ['small', 'large'],
    });
    expect(attributes['pl-date-picker/model-value']).toEqual({ type: 'string' });
    expect(attributes['pl-date-picker/update:model-value']).toEqual({
      type: 'event',
      description: 'Value changed',
    });
  });
});
