import { describe, it, expect, beforeEach } from 'vitest';

import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import App from '../App.vue';

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('mounts renders properly', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          'router-view': true,
        },
      },
    });
    expect(wrapper.text()).toContain('AppName');
  });
});
