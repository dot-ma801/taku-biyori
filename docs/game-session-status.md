# ステータス設計

ロビーと開催のステータスは **DB に保持せず、ファクトから毎回導出する**。
導出表・遷移図・操作可否は [design-v2.md](./design-v2.md) の §4 に集約した。

| 知りたいこと | 参照先 |
|---|---|
| ロビーのステータス（`draft` / `open` / `closed` / `disbanded`） | design-v2 §4-1 |
| 開催のステータス（`scheduled` / `today` / `completed` / `cancelled`） | design-v2 §4-2 |
| ロール別の操作可否 | design-v2 §4-3 |
| 遷移図 | design-v2 §4-4 |
| 導出関数の置き場所（`shared` に置く理由） | design-v2 §4-5 |

導出の実装は `packages/shared` にある。フロントエンドとバックエンドで同じ関数を使う。

| 対象 | 関数 |
|---|---|
| ロビー | `getLobbyStatus()`（`packages/shared/src/lobby/status.ts`） |
| 開催 | `getGameSessionStatus()`（`packages/shared/src/game-session/status.ts`） |

> この文書は v1.1 の時点で内容が陳腐化していた。design-v2 と二重管理しても片方が必ず腐るため、
> 本体を design-v2 §4 に置き、ここは入口だけを残している。
