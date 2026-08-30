---
name: add-basic-component
description: >
  このプロジェクト（taku-biyori）の packages/frontend/src/components 配下に
  基本UIコンポーネントを追加するためのスキル。 「コンポーネントを追加したい」「〇〇コンポーネントを作って」「UIコンポーネントを実装して」
  「packages/frontend/src/components に追加」など、フロントエンドの基本UIコンポーネント追加を
  依頼されたときは必ずこのスキルを使うこと。BaseButton, BaseAlert のような Base プレフィックスの コンポーネントを作るときも同様。
targets:
  - '*'
---
# taku-biyori 基本UIコンポーネント追加スキル

`packages/frontend/src/components` 配下に新しいVue UIコンポーネントを追加する際の規約。
4ファイルセット（.vue / .stories.ts / .test.ts / README.md）を必ず揃えること。

---

## 0. 実装前の調査

コンポーネントを実装する前に、`@vuetify/v0` に対応する headless コンポーネントがないか確認する。

- まず vuetify-mcp の `get_vuetify0_component_list` でコンポーネント一覧を取得する
- 対応するものがあれば `get_vuetify0_component_guide` で詳細を確認し、ロジック部分として活用する
- スタイルは vuetify0 に依存せず、プロジェクトのCSS変数で自前で当てる（vuetify0 は headless）
- 不明点があれば vuetify-mcp の他のツール（`get_component_api_by_version` 等）も活用する

---

## 1. カテゴリと配置場所

まず追加するコンポーネントがどのカテゴリに属するか判断する。

判断基準は [packages/frontend/README.md](/packages/frontend/README.md) を参考にすること。

### 命名規則

- 再利用可能なUIプリミティブには `Base` プレフィックスをつける（例: `BasePopover`）
- ディレクトリ名・ファイル名ともに **PascalCase**

---

## 2. ComponentName.vue の書き方

```vue
<script setup lang="ts">
import { SomeV0Component } from '@vuetify/v0'  // vuetify0 を活用する場合

// 型定義は type で inline に書く
type Variant = 'primary' | 'secondary'

// withDefaults でデフォルト値を設定
const props = withDefaults(defineProps<{
  variant?: Variant
  disabled?: boolean
}>(), {
  variant: 'primary',
  disabled: false,
})

// emits も型付き
const emit = defineEmits<{ change: [value: string] }>()
</script>

<template>
  <!-- ルートクラスはコンポーネント略称（BEM ライク） -->
  <div :class="['component-name', `component-name--${variant}`]">
    <slot />
  </div>
</template>

<style scoped>
/* Tailwind は使わない。CSS変数はデザインシステムのものを使う */
.component-name {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-family-base);
}
/* BEM: modifier は --, child は __ */
.component-name--primary { color: var(--color-text); }
.component-name__inner { /* ... */ }
</style>
```

スタイルの詳細は [packages/frontend/DESIGN.md](/packages/frontend/DESIGN.md) に準拠すること。
実装前に必ず参照し、色・余白・角丸・タイポグラフィの値を確認する。

**CSS変数の系統:**
- 色: `--color-primary`, `--color-surface`, `--color-text`, `--color-border`, `--color-error` など
- 余白: `--space-1` 〜 `--space-8`
- 角丸: `--radius-sm`, `--radius-md`
- フォント: `--font-family-base`

**アクセシビリティチェックリスト:**
- インタラクティブ要素に適切な `role` / `aria-label`
- 装飾アイコンに `aria-hidden="true"`（アイコンは `@lucide/vue` を使用）
- フォーカス時の視覚的フィードバック（`focus-visible`）
- ローディング中は `aria-busy="true"` + `disabled`

---

## 3. ComponentName.stories.ts の書き方

```ts
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseXxx from './BaseXxx.vue'

const meta: Meta<typeof BaseXxx> = {
  title: 'Common/BaseXxx',   // カテゴリ/コンポーネント名
  component: BaseXxx,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
    onChange: { action: 'change' },   // emitのアクションはこの形式
  },
  args: {
    variant: 'primary',
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 各バリアント・エッジケースごとにストーリーを作る
export const Default: Story = {
  render: (args) => ({
    components: { BaseXxx },
    setup: () => ({ args }),
    template: '<BaseXxx v-bind="args">コンテンツ</BaseXxx>',
  }),
}

// 最後に AllVariants ストーリーを必ず入れる
export const AllVariants: Story = {
  render: () => ({
    components: { BaseXxx },
    template: `
      <div style="display: flex; gap: 8px;">
        <BaseXxx variant="primary">Primary</BaseXxx>
        <BaseXxx variant="secondary">Secondary</BaseXxx>
      </div>
    `,
  }),
}
```

- `meta.title` の形式: `'カテゴリPascalCase/ComponentName'`
  - common → `'Common/BaseXxx'`
  - button → `'Button/BaseXxx'`
  - dialog → `'Dialog/BaseXxx'`
  - form → `'Form/BaseXxx'`
- ストーリー内のテキスト・ラベルは**日本語**で書く

---

## 4. ComponentName.test.ts の書き方

```ts
// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseXxx from './BaseXxx.vue'

describe('BaseXxx', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseXxx, { slots: { default: 'コンテンツ' } })

      // Assert
      expect(wrapper.find('.xxx').exists()).toBe(true)
    })
  })

  // union型のpropはit.eachでまとめてテスト
  describe('variant', () => {
    it.each(['primary', 'secondary'] as const)(
      'variant="%s" のとき .xxx--%s クラスが付与される',
      (variant) => {
        // Arrange & Act
        const wrapper = mount(BaseXxx, { props: { variant } })

        // Assert
        expect(wrapper.find('.xxx').classes()).toContain(`xxx--${variant}`)
      },
    )
  })

  describe('アクセシビリティ', () => {
    it('適切な role が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseXxx)

      // Assert
      expect(wrapper.find('[role]').exists()).toBe(true)
    })
  })
})
```

**テスト構造のパターン:**
1. `describe('レンダリング')` — デフォルト状態のレンダリング確認
2. `describe('propName')` — 各 prop の挙動（union型は `it.each` で）
3. `describe('イベント')` — emit のテスト（該当する場合）
4. `describe('アクセシビリティ')` — ARIA属性の確認

テスト説明文は**日本語**で書く。AAA コメント (`// Arrange`, `// Act`, `// Assert`) を入れる。
その他、必要に応じて、項目を増やしても良い。

---

## 5. README.md の書き方

```markdown
# BaseXxx

一行の日本語説明文。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary'` | `'primary'` | 表示スタイル |
| `disabled` | `boolean` | `false` | 無効化 |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `string` | 値が変化したとき |

## Usage

​```vue
<BaseXxx variant="primary" @change="handleChange">
  ここにコンテンツ
</BaseXxx>
​```

## Design Notes

- CSS変数 `--color-*` を使用しダーク/ライト両モード対応
- アイコンは `@lucide/vue` を使用
- `@vuetify/v0` の XxxComponent をロジック層として活用

## 単体テスト項目

### レンダリング
- デフォルト props でレンダリングされること

### variant
- `variant="primary"` のとき対応するクラスが付与されること
- `variant="secondary"` のとき対応するクラスが付与されること

### アクセシビリティ
- 適切な role が付与されていること
```

すべてのセクション・説明文は**日本語**で書く。
`## 単体テスト項目` の箇条書きは `.test.ts` のテスト内容と一致させること（テストを追加したら README も更新）。

---

## 6. 実装の流れ

1. vuetify-mcp で `@vuetify/v0` に対応コンポーネントがないか確認する
2. コンポーネントのカテゴリを判断し、配置場所を決める
3. 4ファイルを同時に作成する
4. 作成後、ユーザーに確認を取る（テストを走らせるか等）
