# RollHub（たく日和）— 設計ドキュメント v1.1: 募集と卓の分離

> **最終更新**: 2026-07-07
> **元要求**: [docs/requirements/recruitment-separation.md](./requirements/recruitment-separation.md)
> **位置づけ**: [design-v1.md](./design-v1.md) に対する**差分設計書**。本書に記載のない事項（技術スタック、認証、ゲストトークンの扱い、命名規則の基本方針など）は design-v1 を踏襲する。

---

## 目次

1. [概要とコンセプト](#1-概要とコンセプト)
2. [命名](#2-命名)
3. [DBスキーマ](#3-dbスキーマ)
4. [ステータス設計](#4-ステータス設計)
5. [卓確定（選出）の設計](#5-卓確定選出の設計)
6. [API設計](#6-api設計)
7. [画面構成](#7-画面構成)
8. [既存（卓）側の変更](#8-既存卓側の変更)
9. [実装ステップ](#9-実装ステップ)
10. [意思決定ログ](#10-意思決定ログ)

---

## 1. 概要とコンセプト

「卓（game_session）」が担っていた**募集・日程調整**の責務を、新概念**「募集枠（recruitment）」**に分離する。

```
【募集枠 recruitment】                    【卓 game_session】
  作成 → 公開 → 参加募集 → 日程調整 ──確定──▶ 実施前 → 当日 → 完了
  （人を多めに集めて日程を調整する）        （日程とメンバーが確定した状態でのみ存在）
                                              ▲
  直接卓立て（日程・メンバー決め打ち）────────┘
```

- 募集枠では定員を超えて人を集めてよい。**卓確定時に「その日に来られる人」を選ぶ**ことで、「キック」操作を不要にする
- 選ばれなかった人は募集枠の参加者のまま。強い言葉（キック・削除・落選）は UI に出さない
- 卓は募集枠を経由せず直接作ることもできる（既存グループ向け最短導線）。作成後の扱いは募集経由と同一

---

## 2. 命名

| 対象 | 名前 |
|---|---|
| 概念の英語名 | **recruitment**（仮称をそのまま正式採用） |
| PostgreSQL スキーマ | `recruitment` |
| URL | `/recruitments` |
| 変数名 / 型名 | `recruitment` / `Recruitment` |
| バックエンドの機能ディレクトリ | `packages/backend/src/recruitment/` |

> `recruitment` は Better Auth の予約概念（`session` / `user` / `account` / `verification`）と衝突しないため、
> `game` プレフィックスは**付けない**。`game` プレフィックスは引き続き卓（gameSession）系の識別子にのみ使う。

---

## 3. DBスキーマ

### 方針

- design-v1 と同じく、ステータスは DB に持たずファクトデータから導出する
- ADR 0005 に従い、新テーブル・enum は `pgSchema('recruitment')` 配下に定義する
- 構造は既存の `game_session` スキーマ4テーブルのミラー。**既存テーブルは（確定リンク以外）変更しない**

### `recruitment.recruitments` — 募集枠

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `host_user_id` | `text` | FK → `auth.user.id` |
| `title` | `text` | 募集タイトル |
| `scenario_name` | `text?` | シナリオ名 |
| `description` | `text?` | 備考・説明文 |
| `location` | `text?` | 開催場所（オンライン等の自由入力） |
| `max_players` | `integer?` | 定員。`null` なら定員なし（選出は常に全員） |
| `guest_link_token` | `text` | ゲストリンク用トークン（design-v1 と同じ仕組み） |
| `is_published` | `boolean` | 公開フラグ |
| `open_until` | `date?` | 募集締め切り日 |
| `confirmed_game_session_id` | `uuid?` | **unique** FK → `game_session.game_sessions.id`。卓確定で生成された卓。`null` なら未確定 |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

> `confirmed_game_session_id` が「確定した」というファクト。ステータス導出はこの1行で完結する（JOIN 不要）。
> unique 制約により「1募集枠 → 高々1卓」を DB レベルで保証する。
> 卓側から見た出自（この卓はどの募集から生まれたか）は、この unique FK の逆引きで取得できる。

### `recruitment.recruitment_members` — 募集枠の参加者

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `recruitment_id` | `uuid` | FK → `recruitments.id`（cascade delete） |
| `user_id` | `text?` | FK → `auth.user.id`。ゲストは `null` |
| `guest_name` | `text?` | ゲストの表示名 |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

> partial unique index: `(recruitment_id, user_id) WHERE user_id IS NOT NULL`（ログインユーザーの重複参加防止。既存と同じ）。
> **`character_name` は持たない**。キャラクター名は「卓に着席してから」の関心事とし、卓側（`game_session_members.character_name`）でのみ管理する（[意思決定ログ](#10-意思決定ログ)参照）。

### `recruitment.recruitment_candidates` — 候補日

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `recruitment_id` | `uuid` | FK → `recruitments.id`（cascade delete） |
| `date` | `date` | 候補日（時刻は持たない） |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

### `recruitment.recruitment_answers` — 日程回答（◯△×）

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK |
| `candidate_id` | `uuid` | FK → `recruitment_candidates.id`（cascade delete） |
| `member_id` | `uuid` | FK → `recruitment_members.id`（cascade delete） |
| `answer` | `recruitment.recruitment_answer` | enum `'ok' \| 'maybe' \| 'ng'` |
| `comment` | `text?` | 回答コメント |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

> unique 制約: `(candidate_id, member_id)`。
> enum は `recruitment` スキーマに新規定義する（`game_session.availability_date_answer` を跨いで参照しない。スキーマ独立性を優先）。

### リレーション概要

```
auth.user
  └─< recruitments (host_user_id)
  └─< recruitment_members (user_id) ※ゲストはnull

recruitments
  └─< recruitment_members
  └─< recruitment_candidates
  └─1 game_session.game_sessions (confirmed_game_session_id, unique)  ← 確定リンク

recruitment_candidates ─< recruitment_answers >─ recruitment_members
```

---

## 4. ステータス設計

### 募集枠のステータス

ファクトカラム: `is_published` / `open_until` / `confirmed_game_session_id`

| ステータス | 表示名 | 条件 |
|---|---|---|
| `confirmed` | 卓確定済み | `confirmed_game_session_id != null`（最優先） |
| `draft` | 非公開 | `is_published = false` |
| `open` | 募集中 | 公開済み・`open_until` が `null` または未来 |
| `scheduling` | 日程調整中 | 公開済み・`open_until` 経過 |

```ts
// utils/recruitmentStatus.ts（フロント・バック共用。getGameSessionStatus と同配置）

export type RecruitmentStatus = 'draft' | 'open' | 'scheduling' | 'confirmed';

export function getRecruitmentStatus(
  recruitment: Pick<
    Recruitment,
    'isPublished' | 'openUntil' | 'confirmedGameSessionId'
  >,
  now: Date = new Date(),
): RecruitmentStatus {
  if (recruitment.confirmedGameSessionId) return 'confirmed';
  if (!recruitment.isPublished) return 'draft';
  if (!recruitment.openUntil || now < recruitment.openUntil) return 'open';
  return 'scheduling';
}
```

> `confirmed` を最優先にする理由: 確定は終端状態であり、公開フラグや締め切りに関係なく以降の参加・回答を締め切るため。
> `open` / `scheduling` の判定は既存 `getGameSessionStatus` の修正済みロジック（`docs/game-session-status.md`）と同一。
> **卓確定は `open` / `scheduling` のどちらからでも可能**（締め切り前でも回答が揃えばホストは確定できる）。

### ステータスごとの操作可否

| 操作 | draft | open | scheduling | confirmed |
|---|---|---|---|---|
| 募集枠の編集（PATCH） | ✅ | ✅ | ✅ | ❌ 409 |
| 参加（ログイン / ゲスト） | ❌ 422 | ✅ | ❌ 422 | ❌ 422 |
| 候補日の追加・削除 | ✅ | ✅ | ✅ | ❌ 409 |
| 日程回答（◯△×） | ✅* | ✅ | ✅ | ❌ 409 |
| 卓確定 | ❌ 422 | ✅ | ✅ | ❌ 409 |

> \* draft 中に回答できるのは実質ホスト本人のみ（他者は非公開のため到達できない）。
> 参加可否を `open` のみに限定するのは design-v1 の既存方針と同じ。

### 卓のステータス（最終形）

卓は「実施前 → 当日 → 完了」のみを持つ（詳細は [8. 既存（卓）側の変更](#8-既存卓側の変更)）。

---

## 5. 卓確定（選出）の設計

本要求のコア機能。**候補日を1つ選び、その日に来られるメンバーで卓を作る**。

### 選出ルール

1. **選出対象（eligible）** = 確定候補日に `ok` または `maybe` を回答した募集枠メンバー
2. `max_players` が `null`、または選出対象が `max_players` 以下 → **全員自動選出**（手動選出ステップなし）
3. 選出対象が `max_players` 超過 → **ホストが手動で選出**（選出数は `max_players` 以下）

### 確定処理（1トランザクション）

`POST /api/recruitments/:id/confirm` — body: `{ candidateId, memberIds?: string[] }`

```
1. 卓 game_sessions を INSERT
   - title / scenario_name / description / location / max_players を募集枠からコピー
   - host_user_id = 募集枠のホスト
   - scheduled_at = 確定候補日の date
   - is_published = true、guest_link_token は新規生成（募集枠のトークンは使い回さない）
2. 選出メンバーを game_session_members に INSERT
   - user_id / guest_name をコピー（character_name は null。卓側で後から設定）
3. recruitments.confirmed_game_session_id に 1 の卓 ID をセット
```

### バリデーション・エラー

| 条件 | レスポンス |
|---|---|
| ホスト以外の実行 | `403` |
| 確定済み（`confirmed_game_session_id != null`） | `409` |
| ステータスが `draft` | `422` |
| `candidateId` がこの募集枠の候補日でない | `404` |
| `memberIds` 省略・選出対象が定員超過（手動選出が必要） | `422`（`selection_required` を示すエラーコード） |
| `memberIds` に選出対象外（×回答・未回答・他募集枠のメンバー）を含む | `422` |
| `memberIds` が定員超過 or 空配列 | `422` |
| 選出対象が0人 | `422`（別の候補日を選ぶよう促す） |

> `memberIds` 省略時は選出対象全員をそのまま選出する（受け入れ基準「定員以内なら手動選出ステップが出ない」に対応）。
> レスポンスは作成された卓（`GameSession`）を返し、フロントは卓詳細へ遷移する。

### 確定後の募集枠

- 参加・日程回答・候補日変更・募集枠編集をすべて受け付けない（read-only）
- 詳細画面は閲覧可能のまま。選出メンバーには卓詳細へのリンクを表示する
- **非選出者への表現**: 「今回は日程が合いませんでした。またの機会にぜひ遊びましょう」等の柔らかい文言。「キック」「削除」「落選」は使わない

---

## 6. API設計

### 方針

- 既存の game-sessions 系 API と同じ構造・権限モデル・ゲストトークン方式（`Guest-Token` ヘッダー）をミラーする
- 一覧は全件返却・絞り込みはフロント（design-v1 と同じ）
- shared パッケージに `Recruitment` / `RecruitmentListItem` / `CreateRecruitmentInput` / `UpdateRecruitmentInput` / `ConfirmRecruitmentInput` 等の契約型を先に定義する

### Recruitments

| メソッド | パス | 認証 | 概要 |
|---|---|---|---|
| `GET` | `/api/recruitments` | 必要 | 募集枠一覧（全件） |
| `POST` | `/api/recruitments` | 必要 | 募集枠新規作成 |
| `GET` | `/api/recruitments/:id` | 公開済みは不要 | 募集枠詳細（メンバー含む）。確定済みなら `confirmedGameSessionId` を含む |
| `PATCH` | `/api/recruitments/:id` | ホスト | 募集枠更新（確定済みは `409`） |
| `DELETE` | `/api/recruitments/:id` | ホスト | 募集枠削除 |
| `PATCH` | `/api/recruitments/:id/status` | ホスト | `{ status: "open" }` — `draft → open`（公開） |
| `POST` | `/api/recruitments/:id/confirm` | ホスト | **卓確定（選出）**。[5章](#5-卓確定選出の設計)参照 |

### Recruitment Members

| メソッド | パス | 認証 | 概要 |
|---|---|---|---|
| `GET` | `/api/recruitments/:id/members` | 公開済みは不要 | 参加者一覧 |
| `POST` | `/api/recruitments/:id/members` | 必要 | 参加（`open` のみ。それ以外 `422`） |
| `POST` | `/api/recruitments/:id/guest-members` | 不要・`Guest-Token` 必須 | ゲスト参加（`open` のみ） |
| `DELETE` | `/api/recruitments/:id/members/:memberId` | ホスト | 参加取り消し（確定済みは `409`） |

> `PATCH .../members/:memberId` は提供しない（募集枠メンバーは `character_name` を持たず、編集対象がないため）。

### Recruitment Schedules（日程調整）

既存の availability-dates 系と同一のインターフェース。ロジックは既存実装から移植する。

| メソッド | パス | 認証 | 概要 |
|---|---|---|---|
| `GET` | `/api/recruitments/:id/availability-dates` | 公開済みは不要 | 候補日一覧（回答含む） |
| `POST` | `/api/recruitments/:id/availability-dates` | ホスト | 候補日追加（確定済みは `409`） |
| `PUT` | `/api/recruitments/:id/availability-dates` | ホスト | 候補日一括更新（確定済みは `409`） |
| `DELETE` | `/api/recruitments/:id/availability-dates/:dateId` | ホスト | 候補日削除（確定済みは `409`） |
| `PUT` | `/api/recruitments/:id/availability-dates/:dateId/responses` | 必要 | 自分の回答登録・更新（確定済みは `409`） |
| `PUT` | `/api/recruitments/:id/availability-dates/:dateId/guest-responses` | 不要・`Guest-Token` 必須 | ゲスト回答（全ゲスト分編集可。確定済みは `409`） |

> 既存にあった `POST .../availability-dates/:dateId/confirm`（日程だけ確定）は募集枠には**存在しない**。
> 募集枠における「確定」は日程＋メンバー選出＋卓生成を不可分に行う `POST /:id/confirm` のみ。

### Recruitment Guest Links

| メソッド | パス | 認証 | 概要 |
|---|---|---|---|
| `GET` | `/api/recruitments/:id/guest-link` | ホスト | ゲストリンクトークン取得。`/recruitments/:id?token=...` を配る |

### 既存 API の変更

| API | 変更 |
|---|---|
| `GET /api/game-sessions/:id` | レスポンスに `recruitmentId?`（出自の募集枠。逆引き）を追加 |
| `POST /api/game-sessions` | 【最終形】`scheduledAt` 必須化（直接卓立て = 日程決め打ち）。移行期間中は現状のまま |
| 卓の availability-dates / status(`open`) 系 | 【段階6で廃止】[9章](#9-実装ステップ)参照 |

---

## 7. 画面構成

### 画面一覧

| URL | 概要 | 新規/変更 |
|---|---|---|
| `/` | ダッシュボード。**募集枠と卓を分けて表示**（「募集・調整中」「開催予定の卓」） | 変更 |
| `/recruitments` | 募集枠一覧 | **新規** |
| `/recruitments/new` | 募集枠新規作成（タイトル・シナリオ名・説明・場所・定員・締め切り・候補日） | **新規** |
| `/recruitments/:recruitmentId` | 募集枠詳細。参加・日程調整・卓確定はすべてこの画面。ゲストは `?token=` 付きリンクで同画面を使う | **新規** |
| `/recruitments/edit/:recruitmentId` | 募集枠編集（既存 `/game-sessions/edit/:id` と同パターン） | **新規** |
| `/game-sessions` | 卓一覧（確定済みの卓のみが並ぶ世界になる） | 位置づけ変更 |
| `/game-sessions/new` | **直接卓立て**（日程決め打ち。募集系フィールドは最終的に撤去） | 位置づけ変更 |
| `/game-sessions/:gameSessionId` | 卓詳細（実施前→当日→完了の管理、メンバー表示、キャラ名編集） | 位置づけ変更 |
| `/game-sessions/edit/:gameSessionId` | 卓編集 | 位置づけ変更 |

### 募集枠詳細画面（`/recruitments/:recruitmentId`）の構成

- **基本情報**: タイトル・シナリオ名・説明・場所・定員・締め切り・ステータスバッジ
- **参加者一覧**: 募集枠メンバー（定員超えて表示してよい。「5 / 定員3」のような表示可）
- **日程調整表**: 既存 `ScheduleDisplay` 系の実装詳細を流用・移植（◯△×マトリクス、ゲスト全列編集）
- **卓確定フロー（ホストのみ・`open`/`scheduling` 時）**: 画面内ダイアログのステップ形式
  1. 候補日を選ぶ（各候補日の ◯/△ 人数を表示）
  2. 選出対象が定員超過の場合**のみ**、メンバー選出ステップを表示（チェックボックス。◯/△回答者のみ選択可）
  3. 確認 → 確定 → 作成された卓詳細へ遷移
- **確定後**: 全操作を閉じ、「卓が確定しました」の案内を表示
  - 選出メンバー: 卓詳細へのリンク
  - 非選出メンバー: 「今回は日程が合いませんでした。またの機会にぜひ遊びましょう」（柔らかい文言。強い言葉を使わない）

### フロントエンドのディレクトリ方針

`features/Recruitment/` を新設し、`features/GameSession/` と同じ構成（List / New / Detail / Edit、Detail 配下に `Schedule/` サブディレクトリ）を取る。日程調整 UI・composable は既存 GameSession 実装から移植する。

---

## 8. 既存（卓）側の変更

### 最終形（旧経路廃止後）

- 卓は**日程とメンバーが確定した状態でのみ存在**する。ライフサイクルは「実施前 → 当日 → 完了」のみ
- ステータス導出は簡素化する:

```ts
export type GameSessionStatus = 'confirmed' | 'today' | 'completed';
// completed_at があれば completed / scheduled_at が今日なら today / それ以外 confirmed
```

- 完了は引き続きホストの明示アクション（`PATCH /:id/status` で `completed_at` セット）。自動完了しない
- `game_sessions` から `is_published` / `open_until` を、テーブルごと `game_session_candidates` / `game_session_answers` を削除
- `POST /api/game-sessions` は `scheduledAt` 必須
- 直接卓立ての卓へのメンバー追加は、既存のゲストリンク / 参加 API をそのまま使う。参加可否条件は `status === 'open'` から「**未完了かつ実施日前**」に変わる

### 移行期間中（旧経路廃止まで）

- 既存の卓の募集・日程調整機能（候補日 CRUD・◯△×回答・日程確定・`draft/open/scheduling` ステータス）は**そのまま動かし続ける**
- 本番データは存在しないため、データ移行は不要。廃止時はカラム・テーブルを drop するマイグレーションのみ

---

## 9. 実装ステップ

各段階を独立した PR として提出する（要求 §5）。GitHub issue はこの段階単位で切る。

| # | 内容 | 主な成果物 |
|---|---|---|
| 1 | **募集枠の基盤**: DB スキーマ（`recruitment` スキーマ4テーブル）+ shared 型 + 募集枠 CRUD API（一覧/作成/詳細/更新/削除/公開） | backend `src/recruitment/`、マイグレーション |
| 2 | **募集枠への参加と日程調整 API**: members / guest-members / guest-link / availability-dates / responses / guest-responses（既存ロジック移植） | backend |
| 3 | **卓確定 API**: `POST /:id/confirm`（選出バリデーション + トランザクション卓生成）+ `GET /game-sessions/:id` への `recruitmentId` 追加 | backend |
| 4 | **募集枠のフロントエンド**: 一覧・作成・詳細（参加・日程調整）・編集画面（既存 GameSession 実装の移植） | frontend `features/Recruitment/` |
| 5 | **卓確定フローのフロントエンド**: 確定ダイアログ（候補日選択 → 条件付き選出 → 確認）、確定後表示（非選出者文言含む）、ダッシュボード再構成 | frontend |
| 6 | **旧経路の廃止**: 卓の候補日・回答・募集ステータスの削除（API・UI・テーブル）、`POST /api/game-sessions` の `scheduledAt` 必須化、卓ステータス簡素化 | backend + frontend + マイグレーション |

> 段階 1〜5 の間、既存機能は無変更で動き続ける（要求 §5「既存実装を壊さず段階的に」）。
> 段階 6 は新経路の動作確認（受け入れ基準の一連フロー）完了後に着手する。

---

## 10. 意思決定ログ

### 「confirmed_game_session_id」を募集枠側に持つ（卓側に recruitment_id を持たない）

ステータス導出をファクトデータから行う方針のため、募集枠のステータスが**自テーブルの行だけで**計算できることを優先した。
unique FK なので卓側からの出自参照も逆引きで可能（`GET /api/game-sessions/:id` が `recruitmentId` を返す）。

### 募集枠メンバーは character_name を持たない

キャラクター名は「卓に着席してから」決まる関心事（シナリオのネタバレ配慮・HO割り当て等も卓確定後）。
募集段階で持たせると、非選出者のキャラ名という無意味なデータが残る。卓確定時は `character_name = null` でコピーし、卓詳細画面で従来どおり編集する。

### 確定はステータス遷移 API ではなく専用エンドポイント

design-v1 で「日程確定は `PATCH /status` に統合せず独立エンドポイント」とした判断を踏襲・発展させた。
卓確定は「日程確定 + メンバー選出 + 卓生成」の不可分な複合操作であり、`{ status: ... }` の形に収まらないため `POST /:id/confirm` とする。

### 確定時に guest_link_token を新規生成する

募集枠のトークンを卓に使い回すと、非選出者（募集枠のトークンを知っている）が卓側のゲスト操作をできてしまう。
卓は独立した資格情報を持つ。

### enum は recruitment スキーマに再定義する

`game_session.availability_date_answer` をスキーマ跨ぎで参照すると、段階6（旧経路廃止）で `game_session` 側の候補日・回答テーブルを drop する際に依存が残る。値は同一（`ok | maybe | ng`）だが独立して定義する。

### 選出対象0人での確定は許可しない

「メンバー0人の卓」は概念上存在意義がなく、誤操作の可能性が高い。`422` で別の候補日を選ぶよう促す。
ホスト自身も参加者として回答に加わる方針（要求 §3-2）のため、ホストが開催したい日には自分で ◯ を付ければよい。

### 締め切り前（open）でも卓確定できる

回答が早く揃った場合に締め切りを待たせる理由がない。`open` / `scheduling` の両方から確定可能とする。
確定がすべての受付を閉じる終端状態であることは、ステータス導出の優先順位（`confirmed` 最優先）で保証する。
