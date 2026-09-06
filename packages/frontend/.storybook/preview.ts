import type { Preview } from '@storybook/vue3';
// VRT のレンダリングを安定させるため、フォントはここで同期読み込みする。
// （アプリ本体の main.ts は初回描画を優先して非同期読み込みにしている）
import '../src/style/fonts.css';
import '../src/style/main.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'カラーテーマ',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'light',
  },

  decorators: [
    (story, context) => {
      // アプリ側と同じく :root[data-theme] でテーマを切り替える
      document.documentElement.setAttribute(
        'data-theme',
        context.globals.theme === 'dark' ? 'dark' : 'light',
      );

      return {
        components: { story },
        // 背景と文字色をトークン経由で当てる。VRT はこの要素を撮る
        template: `
          <div
            id="vrt-root"
            style="background: var(--color-background); color: var(--color-text); padding: 16px;"
          >
            <story />
          </div>
        `,
      };
    },
  ],

  parameters: {
    // 背景色はテーマトークンが持つので Storybook の背景アドオンは使わない
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
  },
};

export default preview;
