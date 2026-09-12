# taku-biyori（RollHub）

TRPG の「卓」を立てて日程調整し、当日の記録を残す Web アプリ。
pnpm workspace のモノレポで、`packages/` 配下に `shared` / `backend` / `frontend` がある。

> **このファイルは生成物です。** 実体は `.rulesync/rules/` にあります。
> `CLAUDE.md` / `AGENTS.md` / `.claude/` を直接編集しても `rulesync generate` で上書きされます。
> ルールを変えるときは `.rulesync/rules/*.md` を編集し、`pnpm rules:sync` を実行してください。

パッケージ固有の規約は、そのパッケージのファイルを触ったときに読み込まれます。

| 対象 | ルール |
|---|---|
| `packages/backend/**` `packages/shared/**` | `.claude/rules/backend.md` |
| `packages/frontend/**` | `.claude/rules/frontend.md` |

---

## 設計ドキュメント

現行仕様は **[`docs/design/v0.3/design-concept-model.md`](docs/design/v0.3/design-concept-model.md)** が唯一の根拠。
**API を実装・変更する前に必ず参照すること。** 一覧は [`docs/design/README.md`](docs/design/README.md)。

`docs/design/v0.1/` `v0.2/` は **superseded**（履歴）。実装の根拠には使わない。

### コード中の `design-v2 §…` の読み方

これは**ファイル名ではなく設計書の通称**。ファイルを `docs/design/v{版}/` へ再編したあとも語彙だけ残っている。

| コード中の表記 | 指す文書 |
|---|---|
| `design-v2 §…` | `docs/design/v0.3/design-concept-model.md`（現行） |
| `design-v1.2 §…` | `docs/design/v0.2/design-play-memo.md` |
| `design-v1.1 §…` / `design-v1 §…` | `docs/design/v0.1/` の各文書 |

`design-v1.x §…` は **v2 が引き継いだ判断の出典を示す履歴参照**。仕様の確認は必ず v0.3 で行う。
唯一の例外はプレイメモ4本で、design-v2 §6-15 が「リクエスト・レスポンス契約を v2 でも変えない」と
明示しているため、v1.2 §4（操作可否）・§5（エラー表）・§8 は挙動の記録として有効
（パスの入れ子化と `memberId` → `seatId` の改名を除く）。

---

## インポートルール

`src/` および `test/` 配下で**相対パス（`./`・`../`）のインポートは禁止**。必ず `@/` エイリアスを使う
（ESLint `no-restricted-imports` で強制。backend・frontend 共通）。

```ts
import { foo } from '../../../src/game-session/domain/foo'; // ❌
import { foo } from '@/game-session/domain/foo'; // ✅
```

`@/` は各パッケージの `src/` を指す（`tsconfig.json` の `paths` と `vite.config.ts` の `resolve.alias`）。

---

## 命名規則

- ファイル名は **kebab-case**（`create-game-session.ts`）
  - **例外: Vue の SFC（`.vue`）とそのディレクトリは PascalCase**（`PublicLobbyList.vue`,
    `components/common/BaseBreadcrumb/`）。ルートに対応するエントリポイントだけ `index.vue`
- 開催（セッション）の識別子はすべて **`game` プレフィックス**（`gameSession` / `GameSession`）
  - Better Auth の `session` と衝突するため
- DB カラム名は **スネークケース**（`host_user_id`, `scheduled_at`）

---

## 日本語ラベル（design-v2 §2-2 / issue #147）

**語彙の正は [`docs/concept/CONTEXT.md`](docs/concept/CONTEXT.md)。** ここに置くのは UI 表示の方針と
固定語彙だけで、概念の一文定義・紛らわしい語の対比・ロールはそちらにある。

**方針: BE では概念を分ける。UI ではそれを漏らさない。**

Lobby と GameSession は**バックエンドでは別リソース・別ステータスのまま**だが、
**利用者に見せる名詞は「卓」1つ**に統一する。UI 表示層で2つを1つの卓に畳む場所は
`features/GameSession/` に集約してある。

| 概念 | UI 表記 |
|---|---|
| Lobby + GameSession（1つの企画） | 卓 |
| LobbyEntry | 参加 / 参加者 / メンバー |
| SchedulePoll | 日程調整 |
| Seat | 着席 / 当日の参加者 |

卓の状態は次の1系列だけを見せる。**固定語彙なのでそのまま使うこと**
（定義は `features/GameSession/gameSessionCardStatus.ts`）。

```
募集中 → 調整中 → 開催予定 → 完了 / 中止
```

「下書き」はこの系列の外側で、ホストにしか見えない。

UI が「卓」1つに見せていても、**コード側（型・変数・API）の分離はそのまま維持する**。
`Lobby` / `GameSession` / `LobbyStatus`（4値）/ `GameSessionStatus`（4値）や
`disbanded_at`（解散）・`cancelled_at`（中止）は design-v2 のとおりに扱う。

`features/Landing/` のマーケティング文言の「卓」はサービス全体を語る文脈として残しているもの。
「直接卓立て」は design-v2 §5-3 / §7-3 の用語なのでそのまま。

### ドキュメントでのステータス表記

ドキュメントでステータスに言及するときは **`日本語ラベル名(変数名)`** の形で書く。

```
✅ 募集中(recruiting) から 調整中(scheduling) に遷移する
❌ recruiting から scheduling に遷移する
❌ 「募集中」から「調整中」に遷移する
```

---

## 書き方の規約

- **あらゆる出力は MECE を意識し、簡潔に書く。** 重複・漏れのない切り分けを優先し、冗長な前置きや
  言い換えは削る。コード・ドキュメント・PR 本文・レビュー返信に加え、**チャットでの応答も対象**
- **構造があるものは図示する。** 対応関係は表、手順は番号付きリスト、依存やフローは図にする。
  同じ内容を散文で長々と書き直さない。ただし1行で済むことを図にしない
- **コメントは基本3行以内。どんなに長くても5行**。それ以上必要ならコメントではなく設計か命名を直す
- 複雑なビジネスロジックにはコメントを残す。自明なコードには付けない
- `if` 文のブロックは単行でも必ず `{}` を付ける

---

## Git 運用

### コミット

- **メッセージは日本語**
- **粒度は細かく、その場で都度コミットする。** まとめて後でコミットすると、同じファイルに別の文脈の
  変更が混ざって切り分けられなくなる。意味のまとまりができた時点でコミットする
- 1 コミットに複数の独立した変更を混ぜない
- **プレフィックスは以下のいずれか**

| プレフィックス | 用途 |
|---|---|
| `[add]` | 新規ファイル・機能・型の追加 |
| `[update]` | 既存機能の変更・改善 |
| `[fix]` | バグ修正 |
| `[delete]` | ファイル・コード・機能の削除 |
| `[clean]` | フォーマット・lint・命名など動作に影響しない変更 |
| `[style]` | CSS・スタイリングの変更 |
| `[doc]` | ドキュメント・コメントの追加・更新 |

```
[add] shared に UpdateGameSessionInput 型を追加
[add] update-game-session ユースケースを実装
[fix] GET /api/game-sessions/:id を未認証でも公開セッションに接続できるよう修正
```

コミット時は必ず以下の形式を使う（`git config` は変更しない）。

```bash
git -c "user.name=Claude Code Bot" -c "user.email=claude-code-bot@example.com" commit -m "..."
```

### コンフリクトの解消

**必ず rebase で解消する。`git merge` は使わない。**

rebase 先は **その PR のベースブランチ**。ADR 0011 のリリースブランチ戦略では feature ブランチの
ベースが `develop/{version}` になるため、`origin/main` 固定だと誤ったベースに載せ替わる。

```bash
base=$(gh pr view --json baseRefName --jq .baseRefName)
git fetch origin
git rebase origin/"$base"
# 解消後
git rebase --continue
```

履歴を直線に保つため、マージコミットを作る解決方法は取らない。

### PR

- **タイトルは日本語**で簡潔に。コミット規則と同じプレフィックスを使う
  - 例: `[add] 候補日一括更新・日程回答（◯△×）API を実装`
- **本文は詳細に**。次を含める
  - 実装の背景・目的
  - 追加・変更したエンドポイントや機能の一覧
  - レイヤーごとの変更概要（shared / application / infrastructure / presentation）
  - 権限・バリデーション・エラーハンドリングの方針
  - DB スキーマ変更があればその内容

### レビュー指摘への対応

指摘を直したら**必ずそのスレッドに返信する**。返信には対応したコミットハッシュを書く。
**ハッシュはバッククォートで囲まない**（GitHub がコミットへのリンクに変換しなくなるため）。

```
✅ 1b493ad で修正しました。
❌ `1b493ad` で修正しました。
```

詳細な進め方は `pr-review-response` スキルを使う。

---

## コミット前チェック

```bash
pnpm check
```

shared のビルド → format → lint → typecheck → test を shared・backend・frontend の3パッケージすべてに
対して実行する。CI（`.github/workflows/ci.yml`）と同じ検証内容。`pnpm check:ci` は自動修正なしの検査のみ。

> `@taku-biyori/shared` は `dist/` がないと backend・frontend のテストが型解決に失敗する。
> `pnpm check` は先頭で shared をビルドするので、個別にコマンドを打つ場合も同じ順序を守ること。

ルールを編集したあとは生成物を更新する。

```bash
pnpm rules:sync   # .rulesync/ → CLAUDE.md / AGENTS.md / .claude/ / .codex/
pnpm rules:check  # 生成物が最新か検証（CI でも実行）
```

---

## 環境変数

| 変数名 | 必須 | 既定値 |
|---|---|---|
| `DATABASE_URL` | ✅ | — |
| `TEST_DATABASE_URL` | ✅（テスト実行時） | — |
| `BETTER_AUTH_SECRET` | ✅ | — |
| `PORT` | — | `3000` |
| `FRONTEND_URL` | — | `http://localhost:5173` |
| `BETTER_AUTH_URL` | — | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | — | — |
| `GOOGLE_CLIENT_SECRET` | — | — |

---

## 開発サーバー

```bash
pnpm --filter @taku-biyori/backend dev   # http://localhost:3000
pnpm --filter @taku-biyori/frontend dev  # http://localhost:5173
```

# backend / shared の規約

## 技術スタック

| 用途 | ライブラリ |
|---|---|
| HTTP フレームワーク | Hono 4.x |
| 認証 | Better Auth 1.x |
| ORM | Drizzle ORM 0.45.x |
| DB ドライバ | postgres（Neon） |
| テスト | Vitest 4.x |
| ランタイム | Node.js（`@hono/node-server`） |

---

## パッケージ構成

```
packages/backend/src/
├── {機能名}/
│   ├── domain/          # 純粋なルールや値オブジェクト
│   ├── application/     # ユースケース（純粋関数寄りに実装）
│   ├── infrastructure/  # DB・外部サービス連携
│   └── presentation/
│       └── controller/
│           └── routes/  # Hono ルート定義
├── system/
│   ├── db/              # Drizzle スキーマ・クライアント
│   └── infrastructure/  # 環境変数・DB接続
└── app/
    └── presentation/
        └── controller/
            └── create-app.ts  # アプリ組み立て
```

依存の向きは **内側の層に向かう**（`presentation` → `application` → `domain`）。
`infrastructure` は外側から注入する。実装例は `health/` が参考になる。

---

## `shared` パッケージとの連携

`packages/shared`（`@taku-biyori/shared`）はフロントエンドとバックエンド共通の型・契約を置く場所。

**API を実装する前に、必ず `shared` にリクエスト型・レスポンス型を定義してから始めること。**
型定義が契約となり、FE と BE の整合性を保証する。定義したら `packages/shared` の
エクスポートへの追加も忘れずに。

`shared` を変更したら `pnpm --filter @taku-biyori/shared build` を実行する
（`dist/` がないと backend のテストが型解決に失敗する）。

---

## テスト方針

**backend の実装は TDD で進めること。** 必ずテストを先に書き、失敗を確認してから実装する
（Red → Green → Refactor）。

t-wada の **AAA パターン**を採用している。

```ts
// Arrange
const input = ...

// Act
const result = ...

// Assert
expect(result).toEqual(...)
```

- ユースケース（`application/`）は純粋関数寄りに実装し、単体テストを書きやすくする
- HTTP 層（`presentation/`）は注入した依存を使って検証する
- テストは `test/unit/` と `test/integration/` に分けて配置する
- **リポジトリ層（`infrastructure/`）は実 DB に対してテストする**
  （`docs/adr/0009-repository-tests-against-real-database.md`）。
  drizzle のメソッドチェーンをモックしない。接続先は `TEST_DATABASE_URL` で切り替え、
  各ケースはトランザクションでロールバックする

```bash
pnpm --filter @taku-biyori/backend db:test:setup   # テスト DB 作成 + マイグレーション（初回・スキーマ変更後）
pnpm --filter @taku-biyori/backend test:unit
pnpm --filter @taku-biyori/backend test:integration
```

> インテグレーションテストが `relation "auth.user" does not exist` やフックのタイムアウトで
> まとめて落ちたら、コードではなく **PostgreSQL が止まっていないか**を先に疑う（`pg_isready`）。

> `pnpm --filter @taku-biyori/backend test` はローカルでは watch モードで起動する。
> 1 回だけ実行したいときは `pnpm check`（`CI=true` で実行する）か `test -- run` を使う。

---

## 作業の入口

| やること | 使うスキル |
|---|---|
| 新しい API エンドポイントを追加する | `add-api-endpoint` |
| DB のテーブル・カラム・enum を変更する | `db-schema-change` |

# PR レビューの規約（Codex 向け）

## 言語

**レビューコメントは必ず日本語で書く。** 要約・インラインコメント・指摘の見出し・結論のすべてを日本語にする。
コード片・識別子・コマンド・エラーメッセージの引用は原文のままでよい。

## 書き方

- **MECE を意識し、簡潔に書く。** 同じ指摘を観点を変えて繰り返さない
- 1つの指摘は「何が問題か」→「なぜ問題か」→「どう直すか」の3点で完結させる
- 重大度を明示する（例: `[must]` / `[should]` / `[nits]`）
- 憶測で断定しない。確認が必要なものは質問として書く

## 観点

このリポジトリ固有の規約に反していないかを優先して見る。

| 観点 | 参照 |
|---|---|
| `@/` エイリアスを使わず相対パスで import していないか | AGENTS.md「インポートルール」 |
| 仕様が `docs/design/v0.3/design-concept-model.md` と一致しているか | AGENTS.md「設計ドキュメント」 |
| backend の実装にテストが先行しているか（TDD） | AGENTS.md「テスト方針」 |
| frontend が DTO を composable / component に持ち込んでいないか | AGENTS.md「API の型（DTO）と FE の model を分ける」 |
| `watch` を `computed` / `emit` / `onMounted` で置き換えられないか | AGENTS.md「`watch` を多用しない」 |
| 新規テーブル・enum が `pgSchema()` 経由で定義されているか | `docs/adr/0005-postgresql-schema-per-feature.md` |
| コメントが3行（最大5行）に収まっているか | AGENTS.md「書き方の規約」 |

# frontend の規約

## API の型（DTO）と FE の model を分ける

`@taku-biyori/shared` の型は **API との通信契約（DTO）** であって、フロントエンド内部で扱う
データ構造ではない。DTO を見てよいのは `src/api/` と `src/models/` だけで、
composable / component は model だけを受け取る
（`docs/adr/0010-frontend-separates-dto-and-model.md`）。

```plaintext
packages/frontend/src/
├── api/          # DTO ⇄ model の境界。fetch して model を返す
├── models/       # FE の内部型と、DTO からの変換関数（+ *.test.ts）
├── components/   # ドメイン知識を持たない汎用 UI
├── features/     # 機能ごとの画面・composable
├── views/        # ルートに対応する画面。features を組み立てる
├── router/
├── stores/
└── utils/
```

```ts
// ❌ NG — composable が DTO をそのまま持つ
import type { LobbyDetail } from '@taku-biyori/shared';
const lobby = ref<LobbyDetail | null>(null);

// ✅ OK — api 層で model に変換し、内側は model だけを見る
import type { LobbyDetailModel } from '@/models/lobby';
const lobby = ref<LobbyDetailModel | null>(null);
```

model 側で引き受けること。

| 関心事 | 例 |
|---|---|
| タイムスタンプを `Date` にする | `createdAt: string` → `Date`（画面ごとに `new Date()` しない） |
| `undefined` を `null` に正規化する | `scenarioName?: string \| null` → `string \| null` |
| 導出値をあらかじめ持たせる | `entries` から `activeEntries`（`leftAt === null`）を作る |

- 日付のみの値（`YYYY-MM-DD`）は `Date` にしない。タイムゾーンで日付がずれるため文字列のまま持つ
- 表示用のフォールバック文言（`'未設定'` など）は UI の関心事なので model に入れない
- 変換関数（`toXxxModel()`）には**テストを先に書く**
- **enum・権限関数・ステータス導出関数は shared から直接 import してよい。**
  これらは通信契約ではなく、FE と BE が同じ規則で動くための共有定義そのもの
- **`*Input` 型は「送るリクエストの形」そのもの（DTO）なので、DTO 境界の内側に置く。**
  composable / component から直接 import してはいけない
  （`UpdateGameSessionPlayMemoVisibilityInput` などは、サーバ側のルートが HTTP の JSON を
  parse するのに使っている型そのもの）。例外は「送る形の下書きを組み立てるユーティリティ」だけで、
  現状は `utils/pendingCandidateDates.ts` が `LobbyCandidateDateInput` を持つ1件のみ
- 参考: `src/models/lobby.ts` / `src/models/lobby.test.ts`

---

## template 内の式は computed に切り出す

`<template>` 内に `??` や三項演算子などの式を直接書かない。
必ず `<script setup>` 内の `computed` に切り出すこと。

```vue
<!-- ❌ NG -->
<p>{{ gameSession.scenarioName ?? '未設定' }}</p>

<!-- ✅ OK -->
<p>{{ scenarioName }}</p>

<!-- script setup 側 -->
const scenarioName = computed(() => gameSession.value?.scenarioName ?? '未設定');
```

---

## コンポーネントが持っていいもの・composable に寄せるもの

**コンポーネントの責務はテンプレートの構造制御に限定する。**

- ✅ コンポーネントに置く: `v-if` / `v-for` の条件、イベント転送、子コンポーネントへの props マッピング
- ❌ コンポーネントに置かない: データの変換・集計・導出。「表示のための計算」も含め、判断に迷ったら
  composable に寄せる

```ts
// ❌ NG — ScheduleTable.vue の中に計算ロジックを書く
function getAnswer(date, memberId) { ... }
function okCount(date) { ... }

// ✅ OK — composable に切り出して toRef で接続する
const { getAnswer, okCount } = useScheduleView(
  toRef(props, 'myMemberId'),
  toRef(props, 'isEditing'),
  toRef(props, 'draftAnswers'),
);
```

`'未設定'` のような表示用フォールバックは UI の関心事なので composable に含めない。
composable はフォールバックなしの生データを返し、コンポーネント側の `computed` で表示用に加工する。

---

## `watch` を多用しない

**`watch` は最後の手段。** 書きたくなったら、先に次の4つを検討する。

| 代わりに使えないか | 典型例 |
|---|---|
| `computed` で導出できないか | 他の state から計算できる値に `watch` + `ref` を使わない |
| `emit` で親にイベントを渡せば済まないか | 子の変更を親が `watch` で拾う → 子が `emit`、親がハンドラで処理する |
| イベントドリブンにできないか | 「値が変わったら実行」ではなく「ユーザーが押したら実行」で書けないか |
| `onMounted` の初期化で済まないか | 初回だけ必要な処理に `watch(..., { immediate: true })` を使わない |

```ts
// ❌ NG — 子の state 変化を watch で親に伝播させる
watch(draftName, (value) => {
  emit('update', value);
});

// ✅ OK — 確定した時点のイベントとして親へ渡す
function handleSubmit() {
  emit('update', draftName.value);
}
```

`watch` が妥当なのは、**自分が発生源ではない外部の変化に追従する**とき。

- 再取得などで props の元データが差し替わり、編集ドラフトを作り直す必要がある
- ルートパラメータの変化に応じて再フェッチする
- 外部リソース（購読・タイマー）のライフサイクルを state に合わせる

使う場合は「何の変化に追従しているのか」をコメント1行で残す。

---

## composable の引数は `Ref` を要求しない（依存は一方向に保つ）

**composable の引数で `Ref<T>` を受け取ってはいけない。**
依存の向き（とくに書き込み）は常に「呼び出し側 → composable」の一方向に保つ。
`Ref` を渡すと composable が `.value =` で呼び出し側の状態を書き換えられてしまい、
親が所有する状態を子のロジックが勝手に変える＝Vue の一方向データフロー違反になる。
（props のバケツリレーで「値」を下に流すのは可。逆流する「書き込み」を作らないことが要点）

| 関心事 | ❌ NG | ✅ OK |
|---|---|---|
| 読み取り | `Ref<T>` を要求 | `MaybeRefOrGetter<T>` を `toValue()` で読む |
| 書き込み | 受け取った `Ref` に代入 | `onXxx` コールバックで所有者に委譲 |
| 状態の所有 | あちこちで `.value =` | `ref()` を宣言した場所（親）だけ |

```ts
// ❌ NG — Ref を要求し、内部で書き換える（props 境界をまたぐと一方向違反）
export const useEdit = (entity: Ref<Entity | null>) => {
  const canEdit = computed(() => entity.value?.status === 'open');
  async function submit() {
    const updated = await api.update(entity.value!.id);
    entity.value = { ...entity.value!, ...updated }; // 呼び出し側の状態を書き換えている
  }
};

// ✅ OK — 読みは getter、書きは callback。所有者（親）が自分の ref を更新する
export const useEdit = (
  id: string,
  entity: MaybeRefOrGetter<Entity | null>,
  onUpdated: (updated: Entity) => void,
) => {
  const canEdit = computed(() => toValue(entity)?.status === 'open');
  async function submit() {
    const updated = await api.update(id);
    onUpdated(updated); // 親に依頼するだけ
  }
};
```

呼び出し側（子コンポーネント）は `() => props.xxx` を渡し、更新は `emit` で親へ返す。
親（`ref` の所有者）が `patchXxx` 等で自分の状態を差し替える。
参考: `useScheduleConfirm.ts` / `useMemberEdit.ts`、親側は `useGetGameSessionDetail.ts` の `patchGameSession`。

**例外**: composable がその状態の所有者自身（自分で `ref()` を宣言している）の場合のみ、
内部で `.value =` してよい。props 境界をまたいで受け取った値は書き換えない。

---

## 「サーバ値」と「編集ドラフト」は別物として管理する

API 由来の値（＝真実）と、UI で編集中の値（＝ドラフト）を**同一の状態にしない**。
同一視すると「元の値」が残らず変更検知ができず、キャンセルで戻す処理も複雑になる。
（Pinia などのグローバルストアは使わない方針。コンポーネント所有で完結させる）

| 状態 | 所有者 | 渡し方 |
|---|---|---|
| original（サーバ値・真実） | 親（fetch した側） | **readonly な props** で子へ下ろす |
| draft（編集中のコピー） | **子（編集UI）** | 子の中でコピーして持つ |
| 変更通知 | — | 保存確定値を **emit** で親へ返す |

- original は props（実質 readonly）で配るだけ。子は決して書き換えない
- draft は子の中で original から**コピー**して作る
  （オブジェクトなら `structuredClone`、文字列など**プリミティブはそのまま代入でコピー扱い**。
  不要な deepcopy はしない）
- 変更検知は `isDirty = draft !== baseline` で行う。
  保存ボタンの活性判定など UI の関心事なら**子側で**比較する
  （親で判定したいときは emit した object と親が持つ original を比較）
- ⚠️ **罠**: 再取得などで original（prop）が変わったら draft は古いまま取り残される。
  `watch(() => props.original, reset)` で draft を作り直すか `:key` で再マウントする
  （これは上の「`watch` が妥当なケース」にあたる）
- 参考実装: `useMemberEdit.ts`（`baseline` / `draftCharacterName` / `isDirty`）

---

## フィーチャー内のディレクトリ構成

**他の機能から使われることを意図しない実装詳細が生まれたら、サブディレクトリを切る。**
外部に公開するエントリポイントは1ファイルに限定し、内部の分割が外に漏れないようにする。

```plaintext
features/GameSession/Detail/
  Schedule/                     ← 日程調整の実装詳細をまとめたサブディレクトリ
    ScheduleDisplay.vue         ← 外部から import するのはここだけ
    ScheduleTable.vue           ← Detail/ の他コンポーネントからは使わない
    AnswerCell.vue
    useScheduleDisplay.ts
    useScheduleEdit.ts
    useScheduleView.ts
  index.vue                     ← ScheduleDisplay.vue だけを import する
  MemberDisplay.vue
```

---

## `useSession` の使い方（better-auth）

`createAuthClient`（`better-auth/client` の vanilla クライアント）の `useSession` は nanostores の
Atom であり、Vue の `ref` ではないため直接リアクティブに使えない。以下のパターンで変換する。

```ts
import { useSession } from '@/lib/auth';
import { ref, onUnmounted } from 'vue';

const sessionData = ref(useSession.get());
const unsub = useSession.subscribe((v) => { sessionData.value = v; });
onUnmounted(unsub);
// → sessionData.value.data?.user?.id でユーザー ID にアクセス
```

---

## `noUncheckedIndexedAccess` への対応

`tsconfig` で `noUncheckedIndexedAccess: true` が有効なため、`Record<string, T>` のインデックス
アクセスは `T | undefined` になる。キーの存在が不明なルックアップには `Map` + `.get()` を使う。

```ts
const answer = myAnswers[dateId]; // ❌ Record のインデックスアクセスは undefined になりうる
const answer = myAnswers.get(dateId); // ✅ .get() は意図が明確
```

---

## 作業の入口

| やること | 使うスキル |
|---|---|
| 基本 UI コンポーネントを追加する | `add-basic-component` |
| composable（処理ロジック）を TDD で実装する | `tdd-composable` |
