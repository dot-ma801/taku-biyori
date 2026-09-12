---
name: add-api-endpoint
description: >
  taku-biyori のバックエンドに API エンドポイントを追加・変更するときに使う。
  「API を追加して」「エンドポイントを実装して」「POST /api/... を作って」
  「このリソースの取得 API がほしい」などの依頼が対象。
  shared の型定義 → テスト → 層ごとの実装 → ルート登録の順で TDD で進める。
targets:
  - '*'
---
# API エンドポイントの追加

`packages/backend` に Hono のルートを1本増やすまでの手順。**TDD（Red → Green → Refactor）で進める。**

## 1. 仕様を確定する

[`docs/design/v0.3/design-concept-model.md`](../../../docs/design/v0.3/design-concept-model.md) で次を確認する。

- §6 API設計 — パス・メソッド・認可の方針
- §3 DBスキーマ — 触るテーブルとリレーション
- §4 ステータス設計 — `getLobbyStatus` / `getGameSessionStatus` の導出ロジック

設計書に載っていない仕様を勝手に決めない。曖昧なら実装前にユーザーに確認する。

## 2. `packages/shared` に型を定義する（実装より先）

リクエスト型・レスポンス型が FE と BE の契約になる。

```ts
// packages/shared/src/game-session/update-game-session.ts
export type UpdateGameSessionInput = { ... };
export type UpdateGameSessionResponse = { ... };
```

- `packages/shared` のエクスポートへの追加を忘れない
- 定義したら `pnpm --filter @taku-biyori/shared build`（`dist/` がないと backend のテストが型解決に失敗する）

コミット: `[add] shared に UpdateGameSessionInput 型を追加`

## 3. テストを先に書く（Red）

| 層 | 置き場所 | 方針 |
|---|---|---|
| `application/`（ユースケース） | `test/unit/` | 純粋関数寄り。依存はすべて引数で注入する |
| `presentation/`（ルート） | `test/unit/` | 注入した依存を使って HTTP の入出力を検証する |
| `infrastructure/`（リポジトリ） | `test/integration/` | **実 DB に対してテストする。** drizzle のメソッドチェーンをモックしない |

AAA パターン（`// Arrange` / `// Act` / `// Assert`）で書く。

```bash
pnpm --filter @taku-biyori/backend db:test:setup   # 初回・スキーマ変更後のみ
pnpm --filter @taku-biyori/backend test:unit
```

**失敗することを確認してから次へ進む。**

コミット: `[add] update-game-session のユニットテストを追加`

## 4. 層ごとに実装する（Green）

```
src/{機能名}/
├── domain/          # 純粋なルールや値オブジェクト
├── application/     # ユースケース
├── infrastructure/  # DB アクセス
└── presentation/controller/routes/{機能名}-route.ts
```

- 依存の向きは `presentation` → `application` → `domain`。`infrastructure` は外側から注入する
- 権限チェックは `application` 層に置く（`presentation` に散らさない）
- 実装例は `src/health/` が参考になる

コミット: `[add] update-game-session ユースケースを実装`

## 5. ルートを登録する

`src/app/presentation/controller/create-app.ts` に追加する。

コミット: `[add] PATCH /api/game-sessions/:id ルートを登録`

## 6. 仕上げ

```bash
pnpm check
```

Green を確認し、リファクタする。エラーレスポンスの形が既存エンドポイントと揃っているかを見直す。

## チェックリスト

- [ ] `docs/design/v0.3/design-concept-model.md` と仕様が一致している
- [ ] `shared` に型を定義し、エクスポートに追加した
- [ ] テストを先に書き、Red を確認した
- [ ] 相対パス import がない（`@/` を使っている）
- [ ] リポジトリ層のテストが実 DB に対して動いている
- [ ] `create-app.ts` にルートを登録した
- [ ] `pnpm check` が通る
- [ ] 意味のまとまりごとに都度コミットした
