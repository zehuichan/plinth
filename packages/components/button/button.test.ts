import { createNamespace } from '@internal/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Button from './button.vue';

const ns = createNamespace('button');

describe('PlButton', () => {
  it('renders slot content inside the content element', () => {
    const wrapper = mount(Button, { slots: { default: 'Save' } });
    expect(wrapper.text()).toBe('Save');
    expect(wrapper.classes()).toContain(ns.b());
    expect(wrapper.classes()).toContain(ns.m('default'));
    expect(wrapper.find(`.${ns.e('content')}`).exists()).toBe(true);
  });

  it('marks the disabled state with a state class', () => {
    const wrapper = mount(Button, { props: { disabled: true } });
    expect(wrapper.classes()).toContain(ns.is('disabled'));

    const enabled = mount(Button);
    expect(enabled.classes()).not.toContain(ns.is('disabled'));
  });
});
