# 引き継ぎ資料 — issue #114（タスク4 / SchedulePoll）

> このファイルは引き継ぎ用の一時ドキュメントです。issue #114 が完了したら削除してください。

## 現在の状況

| PR | ブランチ | ベース | 状態 |
|---|---|---|---|
| #131 | `codex/issue-114-shared` | `develop/v0.3` | **CI green・マージ可能**。レビュー3件のうち2件は修正済み＆resolve、1件は返信のみ（下記） |
| #132 | `claude/issue-114-backend` | `codex/issue-114-shared` | **CI green**。CodeRabbit の指摘3件が**未対応** |
| （未作成） | `claude/issue-114-frontend` | `claude/issue-114-backend` | フェーズ1（model + api）まで完了・push 済み。**フェーズ2（composable + UI）が未着手** |

マージ順序は #131 → #132 → frontend PR。

### 完了していること

- **shared（#131）**: `SchedulePoll` / `CandidateDate` / `ScheduleAnswer` の契約型、`time-label.ts`、
  作成時の候補日を任意化。追加で、日程回答の入力で `candidateDateId` の重複を parse 境界で拒否、
  openapi の `timeLabel` の `maxLength` を共有スキーマ（trim 後に20文字）に揃えた。
- **backend（#132）**: DDL（`schedule_polls` / `candidate_dates` / `schedule_answers`、RENAME 主体の
  マイグレーション 0016）、ユースケース6本、リポジトリ置換、`schedule-poll-route.ts`、
  旧 availability 系の撤去、seed 追随、実 DB テスト。`LobbyDetail.schedulePolls` を必須化。
  ローカルで backend 632 tests / shared 356 tests / frontend 1,088 tests green、typecheck・lint・
  `db:generate` 差分なしを確認済み。
- **frontend（フェーズ1）**: `src/models/schedule-poll.ts`（+ テスト）、`LobbyDetailModel.schedulePolls`、
  `src/api/lobby.ts` に日程調整6関数を**追加**（model を返す）。旧 availability 系4関数はまだ残っている。

---

## 1. 最優先: PR #132 の CodeRabbit 指摘3件

### (a) 【Major・要修正】回答の検証〜書込みが同じロックで直列化されていない

`upsert-schedule-answers.ts` と `upsert-guest-schedule-answers.ts` は、
「最新 poll の判定」「候補日がその poll のものか」を検証したあとに `upsertScheduleAnswers` を呼ぶが、
その間ロックを取っていない。並行して `createSchedulePoll` が走ると古い poll に書き込めてしまい、
`replaceCandidateDates` が走ると検証済み候補日が消えて FK 違反になる。**これは実在の不具合。**

修正方針: `createSchedulePoll` / `replaceCandidateDates` と同じく `repo.executeWithLock(lobbyId, ...)`
のコールバック内で「検証 → upsert」までを実行する。

- 両ユースケースの repository interface に `executeWithLock<T>(lobbyId, fn)` を足す
  （`replace-candidate-dates.ts` の宣言をそのまま真似る）
- `lobby-repository.ts` の `executeWithLock` は実装済みなので追加実装は不要
- ロック取得はロビー行への `SELECT ... FOR UPDATE`。同じロビーの回答が直列化されるが、
  ロビーの人数規模では許容できるコスト。**この判断を PR にコメントで残すこと**
- ユニットテストのモック repo にも `executeWithLock: (_, fn) => fn(mockRepo)` を足す必要がある
- 並行性の検証は `test/integration/row-lock-contention.test.ts` に追加すると既存の流儀に沿う

### (b) 【Minor・要修正】ユニットテストの日付が時間経過で腐る

`test/unit/lobby/replace-candidate-dates.test.ts` の 60 / 77 / 359 行目あたりで
`2026-09-03` / `2026-09-05` を「新規追加する候補日」として使っている。実行日がその日を過ぎると
`pastDateAdded` が返るようになり落ちる。`existingDates` も含めて `2100-09-01` / `2100-09-02` /
`2100-09-03` / `2100-09-05` に寄せる（インテグレーションテストは既に 2100 系を使っている）。

### (c) 【Nitpick】ゲスト回答の `entryId` 欠落テストにトークンが無い

`test/integration/lobby-route.test.ts` の 2126 行目あたり。`GUEST_TOKEN_HEADER` を付けないと
「トークン欠落で 400」でも通ってしまい、検証したい理由と違う理由で成功する。ヘッダーを足す。

### PR #131 の未 resolve スレッド

`LobbyDetail.schedulePolls` を必須にすべきという指摘。**#132 で必須化済み**なので、
#132 がマージされたら resolve してよい。返信は投稿済み。

---

## 2. 残作業: frontend フェーズ2（composable + UI）

ブランチ `claude/issue-114-frontend`（`claude/issue-114-backend` から分岐）で作業する。

### 使えるもの（フェーズ1で実装済み）

`src/models/schedule-poll.ts`:
```ts
ScheduleAnswerValue = 'ok' | 'maybe' | 'ng'
ScheduleAnswerModel  = { id, entryId, answer, comment }
CandidateDateModel   = { id, date: string /* YYYY-MM-DD のまま */, timeLabel, answersByEntryId: Map<string, ScheduleAnswerModel> }
SchedulePollModel    = { id, lobbyId, candidateDates: CandidateDateModel[], createdAt: Date }
SchedulePollSummaryModel = { id, createdAt: Date }
```
`src/api/lobby.ts`: `listSchedulePolls` / `createSchedulePoll` / `getSchedulePoll` /
`replaceCandidateDates` / `upsertScheduleAnswers` / `upsertGuestScheduleAnswers`（いずれも model を返す）。
`LobbyDetailModel.schedulePolls`（新しい順・先頭が最新）。

### やること

- `src/features/Lobby/Detail/Schedule/` を model ベースへ移行
  - `useSchedule.ts` → `useSchedulePoll.ts`（`lobby.schedulePolls[0].id` で最新 poll を取得）
  - `useGuestSchedule.ts` を poll ベースに。**回答は候補日ごとではなく1リクエストで一括送信**
  - `useScheduleView.ts` の `getAnswer` は `answersByEntryId.get(entryId)` を引くだけにする。
    `hasAnyDateNote` → `hasAnyTimeLabel`
  - `useScheduleEditHint.ts` の語彙を追随
  - `ScheduleDisplay.vue` / `ScheduleTable.vue` / `ScheduleCardList.vue` / `AnswerCell.vue`
- **「日程調整をやり直す」導線**（ホストのみ。`createSchedulePoll`）
- **過去の調整の折りたたみ表示**（読み取り専用。`getSchedulePoll`）
- `Lobby/Edit/InputScheduleInfo.vue` の候補日編集を詳細画面へ移す
  （**作成**時の候補日入力は残し、**編集**画面から外す）。`useUpdateLobby.ts` も追随
- ロビー作成時の候補日は `dateNote` ではなく **`timeLabel`** を送る（backend はもう `dateNote` を読まない）
- 最後に `src/api/lobby.ts` の旧 availability 系4関数と不要な shared 型 import を削除

### エラーの意味

- **409** = その調整はもう最新でない（誰かが「やり直す」を実行した）。再取得を促す
- **422** = ロビーが解散済み、または未公開
- **400** = 現在の調整に無い過去日を追加した／同じ `candidateDateId` を2件送った、など

### issue #114 の完了条件（frontend 分）

- `src/models/schedule-poll.test.ts` があり、回答の参照が `Map.get()`（`answers.find()` が `src/models/` の外に無い）
- `src/api/` `src/models/` 以外の frontend が shared の日程調整系レスポンス型を import していない
- `grep -rn "dateNote\|availability\|Availability" packages/frontend/src` が0件

### 守ること（CLAUDE.md「フロントエンド実装方針」）

`<template>` に `??` や三項演算子を書かない／表示用フォールバック文言はコンポーネントの `computed` に置く／
**composable の引数に `Ref<T>` を要求しない**（読みは `MaybeRefOrGetter` + `toValue()`、書きは `onXxx` コールバック）／
サーバ値（props・readonly）と編集ドラフト（子が所有するコピー）を分ける／相対 import 禁止。

---

## 3. 環境のセットアップ（毎回）

```bash
service postgresql start          # dangerouslyDisableSandbox: true が必要
pg_isready
pnpm install --frozen-lockfile
pnpm --filter @taku-biyori/shared build
pnpm --filter @taku-biyori/backend db:test:setup
```

`packages/backend/.env` は gitignore されているため、新しいコンテナでは作り直しが要る
（`.env.example` どおり。`DATABASE_URL` は `app_template`、`TEST_DATABASE_URL` は `taku_biyori_test`）。
PostgreSQL のロール `app` が無ければ
`su postgres -c "psql -c \"CREATE ROLE app LOGIN PASSWORD 'password' SUPERUSER\""` で作る。

backend のテストが `relation "auth.user" does not exist` で大量に落ちたら**環境を疑う**
（コンテナがアイドルすると Postgres が止まる）。

---

## 4. 設計判断の記録（変更しないこと）

- **「最新の調整」は `created_at DESC, id DESC`。** `is_latest` フラグは持たない（design-v2 §9-9）。
  `schedule_polls.created_at` の既定値だけ `clock_timestamp()`（`now()` は同一トランザクション内で
  同値になり最新が不定になるため）
- **過去日ルール**（issue #114 の【要決定】への回答）:
  新規作成（ロビー作成時・新しい調整の作成）は過去日を 400 で拒否（shared の Schema）。
  候補日の一括更新は既存の過去日を据え置き・`timeLabel` 変更可、**現在の調整に無い過去日の追加だけ** 400
  （更新前との日付比較が要るので application 層で判定）
- **`get-latest-schedule-poll` は独立したユースケースにしていない。** openapi に `/latest` の
  エンドポイントが無く、「`LobbyDetail.schedulePolls[0].id` → `GET .../schedule-polls/{pollId}`」で足りるため

## 5. 人間の確認が必要な項目（自動では確認できない）

- 候補日を登録 → 参加者3人が◯△×で回答 → ホストが「日程調整をやり直す」→ 新しい調整に切り替わり、
  古い調整が読み取り専用の履歴として残る → 古い調整の候補日へ回答すると 409、という UI 通しの動作確認
- 実 DB の migration 0016 を既存データがある環境へ当てたときの挙動（ローカルでは確認済み）
