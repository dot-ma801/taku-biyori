---
name: db-schema-change
description: >
  taku-biyori の DB スキーマ（テーブル・カラム・enum・リレーション）を変更するときに使う。
  「テーブルを追加して」「カラムを増やして」「enum に値を足して」「マイグレーションを作って」 「drizzle のスキーマを変えて」などの依頼が対象。
---
# DB スキーマの変更

Drizzle ORM + PostgreSQL（Neon）。スキーマ定義は `packages/backend/src/system/db/` にある。

## 1. 設計を確認する

[`docs/design/v0.3/design-concept-model.md`](../../../docs/design/v0.3/design-concept-model.md) §3 DBスキーマ が正。
設計書にないテーブル・カラムを勝手に追加しない。概念そのものを足す判断が要るなら `concept-design` スキルへ。

## 2. 定義する

**新しいテーブル・enum は機能ごとの PostgreSQL スキーマに置く**
（[`docs/adr/0005-postgresql-schema-per-feature.md`](../../../docs/adr/0005-postgresql-schema-per-feature.md)）。

```ts
// ❌ NG
export const gameSession = pgTable('game_session', { ... });
export const status = pgEnum('status', [...]);

// ✅ OK
const gameSessionSchema = pgSchema('game_session');
export const gameSession = gameSessionSchema.table('game_session', { ... });
export const status = gameSessionSchema.enum('status', [...]);
```

- 機能ディレクトリ名の kebab-case は、**スキーマ名では snake_case に読み替える**（`game-session` → `game_session`）
- カラム名は **スネークケース**（`host_user_id`, `scheduled_at`）
- **開催（`GameSession`）は必ずロビーに属する。`lobby_id` は NOT NULL**
  （[`docs/adr/0008-game-session-belongs-to-lobby.md`](../../../docs/adr/0008-game-session-belongs-to-lobby.md)）

## 3. マイグレーションを生成・適用する

```bash
pnpm --filter @taku-biyori/backend db:generate
pnpm --filter @taku-biyori/backend db:migrate
```

生成された SQL を**必ず目視で確認する**。とくに次は本番で事故りやすい。

| 確認点 | 見るところ |
|---|---|
| 既存行のある列に NOT NULL を足していないか | `ALTER TABLE ... SET NOT NULL` に DEFAULT が伴っているか |
| 意図しない DROP がないか | `DROP COLUMN` / `DROP TABLE` |
| enum 値の削除が混ざっていないか | PostgreSQL は enum 値を消せない。型の作り直しになる |

## 4. テスト DB を作り直す

リポジトリ層のテストは実 DB に対して走る
（[`docs/adr/0009-repository-tests-against-real-database.md`](../../../docs/adr/0009-repository-tests-against-real-database.md)）。
**スキーマを変えたら必ず実行する。**

```bash
pnpm --filter @taku-biyori/backend db:test:setup
pnpm --filter @taku-biyori/backend test:integration
```

> `relation "auth.user" does not exist` やフックのタイムアウトでまとめて落ちたら、
> コードではなく **PostgreSQL が止まっていないか**を先に疑う（`pg_isready`）。

## 5. 影響範囲を追う

- `packages/shared` のレスポンス型に出るカラムか。出るなら型も直して `build` する
- ステータス導出（design-v2 §4 の `getLobbyStatus` / `getGameSessionStatus`）に関わるか
- FE の model（`packages/frontend/src/models/`）の変換関数に反映が要るか

## 6. 仕上げ

```bash
pnpm check
```

## チェックリスト

- [ ] `pgTable()` / `pgEnum()` ではなく `pgSchema()` 経由で定義した
- [ ] カラム名がスネークケース
- [ ] 生成されたマイグレーション SQL を目視で確認した
- [ ] `db:test:setup` を実行し、インテグレーションテストが通る
- [ ] `shared` の型・FE の model への波及を確認した
- [ ] `pnpm check` が通る

コミット例: `[add] game_session スキーマに play_memo_visibility カラムを追加`
