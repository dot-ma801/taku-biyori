---
root: false
targets:
  - 'codexcli'
description: 'Codex がこのリポジトリで PR レビューを行うときの規約'
globs:
  - '**/*'
---
# PR レビューの規約（Codex 向け）

## 言語

**レビューコメントは必ず日本語で書く。** 要約・インラインコメント・指摘の見出し・結論のすべてを日本語にする。
コード片・識別子・コマンド・エラーメッセージの引用は原文のままでよい。

## 書き方

- **MECE を意識し、簡潔に書く。** 同じ指摘を観点を変えて繰り返さない
- 1つの指摘は「何が問題か」→「なぜ問題か」→「どう直すか」の3点で完結させる
- 重大度を明示する（例: `[must]` / `[should]` / `[nits]`）
- 憶測で断定しない。確認が必要なものは質問として書く

## 観点

このリポジトリ固有の規約に反していないかを優先して見る。

| 観点 | 参照 |
|---|---|
| `@/` エイリアスを使わず相対パスで import していないか | AGENTS.md「インポートルール」 |
| 仕様が `docs/design/v0.3/design-concept-model.md` と一致しているか | AGENTS.md「設計ドキュメント」 |
| backend の実装にテストが先行しているか（TDD） | AGENTS.md「テスト方針」 |
| frontend が DTO を composable / component に持ち込んでいないか | AGENTS.md「API の型（DTO）と FE の model を分ける」 |
| `watch` を `computed` / `emit` / `onMounted` で置き換えられないか | AGENTS.md「`watch` を多用しない」 |
| 新規テーブル・enum が `pgSchema()` 経由で定義されているか | `docs/adr/0005-postgresql-schema-per-feature.md` |
| コメントが3行（最大5行）に収まっているか | AGENTS.md「書き方の規約」 |
