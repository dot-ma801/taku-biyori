---
name: pr-review-cycle
description: >
  PR レビューサイクルを自動化する。Agent A がレビュー・インラインコメントを投稿し、
  Agent B が PR を監視して修正対応する。修正後 Agent A が再レビューするサイクルを繰り返す。
  「PR をレビューして」「レビューサイクルを回して」「PR #N を自動レビュー」と言われたら使う。
---

リポジトリ `dot-ma801/taku-biyori` の PR に対して、レビュー（Agent A）と修正対応（Agent B）を
2 エージェントで並行実行し、CI グリーン・全指摘解消まで自動でサイクルを回す。

引数: PR 番号（例: `18`）

## 実行手順

### Step 1: PR 情報を事前取得してコンテキストを共有

```
mcp__github__pull_request_read (method: "get") → PR タイトル・ブランチ名・マージ可能状態
mcp__github__pull_request_read (method: "get_files") → 変更ファイル一覧
mcp__github__pull_request_read (method: "get_check_runs") → CI 状態
```

これらを取得してから両エージェントに渡す（重複取得を避けトークン節約）。

### Step 2: Agent A（レビュアー）を起動

以下のプロンプトで Agent を起動（`run_in_background: false` で foreground 実行）:

```
あなたはレビュアー（Agent A）です。PR #{PR番号} を詳細にコードレビューし、
GitHub にインラインコメントを投稿してください。

## PR 情報（事前取得済み）
- タイトル: {title}
- ブランチ: {branch}
- 変更ファイル: {files}

## レビュー観点（CLAUDE.md 準拠）
- インポートは `@/` エイリアス（相対パス禁止）
- 命名規則: kebab-case ファイル名、`game` プレフィックス、スネークケース DB カラム
- レイヤー設計: presentation → application → domain
- TDD: AAA パターン、テストが先
- `shared` に型定義が先にあるか
- TypeScript 型安全性・エラーハンドリング

## 投稿手順
1. `pull_request_review_write` (method: create) で pending review 作成
2. `add_comment_to_pending_review` で各ファイルにインラインコメント
3. `pull_request_review_write` (method: submit_pending, event: "REQUEST_CHANGES" or "COMMENT")

日本語でコメントを記載。問題なければ APPROVE。
owner: "dot-ma801", repo: "taku-biyori", pullNumber: {PR番号}
```

### Step 3: Agent B（監視・修正担当）を起動

Agent A 完了後、以下のプロンプトで Agent を起動（`run_in_background: true`）:

```
あなたは修正担当（Agent B）です。PR #{PR番号} を購読・監視し、
レビュー指摘に対応して修正・コミット・プッシュしてください。

## PR 情報
- ブランチ: {branch}（作業ブランチ）
- owner: "dot-ma801", repo: "taku-biyori"

## 手順
1. `subscribe_pr_activity` で PR #{PR番号} を購読
2. <github-webhook-activity> でレビューコメント通知が来たら:
   a. `get_file_contents` で対象ファイルを取得 (branch: "{branch}")
   b. 問題を修正
   c. `push_files` でコミット（メッセージ: "[fix] レビュー指摘対応: {内容}"）
   d. `add_reply_to_pull_request_comment` で対応完了を返信
3. CI 失敗通知が来たら:
   a. `get_job_logs` でエラー確認
   b. ローカルで `lint`/`format` を実行して修正
   c. `push_files` でプッシュ

## CLAUDE.md ルール
- インポート: `@/` エイリアス（相対パス禁止）
- コミットメッセージ: 日本語、[fix]/[update] プレフィックス
- フォーマット確認: `pnpm --filter @taku-biyori/backend format` 後に push

PR がマージされるか閉じられるまで監視を続ける。
```

### Step 4: 再レビューサイクル

Agent B が修正をプッシュしたら、Agent A に再レビューを依頼:

```
PR #{PR番号} の再レビューをしてください。

## 前回の指摘と Agent B の修正内容
{Agent Bから報告された修正内容}

## 確認手順
1. `get_diff` で最新 diff を取得
2. `get_review_comments` で未解決スレッドを確認
3. 各指摘が解消されていれば APPROVE、残課題があれば REQUEST_CHANGES

owner: "dot-ma801", repo: "taku-biyori", pullNumber: {PR番号}
```

### Step 5: 完了判定

以下の条件を満たしたらサイクル終了:
- CI 全ジョブ success
- 未解決レビューコメント 0 件
- Agent A が APPROVE または「問題なし」と判定

## トークン最適化ポイント

| 最適化 | 方法 |
|---|---|
| diff の重複取得を避ける | Step 1 で取得した情報を両エージェントのプロンプトに埋め込む |
| Agent B への指摘転送 | レビュー全体サマリーを転送（全コメントの個別転送は不要） |
| 再レビューの絞り込み | 変更されたファイルのみ確認するよう指示 |
| CI エラーの即時対応 | Agent B がローカルで `lint`/`format` を先に実行してから push |
| CodeRabbit/bot コメントは無視 | `Author: coderabbitai[bot]` のイベントはスキップ |

## Gotchas

- **自己レビュー制限**: GitHub は PR 作成者が APPROVE できない。`COMMENT` で代替。
- **CI format エラー**: Prettier の長行折り返しは `pnpm format` で自動修正可。push 前に必ず実行。
- **未使用インポート**: Agent B が型インポートを追加した後、使わない型が残ってエラーになりやすい。`pnpm lint` で確認。
- **push_files と相対パス**: `get_file_contents` → `push_files` のパスは `packages/backend/...` のように repo root からの相対パス。
- **CodeRabbit レート制限**: 短時間に複数コミットするとレート制限に引っかかる。対応不要。
