# ゲームセッション ステータス設計

ステータスは DB に保持せず、`getGameSessionStatus`（`packages/backend/src/game-session/domain/game-session-status.ts`）が毎回フィールドから導出する。

## 導出に使うフィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `is_published` | boolean | 公開済みかどうか |
| `open_until` | Date \| null | 募集締め切り日。null = 締め切りなし |
| `scheduled_at` | Date \| null | 確定した開催日。null = 未確定 |
| `completed_at` | Date \| null | 完了日時。null = 未完了 |

## 導出フローチャート

```mermaid
flowchart TD
    A([開始]) --> B{is_published?}
    B -- false --> DRAFT[draft]
    B -- true --> C{open_until が null\nまたは未来?}
    C -- true --> OPEN[open]
    C -- false --> D{scheduled_at が\nセット済み?}
    D -- false --> SCHEDULING[scheduling]
    D -- true --> E{completed_at が\nセット済み?}
    E -- true --> COMPLETED[completed]
    E -- false --> F{scheduled_at が\n今日?}
    F -- true --> TODAY[today]
    F -- false --> CONFIRMED[confirmed]
```

## ステータス一覧

| ステータス | 意味 | 遷移条件 |
|---|---|---|
| `draft` | 下書き | `is_published = false` |
| `open` | 募集中 | 公開済み かつ `open_until` が null または未来 |
| `scheduling` | 日程調整中 | 公開済み かつ `open_until` が過去 かつ `scheduled_at` が null |
| `confirmed` | 開催確定 | 公開済み かつ `open_until` が過去 かつ `scheduled_at` が未来 |
| `today` | 開催日当日 | 公開済み かつ `open_until` が過去 かつ `scheduled_at` が今日 |
| `completed` | 完了 | 公開済み かつ `completed_at` がセット済み |

## 設計上の注意点

- **`open` は `scheduledAt` より優先される。** `open_until` が未来または null の間は、たとえ `scheduled_at` が設定済みでも `open` を返す。開催日を直接指定して作成したセッションが公開直後に `confirmed` になるのを防ぐため。
- **ステータスは保存しない。** 常に上記フィールドから導出する。ステータスを直接更新する API は存在しない（`PATCH /api/game-sessions/:id/status` はフィールドを更新した結果としてステータスが変わる）。
- **`open_until` が null = 締め切りなし = 募集中。** 候補日方式でも開催日直接指定方式でも、公開後は必ず `open` から始まる。
