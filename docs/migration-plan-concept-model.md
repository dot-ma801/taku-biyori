# 移行計画: 概念モデル v2 への移行（ロビーとセッションの分離）

> 最終更新: 2026-08-22
> 元概念設計: [docs/concept/lobby-game-session.md](./concept/lobby-game-session.md)
> 基本設計: [docs/design-v2.md](./design-v2.md)
> 前例: [docs/migration-plan-recruitment-separation.md](./migration-plan-recruitment-separation.md)

本書は design-v2 を「どの順番で・どの単位の PR で実装するか」の実行計画に落とし込んだものである。
設計そのもの（スキーマ・API・ステータス導出）は design-v2 が正であり、本書では繰り返さない。

---

## 1. 前提と基本方針

### 1-1. ブランチ運用

- **`develop` ブランチを作り、すべてのタスクをそこへマージする。** `main` はマージすると Vercel の
  自動デプロイが走るため、移行が完了するまで触らない。`main` は実質リリースブランチとして扱う
- **`develop` は「長命フィーチャーブランチ」ではない。** 各タスク（さらにその中の各 PR）が
  完成するたびに継続的に統合される。統合を遅らせないことが目的であり、デプロイを遅らせることは
  その副産物にすぎない
- **`develop` は常にビルドが通り、テストが緑であること。** これが移行中の唯一の安全網なので、
  「一時的に red のまま進む」ことは認めない
- `develop` → `main` は移行完了後、§4 の Go/No-Go を通してから1回だけ行う

### 1-2. タスクの原則

- **DDL は各タスクに載せる。「スキーマだけ先に全部作る」段階は作らない。** これを分離すると
  リポジトリ全体がコンパイル不能になり、ビルドによる安全確認が効かなくなる
- 実装タスクは `shared`（契約型）→ `backend`（TDD）→ `frontend` を貫く縦切り
- **タスク内はさらに PR を分ける**（目安: 契約型 / backend / frontend で1本ずつ）。
  1 PR あたりの差分が大きすぎるとレビューが機能しないため、原則 500 行程度を上限とする
- **旧コードは残さない。** 置き換え対象のファイルはそのタスク内で削除する

### 1-3. データと検証

- **本番データはテストデータのみ。データ移行スクリプトは書かない**（design-v2 §9-10）。
  単一アプリ・データ無しの状況では、スキーマとコードを並行改修して同時に適用してよい
- **シードスクリプト（`db:seed`）を用意する。** 破壊的 DDL の直後に開発用データを1コマンドで
  復元できないと、移行のたびに手作業が発生する。スキーマ変更でシードが壊れることが早期警告にもなる。
  マイグレーション（DDL・履歴管理あり・本番でも実行）とは別物で、シードは DML・履歴管理なし・本番では実行しない
- **リポジトリ層は実 DB に対してテストする。** 現状は drizzle のメソッドチェーンを
  `vi.fn()` でモックして生成 SQL 文字列を検証する形式（`lobby-repository.test.ts` 1417 行 +
  `game-session-repository.test.ts` 1204 行）で、全クエリを書き換える本移行を検証できない
- backend は TDD（Red → Green → Refactor）。契約型は実装より先に `shared` へ定義する（CLAUDE.md）
- コミットは細かく、日本語、プレフィックス付き（CLAUDE.md のコミット規則）

### 1-4. 全体像

```text
main ────────────────────────────────────────────────────────────▶ (Go/No-Go 後に1回だけマージ)
  │
  └─ develop  ← 各タスクがここへ継続的にマージされる。常に緑
        │
        │  ── 準備（並行実行可）──
        ├─ タスク0  テスト基盤とシード          [モデル変更なし]
        ├─ タスク1  詳細設計と API 仕様書の改訂  [ドキュメントのみ / 実装のゲート]
        │
        │  ── 実装（直列）──
        ├─ タスク2  削除先行                    [旧経路を剥がして依存を解く]
        ├─ タスク3  Lobby と LobbyEntry
        ├─ タスク4  SchedulePoll
        ├─ タスク5  GameSession と Seat         ← 新モデルが初めて通しで動く
        ├─ タスク6  CharacterAssignment / PlayMemo
        └─ タスク7  横断 UI・語彙・ドキュメント整備
```

---

## 2. タスク別計画

### タスク0: テスト基盤とシード（モデル変更なし）

ローカルの Postgres は WSL 上でネイティブに動いており、Windows からは `localhost:5432` で見える。
**Testcontainers も PGlite も導入しない。すでに動いている Postgres にテスト用データベースを1つ足す。**

| 項目 | 内容 |
|---|---|
| スコープ | (1) テスト用 DB `taku_biyori_test` を用意し、`TEST_DATABASE_URL` を `.env.example` に追加。(2) リポジトリ層のテストを実 DB に対して実行する形へ移行し、既存の 2621 行のモックチェーンテストを置き換える。テスト間の分離は**各テストをトランザクションで包んでロールバック**（truncate 不要で速い）。(3) `packages/backend/scripts/seed.ts` と `db:seed` スクリプトを追加。(4) CI（`.github/workflows/ci.yml`）の test ジョブに `services: postgres`（postgres:17-alpine）を足し、`db:migrate` してからテストを走らせる |
| 先行検証 | **design-v2 §3 の新スキーマを使い捨てで立て、§5 のシナリオを生クエリで通す。** リスケ（中止→再調整→再作成）、2日開催、脱退後の再参加、表示値の導出（ロビー改名の追随）。本番コードを1行も書く前に設計上の穴を洗い、結果をタスク1 のレビューに反映する。この検証コードはコミットしない |
| 既存への影響 | **なし**（テストの実装方式が変わるだけで、プロダクションコードは無変更） |
| 完了条件 | `pnpm --filter @taku-biyori/backend test` がローカル（Windows から WSL の Postgres へ接続）と CI の両方で green / リポジトリ層のテストが実 DB に対して走っている / `db:seed` で空 DB から動くアプリの状態を作れる / 既存の TOCTOU（`FOR UPDATE` 競合）テストが実 DB で再現できている |
| 検証 | テスト DB を drop → `db:migrate` → `db:seed` → `pnpm dev` で、ログインしてロビー一覧に開発データが見える |

> テスト件数はそのまま移植しない。生成 SQL 文字列を目視 assert していたケースは実 DB では
> 「クエリ結果が正しいか」に置き換わるため、実質的なカバレッジを上げつつ件数は減る想定。

---

### タスク1: 詳細設計と API 仕様書の改訂（実装のゲート）

design-v2 はエンドポイント一覧・権限・差分分類までを定義しているが、
**リクエスト/レスポンスのフィールドレベルの定義がまだ無い。** ここを埋めてレビューを通す。

| 項目 | 内容 |
|---|---|
| スコープ | (1) design-v2 §6 に、**新規7 + 仕様変更6 の計13エンドポイント**のリクエスト/レスポンスのフィールド定義を追加（パス変更9本は形が変わらないため、識別子名の変更のみ明記）。(2) `openapi.yml` を design-v2 §6 に合わせて改訂: 新規7を追加、廃止8を削除、パス変更9をリネーム、仕様変更6のスキーマを更新、タグを新語彙へ再編（`LobbyMembers` → `LobbyEntries`、`LobbySchedules` → `SchedulePolls`、`GameSessionMembers` → `Seats`）。(3) エラーレスポンス（400/401/403/404/409/422）の使い分けを一覧化 |
| 移植元 | design-v1.1 の前例（PR #57）どおり、API 仕様を先行執筆する。以降の実装タスクでは差分の反映のみを行い、タスク7 では残差の突き合わせだけで済む |
| 既存への影響 | **なし**（ドキュメントのみ） |
| 完了条件 | `deploy-docs` ワークフローが成功し、Redoc / Swagger UI がレンダリングされる / 下記レビュー観点がすべて承認される |
| 検証 | レンダリングされた API ドキュメント上で、design-v2 §6-9 の差分サマリ（新規7 / 廃止8 / パス変更9 / 仕様変更6 / 変更なし5）と実際のパス数が一致する |

#### レビュー観点（承認されるまでタスク2 以降に着手しない）

- [ ] design-v2 §3 DBスキーマ — 9テーブルのカラム・制約・FK・カスケード方針
- [ ] design-v2 §4 ステータス設計 — ロビー4値 / セッション4値の導出順と操作可否表
- [ ] design-v2 §5-2 セッション作成の手順とロック方針
- [ ] design-v2 §5-5 表示値の導出（上書き生値との二重表現）
- [ ] design-v2 §6 API設計 + 本タスクで追加するフィールド定義
- [ ] design-v2 §9 意思決定ログ — 特に §9-3（`lobby_id` NOT NULL）、§9-4（CharacterAssignment 別テーブル）、§9-5（脱退のソフト化）
- [ ] `openapi.yml` の改訂内容

**タスク0 はモデル設計に依存しないため、このタスクと並行して進めてよい。**
むしろタスク0 の先行検証で見つかった問題をここへ反映するのが望ましい。

---

### タスク2: 削除先行（旧経路を剥がして依存を解く）

現行モデルで lobby と game-session を絡ませているのは `confirm-lobby.ts` /
`insert-game-session-with-members.ts` / `find-confirmed-game-session-by-lobby-id.ts` の3点である。
**これを先に取り除くと以降のタスクが直列に積める。** 作る前に消すのがこの移行の要点。

| 項目 | 内容 |
|---|---|
| スコープ | **backend**: `lobby/application/confirm-lobby.ts` と `POST /api/lobbies/:id/confirm`、`game-session/infrastructure/insert-game-session-with-members.ts`、`find-confirmed-game-session-by-lobby-id.ts`、`game-session/application/{join-as-guest, get-guest-link, get-guest-link-preview}.ts` と対応ルート、`POST /api/game-sessions`（`create-game-session.ts`）、候補日の単体 `POST`/`DELETE`（`add-availability-date.ts` / `delete-availability-date.ts`）。**shared**: `ConfirmLobbyInput` / `ConfirmedGameSession` / `CreateGameSessionInput`。**frontend**: `Lobby/Detail/ConfirmedNotice.vue`、`useConfirmedLobby.ts`、`ConfirmFlow/` 一式、`views/GameSession/CreateView.vue`、`GameSession/Detail/Dialog/GuestJoinDialog.vue` と GameSession 側の `useGuestJoin` / `useGuestLink`。**DDL**: `lobbies.closed_at` を DROP、`game_sessions.lobby_id` / `game_session_members.lobby_member_id` を DROP |
| 削除するテスト | `confirm-lobby.test.ts`（12ケース）、`insert-game-session-with-members.test.ts`、`find-confirmed-game-session-by-lobby-id.test.ts`、`useConfirmFlow.test.ts`、`useConfirmedLobby.test.ts` ほか |
| 既存への影響 | **卓確定・直接卓立て・セッション側ゲスト参加の機能が一時的に失われる**（タスク5 で新しい形で復活する）。ロビーの募集・日程調整、既存セッションの閲覧・完了・中止、プレイメモは動き続ける |
| 完了条件 | `lint` / `typecheck` / backend・frontend の全テストが green / `db:generate` 差分なし / 削除したシンボルがリポジトリ全体に残っていない |
| 検証 | ロビーを作って参加・回答までできる。「卓を確定する」ボタンが UI から消えている。既存のセッション詳細・プレイメモが引き続き開ける |

---

### タスク3: Lobby（企画）と LobbyEntry（参加）

| 項目 | 内容 |
|---|---|
| スコープ | **DDL**: `lobbies.cancelled_at` → `disbanded_at` に改名、`lobby_members` → `lobby_entries` に改名 + `left_at` 追加（`lobby_answers.member_id` の FK 参照も付け替え）。**shared**: `lobby/status.ts`（`draft`/`open`/`closed`/`disbanded`）、`lobby/permissions.ts` 書き直し、`Lobby` / `LobbyListItem` / `LobbyDetail` / `LobbyEntry` 契約、`GUEST_TOKEN_HEADER` を `game-session.ts` → `lobby.ts` へ移設。**backend**: `lobby/domain/lobby-status.ts`、ロビー CRUD・status・参加/脱退/ゲスト参加・guest-link（再発行含む）、`GET /api/join/:token` をロビー側へ移設。**frontend**: `api/lobby.ts`、`features/Lobby/List/`、`Lobby/Edit/`、`Lobby/Detail/` のヘッダ・ActionBar・StatusDisplay・参加者一覧・各ダイアログ、`LobbyStatusBadge` |
| 既存への影響 | ロビー機能の挙動が変わる（受付の開閉が往復可能に、脱退がソフト化）。セッション側は無変更 |
| 完了条件 | 全テスト green / 脱退が `left_at` セットであること、再参加で `left_at` が NULL に戻ること、`open ⇄ closed` の往復、`disbanded` からの遷移不可のテストがある / 参加者一覧・回答表・着席候補のクエリがすべて `left_at IS NULL` で絞られている |
| 検証 | 作成 → 公開 → 招待リンク発行 → ゲスト参加 → 脱退 → 再参加（過去の回答が残っている）→ 受付を閉じる → 追加募集で開き直す → 解散、が UI から通る |

---

### タスク4: SchedulePoll（日程調整）

| 項目 | 内容 |
|---|---|
| スコープ | **DDL**: `schedule_polls` 新設、`lobby_candidates` → `candidate_dates`（`lobby_id` → `poll_id`、`date_note` → `time_label`）、`lobby_answers` → `schedule_answers`（`member_id` → `lobby_entry_id`）、enum `lobby_answer` → `schedule_answer`。**shared**: `SchedulePoll` / `CandidateDate` / `ScheduleAnswer` 契約、`date-note.ts` → `time-label.ts`。**backend**: `candidate-date-diff.ts` を `poll_id` ベースへ、履歴一覧・最新取得・新規調整の開始・候補日一括更新・回答 upsert・ゲスト回答、`schedule-poll-route.ts`。**frontend**: `Lobby/Detail/Schedule/` を poll ベースに改修、「日程調整をやり直す」導線、過去の調整の折りたたみ表示 |
| 移植元 | `list-availability-dates` / `bulk-update-availability-dates` / `update-availability-date-response` / `update-guest-availability-date-response` のロジックをほぼそのまま移植。差分は `poll_id` が1階層挟まる点と `memberId` → `entryId` の付け替え |
| 既存への影響 | 日程調整の URL とレスポンス形が変わる。ロビー本体とセッションは無変更 |
| 完了条件 | 全テスト green / 最新以外の poll への書き込みが 409 になるテストがある / 「最新」の判定が `created_at DESC, id DESC` で決定的であることのテストがある |
| 検証 | 候補日を登録 → 3人が◯△×で回答 → 「日程調整をやり直す」→ 新しい調整に切り替わり、古い調整が読み取り専用の履歴として残る。古い調整への回答が 409 |

---

### タスク5: GameSession（開催）と Seat（着席）

**タスク2 で失った機能を新モデルの形で復活させる。ここで新モデルが初めて通しで動く。**

| 項目 | 内容 |
|---|---|
| スコープ | **DDL**: `game_sessions` から `host_user_id` / `guest_link_token` / `is_published` / `max_players` を DROP、`lobby_id` を NOT NULL で追加、`time_label` 追加。`game_session_members` → `seats`（2 FK まで削ぎ落とし、`character_name` は一旦保持してタスク6 で移す）。**shared**: `game-session/status.ts`（`scheduled`/`today`/`completed`/`cancelled`）、`permissions.ts` 書き直し、`GameSession` / `GameSessionDetail` / `Seat` 契約、上書き値の二重表現（design-v2 §5-5）。**backend**: `game-session-status.ts`、`POST /api/lobbies/:id/game-sessions`、一覧/詳細/更新/削除/ステータス、着席・離席・参加+着席の一体操作・ゲスト着席、表示値の導出を application 層に実装。**frontend**: `api/game-session.ts`、`GameSession/List/`・`Detail/`、「開催を追加する」フロー（旧 ConfirmFlow の設計を流用して新規実装）、ロビー詳細への開催一覧セクション |
| 既存への影響 | セッション機能が全面的に置き換わる。プレイメモは `seats.id` への付け替えが必要なため、このタスクで最小限の追従を行う（本格対応はタスク6） |
| 完了条件 | 全テスト green / `seats.lobby_entry_id` のロビーと `game_sessions.lobby_id` の不一致を 422 で弾くテストがある / セッション作成のロック（`FOR UPDATE` + `FOR KEY SHARE`）が実 DB のテストで検証されている / 表示値の導出（未設定ならロビー参照）のテストがある |
| 検証 | 1つのロビーから2つのセッションを開く → 片方を中止 → 日程調整をやり直す → 3つ目を開く。ロビーの title を変更すると上書きしていないセッションの表示名が追随する。直接卓立てが1画面で完結する |

---

### タスク6: CharacterAssignment とプレイメモ

| 項目 | 内容 |
|---|---|
| スコープ | **DDL**: `character_assignments` 新設、`seats.character_name` を DROP、`game_session_play_memos` → `play_memos`（`member_id` → `seat_id`）。**shared**: `CharacterAssignment` 契約、`play-memo.ts` を `seatId` ベースへ、`canViewSharedPlayMemos` の入力を v2 のステータス値に合わせる。**backend**: キャラ割り当ての PUT / DELETE、プレイメモ4ユースケースの `seat_id` 付け替え。**frontend**: `useMemberEdit` をキャラ割り当て API へ、`GameSession/PlayMemo/`（13ファイル）の seat 対応、`MemberDisplay.vue` |
| 移植元 | プレイメモは design-v1.2 の設計を維持する。**パスもレスポンス形も不変**なので、既存の31ケースは紐付け先だけ変えて 1:1 で移植できる。移行の等価性検証の基準点として使える |
| 既存への影響 | キャラ名の更新経路が `PATCH .../members/:memberId` から `PUT .../seats/:seatId/character` に変わる |
| 完了条件 | 全テスト green / プレイメモの31ケースが `seat_id` ベースで移植済み / ゲストがプレイメモを持てないこと（`lobby_entries.user_id IS NULL` で構造的に排除）のテストがある |
| 検証 | キャラ名を割り当て → 変更 → 解除。メモを書く → 完了後に公開 → 他の着席者から見える。同じロビーで3回開催すればメモも3つ独立して存在する |

---

### タスク7: 横断 UI・語彙・ドキュメント整備

| 項目 | 内容 |
|---|---|
| スコープ | **frontend**: ダッシュボードを design-v2 §7-5 の4セクションに再編、`GameSessionStatusBadge` / `LobbyStatusBadge` のラベル更新、日本語ラベルの一斉置換（「募集枠」→「ロビー」、「卓」→「開催 / セッション」、「参加メンバー」→「着席者」、「募集中止」→「解散」、「確定」系文言の削除）、ルーティング整理。**docs**: `openapi.yml` は**残差の突き合わせのみ**（全面改訂はタスク1 で完了済み）、`design-v1.md` / `v1.1` / `v1.2` に supersede 注記、`game-session-status.md` を更新、ADR 0006 を `Superseded` に、`db:seed` の生成データを新モデルに追従、CLAUDE.md の用語とディレクトリ例を更新 |
| 既存への影響 | 表示文言とドキュメントのみ |
| 完了条件 | badge の2テストが新ラベルで green / `募集枠` `卓確定` `confirmed` `closedAt` `lobbyMemberId` `dateNote` `availability` `game_session_members` で全体を grep して0件（`features/Landing/` の「卓」のみ除外） / `openapi.yml` と実装のルートが一致 |
| 検証 | ダッシュボードの4セクションがそれぞれ正しい対象を出す。UI 上に「確定」「募集枠」という語が残っていない |

---

## 3. 依存関係とマージ順

```text
タスク0（テスト基盤・シード）─┐
                              ├─▶ タスク2 ─▶ タスク3 ─▶ タスク4 ─▶ タスク5 ─▶ タスク6 ─▶ タスク7 ─▶ Go/No-Go
タスク1（詳細設計・API仕様）──┘
   ↑ レビュー承認が実装着手のゲート
```

- **タスク0 と タスク1 は並行に進む。** タスク0 の先行検証で見つかった設計上の問題はタスク1 に反映する
- タスク2（削除先行）が依存を解くので、以降は直列に積める
- タスク3 → 4 は `lobby_entries` の契約型に依存するため直列
- タスク5 は `LobbyEntry`（3）と候補日 UI（4）の両方に依存する。ただし
  **backend の `seats` / `game_sessions` 実装は shared の `LobbyEntry` 型さえ確定すれば
  タスク4 と並行着手できる**。人手が2人以上いる場合はここで分岐する
- タスク6 は 5 の `seats` に依存。タスク7 は全部に依存

### GitHub issue の粒度

- **issue はタスク単位で起票する**（0〜7 の8本）。本文に shared / backend / frontend の
  サブタスクをチェックリストで持たせ、design-v2 の該当セクションへリンクする
- **PR はタスク単位ではなく、サブタスク単位で分ける**（1タスクあたり2〜4本）。
  1 PR の差分は 500 行程度を上限とし、`develop` へ順次マージする。
  タスク完了時点の「動く状態」は issue のクローズ条件で担保する

---

## 4.【Go/No-Go 判定】`develop` → `main` のマージ条件

design-v2 の設計意図が実際の挙動として満たされているかを、コードではなく**振る舞い**で確認する。

- [ ] 1つのロビーから2つのセッションを開ける（集まりすぎて2日に分けるケース）
- [ ] セッションを中止 → 同じロビーで日程調整をやり直す → 新しいセッションを開ける（リスケ）。
      新しい募集枠を作る必要も、参加者の再参加も不要
- [ ] 受付を閉じたロビーを、もう一度開ける（追加募集）
- [ ] ロビーの招待リンクを再発行でき、古いトークンが使えなくなる
- [ ] ゲストが招待リンクからロビーに参加し、◯△×で回答し、着席し、開催を見られる。
      セッション専用のトークンはどこにも発行されていない
- [ ] 参加者が脱退しても、その人の過去の着席・回答・プレイメモが壊れない。
      再参加すると過去の記録に繋がったまま復帰する
- [ ] 選ばれなかった参加者向けの表示に、強い言葉（落選・非選出・キック・削除）が使われていない
- [ ] ロビーの title を変更すると、上書きしていないセッションの表示名も追随する
      （＝既定値が DB にコピーされていない）
- [ ] 2つのセッションにそれぞれ別の場所・時間帯を設定でき、片方だけ完了・片方だけ中止にできる
- [ ] 直接卓立てが UI 上1つの流れで完結し、「ロビーを作ってからセッションを作る」と意識せずに済む
- [ ] 解散したロビーの過去セッションが `completed` のまま参照でき、プレイメモも読める
- [ ] プレイメモ4エンドポイントのレスポンス形が移行前と一致している（唯一の不変契約）
- [ ] `db:seed` が空 DB から動くアプリの状態を作れる
- [ ] `db:generate` が差分なし（スキーマ定義とマイグレーションが一致）
- [ ] `openapi.yml` のエンドポイントと実装のルートが一致している
- [ ] CI の全ジョブが green（Postgres service container を含む）

**1項目でも未達なら `main` にはマージせず、`develop` 上で修正 PR を先に出す。**

### マージ後の手順（順序を誤ると本番が壊れる）

Vercel のビルドコマンドにマイグレーション実行が含まれていないため、手動で順序を守る。

1. `develop` → `main` をマージする**前に**、Neon 本番 DB に対して `db:migrate` を実行する
2. マイグレーション成功を確認してからマージ（＝デプロイ）する
3. 破壊的 DDL のため、旧コードが新スキーマに当たる時間帯を作らない
4. `db:seed` は**本番では実行しない**

> 移行中は `develop` を Vercel のプレビュー環境に向けると、`main` に触れずに実機確認できる。

---

## 5. リスクと対応方針

| リスク | 対応 |
|---|---|
| タスク2 で機能が一時的に失われる（卓確定・直接卓立て） | `develop` 上での話で `main` は無傷。失った機能はタスク5 で復活する。Go/No-Go の1・2・10項目目が復活の確認になる。**タスク2〜5 の間に `main` へマージしない**ことを運用ルールとして明記する |
| リポジトリ層の巨大な交差型（lobby 18・game-session 20 メソッド）を段階的に直すと型エラーが増殖する | タスクごとに**ファイル単位で丸ごと置き換える**。既存メソッドを1つずつ改名する差分編集はしない |
| 実 DB テストへの移行（2621 行）がタスク0 の見積もりを膨らませる | この 2621 行は**どうせ全部書き直す対象**であり、書き直し先をモックから実 DB に変えるだけ。純増はテスト DB の配線とシードスクリプトぶん。生成 SQL 文字列の目視 assert は実 DB では不要になるため、件数はむしろ減る |
| ローカル（WSL の Postgres）と CI（service container）で接続先が違う | `TEST_DATABASE_URL` 環境変数1つで切り替える。`.env.example` に既定値を書き、CI では workflow の `env` で上書きする |
| テストがローカル DB を汚す / 並列実行で干渉する | 専用 DB `taku_biyori_test` を使い、各テストをトランザクションで包んでロールバックする。開発用 DB（`taku_biyori`）には接続しない |
| `seats.lobby_entry_id` のロビーと `game_sessions.lobby_id` の不一致（DB 制約で表現できない） | application 層で必ず検証し 422 を返す。タスク5 の完了条件に専用テストを入れる（design-v2 §3-8） |
| 「最新の調整」の判定が同一 timestamp で不定になる | `created_at DESC, id DESC` でタイブレーク（design-v2 §9-9）。同一トランザクション内で2つの poll を作る経路は作らない |
| 脱退をソフト化したことで `left_at` を無視した集計が混入する | 「参加者一覧」「回答表」「着席候補」をすべて `left_at IS NULL` で絞る。脱退者を表示するのはロビー詳細の参加者一覧のみ（グレー表示）。タスク3 のレビュー観点に明記する |
| 削除漏れ（旧概念のシンボルが残る） | タスク2 と7 の完了条件で全体 grep + 0件確認。型を消してコンパイラに見つけさせることを優先し、grep は最後の網とする |
| 先行執筆した `openapi.yml` が実装とずれる | タスク3〜6 の各 PR で、その PR が触ったパスだけ都度反映する。タスク7 では残差の突き合わせのみ（design-v1.1 §4 と同じ運用） |
| Neon 本番へのマイグレーションが手動運用 | §4 のマージ後手順に従う。移行完了を機に Vercel のビルドコマンドへ `db:migrate` を組み込むかを判断する（フォローアップ） |

---

## 6. 移行後のフォローアップ（スコープ外だが忘れないこと）

- `docs/design-v1.md` / `v1.1` / `v1.2` は履歴として残すが、参照先が v2 であることを冒頭で明示する
- `docs/game-session-status.md` は v1.1 の時点ですでに陳腐化していた（`open` / `scheduling` / `open_until` が残存）。v2 の内容に更新するか、design-v2 §4 へのリンクだけ残して削除する
- ADR 0006（`Proposed` のまま）は design-v1.1 の時点で前提が失効している。`Superseded` にする
- ADR を新規に起票する: 「セッションはロビーに必ず属する（`lobby_id` NOT NULL）」（design-v2 §9-3）、
  「リポジトリ層は実 DB でテストする」（タスク0 の判断）
- Vercel のデプロイパイプラインにマイグレーション実行を組み込む
- `develop` を常設ブランチとして残すか、移行完了後に廃止して trunk 運用へ戻すかを決める
- 通知機能・グループ概念・シナリオ管理は Ph2 の別要求として切り出す
