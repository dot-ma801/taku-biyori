---
root: false
targets:
  - '*'
description: 'frontend（Vue 3）の DTO/model 分離・コンポーネント・composable 規約'
globs:
  - 'packages/frontend/**'
---
# frontend の規約

## API の型（DTO）と FE の model を分ける

`@taku-biyori/shared` の型は **API との通信契約（DTO）** であって、フロントエンド内部で扱う
データ構造ではない。DTO を見てよいのは `src/api/` と `src/models/` だけで、
composable / component は model だけを受け取る
（`docs/adr/0010-frontend-separates-dto-and-model.md`）。

```plaintext
packages/frontend/src/
├── api/          # DTO ⇄ model の境界。fetch して model を返す
├── models/       # FE の内部型と、DTO からの変換関数（+ *.test.ts）
├── components/   # ドメイン知識を持たない汎用 UI
├── features/     # 機能ごとの画面・composable
├── views/        # ルートに対応する画面。features を組み立てる
├── router/
├── stores/
└── utils/
```

```ts
// ❌ NG — composable が DTO をそのまま持つ
import type { LobbyDetail } from '@taku-biyori/shared';
const lobby = ref<LobbyDetail | null>(null);

// ✅ OK — api 層で model に変換し、内側は model だけを見る
import type { LobbyDetailModel } from '@/models/lobby';
const lobby = ref<LobbyDetailModel | null>(null);
```

model 側で引き受けること。

| 関心事 | 例 |
|---|---|
| タイムスタンプを `Date` にする | `createdAt: string` → `Date`（画面ごとに `new Date()` しない） |
| `undefined` を `null` に正規化する | `scenarioName?: string \| null` → `string \| null` |
| 導出値をあらかじめ持たせる | `entries` から `activeEntries`（`leftAt === null`）を作る |

- 日付のみの値（`YYYY-MM-DD`）は `Date` にしない。タイムゾーンで日付がずれるため文字列のまま持つ
- 表示用のフォールバック文言（`'未設定'` など）は UI の関心事なので model に入れない
- 変換関数（`toXxxModel()`）には**テストを先に書く**
- **enum・権限関数・ステータス導出関数は shared から直接 import してよい。**
  これらは通信契約ではなく、FE と BE が同じ規則で動くための共有定義そのもの
- **`*Input` 型は「送るリクエストの形」そのもの（DTO）なので、DTO 境界の内側に置く。**
  composable / component から直接 import してはいけない
  （`UpdateGameSessionPlayMemoVisibilityInput` などは、サーバ側のルートが HTTP の JSON を
  parse するのに使っている型そのもの）。例外は「送る形の下書きを組み立てるユーティリティ」だけで、
  現状は `utils/pendingCandidateDates.ts` が `LobbyCandidateDateInput` を持つ1件のみ
- 参考: `src/models/lobby.ts` / `src/models/lobby.test.ts`

---

## template 内の式は computed に切り出す

`<template>` 内に `??` や三項演算子などの式を直接書かない。
必ず `<script setup>` 内の `computed` に切り出すこと。

```vue
<!-- ❌ NG -->
<p>{{ gameSession.scenarioName ?? '未設定' }}</p>

<!-- ✅ OK -->
<p>{{ scenarioName }}</p>

<!-- script setup 側 -->
const scenarioName = computed(() => gameSession.value?.scenarioName ?? '未設定');
```

---

## コンポーネントが持っていいもの・composable に寄せるもの

**コンポーネントの責務はテンプレートの構造制御に限定する。**

- ✅ コンポーネントに置く: `v-if` / `v-for` の条件、イベント転送、子コンポーネントへの props マッピング
- ❌ コンポーネントに置かない: データの変換・集計・導出。「表示のための計算」も含め、判断に迷ったら
  composable に寄せる

```ts
// ❌ NG — ScheduleTable.vue の中に計算ロジックを書く
function getAnswer(date, memberId) { ... }
function okCount(date) { ... }

// ✅ OK — composable に切り出して toRef で接続する
const { getAnswer, okCount } = useScheduleView(
  toRef(props, 'myMemberId'),
  toRef(props, 'isEditing'),
  toRef(props, 'draftAnswers'),
);
```

`'未設定'` のような表示用フォールバックは UI の関心事なので composable に含めない。
composable はフォールバックなしの生データを返し、コンポーネント側の `computed` で表示用に加工する。

---

## `watch` を多用しない

**`watch` は最後の手段。** 書きたくなったら、先に次の4つを検討する。

| 代わりに使えないか | 典型例 |
|---|---|
| `computed` で導出できないか | 他の state から計算できる値に `watch` + `ref` を使わない |
| `emit` で親にイベントを渡せば済まないか | 子の変更を親が `watch` で拾う → 子が `emit`、親がハンドラで処理する |
| イベントドリブンにできないか | 「値が変わったら実行」ではなく「ユーザーが押したら実行」で書けないか |
| `onMounted` の初期化で済まないか | 初回だけ必要な処理に `watch(..., { immediate: true })` を使わない |

```ts
// ❌ NG — 子の state 変化を watch で親に伝播させる
watch(draftName, (value) => {
  emit('update', value);
});

// ✅ OK — 確定した時点のイベントとして親へ渡す
function handleSubmit() {
  emit('update', draftName.value);
}
```

`watch` が妥当なのは、**自分が発生源ではない外部の変化に追従する**とき。

- 再取得などで props の元データが差し替わり、編集ドラフトを作り直す必要がある
- ルートパラメータの変化に応じて再フェッチする
- 外部リソース（購読・タイマー）のライフサイクルを state に合わせる

使う場合は「何の変化に追従しているのか」をコメント1行で残す。

---

## composable の引数は `Ref` を要求しない（依存は一方向に保つ）

**composable の引数で `Ref<T>` を受け取ってはいけない。**
依存の向き（とくに書き込み）は常に「呼び出し側 → composable」の一方向に保つ。
`Ref` を渡すと composable が `.value =` で呼び出し側の状態を書き換えられてしまい、
親が所有する状態を子のロジックが勝手に変える＝Vue の一方向データフロー違反になる。
（props のバケツリレーで「値」を下に流すのは可。逆流する「書き込み」を作らないことが要点）

| 関心事 | ❌ NG | ✅ OK |
|---|---|---|
| 読み取り | `Ref<T>` を要求 | `MaybeRefOrGetter<T>` を `toValue()` で読む |
| 書き込み | 受け取った `Ref` に代入 | `onXxx` コールバックで所有者に委譲 |
| 状態の所有 | あちこちで `.value =` | `ref()` を宣言した場所（親）だけ |

```ts
// ❌ NG — Ref を要求し、内部で書き換える（props 境界をまたぐと一方向違反）
export const useEdit = (entity: Ref<Entity | null>) => {
  const canEdit = computed(() => entity.value?.status === 'open');
  async function submit() {
    const updated = await api.update(entity.value!.id);
    entity.value = { ...entity.value!, ...updated }; // 呼び出し側の状態を書き換えている
  }
};

// ✅ OK — 読みは getter、書きは callback。所有者（親）が自分の ref を更新する
export const useEdit = (
  id: string,
  entity: MaybeRefOrGetter<Entity | null>,
  onUpdated: (updated: Entity) => void,
) => {
  const canEdit = computed(() => toValue(entity)?.status === 'open');
  async function submit() {
    const updated = await api.update(id);
    onUpdated(updated); // 親に依頼するだけ
  }
};
```

呼び出し側（子コンポーネント）は `() => props.xxx` を渡し、更新は `emit` で親へ返す。
親（`ref` の所有者）が `patchXxx` 等で自分の状態を差し替える。
参考: `useScheduleConfirm.ts` / `useMemberEdit.ts`、親側は `useGetGameSessionDetail.ts` の `patchGameSession`。

**例外**: composable がその状態の所有者自身（自分で `ref()` を宣言している）の場合のみ、
内部で `.value =` してよい。props 境界をまたいで受け取った値は書き換えない。

---

## 「サーバ値」と「編集ドラフト」は別物として管理する

API 由来の値（＝真実）と、UI で編集中の値（＝ドラフト）を**同一の状態にしない**。
同一視すると「元の値」が残らず変更検知ができず、キャンセルで戻す処理も複雑になる。
（Pinia などのグローバルストアは使わない方針。コンポーネント所有で完結させる）

| 状態 | 所有者 | 渡し方 |
|---|---|---|
| original（サーバ値・真実） | 親（fetch した側） | **readonly な props** で子へ下ろす |
| draft（編集中のコピー） | **子（編集UI）** | 子の中でコピーして持つ |
| 変更通知 | — | 保存確定値を **emit** で親へ返す |

- original は props（実質 readonly）で配るだけ。子は決して書き換えない
- draft は子の中で original から**コピー**して作る
  （オブジェクトなら `structuredClone`、文字列など**プリミティブはそのまま代入でコピー扱い**。
  不要な deepcopy はしない）
- 変更検知は `isDirty = draft !== baseline` で行う。
  保存ボタンの活性判定など UI の関心事なら**子側で**比較する
  （親で判定したいときは emit した object と親が持つ original を比較）
- ⚠️ **罠**: 再取得などで original（prop）が変わったら draft は古いまま取り残される。
  `watch(() => props.original, reset)` で draft を作り直すか `:key` で再マウントする
  （これは上の「`watch` が妥当なケース」にあたる）
- 参考実装: `useMemberEdit.ts`（`baseline` / `draftCharacterName` / `isDirty`）

---

## フィーチャー内のディレクトリ構成

**他の機能から使われることを意図しない実装詳細が生まれたら、サブディレクトリを切る。**
外部に公開するエントリポイントは1ファイルに限定し、内部の分割が外に漏れないようにする。

```plaintext
features/GameSession/Detail/
  Schedule/                     ← 日程調整の実装詳細をまとめたサブディレクトリ
    ScheduleDisplay.vue         ← 外部から import するのはここだけ
    ScheduleTable.vue           ← Detail/ の他コンポーネントからは使わない
    AnswerCell.vue
    useScheduleDisplay.ts
    useScheduleEdit.ts
    useScheduleView.ts
  index.vue                     ← ScheduleDisplay.vue だけを import する
  MemberDisplay.vue
```

---

## `useSession` の使い方（better-auth）

`createAuthClient`（`better-auth/client` の vanilla クライアント）の `useSession` は nanostores の
Atom であり、Vue の `ref` ではないため直接リアクティブに使えない。以下のパターンで変換する。

```ts
import { useSession } from '@/lib/auth';
import { ref, onUnmounted } from 'vue';

const sessionData = ref(useSession.get());
const unsub = useSession.subscribe((v) => { sessionData.value = v; });
onUnmounted(unsub);
// → sessionData.value.data?.user?.id でユーザー ID にアクセス
```

---

## `noUncheckedIndexedAccess` への対応

`tsconfig` で `noUncheckedIndexedAccess: true` が有効なため、`Record<string, T>` のインデックス
アクセスは `T | undefined` になる。キーの存在が不明なルックアップには `Map` + `.get()` を使う。

```ts
const answer = myAnswers[dateId]; // ❌ Record のインデックスアクセスは undefined になりうる
const answer = myAnswers.get(dateId); // ✅ .get() は意図が明確
```

---

## 作業の入口

| やること | 使うスキル |
|---|---|
| 基本 UI コンポーネントを追加する | `add-basic-component` |
| composable（処理ロジック）を TDD で実装する | `tdd-composable` |
