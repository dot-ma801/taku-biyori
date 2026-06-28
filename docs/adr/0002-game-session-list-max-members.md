# ADR 0002: セッション一覧 API に `maxMembers` を追加する

## Status

Accepted

## Context

taku-biyori のホーム画面ではセッション一覧を表示しており、各セッションカードに
現在の参加人数（`memberCount`）を表示している。
ユーザーが「空き枠があるか」を一目で判断できるよう、上限人数との比較表示（例: `2/6`）が必要になった。

現在の `GameSessionListItem`（一覧 API: `GET /api/game-sessions`）には `memberCount` は含まれるが、
上限人数を表す `maxMembers` は含まれない。`maxMembers` は詳細 API（`GET /api/game-sessions/:id`）
の `GameSession` 型にのみ存在する。

なお、一覧 API の `findByUserId` クエリは `getTableColumns(gameSessions)` で全カラムを取得しており、
`max_players` カラムはすでに DB から取得済みで、`toListItem` マッピング関数で捨てているだけである。

### 解決したい課題

- 一覧画面で「空き枠が何枠あるか」を表示できない
- `memberCount` だけでは上限との比較ができず、満員かどうかも判断できない

### 検討した選択肢

1. **`maxMembers` をそのまま一覧 API に追加する**
2. **`availableSlots: number | null` をバックエンドで計算して返す**
3. **一覧には追加しない（`memberCount` のみ、空き枠表示は諦める）**

### 各選択肢の評価

| 観点 | 案1: `maxMembers` 追加 | 案2: `availableSlots` 追加 | 案3: 追加しない |
|------|----------------------|--------------------------|---------------|
| 追加 DB コスト | なし（取得済み） | なし（取得済み） | なし |
| フロントの計算責務 | あり（自明な引き算） | なし | — |
| 情報量 | `maxMembers` が残る | `maxMembers` が失われる | 変化なし |
| 一覧/詳細の差 | 縮まる | 縮まる | 変化なし |
| 空き枠表示 | 可能 | 可能 | 不可 |

## Decision

**`GameSessionListItem` に `maxMembers: number | null` を追加する。**

### 1. `availableSlots` を採用しない理由

`availableSlots = maxMembers - memberCount` はフロントエンドが自明に導出できる値であり、
バックエンドで計算することは責務の配置として不自然である。
また、`availableSlots` を返すと `maxMembers` そのものが失われ、フロントエンドが
「上限は何人か」「満員かどうか」を表現する柔軟性が下がる。

### 2. 一覧 API と詳細 API の収束について

一覧と詳細の本質的な差は `members[]`（メンバー全員の JOIN）の有無にある。
スカラーフィールドが1つ増えることで両者が収束するわけではない。
ただし、「便利だから」という理由でスカラーフィールドを無制限に追加することは設計の劣化につながるため、
**追加の判断基準は「一覧画面の UX に直接必要か」とする**（ADR 0001 の `role` と同じ基準）。

### 3. 変更箇所

```ts
// packages/shared/src/game-session.ts
export const GameSessionListItemSchema = z.object({
  // ...既存フィールド...
  maxMembers: z.number().int().nullable().optional(),
});
```

```ts
// packages/backend/.../game-session-repository.ts
const toListItem = (row: ListRow, userId: string): GameSessionListItem => ({
  // ...既存フィールド...
  maxMembers: row.maxPlayers,
});
```

## Consequences

### Positive

- 一覧画面で空き枠表示が可能になる
- 追加の DB クエリコストはゼロ（`max_players` はすでに取得済み）
- `maxMembers` が残ることで、フロントエンドが表示方法を自由に選べる

### Negative

- 一覧 API と詳細 API が返すスカラーフィールドの差が1つ縮まる
  - → 追加基準を「一覧 UX に直接必要か」に明示することで、今後の無秩序な追加を防ぐ

### Risks

- この決定を根拠に「詳細にあるフィールドは全部一覧にも追加してよい」という解釈が広がるリスク
  - → 本 ADR で追加基準を明文化し、次回の議論の参照先とする

## Notes

### 参考資料

- [ADR 0001: セッション一覧 API にユーザーとの関係を表す `role` フィールドを追加する](0001-game-session-list-user-role.md)
