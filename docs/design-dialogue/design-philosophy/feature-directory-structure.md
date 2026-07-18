# feature ディレクトリ構成

Status: 未執筆（関連ログの蓄積中）

## 現時点の仮説

feature 内の composable は `composables/` サブディレクトリに置く方向に統一する。既存のフラット置きは次にその feature を触るタイミングで揃える。

残っている問い:

- `user/` 配下の構造の違い（小文字・画面階層なし・`UserAvatar/` のみ独立ディレクトリ）をどう裁くか
- `composables/` を切る閾値（1本でも切るか、複数になったら切るか）

## 関連ログ

- [2026-07-18 SFC と composable の境界・composable の置き場所](../design-notes/2026-07-18-sfc-composable-boundary.md) — 結論: `composables/` を切る側に統一（適用は次に触るときから）/ `user/` の構造は保留
