# UI 移行 チェックリスト

進捗の唯一の記録。ralph loop はこのファイルの **Phase 2 の未チェック先頭1件**だけを見る。

- チェックは**検証コマンドが全部緑になってから**入れる
- 判断に迷って中断したら、その行に `⚠️ 要相談: 理由` を追記する
- 各行は GitHub issue と1対1で対応させる（issue 番号が決まったら `#NNN` を追記する）

---

## Phase 0 — 足場（人）

- [x] VRT の仕組みを入れる（`playwright.vrt.config.ts` / `vrt/storybook.spec.ts`）
- [x] Storybook の preview にテーマ切替とフォント同期読み込みを入れる
- [x] `check:raw-color` を追加し、既存の生リテラル 17 件を潰す
- [x] CI に `vrt` ジョブと `check:raw-color` ステップを追加
- [x] `VRT Baseline` ワークフローと `scripts/vrt-docker.sh` を追加
- [x] 本ドキュメント一式を追加
- [ ] **ClaudeDesign プロジェクトを取り込み、`packages/frontend/DESIGN.md` を差し替える**
- [ ] `VRT Baseline` ワークフローを実行して、現行デザインの基準画像をコミットする
- [ ] トラッキング issue と Phase ごとの sub-issue を作成する

## Phase 1 — トークン層（人）

- [ ] `token-diff.md` の「新デザインの値」列を全部埋める
- [ ] `variables.css` を新トークンに差し替える
- [ ] 増えたトークン・消えるトークンを洗い出し、参照元を確認する
- [ ] ダークテーマのコントラスト比 4.5:1 を再検証する
- [ ] VRT の差分を全件目視して基準画像を撮り直す（**ここは全面的に変わるのが正常**）

## Phase 2 — Base コンポーネント（ralph loop）

対象は `packages/frontend/src/components/**`。上から順に1周1件。

### 基本

- [ ] `button/BaseButton`
- [ ] `common/BaseCard`
- [ ] `common/BaseDivider`
- [ ] `common/BaseBadge`
- [ ] `common/BaseChip`
- [ ] `common/BaseSectionHeading`
- [ ] `common/BaseSkeleton`
- [ ] `common/BaseProgress`
- [ ] `common/BaseAlert`

### フォーム

- [ ] `form/BaseTextBox`
- [ ] `form/BaseTextArea`
- [ ] `form/BaseSelect`
- [ ] `form/BaseCheckbox`
- [ ] `form/BaseRadioGroup`
- [ ] `form/BaseSwitch`
- [ ] `form/BaseDatePicker`
- [ ] `form/BaseDateTimePicker`

### オーバーレイ・ナビゲーション

- [ ] `dialog/BaseDialog`
- [ ] `common/BasePopover`
- [ ] `common/BaseTabs`
- [ ] `common/BaseTable`
- [ ] `common/BaseBreadcrumb`
- [ ] `common/BaseCollapsible`
- [ ] `common/BaseStepper`
- [ ] `common/BaseToastContainer`
- [ ] `common/BaseLoadingOverlay`

### ドメイン付き

- [ ] `common/LobbyStatusBadge`
- [ ] `common/GameSessionStatusBadge`

## Phase 3 — レイアウト（人）

- [ ] `layout/PageContainer`
- [ ] `layout/AppHeader`
- [ ] `layout/AppFooter`
- [ ] `layout/ThemeSwitchButton`
- [ ] `features/user/UserAvatar`

## Phase 4 — 画面（人 / issue 単位）

新デザインで情報設計が変わるため、**粒度はデザイン取り込み後に確定する**。
現状の画面から起こした暫定リスト。

- [ ] Landing（`features/Landing`）
- [ ] ログイン・サインアップ（`views/LoginView` / `features/user`）
- [ ] ダッシュボード（`features/Dashboard`）
- [ ] ロビー一覧（`features/Lobby/List`）
- [ ] ロビー詳細（`features/Lobby/Detail`）※ 日程調整を含むので分割の可能性あり
- [ ] ロビー作成・編集（`features/Lobby/Edit`）
- [ ] セッション一覧（`features/GameSession/List`）
- [ ] セッション詳細（`features/GameSession/Detail`）
- [ ] セッション編集（`features/GameSession/Edit`）
- [ ] プレイメモ（`features/GameSession/PlayMemo`）
- [ ] プロフィール（`features/Profile`）

## Phase 5 — 後片付け（人）

- [ ] `views/ComponentsView.vue` を新デザインのカタログに更新
- [ ] 各コンポーネントの `README.md` の記述と実装のズレを解消
- [ ] 使われなくなったトークンを `variables.css` から削除
- [ ] `check:raw-color` の `ALLOWED_FILES` を見直す
- [ ] 日本語ラベルの統一（issue #117）と合流
- [ ] `packages/frontend/DESIGN.md` と実装の最終突き合わせ
