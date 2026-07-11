# 移行計画: 募集と卓の分離

> **最終更新**: 2026-07-07
> **元設計**: [design-v1.1.md](./design-v1.1.md)（特に §9 実装ステップ）
> **元要求**: [requirements/recruitment-separation.md](./requirements/recruitment-separation.md)

本書は design-v1.1 の実装ステップを「安全に既存機能を保ったまま新経路へ切り替え、最終的に旧経路を廃止する」ための実行計画に落とし込んだもの。

---

## 1. 前提と基本方針

- **本番データは存在しない**（初回本番デプロイ中止済み）。データ移行・バックフィルは一切不要。移行対象は**コードと機能経路のみ**
- **既存機能は段階1〜5の間、無変更で動き続ける**。新機能は既存に対して純粋な追加（additive）とする
- 各段階は**独立した PR**。マージ順は段階番号どおり（後述の依存関係を参照）
- Backend は TDD（Red → Green → Refactor）、shared に契約型を先に定義してから実装する（CLAUDE.md 準拠）
- 旧経路の廃止（段階6）は、**新経路の受け入れ基準がすべて満たされたことを確認してから**着手する（Go/No-Go 判定を設ける）

### 移行の全体像

```text
 段階1        段階2        段階3        段階4        段階5      【判定】   段階6
 募集枠基盤 → 参加・調整 → 確定API  →  募集枠UI  →  確定UI  →  Go/No-Go → 旧経路廃止
 (backend)    (backend)    (backend)   (frontend)   (frontend)             (全レイヤー)
└──────────────── 既存機能は無変更で並走 ────────────────┘
```

---

## 2. 段階別計画

### 段階1: 募集枠の基盤（backend）

| 項目 | 内容 |
|---|---|
| スコープ | `recruitment` PostgreSQL スキーマ（4テーブル + enum）の Drizzle 定義・マイグレーション生成、shared に `Recruitment` 系契約型、募集枠 CRUD API（一覧/作成/詳細/更新/削除/`PATCH /:id/status` 公開） |
| 既存への影響 | なし（新規スキーマ・新規ルートの追加のみ） |
| 完了条件 | ユニット・インテグレーションテスト green。`db:generate` / `db:migrate` が通る |
| 検証 | `POST → PATCH(公開) → GET` の一連をインテグレーションテストで確認。ステータス導出（`draft/open/scheduling`）のユニットテスト |

### 段階2: 募集枠への参加と日程調整 API（backend）

| 項目 | 内容 |
|---|---|
| スコープ | members / guest-members / guest-link / availability-dates（CRUD・一括更新）/ responses / guest-responses |
| 移植元 | 既存 `game-session` の application / infrastructure 層ロジック。**コピーして recruitment 配下に移植**する（共通化はしない。理由は §4 参照） |
| 既存への影響 | なし |
| 完了条件 | 既存卓側の同等機能と同じテスト観点（権限・`Guest-Token` 検証・`open` のみ参加可・ゲスト全列編集）を recruitment 側でカバー |
| 検証 | ゲストリンク発行 → ゲスト参加 → ゲスト回答の一連をインテグレーションテストで確認 |

### 段階3: 卓確定 API（backend）

| 項目 | 内容 |
|---|---|
| スコープ | `POST /api/recruitments/:id/confirm`（選出バリデーション + トランザクションでの卓生成 + `closed_at` の条件付き UPDATE による二重確定排他 + `open_until = 確定実行日` セット + `recruitment_member_id` コピー）、`game_sessions.recruitment_id`・`game_session_members.recruitment_member_id` カラム追加マイグレーション、`recruitments.closed_at` カラム追加、`GET /api/game-sessions/:id` への `recruitmentId` 追加、卓の中止（`game_sessions.cancelled_at` カラム追加 + `PATCH /:id/status` に `cancelled` 遷移を追加。`confirmed`/`today` から可）、確定後の募集枠 API の read-only 化（`409`） |
| 既存への影響 | `GET /api/game-sessions/:id` のレスポンスフィールド追加、`game_session_members` への nullable カラム追加、卓削除への確定卓ガード追加（いずれも後方互換） |
| 完了条件 | design-v1.1 §5 のバリデーション表を全ケーステストでカバー。トランザクション失敗時に卓もリンクも残らないこと・並行確定が片方 `409` になることを確認 |
| 検証 | 「`memberIds` 必須（未指定・空配列で `422`）」「この募集枠のメンバーでない ID を含むと `422`」「◯△×・未回答いずれのメンバーも指定できる（サーバは回答内容・定員でブロックしない）」「確定後の参加・回答が `409`」「確定卓のステータスが `confirmed`/`today` に導出される（`open` に落ちない）」 |

### 段階4: 募集枠のフロントエンド

| 項目 | 内容 |
|---|---|
| スコープ | `features/Recruitment/`（List / New / Detail / Edit）、ルート追加（`/recruitments` 系）、ゲストの `?token=` 動線 |
| 移植元 | `features/GameSession/` の各画面・`Schedule/` サブディレクトリ・composables |
| 既存への影響 | ルート追加のみ。既存画面は無変更（ダッシュボード再構成は段階5） |
| 完了条件 | 募集枠の作成 → 公開 → 参加 → 日程回答が UI から一通り行える |
| 検証 | ログインユーザー・ゲスト両方の参加/回答を手動確認（`/verify` 相当のフロー確認） |

### 段階5: 卓確定フローのフロントエンド

| 項目 | 内容 |
|---|---|
| スコープ | 確定ダイアログ（候補日選択 → メンバー選出〔常に表示・◯△デフォルト選択済み・×/未回答は注意表示付きで選択可・定員不一致で確認ダイアログ〕 → 確認）、確定後表示（選出者に卓リンク・非選出者に柔らかい文言）、卓詳細への「開催を中止する」アクション（確認ダイアログ付き・`cancelled` バッジ表示）、ダッシュボード再構成（「募集・調整中」「開催予定の卓」） |
| 既存への影響 | ダッシュボード（`/`）の表示構成のみ |
| 完了条件 | 受け入れ基準の UI 系項目（下記 Go/No-Go チェックリスト）を満たす |
| 検証 | 5人参加・定員3の募集枠で確定フローを通し、◯△回答者がデフォルト選択済みであること・×/未回答も注意表示付きで選択できること・定員不一致で確認ダイアログが出ることを確認 |

### 【Go/No-Go 判定】旧経路廃止の着手条件

段階6に着手する前に、以下（要求 §7 受け入れ基準 + α）を新経路で確認する。

- [ ] 募集枠を作成 → 公開 → 5人参加 → 日程調整 → 3人選出して卓作成、が「キック」なしで完了する
- [ ] 選出画面で◯△回答者がデフォルト選択済みになっている
- [ ] 確定後の卓に選出メンバーだけが表示される
- [ ] 募集枠を経由しない直接卓立てが引き続き可能
- [ ] ゲストリンク参加が募集枠に対して機能する（参加・回答・全ゲスト列編集）
- [ ] 確定後の募集枠で参加・回答・編集がすべて拒否される（UI 非表示 + API `409`）
- [ ] 非選出者向け表示に強い言葉（キック・削除・落選）が使われていない
- [ ] 確定で生まれた卓のステータスが `confirmed`/`today`/`completed` に正しく導出され、完了操作ができる
- [ ] 同一募集枠への二重確定が `409` になり、卓が2つ作られない
- [ ] 確定後の卓を中止でき、`cancelled` ステータスが導出される（募集枠は `confirmed` のまま戻らない）

1項目でも未達なら段階6には進まず、修正 PR を先に出す。

### 段階6: 旧経路の廃止（backend + frontend + マイグレーション）

廃止は影響範囲が広いため、PR をさらに分割してよい（6a → 6b → 6c の順）。

| # | 内容 |
|---|---|
| 6a | **フロントの旧導線撤去**: `/game-sessions/new` を直接卓立て（日程必須）へ変更、卓詳細から日程調整 UI を撤去、卓の `open/scheduling` バッジ撤去（`draft` は残る） |
| 6b | **API の廃止**: 卓の availability-dates 系ルートを削除（公開遷移 `PATCH /:id/status` の `draft → open` は残す）。`POST /api/game-sessions` の `scheduledAt` 必須化。卓参加条件を「公開済み・未完了・実施日当日まで」へ変更（トークン仕様は現行のまま） |
| 6c | **DB とステータスの整理**: `game_session_candidates` / `game_session_answers` テーブル drop、`game_sessions.open_until` カラム drop（`is_published` は維持）、**`scheduled_at` の NOT NULL 化**（null の卓＝旧経路の日程未確定な開発データは事前に削除）、`getGameSessionStatus` を `draft/confirmed/today/completed/cancelled` に簡素化 |

- 6a と 6b の間はフロントが旧 API を呼ばなくなっているため、6b は安全に削除できる
- 6c のマイグレーションは破壊的だが、本番データが無いためロールバックは「マイグレーションを戻す」のみで完結する

---

## 3. 依存関係とマージ順

```text
段階1 ─▶ 段階2 ─▶ 段階3 ─▶ (Go/No-Go) ─▶ 段階6a ─▶ 6b ─▶ 6c
             └─▶ 段階4 ─▶ 段階5 ─┘
```

- 段階4は段階2マージ後に着手可能（確定 UI 以外は段階3を待たない）
- backend（段階3）と frontend（段階4）は並行作業できる
- GitHub issue は段階単位（6は 6a/6b/6c 単位でも可）で起票し、issue 本文から design-v1.1 の該当セクションへリンクする

---

## 4. リスクと対応方針

| リスク | 対応 |
|---|---|
| 移植時に既存ロジックへ手を入れて既存機能を壊す | 移植は**コピー**とし、既存 `game-session` 配下の変更は段階1〜5では段階3の後方互換な追加（`GET /:id` の `recruitmentId`・メンバーレスポンスの `recruitmentMemberId`・`DELETE /:id` の確定卓ガード・`recruitment_member_id` カラム）に限定する。共通化リファクタは段階6完了後に検討する（廃止で消えるコードとの共通化は無駄になるため） |
| 新旧2系統の並走で UI 導線が混乱する | 段階5のダッシュボード再構成までは既存導線を優先表示のまま維持し、`/recruitments` はナビゲーションに追加するだけに留める |
| 確定トランザクションの部分失敗 | 卓生成・メンバーコピー・確定リンクを単一 DB トランザクションで実施（design-v1.1 §5）。インテグレーションテストで失敗時のロールバックを検証 |
| 同一募集枠への同時確定（二重確定） | 確定ファクトのセットを条件付き UPDATE（`SET closed_at = now() WHERE closed_at IS NULL`）で行い、更新0行なら全体ロールバック + `409`（design-v1.1 §5）。卓との紐付けは卓側 `game_sessions.recruitment_id` で持つ |
| 移行期間中に確定卓が既存導出で `open`（募集中）扱いになる | 確定処理で `open_until = 確定実行日` をセットし、既存の `getGameSessionStatus` でも `confirmed`/`today` に到達させる（design-v1.1 §5・意思決定ログ） |
| 段階6の削除漏れ・参照残り | 6b で `typecheck` / `lint` / 全テストに加え、`availability` `openUntil` 等の廃止シンボル（`isPublished` は維持するため対象外）の横断検索で参照ゼロを確認してからマージ |
| openapi.yml と実装の乖離 | 各段階の PR に `docs/openapi.yml` の更新を含める（段階1〜3で追加、6b で削除） |

---

## 5. 廃止後のフォローアップ（スコープ外だが忘れないこと）

- `docs/design-v1.md` の卓ステータス・日程調整・API セクションに「v1.1 で廃止済み」の注記を入れる（または design-v2 として統合改訂する）
- `docs/design-v1.md` の `game_sessions` テーブル定義に `location` カラムが欠けている既存 drift を修正する（実装・v1.1 には存在する）
- 共通化リファクタの検討（募集枠と卓で重複した日程調整ロジックが残る場合。ただし卓側は 6c で消えるため、原則発生しない想定）
- 非選出者への通知機能（要求 §6 スコープ外。リマインド通知機能と合わせて別途要求定義）
