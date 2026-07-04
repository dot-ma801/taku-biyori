# RollHub（たく日和）— 設計ドキュメント 最新版

> **最終更新**: 2026-07-01  
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
| 認証 | Better Auth（userid + password / Google OAuth） |
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
| `/game-sessions/[id]` | セッション詳細（ゲストもこの画面を使う。ゲスト招待は `/game-sessions/[id]?token=<guest_link_token>` 付きリンクで配る） |

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
- **機能ごとに PostgreSQL スキーマを分ける**（ADR 0005 参照）。Better Auth は `auth` スキーマ、卓関連テーブルは `game_session` スキーマで管理
- `user.id` は Better Auth の仕様により `text` 型（uuid ではない）

---

### `auth.user` — ユーザー（Better Auth 管理）

> Better Auth が管理するテーブル。username プラグインにより `username`・`display_username` カラムが追加されている。

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `text` | PK |
| `name` | `text?` | 表示名（ユーザー登録時に入力）。`/profile/setting` で編集可 |
| `email` | `text?` | unique。userid + password 登録時はフロントが生成したプレースホルダー値が入る（ユーザーには非公開） |
| `emailVerified` | `boolean` | |
| `image` | `text?` | OAuth プロバイダーの画像 URL。Ph1 は永続化なし |
| `username` | `text?` | unique。ログイン識別子（userid）。userid + password 登録ユーザーのみ設定される |
| `display_username` | `text?` | username プラグインが内部管理する表示用フィールド。RollHub では `name` を表示名として使うため参照しない |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |

> ⚠️ `userProfiles` テーブルは不要。Ph1 で管理するプロフィール情報は `name` のみで、`auth.user` で完結する。
>
> ⚠️ `email` カラムには userid + password 登録ユーザーのプレースホルダー値が入る。アプリ内でメールアドレスとして表示・利用しないこと（ADR 0004 参照）。

---

### `game_session.game_sessions` — セッション（卓）

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

### `game_session.game_session_members` — 参加登録

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

### `game_session.game_session_candidates` — 候補日

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `game_session_id` | `uuid` | FK → `game_sessions.id` |
| `date` | `date` | 候補日（時刻は持たない） |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

> 候補日はホスト（Ph1 では卓を作った人）のみ登録可能。
> ステータスが `draft`・`open`・`scheduling` のときのみ操作可能（追加・更新・削除）。
> `scheduled_at` が確定済み（非 `null`）の場合は候補日の変更は不可（`409 Conflict`）。

---

### `game_session.game_session_answers` — 日程回答（◯△×）

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

> ゲスト参加は**完全匿名（ログイン不要）**。`user_id` は `null` で登録する。
> 本人確認の手段を持たないため**重複参加を許容**する（同名でも別レコードとして登録される。調整さんと同方針）。
> 参加可能なのは `status === open` のときのみ（通常参加と同条件）。

### 日程調整の回答権限

| ユーザー種別 | 編集できる回答 |
|---|---|
| ログインユーザー | 自分の回答のみ |
| ゲストユーザー | セッション内の全ゲストの回答（本人確認不可のため） |

> ゲストの回答は全員分が編集可能な状態でそのまま表示される。
> ゲストの回答は専用エンドポイント `guest-responses` 経由で行い、`Guest-Token` ヘッダーでトークン検証する。
> ログイン参加者の回答（`user_id != null`）はゲスト経路からは編集できない。

### 日程確定

ホストが候補日を1つ選んで確定操作をすると、`game_sessions.scheduled_at` にその日付がセットされる。
これによりステータスが `scheduling` → `confirmed` に遷移する。

#### 確定後の編集フォームの挙動

日程確定後も編集フォーム（`/edit`）へのアクセスは可能。スケジュールセクションの挙動が変わる:

- 「複数の候補日を選択する」スイッチは非表示（常に単一日モード）
- 「開催日」フィールドは引き続き編集可能
- 候補日の追加・更新・削除は API レベルでも禁止（`409 Conflict`）

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
| `POST` | `/api/game-sessions/:id/guest-members` | ゲストリンク経由でメンバー参加（認証不要・`Guest-Token` ヘッダー必須） |
| `PATCH` | `/api/game-sessions/:id/members/:memberId` | メンバー情報更新（キャラクター名） |
| `DELETE` | `/api/game-sessions/:id/members/:memberId` | メンバー退出 |

#### Schedules（日程調整）

| メソッド | パス | 概要 |
|---|---|---|
| `GET` | `/api/game-sessions/:id/availability-dates` | 候補日一覧（回答含む） |
| `POST` | `/api/game-sessions/:id/availability-dates` | 候補日を1件追加（確定済みは `409`） |
| `PUT` | `/api/game-sessions/:id/availability-dates` | 候補日を一括更新（`{ dates }` で全件置き換え、差分は追加/削除）（確定済みは `409`） |
| `DELETE` | `/api/game-sessions/:id/availability-dates/:dateId` | 候補日を1件削除（確定済みは `409`） |
| `POST` | `/api/game-sessions/:id/availability-dates/:dateId/confirm` | 候補日確定（`scheduled_at` セット） |
| `PUT` | `/api/game-sessions/:id/availability-dates/:dateId/responses` | 日程回答（◯△×）登録・更新（ログインユーザー。自分の回答のみ） |
| `PUT` | `/api/game-sessions/:id/availability-dates/:dateId/guest-responses` | ゲストの日程回答（認証不要・`Guest-Token` 必須・`memberId` 指定で全ゲスト分を編集可） |

#### Guest Links

| メソッド | パス | 概要 |
|---|---|---|
| `GET` | `/api/game-sessions/:id/guest-link` | ゲストリンク取得（ホストのみ）。返ったトークンで `/game-sessions/:id?token=...` を組み立てて配る |

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

#### 一覧レスポンス（`GameSessionListItem`）に含めるフィールドの基準
詳細 API（`GET /api/game-sessions/:id`）との差は `members[]`（メンバー全員の JOIN）の有無にある。
スカラーフィールドの追加基準は「一覧画面の UX に直接必要か」とし、便宜上の追加は行わない。

この基準に基づき、空き枠表示のために `maxMembers` を一覧レスポンスに追加した。
追加 DB コストはゼロ（`max_players` カラムはクエリですでに取得済みだったため）。
詳細は [ADR 0002](./adr/0002-game-session-list-max-members.md) を参照。

#### ゲスト参加は「完全匿名 + トークンリンクのみ」で、専用ページを持たない

旧設計（`GET /api/join/:token` でプレビュー → `/join/[token]` 専用ページ →
ログイン済みユーザーが `POST .../guest-members`）は破棄した。
ゲストは**ログインせずに名前だけで参加できる**ことを要件としたため、
以下の方針に確定した。

**方針**
- ゲスト専用ページ（`/join/[token]`）と専用プレビューAPI（`GET /api/join/:token`）は**作らない**。
- ゲストもログインユーザーと**同じ卓詳細画面** `/game-sessions/:id` を使う。
  - 閲覧は既存の `GET /api/game-sessions/:id`（公開済みなら未ログインで閲覧可）に乗る。トークン不要。
- ホストは `GET /api/game-sessions/:id/guest-link` でトークンを取得し、
  `/game-sessions/:id?token=<guest_link_token>` という形のリンクを配る。
- **秘匿性はトークンのみで担保**する。トークンを知らなければ参加・回答ができない。

**トークンの扱い（REST方針）**
- トークンは「参加・回答を認可する資格情報（capability）」として扱う。
- リンク（`?token=`）に載るのは配布のため不可避だが、**API 呼び出しでは
  `Guest-Token` ヘッダーに載せ替える**。クエリやボディに認可キーを置くのは避ける
  （クエリはログ・履歴・Referer に残りやすく、ボディはリソース表現に鍵が混ざるため）。
- `Authorization: Bearer` ではなく専用ヘッダー名にして better-auth の認証と区別する。

**Referer 漏洩対策（緩和策）**
- `?token=` 付き URL が Referer ヘッダーを通じて外部リンク先に漏洩するリスクがある。
- 緩和策として以下のどちらか（または両方）を適用する：
  1. ページに `<meta name="referrer" content="no-referrer">` を付与するか、
     レスポンスヘッダーに `Referrer-Policy: no-referrer` を設定してトークンを漏らさない。
  2. ゲストが卓詳細画面を開いた際に `history.replaceState({}, '', '/game-sessions/:id')` で
     URL から `?token=` を削除し、ブラウザ履歴・Referer にトークンが残らないようにする。
- フロントが Vue Router のナビゲーションガードや `onMounted` でリプレースを行うのが最小コスト。

**ゲストが使うエンドポイント**

| 操作 | エンドポイント | 認証 | トークン | 主なエラー |
|---|---|---|---|---|
| 閲覧 | `GET /api/game-sessions/:id` | 不要（公開済み前提） | 不要 | 非公開は 401/403 |
| 参加 | `POST /api/game-sessions/:id/guest-members` | 不要 | `Guest-Token` 必須 | token不一致 403 / `open`以外 422 / 卓なし 404 |
| 回答 | `PUT /api/game-sessions/:id/availability-dates/:dateId/guest-responses` | 不要 | `Guest-Token` 必須 | token不一致 403 / 非ゲストmemberId 403 / 卓・日付なし 404 |



- 参加 body: `{ guestName }`（`user_id` は null 登録）。**重複参加は許容**（dup チェックなし）。
- 回答 body: `{ memberId, answer, comment? }`。`memberId` がその卓の**ゲストメンバー（`user_id = null`）**であることを検証。
  本人確認はしないため、**どのゲストでも全ゲスト列を編集可**（調整さん方式）。
- キャラ名編集（`PATCH .../members/:memberId`）と退出（`DELETE .../members/:memberId`）は
  **ホストのみ**（現状維持）。ゲスト自身はこれらを行えない。

**参加可能状態は通常参加と揃える**
- 通常参加（`POST .../members`）が `status === open` のみ許可（それ以外は 422）なので、ゲスト参加も同条件。
- `maxMembers` の満員チェックは通常参加にも無いため、ゲスト参加にも入れない（入れるなら Ph2 で両方に）。

**フロントのガード**
- 不正・不可能な操作（非 `open` での参加、トークン無しでの参加/回答、ホスト専用操作）は
  サーバが適切な HTTP ステータスで拒否しつつ、フロントでも極力ボタン等を出さない。

---

## 9. スコープ外（Ph2以降）

| 機能 | 追加・変更内容 |
|---|---|
| シナリオ管理 | `scenarios`, `scenario_characters` テーブルを追加 |
| キャラクター選択 | `game_session_characters` テーブルを追加（`game_session_members.character_name` を `character_id` FK に置き換え） |
| プロフィール画像永続化 | `auth.user.image` の永続化対応 |
| GM指定機能 | `game_sessions.gm_user_id` カラムを追加 |
| GMなし卓 | 別途設計 |
