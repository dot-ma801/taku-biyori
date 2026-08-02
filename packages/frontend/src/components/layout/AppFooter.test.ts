import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppFooter from '@/components/layout/AppFooter.vue';
import { APP_VERSION } from '@/lib/app-version';

describe('AppFooter', () => {
  it('バージョンを v 付きで表示する', () => {
    // Arrange & Act
    const wrapper = mount(AppFooter);

    // Assert
    expect(wrapper.text()).toContain(`v${APP_VERSION}`);
  });

  it('バージョンが package.json 由来の文字列として埋め込まれている', () => {
    // Arrange & Act & Assert
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
