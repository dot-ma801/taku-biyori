# UI 移行 — ClaudeDesign 版デザインへの全面移行

このディレクトリは、ClaudeDesign プロジェクトで作り直したデザインへ
`packages/frontend` を移行するための運用ドキュメント。

- 全体方針とルール … このファイル
- ralph loop に毎周渡すプロンプト … [`PROMPT.md`](./PROMPT.md)
- 進捗チェックリスト … [`TASKS.md`](./TASKS.md)
- 旧トークン → 新トークンの対応表 … [`token-diff.md`](./token-diff.md)

---

## 1. この移行のスコープ

**トークン（色・タイポ・角丸・余白）だけでなく、画面のレイアウトと情報設計まで変える。**

そのため作業の性質が層によってまったく違う。同じやり方で一括して進めない。

| 層 | 対象 | 進め方 | 理由 |
|---|---|---|---|
| トークン層 | `src/style/variables.css` / `DESIGN.md` | **人が1回で決め打ち** | ここが全ての前提。ここを間違えると下流が全部やり直しになる |
| コンポーネント層 | `src/components/**` の Base* 28個 | **ralph loop** | 単位が小さく独立、Storybook と VRT で機械判定できる |
| 画面層 | `src/features/**` `src/views/**` の約80枚 | **issue 単位で人がレビュー** | 情報設計ごと変わるので「正しさ」を機械が判定できない |

> ⚠️ 画面層を loop に任せないのがこの計画の要。
> レイアウトが変わる画面では VRT の差分が全面的になり、
> 「意図した変化」と「巻き込み事故」の区別がつかなくなるため、loop の停止条件が成立しない。

---

## 2. フェーズ

| Phase | 内容 | 担当 | 完了条件 |
|---|---|---|---|
| 0 | 足場（VRT・ガードレール・本ドキュメント） | 人 | CI に `vrt` と `check:raw-color` が入り、基準画像が撮れている |
| 1 | トークン層の差し替え | 人 | `token-diff.md` が全行埋まり、`variables.css` が新トークンになる |
| 2 | Base コンポーネント 32個 | **loop** | 全 story が新デザイン、VRT 差分が全て承認済み |
| 3 | レイアウト（`AppHeader` / `AppFooter` / `PageContainer` / テーマ切替） | 人 | 全画面の外枠が新デザイン |
| 4 | 画面 8〜10 本（issue 単位） | 人 | 画面ごとに issue を close |
| 5 | 後片付け（`ComponentsView`・各 README・旧トークン削除・語彙統一 #117 と合流） | 人 | 旧トークン参照ゼロ |

Phase 1 が終わるまで Phase 2 を始めない。Phase 2 が終わるまで Phase 4 を始めない。
**依存を飛ばすと、下流で全部やり直しになる。**

---

## 3. ガードレール（機械が判定するもの）

移行中の全 PR は、以下が全て緑であること。人のレビューはその後。

```bash
pnpm --filter @taku-biyori/frontend lint:check        # oxlint + eslint
pnpm --filter @taku-biyori/frontend type-check        # vue-tsc
pnpm --filter @taku-biyori/frontend test              # vitest
pnpm --filter @taku-biyori/frontend check:raw-color   # 生の色リテラル検出
pnpm --filter @taku-biyori/frontend vrt               # 視覚回帰
```

### `check:raw-color`

`src/**/*.vue` と `src/**/*.css` に生の色リテラル（`#fff` / `rgba()` / `hsl()`）が
残っていると落ちる。色は必ず `variables.css` のトークン経由で参照する。

これが無いと、トークンを差し替えても直書きされた箇所だけ旧デザインのまま取り残される。
**loop にとっては「手を抜けない」ことを保証する仕掛けでもある。**

例外が必要な行には、同じ行に `raw-color-ok: 理由` を含むコメントを書く。
ファイル単位の例外は `packages/frontend/scripts/check-raw-color.mjs` の `ALLOWED_FILES` にある
（現在は `variables.css` と、ブランド配色が固定されている `GoogleLoginButton.vue` の2つ）。

---

## 4. VRT（視覚回帰テスト）の運用

Storybook の全 story を **light / dark 両テーマ**で撮り、ピクセル差分を検出する。

### なぜ story 単位なのか

画面ではなくコンポーネントを撮っている。画面はレイアウトごと変わる予定で差分が全面的になり、
判定に使えないため。バックエンド無しで撮れる、という実務上の理由もある。

### 基準画像は「撮る場所」を固定する

スクリーンショットはフォントと Chromium のバージョンでピクセルが変わる。
そのため基準画像は **CI の `vrt` ジョブとまったく同じ Docker イメージ**でのみ撮る。

```bash
# 手元で撮り直す（Docker が必要）
packages/frontend/scripts/vrt-docker.sh --update

# 手元で検証だけする
packages/frontend/scripts/vrt-docker.sh
```

Docker を使いたくない場合は、GitHub Actions の **VRT Baseline ワークフロー**を
対象ブランチで手動実行する。撮り直した画像がそのブランチに自動コミットされる。

基準画像は `packages/frontend/vrt/screenshots/` に置く。
`__screenshots__/` は `.gitignore` が Vitest の慣習として除外しているので使わない。

> `pnpm vrt` を素の手元環境で直接叩くこともできるが、Chromium のバージョンが違うと
> 差分が出る。手元実行は**目視確認用**であって、合否の判定は CI を正とすること。
> ブラウザの場所が違う環境では `VRT_CHROMIUM_PATH` で実行ファイルを指定できる。

### 差分が出たときの判断

| 状況 | 対応 |
|---|---|
| 意図した変化 | `vrt-report` で全画像を確認してから基準画像を撮り直す |
| 意図しない変化 | **直す。基準画像を撮り直して黙らせない** |
| 意図と無関係な箇所まで変わっている | 変更範囲が広すぎる。PR を割る |

**基準画像の撮り直しは必ず人が承認する。loop に撮り直させない**
（`PROMPT.md` でも禁止している）。

---

## 5. ralph loop の回し方

Phase 2（Base コンポーネント）専用。

```bash
# 1周ずつ、毎回まっさらなコンテキストで
while :; do
  claude -p "$(cat docs/ui-migration/PROMPT.md)"
done
```

Claude Code on the web / `/loop` から回す場合も、渡すのは同じ `PROMPT.md`。

**1周でやるのは `TASKS.md` の未チェック先頭1件だけ。**
コンテキストを持ち越さず、毎周ドキュメントを読み直させるのが要点。
持ち越すと、周回を重ねるごとに「前にこう決めたはず」の思い込みが積もって精度が落ちる。

### 停止・エスカレーション条件

loop は以下に当たったら**作業を中断して人に投げる**（`PROMPT.md` に明記済み）。

- 変更が対象コンポーネントのディレクトリ外に及ぶ
- 1件で 400 行を超える変更が必要になる
- `props` / `emits` の signature を変えないと実装できない
- VRT の差分が、対象コンポーネント以外の story にも出る
- 同じタスクで 2 周連続して緑にならない

---

## 6. issue 運用

- トラッキング issue 1本（`#118` と同じ形）＋ Phase ごとの sub-issue
- Phase 2 と Phase 4 はさらに sub-issue に割る（コンポーネント単位 / 画面単位）
- `TASKS.md` のチェックボックスと issue を1対1で対応させる

### issue テンプレ

```markdown
## 対象
packages/frontend/src/components/common/BaseCard/**   ← ここ以外は触らない

## 参照
- packages/frontend/DESIGN.md 「Cards」節
- docs/ui-migration/token-diff.md

## やること
- [ ] BaseCard.vue のスタイルを新デザインに合わせる
- [ ] variant / size の過不足を DESIGN.md と突き合わせる
- [ ] .stories.ts に不足している状態を足す
- [ ] README.md を更新する

## 完了条件
- [ ] lint:check / type-check / test / check:raw-color が緑
- [ ] VRT の差分を目視確認して承認済み
- [ ] props / emits の signature 変更なし（変える必要が出たら人に相談）
```

---

## 7. 触ってはいけないもの

移行中に「ついで」でやらないこと。差分が混ざるとレビューが破綻する。

- ロジック（composable・`models/`・`api/`）のリファクタ
- 日本語ラベルの置換（issue #117 の担当。Phase 5 で合流する）
- `packages/shared` / `packages/backend`
- `props` / `emits` の signature（変えるなら独立した issue にする）

---

## 8. コマンド一覧

```bash
# Storybook を見る
pnpm --filter @taku-biyori/frontend storybook

# 生の色リテラル検査
pnpm --filter @taku-biyori/frontend check:raw-color

# VRT（CI と同じ環境。Docker が必要）
packages/frontend/scripts/vrt-docker.sh
packages/frontend/scripts/vrt-docker.sh --update

# VRT（手元の Chromium。目視確認用）
pnpm --filter @taku-biyori/frontend vrt
```
