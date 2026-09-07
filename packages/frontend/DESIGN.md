---
version: v0.3
name: taku-biyori
description: >
  青空と白い雲、その中に小さく差す太陽。日本語のテキストを落ち着いて読ませる
  ための、明るく静かなデザインシステム。ライトは薄い青みの白、ダークは黒では
  なく深い紺。ブランド色は sky、アクセントの sun は少量だけ使う。
colors:
  # --- sky / primary ---
  primary: '#336fae'
  primary-hover: '#29598c'
  primary-active: '#22466e'
  primary-subtle: '#e4eff9'
  primary-subtle-hover: '#c8dff3'
  primary-on-subtle: '#22466e'
  text-on-primary: '#ffffff'
  # --- sun / accent ---
  accent: '#f9cb4e'
  accent-hover: '#f2b622'
  accent-subtle: '#fff9e6'
  accent-on-subtle: '#8d5c0d'
  text-on-accent: '#12253a'
  # --- surfaces (light) ---
  background: '#fafbfd'
  background-alt: '#f3f8fd'
  surface: '#ffffff'
  surface-subtle: '#f4f6fa'
  surface-raised: '#ffffff'
  surface-inverse: '#1b3653'
  overlay: 'rgb(18 37 58 / 0.42)'
  # --- surfaces (dark) ---
  background-dark: '#0e1826'
  surface-dark: '#16222f'
  surface-dark-subtle: '#1c2938'
  surface-dark-raised: '#1f2d3d'
  # --- borders ---
  border: '#d9dfe9'
  border-subtle: '#e9edf4'
  border-strong: '#bcc5d3'
  border-focus: '#4c8cc9'
  border-dark: '#2b3b4e'
  border-dark-subtle: '#223040'
  border-dark-strong: '#3b4d63'
  # --- text ---
  text-primary: '#1a2230'
  text-secondary: '#6c7789'
  text-tertiary: '#8f9aac'
  text-disabled: '#bcc5d3'
  text-inverse: '#f3f8fd'
  text-dark-primary: '#e7eef7'
  text-dark-secondary: '#a6b5c7'
  text-dark-tertiary: '#8492a5'
  # --- semantic（彩度を落とし、状態として読ませる。ブランド色と競わせない） ---
  success: '#2f8d68'
  success-surface: '#dcf0e6'
  success-text: '#216349'
  info: '#3c7fb0'
  info-surface: '#dceaf6'
  info-text: '#2b5c81'
  warning: '#b9812a'
  warning-surface: '#faecd2'
  warning-text: '#8a5f1e'
  error: '#bf4f4c'
  error-surface: '#f8e2e0'
  error-text: '#8f3a37'
typography:
  display:
    fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif'
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.28
  h1:
    fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif'
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.35
  h2:
    fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif'
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.4
  h3:
    fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif'
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.5
  body-lg:
    fontFamily: '"Noto Sans JP", sans-serif'
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.85
  body:
    fontFamily: '"Noto Sans JP", sans-serif'
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.8
  body-sm:
    fontFamily: '"Noto Sans JP", sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: '"Noto Sans JP", sans-serif'
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.45
  caption:
    fontFamily: '"Noto Sans JP", sans-serif'
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.6
  overline:
    fontFamily: '"Noto Sans JP", sans-serif'
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: 0.14em
rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 16px
  full: 999px
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
elevation:
  xs: '0 1px 1px rgb(18 37 58 / 0.04)'
  sm: '0 1px 2px rgb(18 37 58 / 0.05), 0 1px 3px rgb(18 37 58 / 0.04)'
  md: '0 2px 4px rgb(18 37 58 / 0.05), 0 4px 12px rgb(18 37 58 / 0.06)'
  lg: '0 8px 28px rgb(18 37 58 / 0.1)'
  focus: '0 0 0 3px rgb(76 140 201 / 0.32)'
motion:
  ease-standard: 'cubic-bezier(0.2, 0, 0.2, 1)'
  ease-out: 'cubic-bezier(0.16, 1, 0.3, 1)'
  fast: 140ms
  normal: 220ms
  slow: 360ms
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.text-on-primary}'
    typography: '{typography.body-sm}'
    fontWeight: 600
    rounded: '{rounded.sm}'
    height: 40px
    padding: 0 16px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-primary-active:
    backgroundColor: '{colors.primary-active}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary-on-subtle}'
    borderColor: '{colors.border-strong}'
    typography: '{typography.body-sm}'
    fontWeight: 600
    rounded: '{rounded.sm}'
    height: 40px
    padding: 0 16px
  button-secondary-hover:
    backgroundColor: '{colors.primary-subtle}'
    borderColor: '{colors.primary}'
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.text-secondary}'
    typography: '{typography.body-sm}'
    fontWeight: 500
    rounded: '{rounded.sm}'
    height: 40px
    padding: 0 16px
  button-ghost-hover:
    backgroundColor: '{colors.surface-subtle}'
    textColor: '{colors.text-primary}'
  button-danger:
    backgroundColor: '{colors.error}'
    textColor: '#ffffff'
    rounded: '{rounded.sm}'
    height: 40px
    padding: 0 16px
  button-disabled:
    backgroundColor: '{colors.surface-subtle}'
    textColor: '{colors.text-disabled}'
    borderColor: '{colors.border-subtle}'
  input-text:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-primary}'
    borderColor: '{colors.border}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.sm}'
    height: 40px
    padding: 0 12px
  input-text-hover:
    borderColor: '{colors.border-strong}'
  input-text-focus:
    borderColor: '{colors.border-focus}'
    boxShadow: '{elevation.focus}'
  input-text-error:
    borderColor: '{colors.error}'
  card-surface:
    backgroundColor: '{colors.surface}'
    borderColor: '{colors.border-subtle}'
    boxShadow: '{elevation.xs}'
    rounded: '{rounded.md}'
    padding: 20px
  card-surface-hover:
    borderColor: '{colors.border-strong}'
    boxShadow: '{elevation.md}'
    transform: 'translateY(-1px)'
  badge:
    backgroundColor: '{colors.surface-subtle}'
    textColor: '{colors.text-secondary}'
    borderColor: '{colors.border}'
    typography: '{typography.label}'
    rounded: '{rounded.xs}'
    height: 24px
    padding: 0 9px
  chip-selected:
    backgroundColor: '{colors.primary-subtle}'
    textColor: '{colors.primary-on-subtle}'
    borderColor: '{colors.primary}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    height: 32px
    padding: 0 13px
  chip-unselected:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-secondary}'
    borderColor: '{colors.border}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    height: 32px
    padding: 0 13px
  tabs-active:
    textColor: '{colors.text-primary}'
    fontWeight: 600
    underlineColor: '{colors.accent}'
  dialog:
    backgroundColor: '{colors.surface}'
    borderColor: '{colors.border-subtle}'
    boxShadow: '{elevation.lg}'
    rounded: '{rounded.lg}'
    padding: 20px
---

## Overview

「たく日和」はマーダーミステリーや TRPG の卓を立て、シナリオを選び、日程を合わせ、
メモとメンバーを1か所に置いておくためのサービス。

ブランドの芯は **青空と白い雲、その中に小さく差す太陽の色**。
「よく晴れた日の、みんなで物語をはじめる直前」の空気を目指す。明るいけれど静か。
ボードゲーム的なポップさにも、マーダーミステリー的な黒紫赤の重さにも寄せない。
ゲームらしさはダイス・扉・鍵といった小さなアクセントにだけ宿らせ、全体の印象には出さない。

判断に迷ったら、次の順で決める。

1. **読める** — 日本語が主役。行間 1.75〜1.85、極太を使わない、極小の注釈を作らない
2. **静か** — 1画面の色数を絞る、影はほとんど見えない、動きは短く柔らかい
3. **親しみ** — かわいい、ではなく親しみやすい。角は柔らかいが、全部を丸くはしない
4. **物語が主役** — シナリオと人が中身。UI の外枠は引く
5. **アクセシブル** — 両テーマでコントラストを確保、44px 以上のタップ領域、フォーカスを可視化
6. **一貫している** — ステータス語彙は1系列、アイコンは1ファミリ、角丸は1セット

**実装上の正は `src/style/variables.css`。** このファイルはその意図を説明するもので、
値を二重管理しない。新しい色や余白が要ると思ったら、まず既存トークンで足りないかを疑う。

## Colors

3系統だけ。

- **sky（青空）＝ primary** — 落ち着いた空色。鮮やかなシアンにはしない。
  ライトは `#336fae`、ダークは紺の面の上で 4.5:1 を保つために `#7db4e6` へ明るくする
- **sun（太陽）＝ accent** — ブランドの署名だが**配給制**。アクティブなタブの下線、選択状態、
  1画面につき1つの CTA、ロゴ、「この日がよさそう」の強調にだけ使う。
  黄色いページも、黄色いヘッダーも、黄色い本文も作らない
- **ink（藍墨）＝ ニュートラル** — 青みを含んだグレー。本文は `#1a2230` で、`#000` は使わない

**意味トークンが公開 API。** `--background` `--surface` `--surface-subtle` `--text-primary`
`--text-secondary` `--border` `--primary` `--primary-hover` `--accent` `--success` `--warning`
`--error` などを使い、`--sky-600` のような生のスケールは直接参照しない。
同じ名前がダークテーマにも定義されているので、一度書いたコンポーネントは両テーマで動く。

セマンティック色（success / info / warning / error）はすべて彩度を落としてある。
「状態」として読ませ、ブランド色と競わせないため。

### ライトとダーク

ダークは反転ではなく **「同じ空の、時間が進んだ姿」**。背景 `#0e1826` は黒ではなく深い紺、
面 `#16222f`、持ち上げた面 `#1f2d3d`。**ダークの階層は面が明るくなることで作り**、影はその分離を
深めるだけ。sun のアクセントは色相を変えない（ブランドは夜でも色を変えない）。

## Typography

- **見出し**: Zen Kaku Gothic New（400 / 500 / 700）
- **本文・UI**: Noto Sans JP（400 / 500 / 600 / 700）

スケールは Display 40 / H1 32 / H2 24 / H3 20 / Body L 18 / Body 16 / Body S 14 /
Label 13 / Caption 12 / Overline 11。**700 より太くしない。40px より大きくしない。**

CSS では `--text-h1` のような **`font` ショートハンド**でまとめて当てる。行間が焼き込まれて
いるので、サイズだけ拾って行間を書き忘れる事故が起きない。ショートハンドは `font-weight` を
リセットするので、太さを変えたいときはショートハンドの**後ろ**に書く。

Overline だけはラテン文字の大文字＋ 0.14em のトラッキングで、意味を持たない飾りとして使う。
日本語で ALL CAPS 相当のことはしない。

## Layout

4px 基準の余白（`--space-1` 〜 `--space-24`）。カードの内側 20px、ブロック間 16px、
インライン 8px、セクション間 40px、ページの左右 24px。

コンテンツ幅は `--container-lg` 1080px を中央寄せ、上部ナビは 60px。デスクトップの
2カラムは 1.4fr / 1fr で、主コンテンツが左・状態やメタ情報が右。

**余白が主要な構成手段。** 迷ったら広いほうに倒す。左右余白は `padding-inline: n%` ではなく
`max-width` ＋中央寄せで作る（%だと画面が広いほど余白だけが育つ）。

## Elevation & Depth

**階層は border と surface で作り、影は最後。**

- `--border-subtle` はカードの輪郭
- `--border` は入力欄
- `--border-strong` はホバー

影のスケールは意図的に薄い。`xs` は 4% の 1px、`lg`（28px ぼかし・10%）はモーダルとトーストの
専用。静止しているカードは 1px の淡い枠でほとんど影が無く、ホバーで `--shadow-md` を得て 1px 浮く。

半透明はほぼ使わない。唯一の例外はモーダルのオーバーレイ（`--overlay`、紺の 42% / 62%）。
すりガラスも背景ぼかしも使わない。

## Shapes

- `--radius-xs` 4px — バッジ、チェックボックス
- `--radius-sm` 6px — ボタン、入力欄
- `--radius-md` 10px — カード
- `--radius-lg` 16px — モーダル、シート
- `--radius-full` — チップ、アバター、スイッチ

**バッジは 4px の角丸のまま、チップだけがピル。** バッジまで丸くするとかわいくなりすぎて、
状態表示としての手触りが失われる。

## Motion

90〜360ms。状態変化は `cubic-bezier(.2,0,.2,1)`、登場は `cubic-bezier(.16,1,.3,1)`。
フェードと 8〜10px の短い上昇だけ。**バウンドもスプリングも拡大もしない。**

- ホバーは背景色・枠色を変える（透明度では変えない）
- 押下は色を一段深める（縮めない）
- フォーカスは 3px・32% の primary リング＋枠色の変化
- `prefers-reduced-motion` はすべての duration を 0 にする

## Components

**ボタン**

- primary は塗り。hover は `--primary-hover`、active は `--primary-active` と**別の値**にする
- secondary は面＋枠。hover で `--primary-subtle` に色づき、枠が `--primary` になる
- ghost は控えめに。primary と競わせない
- 無効は透明度を下げるのではなく、`--surface-subtle` ＋ `--text-disabled` ＋ `--border-subtle` に置き換える
- 高さは sm 32 / md 40 / lg 48。影は付けない

**入力**

- 枠を必ず見せる。通常 / ホバー / フォーカス / 無効 / エラーの5状態を揃える
- 枠は `--border` →（hover）`--border-strong` →（focus）`--border-focus` ＋ `--focus-ring`
- ラベルは `--text-label`、補足は `--text-caption` の `--text-secondary`、エラーは `--error-text`

**カード**

- 静止時は `--border-subtle` ＋ `--shadow-xs`。ホバーする面だけ `--shadow-md` ＋ 1px の浮き
- 内側の余白は 20px（`--card-padding`）

**バッジ / チップ**

- バッジは 4px 角丸。トーンごとに「面の色 ＋ 文字色 ＋ 同色 34% の枠」の3点セット
- チップはピル。選択は `--primary-subtle` ＋ `--primary` の枠で、ベタ塗りにはしない

**タブ**

- 下線タブ。アクティブの下線は `--accent-line`（sun）。**ナビゲーションで accent が出る唯一の場所**
- アクティブの文字は `--text-primary` の semibold、非アクティブは `--text-secondary`

**アイコン**

- Lucide の線アイコン1ファミリのみ。24×24 グリッド、1.75 のストローク、丸いキャップ
- `currentColor` を継承。本文中は 14〜20px
- メタ情報のアイコンは `--text-tertiary`、ボタン内のアイコンはボタンの色に従う
- **絵文字をアイコン代わりに使わない。** ◯ / △ / × / − は日程回答の**データ**であってアイコンではない

## Content

- 日本語、です・ます。英語は Overline の飾りにだけ使い、情報を載せない
- **ボタンは動詞で言い切る**: 卓をつくる・参加する・回答を送信・この日で確定する・保存する
- キャンセルは常に「キャンセル」。破壊的操作は「はい」ではなく実際の動作（中止する）
- **ステータスは固定語彙**（そのまま使う）: 募集中・調整中・開催予定・完了・中止・GM・PL・回答済み・未回答
- 空状態は謝らない。「まだ卓がありません」＋「最初の卓をつくると、ここに予定が並びます。」＋操作1つ
- エラーは非難ではなく指示。「卓の名前を入力してください」
- 補足は許可を出す文。「あとから変更できます」
- 数字は半角（`3 / 5 人`、`19:30〜`）。日付は `3月22日(金) 19:30〜`
- **絵文字は使わない**

## Do's and Don'ts

- Do 階層を border と surface で作る。影は最後の手段。
- Do sun（黄色）は1画面に1か所だけ。
- Do 意味トークンを使う。生のパレット（`--sky-600` など）は参照しない。
- Do hover と active を別の値にする。押した手応えを色の深さで返す。
- Do 無効状態は面と文字色を差し替える。透明度で薄くしない。
- Do 入力欄の枠を見せる。フォーカスリングを消さない。
- Do 日本語の行間を 1.75 以上に保つ。
- Don't 700 より太い字、40px より大きい字を使わない。
- Don't バッジをピルにしない（チップだけがピル）。
- Don't グラデーション・すりガラス・光沢を使わない。
- Don't バウンドや拡大のアニメーションを付けない。
- Don't 絵文字をアイコンとして使わない。
