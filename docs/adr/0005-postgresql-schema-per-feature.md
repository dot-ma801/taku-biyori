# ADR 0005: 機能ごとに PostgreSQL スキーマを分離する

## Status

Accepted

## Context

taku-biyori のバックエンドは機能単位のディレクトリ構成（`src/{機能名}/`）を採用しており、
DB は Drizzle ORM でマイグレーション管理している。
現状の PostgreSQL スキーマ構成は次のとおりで、Better Auth のテーブルだけが `auth` スキーマに
分離され、アプリケーション側（卓機能）のテーブルはすべて `public` スキーマに置かれている。

```
auth        … user / session / account / verification（Better Auth 管理）
public      … game_sessions / game_session_members /
              game_session_candidates / game_session_answers /
              enum availability_date_answer
```

今後 Ph2 でシナリオ管理（`scenarios`・`scenario_characters`）やキャラクター選択
（`game_session_characters`）などのテーブル追加が予定されており、`public` に
テーブルを積み続けると機能間の境界が DB 上で見えなくなっていく。

### 解決したい課題

- アプリのテーブルがすべて `public` に詰め込まれており、DB を見ただけでは機能の境界がわからない
- `auth` スキーマ（機能単位）と `public`（詰め込み）で分離方針が一貫していない
- 機能が増えるほど `public` が肥大化し、テーブルの所属機能の判別・整理が難しくなる

### 検討した選択肢

1. **機能ごとに PostgreSQL スキーマを分ける**（`auth` / `game_session` / 将来の `scenario` …）
2. **現状維持**（Better Auth のみ `auth`、アプリのテーブルは `public`）
3. **テーブル名のプレフィックスで区別する**（現状の `game_session_*` 命名を境界の表現とみなす）

### 各選択肢の評価

| 観点 | 案1: 機能ごとにスキーマ分離 | 案2: 現状維持 | 案3: プレフィックスで区別 |
|------|--------------------------|--------------|------------------------|
| DB 上での機能境界の明確さ | スキーマ単位で明確 | なし | 命名規約頼み |
| `auth` スキーマとの一貫性 | 一貫する | 不一貫 | 不一貫 |
| 機能追加時のスケール | スキーマ追加で対応 | `public` が肥大化 | プレフィックスが長くなる |
| 移行コスト | `SET SCHEMA` のみ（低） | なし | なし |
| クロススキーマ FK | 必要（既存実績あり） | 不要 | 不要 |

## Decision

**PostgreSQL スキーマを機能ごとに分離し、卓機能のテーブルと enum を `public` から新設の `game_session` スキーマへ移動する。**

### 1. 分割基準

backend の機能ディレクトリ（`src/{機能名}/`）＝ PostgreSQL スキーマを原則とする。
ディレクトリ名は kebab-case、スキーマ名は SQL 識別子の慣習に合わせて snake_case に読み替える
（ハイフン入り識別子は常にクォートが必要になるため使わない）。

| 機能ディレクトリ | PostgreSQL スキーマ |
|---|---|
| `src/auth/`（Better Auth） | `auth` |
| `src/game-session/` | `game_session` |
| （Ph2）シナリオ管理 | `scenario` |

### 2. テーブル名は現状維持する

`game_sessions` 等のテーブル名は変更せず、`ALTER TABLE ... SET SCHEMA` によるスキーマ移動のみ行う。

- リネームを伴わないため移行リスクが最小（FK・インデックス・制約はテーブルに追随する）
- コード側の `gameSession` プレフィックス命名規則（CLAUDE.md）とも一致したままになる
- 専用スキーマ内では `game_session.game_sessions` と冗長に見えるが、
  リネームの利益がマイグレーションコストに見合わないと判断した

### 3. クロススキーマ FK は許容する

`auth.user` ← `game_session.game_sessions.host_user_id` のようにスキーマをまたぐ FK は
すでに実績があり、PostgreSQL 上の制約もないため許容する。

### 4. Drizzle での定義方法

`pgTable()` ではなく `pgSchema()` 経由でテーブル・enum を定義する（`auth` スキーマと同じパターン）。

```ts
// ❌ NG — public スキーマに作られる
export const gameSessions = pgTable('game_sessions', { ... });
export const availabilityDateAnswerEnum = pgEnum('availability_date_answer', [...]);

// ✅ OK — 機能スキーマに作られる
export const gameSessionSchema = pgSchema('game_session');
export const gameSessions = gameSessionSchema.table('game_sessions', { ... });
export const availabilityDateAnswerEnum = gameSessionSchema.enum(
  'availability_date_answer',
  [...],
);
```

### 5. 新機能追加時の手順

新スキーマの事前準備は不要。機能実装時に `pgSchema('{機能名}')` を定義し、
通常どおり `db:generate` → `db:migrate` でスキーマごと作成する。

## Consequences

### Positive

- DB を見ただけで機能の境界がわかり、`auth` スキーマと分離方針が一貫する
- 機能追加時はスキーマを増やすだけでよく、`public` の肥大化が止まる
- 既存データは `SET SCHEMA` で保全され、アプリケーションコードは Drizzle の
  テーブルオブジェクト経由の参照のため変更不要

### Negative

- 生 SQL や DB クライアントでの操作時にスキーマ修飾（`game_session.game_sessions`）が必要になる
  - → Drizzle 経由のアクセスでは自動で修飾されるため、通常の開発では影響しない
- 既存環境へのマイグレーション適用が必須になる
  - → `ALTER TABLE ... SET SCHEMA` のみでデータ移動を伴わず、適用は瞬時に完了する

### Risks

- 機能間でテーブルを共有したくなったとき、所属スキーマの判断で迷うリスク
  - → 「主たる所有機能のスキーマに置き、他機能からはクロススキーマ FK で参照する」を原則とする
- スキーマ分割の粒度が細かくなりすぎるリスク
  - → 分割基準を「backend の機能ディレクトリ」に固定し、恣意的な分割を防ぐ

## 決めていないこと

| 項目 | 決めない理由 | いつ決めるか |
|------|------------|------------|
| `max_players` → `max_members` 等のカラム名リネーム | 本 ADR の関心はスキーマ配置であり、リネームは別の判断 | 命名整理を行うタイミングで別途 |
| Ph2 のシナリオ関連テーブルの詳細設計 | 機能自体が未着手 | Ph2 のシナリオ管理実装時 |

## Notes

### 参考資料

- Issue #50: DBスキーマの整理
- [ADR 0004: メールアドレス不要の userid + password 認証を採用する](0004-username-password-auth.md)（`auth` スキーマの現状に関連）
- [Drizzle ORM — Table schemas](https://orm.drizzle.team/docs/schemas)
