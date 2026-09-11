# 設計ドキュメント（バージョン別）

バージョンごとに「要求 → 設計 → 移行計画」を1ディレクトリにまとめている。
**版はディレクトリ名（`v0.1` / `v0.2` / `v0.3`）が示す。ファイル名に版番号は付けない。**
以前の `design-v1.md` / `design-v2.md` という採番はアプリの実バージョンとズレていたため廃止した。

**実装の根拠に使うのは [v0.3/design-concept-model.md](./v0.3/design-concept-model.md) だけ。**
v0.1 / v0.2 は superseded（履歴）。

## 一覧

| 版 | 種別 | ドキュメント | 旧ファイル名 |
|---|---|---|---|
| v0.1 | 要求 | [requirement-recruitment-separation.md](./v0.1/requirement-recruitment-separation.md) | `docs/requirements/recruitment-separation.md` |
| v0.1 | 基本設計 | [design.md](./v0.1/design.md) | `docs/design-v1.md` |
| v0.1 | 設計（差分） | [design-recruitment-separation.md](./v0.1/design-recruitment-separation.md) | `docs/design-v1.1.md` |
| v0.2 | 要求 | [requirement-play-memo.md](./v0.2/requirement-play-memo.md) | `docs/requirements/play-memo.md` |
| v0.2 | 設計（差分） | [design-play-memo.md](./v0.2/design-play-memo.md) | `docs/design-v1.2.md` |
| v0.2 | 移行計画 | [migration-plan-recruitment-separation.md](./v0.2/migration-plan-recruitment-separation.md) | `docs/migration-plan-recruitment-separation.md` |
| v0.3 | 基本設計 | [design-concept-model.md](./v0.3/design-concept-model.md) | `docs/design-v2.md` |
| v0.3 | 移行計画 | [migration-plan-concept-model.md](./v0.3/migration-plan-concept-model.md) | `docs/migration-plan-concept-model.md` |

## コード中の `design-v2 §…` という参照について

ソースコードのコメントには `（design-v2 §5-2）` のような節参照が 250 箇所以上ある。
これは**ファイル名ではなく設計書の通称**として使っている語彙で、リネーム後もそのまま残している
（docs のリネームのためにソース 123 ファイルを書き換えるほうが害が大きいため）。

| コード中の表記 | 指す文書 |
|---|---|
| `design-v2 §…` | [v0.3/design-concept-model.md](./v0.3/design-concept-model.md)（現行仕様） |
| `design-v1.2 §…` | [v0.2/design-play-memo.md](./v0.2/design-play-memo.md)（プレイメモ契約の記録として有効） |
| `design-v1.1 §…` / `design-v1 §…` | v0.1 の各文書（履歴参照） |

各ドキュメントの**本文**に残る `design-v1.1 と同じく` のような旧称も同じ読み替えでよい。
執筆当時の呼称をそのまま history として保存している。

## 関連

- [../adr/](../adr/) — アーキテクチャ意思決定記録
- [../concept/](../concept/) — 概念設計
- [../game-session-status.md](../game-session-status.md) — ステータス導出の入口（本体は v0.3 §4）
- [../openapi.yml](../openapi.yml) — API 仕様
