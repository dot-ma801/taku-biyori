# たく日和 リデザイン

_Started 2026-09-05 14:57 UTC_

---

## User

`たく日和 リデザイン v3.dc.html` に UI を変更するタスクを行いたいんだけど、何PRくらいに分けたほうがいいかな？

## Assistant



## Assistant

_[tool: read_file]_

_[tool: read_file]_

v3 を repo（Vue 3 / `packages/frontend/src`）に落とす前提で見ると、**「UI 変更」だけでは収まらない差分が2つ**混ざっています。ここが PR 分割の分かれ目です。

- **卓の一体化**: v3 は「卓はひとつの実体。調整中 → 開催予定と進むだけ」という設計。repo は Lobby と GameSession が別 feature・別ルート・別詳細画面。
- **ステータス語彙の縮約**: repo は8種（非公開/募集中/日程調整中/卓確定済み/実施前/当日/通過済み/中止）、v3 は5種（募集中/調整中/開催予定/完了/中止）。

この2つを外に出せるなら、**UI だけで6 PR** が素直です。

1. **基盤トークン** — `style/variables.css` を DS の色/型/余白/角丸/影/モーションに差し替え。見た目は全画面で変わるが差分は1ファイル群。
2. **共通コンポーネント** — Button / IconButton / Badge / Chip / Card / Avatar / Tabs / Alert / EmptyState / Toast / Modal / Dialog / フォーム系。画面はまだ触らない（Storybook 的な確認のみ）。
3. **シェル** — AppHeader / AppFooter を GlobalNav + モバイル下部タブへ。テーマ切替もここ。
4. **一覧系** — Dashboard と Lobby/GameSession List を新カードへ。
5. **詳細系** — 概要 / 日程調整（○△×）/ メンバーのタブ構成。ここが最大なので、日程調整だけ別 PR に割るなら計7本。
6. **フォーム + マイページ + プレイメモ** — 残り。プレイメモが重ければ独立させて計8本。

1→2→3 は後続の土台なので順序固定、4以降は並行可能です。1本目をマージすると全画面が中途半端に混ざるので、**1 と 2 を feature flag なしで先に入れるか**は先に決めた方がいいです。

分割を変える判断が数点あるので、答えてもらえればこの案を具体化します。

_[tool: ask_user]_

4問の回答を待っています。特に一体化とステータス語彙の扱いで本数が変わります。

## User

Answered — Asked for follow-up questions; model_merge: UI 側だけ統合表示にして、データは今のまま繋ぐ; status: repo の8種を維持し、v3 の見た目だけ適用; pr_size: 中くらい（6-8本）; rollout: ブランチに積んで一括

## User

あーっと

## Assistant



## User

あーっと

## Assistant



