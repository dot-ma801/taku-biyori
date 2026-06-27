# ADR 0001: セッション一覧 API にユーザーとの関係を表す `role` フィールドを追加する

## Status

Accepted

## Context

taku-biyori のホーム画面（ログイン後）では、セッション一覧を「あなたの卓」と「募集中の卓」に分類して表示する。
セッション一覧は既存の `GET /api/game-sessions` エンドポイント（`GameSessionListItem[]`）から取得するが、
現状のレスポンス型にはログインユーザーとセッションの関係を示すフィールドが存在しない。

### 解決したい課題

- `GameSessionListItem` にユーザーとの関係情報がなく、フロントエンドが「自分が関わる卓」を判別できない
- 暫定実装として `isPublished` と `status` の組み合わせでヒューリスティックに分類しているが、正確性が保証できない
- ホスト限定操作（編集・削除ボタン表示など）の制御にも同じ情報が必要になる

### 検討した選択肢

1. **`isMine: boolean` を追加する**
2. **`role: 'host' | 'member' | null` と `visibility: 'public' | 'private' | 'password'` の2フィールドを追加する**
3. **`role: 'host' | 'member' | null` のみ追加する**

### 各選択肢の評価

| 観点 | 案1: `isMine` | 案2: `role` + `visibility` | 案3: `role` のみ |
|------|--------------|--------------------------|----------------|
| 実装コスト | 低 | 高 | 中 |
| ホスト/メンバー区別 | ✗ | ✓ | ✓ |
| 将来の private 機能対応 | △ | ✓ | △ |
| フロントの責務過多 | なし | あり（visibility 判定） | なし |
| バックエンドの責務 | 軽 | 重 | 中 |

## Decision

**`GameSessionListItem` に `role: 'host' | 'member' | null` を追加し、バックエンドがユーザーに見せてよいセッションだけを返す責務を持つ設計とする。**

### 1. フィールド定義

```ts
// packages/shared/src/game-session.ts
export const GameSessionListItemSchema = z.object({
  // ...既存フィールド...
  role: z.enum(['host', 'member']).nullable(),
});
```

`null` は「自分は無関係だが APIが返した = 見てよい公開セッション」を意味する。
`visibility` フィールドは持たない。バックエンドが「認証ユーザーに見せていいものだけ返す」責務を担うため、
フロントが公開範囲を再判定する必要はない。

### 2. フロントエンドの分類ロジック

```ts
// features/Home/useHomeData.ts
const mySessions = computed(() =>
  allSessions.value.filter((s) => s.role !== null)
)

const publicSessions = computed(() =>
  allSessions.value.filter((s) => s.role === null)
)
```

### 3. バックエンドの実装方針

`GET /api/game-sessions` のレスポンス生成時に、認証ユーザーの ID とメンバーテーブルを照合して `role` を付与する。

| 条件 | `role` の値 |
|------|------------|
| セッションの `createdBy` が自分 | `'host'` |
| メンバーテーブルに自分の `userId` が存在する | `'member'` |
| 上記以外（公開セッションを閲覧している） | `null` |
| 未ログイン | すべて `null` |

### ゲスト参加の扱い

ゲスト参加（`joinAsGuest`）は完全匿名を前提とし、`userId: null` で記録される。
このため、ゲストとして参加したセッションを後からログインユーザーに紐づける手段がなく、
ホーム画面の「あなたの卓」には表示しない。`role` に `'guest'` は含めない。

## Consequences

### Positive

- ホスト・メンバーの区別が取れるため、編集ボタン（ホスト限定）などの表示制御に流用できる
- フロントエンドが公開範囲の判定ロジックを持たなくてよい（バックエンドに集約）
- `role !== null` / `role === null` という単純な条件で分類できる

### Negative

- バックエンドの `GET /api/game-sessions` でメンバーテーブルとの JOIN が必要になりクエリが複雑になる
  - → インデックスを適切に設定することで影響を最小化する
- `shared` のスキーマ変更により、既存のフロントエンドコード（`useHomeData.ts`）の更新が必要
  - → `role` を追加しても既存フィールドは変わらないため影響範囲は限定的

### Risks

- バックエンドが「見せていいものだけ返す」責務を正しく実装できていない場合、
  private なセッションが他ユーザーに見えてしまうセキュリティリスクがある
  - → 結合テストでアクセス制御を検証する

## 決めていないこと

| 項目 | 決めない理由 | いつ決めるか |
|------|------------|------------|
| private セッション（招待制）の実装 | 現時点で要件なし | 機能要件が確定したタイミング |
| パスワード付きセッション | 現時点で要件なし | 同上 |
| ゲスト参加とログインユーザーの紐づけ | 設計コストが高く優先度が低い | ゲスト UX 改善の議論が起きたタイミング |

## Notes

### 参考資料

- [設計ドキュメント v1](../design-v1.md) — セッション一覧は全件返し、絞り込みはフロント側で実装する方針
