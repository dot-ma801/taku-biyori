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

## 1. 対象ブランチに切り替える

**最初に必ず行う。** 別のブランチ（とくに `main`）のまま進めると、後段の commit と push が
対象 PR に入らず、無関係なブランチを汚す。

```bash
gh pr checkout <PR番号>
git branch --show-current   # PR の headRefName と一致することを確認
```

未コミットの変更があると checkout に失敗する。先に退避するか、コミットしてから切り替える。

## 2. 指摘を洗い出す

```bash
gh pr view <PR番号> --json title,baseRefName,headRefName,url

# 未解決のレビュースレッド
gh api graphql -f query='
  query($owner:String!, $repo:String!, $pr:Int!) {
    repository(owner:$owner, name:$repo) {
      pullRequest(number:$pr) {
        reviewThreads(first:100) {
          nodes {
            id
            isResolved
            comments(first:20) { nodes { databaseId path line author { login } body } }
          }
        }
      }
    }
  }' -f owner=dot-ma801 -f repo=taku-biyori -F pr=<PR番号> \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'

# PR 全体へのコメント（レビュースレッドとは別物）
gh pr view <PR番号> --json comments --jq '.comments[] | {author: .author.login, body}'
```

**REST の `/pulls/<n>/comments` は使わない。** 解決状態（`isResolved`）を持たず、返信も独立した
コメントとして返すため、解決済みの指摘や自分の返信まで未対応として再処理してしまう。
解決状態は GraphQL の `PullRequestReviewThread` にしかない。

レビュースレッドと PR 全体へのコメントは別物。**両方を集める。**
返信先のコメント ID には、そのスレッドの先頭コメントの `databaseId` を使う。

対応表を作ってから着手する。1つずつ潰し、途中で対象を増やさない。

## 3. 1指摘 = 1コミットで直す

- **まとめて後でコミットしない。** 同じファイルに別の文脈の変更が混ざり、切り分けられなくなる
- 指摘に対応した時点で都度コミットする
- プレフィックスは AGENTS.md のコミット規則に従う（`[fix]` / `[update]` / `[clean]` など）

**コミットの前に `pnpm check` を通す。** 壊れたリビジョンを push すると、無駄な CI を起動してから
問題を検出することになる。

```bash
pnpm check
git -c "user.name=Claude Code Bot" -c "user.email=claude-code-bot@example.com" \
  commit -m "[fix] 未認証時に 401 ではなく 500 を返していた問題を修正"
```

## 4. push してスレッドに返信する

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

## 5. コンフリクトは rebase で解消する

**`git merge` は使わない。** 履歴を直線に保つ。

rebase 先は **その PR のベースブランチ**。ADR 0011 では feature のベースが `develop/{version}` に
なるため、`origin/main` 固定だと誤ったベースに載せ替わる。

```bash
base=$(gh pr view <PR番号> --json baseRefName --jq .baseRefName)
git fetch origin
git rebase origin/"$base"
# 解消したら
git add <解消したファイル>
git rebase --continue
git push --force-with-lease
```

`--force-with-lease` を使う（`--force` は使わない）。

## 6. CI を確認する

CI の結果を確認し、赤ければ同じ手順で直す。`pnpm check` はコミット前に通してあるので、
ここで落ちるのは CI 固有の要因（環境差・gitignore されたファイルなど）を疑う。

## チェックリスト

- [ ] 対象 PR のブランチに切り替えてから作業した
- [ ] インラインコメントと PR 全体コメントの両方を集めた
- [ ] 投稿者を問わず全 unresolved スレッドを対象にした
- [ ] 指摘ごとに都度コミットした
- [ ] すべてのスレッドに返信した（WONTFIX も理由を添えて返信した）
- [ ] 返信にコミットハッシュを書き、バッククォートで囲んでいない
- [ ] コンフリクトは rebase で解消した（merge コミットを作っていない）
- [ ] `pnpm check` と CI が通っている
