# トークン対応表（旧 → 新）

`packages/frontend/src/style/variables.css` の現行トークンを全部並べたもの。
**Phase 1 でこの表を全部埋めてから、`variables.css` に反映する。**

この表が ralph loop・レビュアー・将来の自分にとっての唯一の根拠になる。
新デザイン側の値は `packages/frontend/DESIGN.md` の front matter を正とすること。

判断の記号:

| 記号 | 意味 |
|---|---|
| `=` | 値が変わらない |
| `→ 値` | 新しい値に差し替える |
| `削除` | 新デザインで使わなくなる。参照元を潰してからトークンを消す |
| `新規` | 新デザインで増えるトークン（表の末尾に追記する） |

---

## フォント

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--font-family-base` | `'Quicksand', 'M PLUS Rounded 1c', sans-serif` |  |  |
| `--font-size-base` | `16px` |  |  |
| `--font-size-sm` | `0.875rem` |  |  |
| `--font-size-lg` | `1.5rem` |  |  |

## 色 — ブランド

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--color-primary` | `#005f6b` |  |  |
| `--color-primary-strong` | `#004a53` |  |  |
| `--color-primary-soft` | `#d7ecee` |  |  |
| `--color-on-primary` | `#ffffff` |  |  |
| `--color-primary-text` | `#005f6b` |  |  |
| `--color-secondary` | `#596774` |  |  |

## 色 — 面と境界

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--color-background` | `#f4f5f1` |  |  |
| `--color-background-alt` | `#eef0eb` |  |  |
| `--color-surface` | `#fafaf8` |  |  |
| `--color-surface-raised` | `#f1f2ec` |  |  |
| `--color-surface-muted` | `#e9ebe4` |  |  |
| `--color-border` | `#d4d7cf` |  |  |
| `--color-border-strong` | `#b5bbb1` |  |  |
| `--color-overlay` | `rgba(31, 35, 40, 0.4)` |  |  |

## 色 — 文字

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--color-text` | `#1f2328` |  |  |
| `--color-text-secondary` | `#4e5661` |  |  |
| `--color-text-muted` | `#5c6978` |  |  |

## 色 — セマンティック

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--color-success` | `#1f7348` |  |  |
| `--color-success-soft` | `#d3ede1` |  |  |
| `--color-warning` | `#8c5e00` |  |  |
| `--color-warning-soft` | `#faecd0` |  |  |
| `--color-error` | `#b84040` |  |  |
| `--color-error-soft` | `#f5dada` |  |  |
| `--color-info` | `#005f6b` |  |  |

## 色 — ダークテーマ原色

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--color-dark-background` | `#1c2026` |  |  |
| `--color-dark-background-alt` | `#21262d` |  |  |
| `--color-dark-surface` | `#25292f` |  |  |
| `--color-dark-surface-raised` | `#2c3138` |  |  |
| `--color-dark-surface-muted` | `#343941` |  |  |
| `--color-dark-border` | `#434a54` |  |  |
| `--color-dark-border-strong` | `#59616c` |  |  |
| `--color-dark-text` | `#f2f4f7` |  |  |
| `--color-dark-text-secondary` | `#cdd3da` |  |  |
| `--color-dark-text-muted` | `#929aa5` |  |  |
| `--color-dark-success-soft` | `#1a3028` |  |  |
| `--color-dark-warning-soft` | `#3d3018` |  |  |
| `--color-dark-error-soft` | `#3a1f1f` |  |  |

## 影

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--shadow-sm` | `0 2px 6px rgba(31, 35, 40, 0.04)` |  |  |
| `--shadow-md` | `0 8px 24px rgba(31, 35, 40, 0.06)` |  |  |
| `--shadow-lg` | `0 10px 28px rgba(31, 35, 40, 0.08)` |  |  |

## 角丸

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--radius-sm` | `4px` |  |  |
| `--radius-md` | `8px` |  |  |
| `--radius-lg` | `12px` |  |  |
| `--radius-full` | `9999px` |  |  |

## 余白

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--space-1` | `4px` |  |  |
| `--space-2` | `8px` |  |  |
| `--space-3` | `12px` |  |  |
| `--space-4` | `16px` |  |  |
| `--space-5` | `24px` |  |  |
| `--space-6` | `32px` |  |  |
| `--space-7` | `48px` |  |  |

## 行間

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--line-height-tight` | `1.25` |  |  |
| `--line-height-standard` | `1.5` |  |  |
| `--line-height-relaxed` | `1.65` |  |  |

---

## ダークテーマの上書き（`:root[data-theme='dark']`）

| トークン | 現行値 | 新デザインの値 | メモ |
|---|---|---|---|
| `--color-background` | `var(--color-dark-background)` |  |  |
| `--color-background-alt` | `var(--color-dark-background-alt)` |  |  |
| `--color-surface` | `var(--color-dark-surface)` |  |  |
| `--color-surface-raised` | `var(--color-dark-surface-raised)` |  |  |
| `--color-surface-muted` | `var(--color-dark-surface-muted)` |  |  |
| `--color-border` | `var(--color-dark-border)` |  |  |
| `--color-border-strong` | `var(--color-dark-border-strong)` |  |  |
| `--color-text` | `var(--color-dark-text)` |  |  |
| `--color-text-secondary` | `var(--color-dark-text-secondary)` |  |  |
| `--color-text-muted` | `var(--color-dark-text-muted)` |  |  |
| `--color-primary-text` | `#3db5c5` |  |  |
| `--color-info` | `#3db5c5` |  |  |
| `--color-success` | `#54c48c` |  |  |
| `--color-success-soft` | `var(--color-dark-success-soft)` |  |  |
| `--color-warning` | `#e8a030` |  |  |
| `--color-warning-soft` | `var(--color-dark-warning-soft)` |  |  |
| `--color-error` | `#f88080` |  |  |
| `--color-error-soft` | `var(--color-dark-error-soft)` |  |  |

---

## 埋めるときの注意

- **`--color-primary` はボタン／ヘッダーの背景にも使うため、ダークテーマで変更してはいけない。**
  文字色用途には `--color-primary-text` を使う（`variables.css` のコメント参照）
- ダークテーマのセマンティック色は**コントラスト比 4.5:1 以上**を確認してから確定する。
  現行値のコメントに実測値が残っているので、同じ基準で検証すること
- `--color-overlay` は現状ライト／ダークで同じ値。分けるかどうかは Phase 1 で判断する
- フォントウェイトは **400 / 500 / 700 のみ**。M PLUS Rounded 1c に静的 600 が無く、
  600 指定だと和文だけ 700 に繰り上がって欧文とズレる（`fonts.css` のコメント参照）
