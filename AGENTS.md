# CLAUDE.md — RollHub Backend

このファイルは Claude Code 向けの実装ガイドです。
実装を始める前に必ず読んでください。

---

## 設計ドキュメント

実装に必要な設計情報はすべて `docs/design-v*.md` にまとまっています。
**APIを実装する前に必ず参照してください。**

特に以下のセクションを確認してください。

- DBスキーマ（テーブル定義・カラム型・リレーション）
- ステータス設計（`getGameSessionStatus` の導出ロジック）
- API設計（エンドポイント一覧・方針）
- 命名規則（`gameSession` プレフィックス・スネークケース等）

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

依存の向きは **内側の層に向かう** ように保つこと。
`presentation` → `application` → `domain` の順。`infrastructure` は外側から注入する。

既存の `health/` ディレクトリが実装例として参考になります。

---

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

## インポートルール

`src/` および `test/` 配下のファイルは、**相対パス（`./`・`../`）でのインポートを禁止**しています。
必ず `@/` エイリアスを使うこと（ESLint `no-restricted-imports` で強制）。

```ts
// ❌ NG
import { foo } from '../../../src/game-session/domain/foo';
import { bar } from './schema';

// ✅ OK
import { foo } from '@/game-session/domain/foo';
import { bar } from '@/system/infrastructure/database/schema';
```

`@/` は各パッケージの `src/` にマッピングされています（`tsconfig.json` の `paths` と `vite.config.ts` の `resolve.alias` で設定）。
backend・frontend ともに同じ規則です。

---

## 命名規則

- ファイル名は **kebab-case**（例: `create-game-session.ts`, `game-session-route.ts`）
- 卓（セッション）に関する識別子はすべて **`game` プレフィックス**を付ける
  - 変数名: `gameSession`
  - 型名: `GameSession`
  - 理由: Better Auth の `session` と衝突するため
- DB カラム名は **スネークケース**（例: `host_user_id`, `scheduled_at`）

---

## DB スキーマの変更手順

**新しいテーブル・enum は機能ごとの PostgreSQL スキーマに置くこと**（`docs/adr/0005-postgresql-schema-per-feature.md` 参照）。
`pgTable()` / `pgEnum()` は使わず、`pgSchema('{機能名}')` 経由で定義する
（例: `gameSessionSchema.table(...)`。機能ディレクトリ名の kebab-case はスキーマ名では snake_case に読み替える）。

スキーマを変更した場合は以下を実行します。

```bash
pnpm --filter @taku-biyori/backend db:generate
pnpm --filter @taku-biyori/backend db:migrate
```

---

## テスト方針

**Backend の実装は TDD（テスト駆動開発）で進めること。**
必ずテストを先に書き、失敗を確認してから実装する。Red → Green → Refactor のサイクルを守る。

t-wada の **AAA パターン**を採用しています。

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

```bash
# 全テスト
pnpm --filter @taku-biyori/backend test

# ユニットテストのみ
pnpm --filter @taku-biyori/backend test:unit

# インテグレーションテストのみ
pnpm --filter @taku-biyori/backend test:integration
```

---

## `shared` パッケージとの連携

`packages/shared`（`@taku-biyori/shared`）には、フロントエンドとバックエンドで共通の型・契約を置いています。

**API を実装する前に、必ず `shared` にリクエスト型・レスポンス型を定義してから始めること。**
型定義が契約となり、フロントエンドとバックエンドの整合性を保証する。
型を定義したら `packages/shared` のエクスポートに追加することも忘れずに。

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

## 新しい API を追加する手順

1. `docs/design-v*.md` でエンドポイント仕様・DBスキーマを確認する
2. **`packages/shared` にリクエスト型・レスポンス型を定義する**（実装より先に行うこと）
3. **テストを先に書く**（TDD: Red → Green → Refactor）
4. `src/{機能名}/` ディレクトリを作成し、レイヤーごとにファイルを分ける
5. `src/{機能名}/presentation/controller/routes/{機能名}-route.ts` にルートを定義する
6. `src/app/presentation/controller/create-app.ts` にルートを登録する

---

## PR 規則

- **タイトルは日本語**で簡潔に書く。コミット規則と同じプレフィックスを使うこと
  - 例: `[add] 候補日一括更新・日程回答（◯△×）API を実装`
- **Summary（本文）は詳細に**記載する。以下の項目を含めること
  - 実装の背景・目的
  - 追加・変更したエンドポイントや機能の一覧
  - レイヤーごとの変更概要（shared / application / infrastructure / presentation）
  - 権限・バリデーション・エラーハンドリングの方針
  - DBスキーマ変更がある場合はその内容

---

## コミット規則

- **メッセージは日本語**で書く
- **粒度は細かく**保つ。「shared に型追加」「application 層実装」「route 登録」など、意味のまとまりごとに分けてコミットする
- 1 コミットに複数の独立した変更を混ぜない
- **プレフィックスは以下のいずれかを使う**

| プレフィックス | 用途 |
|---|---|
| `[add]` | 新規ファイル・機能・型の追加 |
| `[update]` | 既存機能の変更・改善 |
| `[fix]` | バグ修正 |
| `[delete]` | ファイル・コード・機能の削除 |
| `[clean]` | コードフォーマット・lint・命名など動作に影響しない変更 |
| `[style]` | CSS・スタイリングの変更 |
| `[doc]` | ドキュメント・コメントの追加・更新 |

```
# 例
[add] shared に UpdateGameSessionInput 型を追加
[add] update-game-session ユースケースを実装
[add] PATCH /api/game-sessions/:id ルートを登録
[add] update-game-session のユニットテストを追加
[fix] GET /api/game-sessions/:id を未認証でも公開セッションに接続できるよう修正
[update] getGameSession の権限チェックを application 層へ移動
[doc] コミット規則を CLAUDE.md に追記
```

---

## コミット前チェック

コミット前に以下をすべて通しておくこと。CI で Lint・Format Check・Type Check・Test が別ジョブで動くため、まとめて確認しておくと安全。

```bash
# shared のビルド（テスト実行前に必要）
pnpm --filter @taku-biyori/shared build

# フォーマット修正（shared・backend 両方）
pnpm --filter @taku-biyori/shared format
pnpm --filter @taku-biyori/backend format

# Lint
pnpm --filter @taku-biyori/backend lint

# 型チェック
pnpm --filter @taku-biyori/backend typecheck

# テスト
pnpm --filter @taku-biyori/backend test
```

> **注意**: `@taku-biyori/shared` は `dist/` が存在しないとバックエンドのテストが型解決に失敗する。
> shared のコードを変更した場合は必ず `build` を再実行すること。

## Git 設定

コミット時は必ず以下の形式を使うこと（git config は変更しない）：

git -c "user.name=Claude Code Bot" -c "user.email=claude-code-bot@example.com" commit -m "..."

---

## 開発サーバーの起動

```bash
pnpm --filter @taku-biyori/backend dev
# → http://localhost:3000
```

---

## フロントエンド実装方針

### API の型（DTO）と FE の model を分ける

`@taku-biyori/shared` の型は **API との通信契約（DTO）** であって、フロントエンド内部で扱う
データ構造ではない。DTO を見てよいのは `src/api/` と `src/models/` だけで、
composable / component は model だけを受け取る。

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
- 参考: `src/models/lobby.ts` / `src/models/lobby.test.ts`

### template 内の式は computed に切り出す

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

### 表示用のフォールバック値は composable ではなくコンポーネントに置く

`'未設定'` のような表示文言は UI の関心事であり、データ取得に集中する composable には含めない。
composable はフォールバックなしの生データを返し、コンポーネント側の `computed` で表示用に加工する。

### コンポーネントが持っていいもの・composable に寄せるもの

**コンポーネントの責務はテンプレートの構造制御に限定する。**

- ✅ コンポーネントに置く: `v-if` / `v-for` の条件、イベント転送、子コンポーネントへの props マッピング
- ❌ コンポーネントに置かない: データの変換・集計・導出。「表示のための計算」も含め、判断に迷ったら composable に寄せる

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

### フィーチャー内のディレクトリ構成

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

### composable の引数は `Ref` を要求しない（依存は一方向に保つ）

**composable の引数で `Ref<T>` を受け取ってはいけない。**
依存の向き（とくに書き込み）は常に「呼び出し側 → composable」の一方向に保つ。
`Ref` を渡すと composable が `.value =` で呼び出し側の状態を書き換えられてしまい、
親が所有する状態を子のロジックが勝手に変える＝Vue の一方向データフロー違反になる。
（props のバケツリレーで「値」を下に流すのは可。逆流する「書き込み」を作らないことが要点）

関心事ごとに引数の形を分ける。

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

### 「サーバ値」と「編集ドラフト」は別物として管理する

API 由来の値（＝真実）と、UI で編集中の値（＝ドラフト）を**同一の状態にしない**。
同一視すると「元の値」が残らず変更検知ができず、キャンセルで戻す処理も複雑になる。
（Pinia などのグローバルストアは使わない方針。下記のコンポーネント所有で完結させる）

データフローは次の3者で固定する。

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
- 参考実装: `useMemberEdit.ts`（`baseline` / `draftCharacterName` / `isDirty`）

### `useSession` の使い方（better-auth）

`createAuthClient`（`better-auth/client` の vanilla クライアント）の `useSession` は nanostores の Atom であり、Vue の `ref` ではないため直接リアクティブに使えない。
以下のパターンで Vue の `ref` に変換すること。

```ts
import { useSession } from '@/lib/auth';
import { ref, onUnmounted } from 'vue';

const sessionData = ref(useSession.get());
const unsub = useSession.subscribe((v) => { sessionData.value = v; });
onUnmounted(unsub);
// → sessionData.value.data?.user?.id でユーザー ID にアクセス
```

### `noUncheckedIndexedAccess` への対応

`tsconfig` で `noUncheckedIndexedAccess: true` が有効なため、`Record<string, T>` のインデックスアクセスは `T | undefined` になる。
キーが存在するかどうか不明なルックアップには `Map` + `.get()` を使うと型が明確になる。

```ts
// ❌ Record のインデックスアクセスは undefined になりうる
const answer = myAnswers[dateId]; // string | undefined

// ✅ Map の .get() は意図が明確
const answer = myAnswers.get(dateId); // string | undefined（型は同じだが意図が明示的）
```

# Project Overview

## General Guidelines

- Use TypeScript for all new code
- Follow consistent naming conventions
- Write self-documenting code with clear variable and function names
- Prefer composition over inheritance
- Use meaningful comments for complex business logic

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Use trailing commas in multi-line objects and arrays

## Architecture Principles

- Organize code by feature, not by file type
- Keep related files close together
- Use dependency injection for better testability
- Implement proper error handling
- Follow single responsibility principle
