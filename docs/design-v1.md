# RollHub（たく日和）— 設計ドキュメント 最新版

> **最終更新**: 2026-06-01  
> マーダーミステリー・TRPG向けのセッション管理・卓建て補助 Web アプリ

---

## 目次

1. [技術スタック](#1-技術スタック)
2. [画面構成](#2-画面構成)
3. [命名規則](#3-命名規則)
4. [DBスキーマ](#4-dbスキーマ)
5. [ステータス設計](#5-ステータス設計)
6. [日程調整設計](#6-日程調整設計)
7. [API設計](#7-api設計)
8. [意思決定ログ](#8-意思決定ログ)
9. [スコープ外（Ph2以降）](#9-スコープ外ph2以降)

---

## 1. 技術スタック

| レイヤー | 技術 |
|---|---|
| モノレポ管理 | pnpm workspaces |
| フロントエンド | Vue 3 + TypeScript + Vite（`apps/frontend`） |
| バックエンド | Hono（`packages/backend`） |
| ORM / DB | Drizzle / Neon（PostgreSQL） |
| 認証 | Better Auth（ソーシャルログインのみ） |
| 状態管理 | Pinia |
| デプロイ | Vercel |
| テスト | Vitest + Playwright |

---

## 2. 画面構成

| URL | 概要 |
|---|---|
| `/` | ダッシュボード |
| `/profile/setting` | プロフィール設定 |
| `/game-sessions` | セッション一覧 |
| `/game-sessions/new` | セッション新規作成 |
| `/game-sessions/[id]` | セッション詳細 |
| `/join/[token]` | ゲストリンク参加（フロントエンドページ） |

---

## 3. 命名規則

### コード上の識別子

> ⚠️ Better Auth との名前衝突を避けるため、卓に関するあらゆるコード上の識別子は `game` プレフィックスを付ける。

| 対象 | 規則 | 理由 |
|---|---|---|
| URL | `/game-sessions` | Better Auth との衝突回避 |
| 変数名 | `gameSession` | `session` は Better Auth のセッション変数と衝突するため使用禁止 |
| 型名 | `GameSession` | Better Auth の `Session` 型と区別するため |
| DBカラム | スネークケース（例: `host_user_id`） | DB標準的な慣習 |

---

## 4. DBスキーマ

### 方針

- ステータスは DB に持たず、ファクトデータから**計算して導出する**
- Better Auth は `auth` スキーマで管理。RollHub 側のテーブルは `public` スキーマ
- `user.id` は Better Auth の仕様により `text` 型（uuid ではない）

---

### `auth.user` — ユーザー（Better Auth 管理）

> Better Auth が自動生成するテーブル。RollHub 側から直接変更しない。

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `text` | PK |
| `name` | `text?` | 表示名。`/profile/setting` で編集可 |
| `email` | `text` | unique |
| `emailVerified` | `boolean` | |
| `image` | `text?` | OAuth プロバイダーの画像 URL。Ph1 は永続化なし |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |

> ⚠️ `userProfiles` テーブルは不要。Ph1 で管理するプロフィール情報は `name` のみで、`auth.user` で完結する。

---

### `game_sessions` — セッション（卓）

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `host_user_id` | `text` | FK → `auth.user.id` |
| `title` | `text` | セッションタイトル |
| `scenario_name` | `text?` | シナリオ名。シナリオなしの場合は `null` |
| `description` | `text?` | 備考・説明文 |
| `max_players` | `integer?` | 定員。未設定の場合は `null` |
| `guest_link_token` | `text` | ゲストリンク用トークン。アプリ側で生成して DB に保持 |
| `is_published` | `boolean` | 公開フラグ。`false` の間は `draft` |
| `open_until` | `date?` | 募集締め切り日。`null` なら募集期間なし |
| `scheduled_at` | `date?` | 実施日。`null` なら日程未確定 |
| `completed_at` | `timestamp?` | 完了日時。ホストの明示的な完了アクションで記録 |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

> ステータス導出ロジックは [5. ステータス設計](#5-ステータス設計) 参照。

---

### `game_session_members` — 参加登録

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `game_session_id` | `uuid` | FK → `game_sessions.id` |
| `user_id` | `text?` | FK → `auth.user.id`。ログインユーザーのみ。ゲストは `null` |
| `guest_name` | `text?` | ゲストの表示名。ゲストのみ。ログインユーザーはプロフィールから取得 |
| `character_name` | `text?` | キャラクター名（自由入力） |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

> **Ph2以降**: シナリオ管理機能の実装時に `game_session_characters` テーブルを追加し、`character_name` から `character_id` FK に移行予定。

---

### `game_session_candidates` — 候補日

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `game_session_id` | `uuid` | FK → `game_sessions.id` |
| `date` | `date` | 候補日（時刻は持たない） |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

> 候補日はホスト（Ph1 では卓を作った人）のみ登録可能。ステータスに関係なくいつでも登録できる。

---

### `game_session_answers` — 日程回答（◯△×）

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `candidate_id` | `uuid` | FK → `game_session_candidates.id` |
| `member_id` | `uuid` | FK → `game_session_members.id` |
| `answer` | `'ok' \| 'maybe' \| 'ng'` | 回答値 |
| `comment` | `text?` | 回答コメント（任意） |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

---

### リレーション概要

```
auth.user
  └─< game_sessions (host_user_id)
  └─< game_session_members (user_id) ※ゲストはnull

game_sessions
  └─< game_session_members
  └─< game_session_candidates

game_session_candidates
  └─< game_session_answers

game_session_members
  └─< game_session_answers
```

---

## 5. ステータス設計

### 方針

ステータスは DB に保持せず、DB のファクトデータから**計算して導出する**。

### ファクトカラム（`game_sessions` テーブル）

| カラム名 | 型 | 説明 |
|---|---|---|
| `is_published` | `boolean` | 公開フラグ。`false` の間は非公開（draft） |
| `open_until` | `date?` | 募集締め切り日。`null` なら募集期間なし |
| `scheduled_at` | `date?` | 実施日。`null` なら日程未確定 |
| `completed_at` | `timestamp?` | 完了日時。`null` なら未完了。ホストの意思的な完了アクションで記録 |

> `completed_at` を明示的に持つ理由: 実施日が過ぎても自動完了にしないため。キャンセルや延期など「実施日が過ぎたが完了ではない」ケースを表現できるようにする。

### ステータス一覧

| ステータス | 表示名 | 説明 |
|---|---|---|
| `draft` | 非公開 | 公開前の下書き状態 |
| `open` | 募集中 | 公開済み・募集期間内 |
| `scheduling` | 日程調整中 | 募集期間終了・実施日未確定 |
| `confirmed` | 実施前 | 実施日確定・当日前 |
| `today` | 当日 | 実施日が今日 |
| `completed` | 通過済み | 完了済み |

### 導出ロジック

```ts
// utils/gameSessionStatus.ts

export type GameSessionStatus =
  | 'draft'
  | 'open'
  | 'scheduling'
  | 'confirmed'
  | 'today'
  | 'completed'

export function getGameSessionStatus(
  session: Pick<GameSession, 'isPublished' | 'openUntil' | 'scheduledAt' | 'completedAt'>,
  now: Date = new Date()
): GameSessionStatus {
  if (!session.isPublished) return 'draft'

  if (session.openUntil && now < session.openUntil) return 'open'

  if (!session.scheduledAt) return 'scheduling'

  if (session.completedAt) return 'completed'

  if (isToday(session.scheduledAt, now)) return 'today'

  return 'confirmed'
}

function isToday(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}
```

> フロントエンド・サーバーサイド両方から呼び出せるよう `utils/` に配置する。

### ステータス遷移フロー

```
is_published=false
      │
      │ 公開する
      ▼
   open      ◀──  open_until が未来
      │
      │ open_until を過ぎる or 募集期間なし
      ▼
 scheduling  ◀──  scheduled_at=null
      │
      │ scheduled_at を確定する
      ▼
 confirmed   ◀──  実施日が未来
      │
      │ 実施日が今日になる
      ▼
   today
      │
      │ ホストが完了アクション（completed_at をセット）
      ▼
 completed
```

---

## 6. 日程調整設計

### フロー概要

```
open（募集中）
  │  参加者が集まったらホストが候補日を登録
  ▼
scheduling（日程調整中）
  │  参加者が ◯△× で回答
  │  ホストが「この日にする」で確定 → scheduled_at をセット
  ▼
confirmed（実施前）
```

### 参加登録

| ユーザー種別 | 登録方法 | 表示名 |
|---|---|---|
| ログインユーザー | アカウントで登録 | プロフィールの name を自動使用 |
| ゲストユーザー | ゲストリンクを踏んで名前を入力 | 入力した名前（`guest_name`） |

### 日程調整の回答権限

| ユーザー種別 | 編集できる回答 |
|---|---|
| ログインユーザー | 自分の回答のみ |
| ゲストユーザー | セッション内の全ゲストの回答（本人確認不可のため） |

> ゲストの回答は全員分が編集可能な状態でそのまま表示される。

### 日程確定

ホストが候補日を1つ選んで確定操作をすると、`game_sessions.scheduled_at` にその日付がセットされる。
これによりステータスが `scheduling` → `confirmed` に遷移する。

---

## 7. API設計

### 方針

- `GET /game-sessions` はホストの卓・参加中の卓を区別せず全件返す
- 絞り込み（ホスト卓のみ / 参加中のみ）はフロント側で実装する

### エンドポイント一覧

#### Game Sessions

| メソッド | パス | 概要 |
|---|---|---|
| `GET` | `/api/game-sessions` | セッション一覧（全件） |
| `POST` | `/api/game-sessions` | セッション新規作成 |
| `GET` | `/api/game-sessions/:id` | セッション詳細（メンバー含む） |
| `PATCH` | `/api/game-sessions/:id` | セッション情報更新 |
| `DELETE` | `/api/game-sessions/:id` | セッション削除（ホストのみ） |
| `PATCH` | `/api/game-sessions/:id/status` | ステータス遷移（`draft→open` / `today→completed`） |

#### Game Session Members

| メソッド | パス | 概要 |
|---|---|---|
| `GET` | `/api/game-sessions/:id/members` | メンバー一覧取得 |
| `POST` | `/api/game-sessions/:id/members` | メンバー参加（ログインユーザー） |
| `POST` | `/api/game-sessions/:id/guest-members` | ゲストリンク経由でメンバー参加 |
| `PATCH` | `/api/game-sessions/:id/members/:memberId` | メンバー情報更新（キャラクター名） |
| `DELETE` | `/api/game-sessions/:id/members/:memberId` | メンバー退出 |

#### Schedules（日程調整）

| メソッド | パス | 概要 |
|---|---|---|
| `GET` | `/api/game-sessions/:id/availability-dates` | 候補日一覧（回答含む） |
| `POST` | `/api/game-sessions/:id/availability-dates` | 候補日を1件追加 |
| `PUT` | `/api/game-sessions/:id/availability-dates` | 候補日を一括更新（`{ dates }` で全件置き換え、差分は追加/削除） |
| `DELETE` | `/api/game-sessions/:id/availability-dates/:dateId` | 候補日を1件削除 |
| `POST` | `/api/game-sessions/:id/availability-dates/:dateId/confirm` | 候補日確定（`scheduled_at` セット） |
| `PUT` | `/api/game-sessions/:id/availability-dates/:dateId/responses` | 日程回答（◯△×）登録・更新 |

#### Guest Links

| メソッド | パス | 概要 |
|---|---|---|
| `GET` | `/api/game-sessions/:id/guest-link` | ゲストリンク取得（ホストのみ） |
| `GET` | `/api/join/:token` | ゲストリンクプレビュー（未ログイン可） |

#### Profile

| メソッド | パス | 概要 |
|---|---|---|
| `GET` | `/api/profile` | 自分のプロフィール取得 |
| `PATCH` | `/api/profile` | プロフィール更新 |

---

## 8. 意思決定ログ

### DB設計

#### カラム名はスネークケース
DB カラム名はすべてスネークケースで統一する（例: `host_user_id`, `game_session_id`）。

#### GM概念は Ph1 では持たない
Ph1 では「ホスト = 卓を作った人」として権限チェックを行う。GM という概念は UI・コードに登場させない。
`game_sessions.host_user_id` のみで完結する。

Ph2 以降で以下を検討:
- GM なし卓
- ホスト以外の参加者を GM に指定する

その際は `game_sessions.gm_user_id` カラムを追加し、初期値は `host_user_id` と同値にする想定。

#### `scenario_name` は Ph1 のままテキストで持つ
Ph1 ではシナリオ名を `game_sessions.scenario_name`（`text?`）として自由入力で管理する。
Ph2 でシナリオ管理機能を実装する際に `scenario_id`（FK）へ移行予定。

#### 候補日は事前登録可能
`game_session_candidates` への候補日登録は、ステータスに関係なくいつでも登録できる。

### API設計

#### publish / complete を PATCH /status に統合
当初 `POST /publish` と `POST /complete` を独立エンドポイントとして設計していたが、`PATCH /:id/status` に統合した。

- `{ status: "open" }` — `draft → open`（公開）
- `{ status: "completed" }` — `today → completed`（完了）

`scheduling → confirmed` の遷移は `POST .../availability-dates/:dateId/confirm` が担う（日程確定と同時に行うため独立させる）。

#### セッション一覧は全件返す
`GET /game-sessions` はホストの卓・参加中の卓を区別せず全件返す。絞り込みはフロント側で実装する。

#### ゲストリンク参加は2ステップ
当初 `POST /join/:token` 1本でゲスト参加を完結させる設計だったが、以下の理由で分割した。

1. `GET /api/join/:token` — トークンを受け取り卓の概要を返す（未ログイン可）。フロントがプレビュー画面を表示するために使う。
2. `POST /api/game-sessions/:id/guest-members` — ゲストとして参加登録する（ログイン済みユーザー）。

ログイン後にリダイレクトされ参加するフローを自然に表現するため。

---

## 9. スコープ外（Ph2以降）

| 機能 | 追加・変更内容 |
|---|---|
| シナリオ管理 | `scenarios`, `scenario_characters` テーブルを追加 |
| キャラクター選択 | `game_session_characters` テーブルを追加（`game_session_members.character_name` を `character_id` FK に置き換え） |
| プロフィール画像永続化 | `auth.user.image` の永続化対応 |
| GM指定機能 | `game_sessions.gm_user_id` カラムを追加 |
| GMなし卓 | 別途設計 |
