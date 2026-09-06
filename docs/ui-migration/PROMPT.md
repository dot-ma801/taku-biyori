# UI 移行 loop プロンプト（Phase 2 専用 / 毎周これをそのまま渡す）

あなたは taku-biyori の frontend を、新しいデザインへ移行している。
このプロンプトは毎回まっさらなコンテキストで渡される。前回の記憶は無い前提で動くこと。

## 最初に読むもの

1. `docs/ui-migration/README.md` — 移行の方針とガードレール
2. `docs/ui-migration/TASKS.md` — 進捗チェックリスト
3. `docs/ui-migration/token-diff.md` — 旧トークン → 新トークンの対応表
4. `packages/frontend/DESIGN.md` — 新デザインの唯一の根拠
5. `CLAUDE.md` — コミット規則・命名規則・フロントエンド実装方針

## この周でやること

`TASKS.md` の **Phase 2 セクションで、未チェックの一番上にある1件だけ**を実装する。

**2件以上やらないこと。** 1周1件が守れないと、差分が大きくなってレビューできなくなる。

### 手順

1. `TASKS.md` から対象コンポーネントを1つ決める
2. そのコンポーネントの現在の実装（`.vue` / `.stories.ts` / `.test.ts` / `README.md`）を読む
3. `DESIGN.md` の該当セクションと `token-diff.md` を読み、あるべき姿を確認する
4. `.vue` のスタイルを新デザインに合わせる
5. `.stories.ts` に不足している状態（hover / disabled / error / 各 variant）があれば足す
6. `README.md` を実装に合わせて更新する
7. 検証コマンドを**全部**通す
8. コミットする
9. `TASKS.md` の該当行にチェックを入れて、同じコミットに含める

### 検証コマンド（全部通すまでコミットしない）

```bash
pnpm --filter @taku-biyori/shared build
pnpm --filter @taku-biyori/frontend format
pnpm --filter @taku-biyori/frontend lint:check
pnpm --filter @taku-biyori/frontend type-check
pnpm --filter @taku-biyori/frontend test
pnpm --filter @taku-biyori/frontend check:raw-color
```

### コミット

`CLAUDE.md` のコミット規則に従う。日本語・プレフィックス付き・粒度は細かく。

```
[style] BaseCard を新デザインのトークンに合わせる
```

## 絶対に守ること

- **触っていいのは対象コンポーネントのディレクトリ配下だけ。** それ以外は変更しない
- **`props` / `emits` の signature を変えない。** 呼び出し側が壊れる
- **色を直書きしない。** 必ず `var(--color-*)` を使う。トークンが足りなければ人に相談する
- **VRT の基準画像を撮り直さない**（`vrt:update` を実行しない）。承認は人の仕事
- **テストを消さない・skip しない**
- **`TASKS.md` のチェックは、検証が全部緑になってからだけ入れる**
- 日本語ラベルの文言は変えない（issue #117 の担当範囲）

## 中断して人に投げる条件

以下に当たったら、**作業を戻して（`git restore`）** 何が起きたかを報告し、その周を終える。
`TASKS.md` の該当行には `⚠️ 要相談: 理由` を追記しておくこと。

- 変更が対象ディレクトリの外に及ぶ
- 変更が 400 行を超える
- `props` / `emits` を変えないと実装できない
- `DESIGN.md` に判断の根拠が無く、推測するしかない
- 検証コマンドが 2 回試しても緑にならない

## Phase 2 の未チェックが無くなったら

新しい作業を勝手に始めないこと。「Phase 2 は完了。Phase 3 は人の担当」とだけ報告して終える。
