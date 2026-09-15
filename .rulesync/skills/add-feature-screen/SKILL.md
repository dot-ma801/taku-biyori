---
name: add-feature-screen
description: >
  taku-biyori の `features/` に画面を組む・変えるときに使う（ビジネスロジックを伴う `.vue`）。
  「画面を作って」「タブを追加して」「詳細画面に〇〇を出して」「この一覧を直して」
  などの依頼が対象。状態の列挙 → ロジックは composable へ → 組み立て → e2e で止める、の順で進める。
  `components/` の基本 UI は add-basic-component、composable 単体は tdd-composable の担当。
targets:
  - '*'
---
# features の画面を組む

対象は `features/**/*.vue` と、それを載せる `views/`。
**停止条件は `pnpm test:e2e` が緑になること。** `pnpm check` だけで終わらせない。

> **このスキルはたたき台。** 画面を1枚組んだ経験からではなく、既存実装（`GameSessionDetail.vue`）と
> 規約から起こしている。初回の適用で足りない段・余る段が出たら、その場で直す。

## 0. 担当の切り分け

| 対象 | 担当 |
|---|---|
| `features/` の `.vue` の組み立て | このスキル |
| 判断・集計・導出のロジック | `tdd-composable` |
| `components/` の汎用 UI | `add-basic-component` |
| API・型 | `add-api-endpoint` |

## 1. 状態を先に列挙する

**書き始める前に、その画面が出しうる状態を並べる。** あとから継ぎ足すと `v-if` が絡み合う。

| 状態 | 出し方の例 |
|---|---|
| 読み込み中 | `v-if="loading && !data"` |
| エラー | `v-else-if="errorMessage"` |
| 空（0件） | 一覧の「まだありません」 |
| 権限なし | ホスト限定の操作を出さない（`v-if="isHost"`） |
| 正常 | 本体 |

`GameSessionDetail.vue` の先頭3分岐がこの順になっている。**「正常だけ先に書く」をしない。**

## 2. ロジックを composable へ出す

`.vue` に残してよいのは **`v-if` / `v-for` の条件・イベント転送・子への props マッピング**だけ。
判断・集計・導出は composable に出す（`.rulesync/rules/frontend.md`）。

- **composable がテストの切り口**。ここを緑にしてから 3 へ進む（手順は `tdd-composable`）
- 表示用のフォールバック（`'未設定'`）は UI の関心事。composable に入れず `.vue` の `computed` で足す
- サーバ値（props）と編集ドラフト（子が所有）を同じ状態にしない

## 3. 組み立てる

- **配置**: `features/{機能}/{画面}/` に置き、外から import するのは1ファイルだけ。
  ルートに対応する入口だけ `index.vue`
- **`views/`** は features を1つ載せて `PageContainer` で包むだけ。ロジックを持たせない
- **語彙**は `docs/concept/CONTEXT.md` と突き合わせる。卓の状態は固定語彙をそのまま使う
- **DTO を持ち込まない。** `.vue` と composable が見てよいのは model だけ
- **操作にアクセシブルな名前を付ける。** e2e は `getByRole` で掴む
  （「`{タイトル}` を開く」「回答を編集する」のように、画面上の名前で一意になるようにする）

## 4. e2e で止める（省略不可）

```bash
pnpm --filter @taku-biyori/backend db:e2e:setup   # 初回・スキーマ変更後
pnpm test:e2e
```

| 置き場所 | 何を見る |
|---|---|
| composable の `*.test.ts` | 分岐・導出・エラー時の状態 |
| `e2e/*.spec.ts` | 画面を通した1本の流れ |

- **追加する e2e はその画面で1本。** 分岐を e2e に持ち込まない（遅くなるだけで、切り分けが composable より粗い）
- 実行日に依存する値は fixtures から導出する（`candidateDateLabel(21)`）。日付をベタ書きしない
- 非同期の保存は**完了の目印が出るのを待ってから** `reload()` する。`click()` は保存の完了を待たない
- シードにない前提が要るなら `e2e/fixtures.ts` と seed に足す。spec の中で作らない

## 5. 仕上げ

```bash
pnpm check
pnpm test:e2e
```

**両方が緑で完了。** 片方だけで終わらせない。

## チェックリスト

- [ ] 状態を先に列挙した（読み込み中 / エラー / 空 / 権限なし / 正常）
- [ ] `.vue` に判断・集計・導出を残していない
- [ ] DTO を `.vue` / composable に持ち込んでいない
- [ ] 画面の語彙が `CONTEXT.md` と一致している
- [ ] 操作を `getByRole` で一意に掴める名前にした
- [ ] e2e を1本追加した
- [ ] `pnpm check` と `pnpm test:e2e` の両方が緑
