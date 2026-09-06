repo: dot-ma801/taku-biyori
branch: claude/issue-117-shared-docs
path: packages/frontend/src

## Last sync

date: 2026-09-05T15:12:00Z

### Updated in this project

- `claude/issue-117-shared-docs`（design-v2）の構造でリデザイン案を作成：`たく日和 リデザイン v0.3.dc.html`
- ロビー（下書き/受付中/受付終了/解散）と開催（開催予定/本日開催/完了/中止）の親子関係、URL 入れ子に対応するパンくずを反映
- 着席者（Seat）、日程調整のやり直しと履歴、ロビー作成時の「日程の決め方」分岐を実装
- ダッシュボードは design-v2 §7-5 の4セクション＋公開ロビーの5セクション構成

## Screen map

| プロジェクトの画面 | 元となるリポジトリのファイル |
| --- | --- |
| 共通シェル（ナビ・テーマ） | src/App.vue, src/router/index.ts, src/components/layout/* |
| ダッシュボード | src/features/Dashboard/index.vue, src/features/Lobby/List/{index,useLobbyList}.*, src/features/GameSession/List/*, src/components/common/{LobbyStatusBadge,GameSessionStatusBadge}/* |
| ロビー詳細 | src/features/Lobby/Detail/{index,ActionBar,StatusDisplay,MemberDisplay,MemoDisplay,GameSessionList}.vue, src/features/Lobby/Detail/composables/{useLobbyStatus,useLobbyStatusAppearance,useGuestLink,useLobbyMembership}.ts |
| 日程調整（テーブル・カード・履歴・やり直し） | src/features/Lobby/Detail/Schedule/{ScheduleDisplay,ScheduleTable,ScheduleCardList,AnswerCell,SchedulePollHistory,RestartSchedulePoll,CandidateDateEditSection}.vue, .../{useSchedulePoll,useSchedulePollHistory,useRestartSchedulePoll,useScheduleView}.ts |
| 開催を追加（3ステップ） | src/features/Lobby/Detail/Schedule/ConfirmFlow/{ConfirmFlowDialog,CandidateStep,MemberSelectStep,ReviewStep}.vue, .../useConfirmFlow.ts, src/components/common/BaseStepper/* |
| 開催詳細 | src/features/GameSession/Detail/{index,StatusDisplay,SeatDisplay,SessionActionBar,MemoDisplay}.vue, .../{useSeatEdit,useSeatManagement,useLobbyEntriesForSeating,useGameSessionStatus}.ts |
| プレイメモ | src/views/GameSession/PlayMemoView.vue, src/features/GameSession/PlayMemo/{PlayMemoDisplay,MyPlayMemoCard,PlayMemoEditor,PlayMemoReader,PlayMemoSidebar}.vue, .../{useMyPlayMemo,useSharedPlayMemos,usePlayMemoEdit,usePlayMemoSelection}.ts |
| ロビー作成（日程の決め方） | src/features/Lobby/Edit/{index,InputBasicInfo,InputScheduleInfo}.vue, src/features/Lobby/Edit/composables/{schedule-mode,useCreateLobby}.ts, src/utils/pendingCandidateDates.ts |
| 開催編集 | src/features/GameSession/Edit/{index,InputBasicInfo,InputScheduleInfo,InputMemo}.vue |
| パンくず | src/components/common/BaseBreadcrumb/BaseBreadcrumb.vue |
| トップ | src/views/TopView.vue, src/features/Landing/* |
| ログイン | src/views/LoginView.vue, src/features/user/{LoginCard,SignupCard,GoogleLoginButton}.vue |
| マイページ | src/features/Profile/*, src/features/user/LogoutDialog.vue |

## Sync history

### main（初回）

date: 2026-09-04T06:07:31Z — `たく日和 リデザイン.dc.html` 系を main の構造で作成
