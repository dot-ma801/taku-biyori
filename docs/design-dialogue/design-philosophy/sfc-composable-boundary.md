# SFC と composable の境界

Status: 未執筆（関連ログの蓄積中）

## 現時点の仮説

`map`・`find` 等によるデータの導出・変換やバリデーションは、表示目的であっても「処理」であり composable（または別ファイル）に切り出す。SFC に置いてよいのは構造制御と表示フォールバック文言のみ。

## 関連ログ

- [2026-07-18 SFC と composable の境界・composable の置き場所](../design-notes/2026-07-18-sfc-composable-boundary.md) — 結論: 導出・変換・バリデーションはすべて「処理」として切り出す
