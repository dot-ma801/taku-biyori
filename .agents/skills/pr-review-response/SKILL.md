---
name: pr-review-response
description: >
  PR に付いたレビュー指摘に対応するときに使う。 「レビューコメントに対応して」「指摘を直して」「PR #N のレビューを見て」 「CodeRabbit
  の指摘を潰して」などの依頼が対象。 人間・AI エージェント・レビュー bot のいずれの指摘も投稿者を問わず対象に含める。
---
# レビュー指摘への対応

リポジトリは `dot-ma801/taku-biyori`。GitHub の操作は `gh` CLI で行う。

## 原則

- **投稿者を問わず、unresolved のスレッドを全件対応する。** 人間・他の AI・`coderabbitai[bot]` や
  Codex の指摘を区別しない。nitpick 扱いで握りつぶさない
- 各スレッドは **対応済み** か **WONTFIX**（直さない判断 + 理由）のどちらかに必ず収束させる。黙殺は禁止
- **resolve は自分で押さない。** 返信までが担当で、解決マークはレビュアー（人間）に委ねる

## 1. 指摘を洗い出す

```bash
gh pr view <PR番号> --json title,headRefName,url
gh api repos/dot-ma801/taku-biyori/pulls/<PR番号>/comments --paginate \
  --jq '.[] | {id, path, line, user: .user.login, body}'
gh pr view <PR番号> --json comments --jq '.comments[] | {author: .author.login, body}'
```

インラインコメント（`/pulls/<n>/comments`）と PR 全体へのコメント（`gh pr view --json comments`）は
別物。**両方を集める。**

対応表を作ってから着手する。1つずつ潰し、途中で対象を増やさない。

## 2. 1指摘 = 1コミットで直す

- **まとめて後でコミットしない。** 同じファイルに別の文脈の変更が混ざり、切り分けられなくなる
- 指摘に対応した時点で都度コミットする
- プレフィックスは AGENTS.md のコミット規則に従う（`[fix]` / `[update]` / `[clean]` など）

```bash
git -c "user.name=Claude Code Bot" -c "user.email=claude-code-bot@example.com" \
  commit -m "[fix] 未認証時に 401 ではなく 500 を返していた問題を修正"
```

## 3. push してスレッドに返信する

```bash
git push
git rev-parse --short HEAD   # 返信に載せるコミットハッシュ
```

**インラインコメントのスレッドへ返信する。**

```bash
gh api repos/dot-ma801/taku-biyori/pulls/<PR番号>/comments/<コメントID>/replies \
  -f body="1b493ad で修正しました。application 層に権限チェックを移しています。"
```

PR 全体へのコメントに対しては `gh pr comment <PR番号> --body "..."`。

### 返信の書き方

- **対応したコミットハッシュを必ず書く**
- **ハッシュをバッククォートで囲まない。** 囲うと GitHub がコミットへのリンクに変換しない

```
✅ 1b493ad で修正しました。
❌ `1b493ad` で修正しました。
```

- MECE に、簡潔に。「何をどう変えたか」を1〜2文で書く
- 直さない場合は WONTFIX として**理由を返信し、スレッドは開いたままにする**

```
このケースは design-v2 §6-15 でリクエスト契約を変えない方針が明示されているため、
今回は対応しません。変更するなら設計側の合意が先になります。
```

## 4. コンフリクトは rebase で解消する

**`git merge` は使わない。** 履歴を直線に保つ。

```bash
git fetch origin
git rebase origin/main
# 解消したら
git add <解消したファイル>
git rebase --continue
git push --force-with-lease
```

`--force-with-lease` を使う（`--force` は使わない）。

## 5. CI と最終確認

```bash
pnpm check
```

CI の結果を確認し、赤ければ同じ手順で直す。

## チェックリスト

- [ ] インラインコメントと PR 全体コメントの両方を集めた
- [ ] 投稿者を問わず全 unresolved スレッドを対象にした
- [ ] 指摘ごとに都度コミットした
- [ ] すべてのスレッドに返信した（WONTFIX も理由を添えて返信した）
- [ ] 返信にコミットハッシュを書き、バッククォートで囲んでいない
- [ ] コンフリクトは rebase で解消した（merge コミットを作っていない）
- [ ] `pnpm check` と CI が通っている
