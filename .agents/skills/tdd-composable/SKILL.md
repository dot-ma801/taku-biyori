---
name: tdd-composable
description: >
  taku-biyori フロントエンドの処理ロジック（composable）をTDDで実装するスキル。
  「処理系を実装して」「ロジックを実装して」「composable を作って」「TDDで実装して」 「UIは自分でやるのでロジックだけ」など、Vue
  composable の実装を依頼されたときは必ずこのスキルを使うこと。 UIコンポーネント（.vue ファイル）には一切触れない。テスト → 実装 →
  Green確認 で止まる。
---
# tdd-composable スキル

`packages/frontend/src/features/` 配下の composable をTDDで実装する。
**.vue ファイルは絶対に触らない。** UI とのつなぎこみはユーザーが行う。

---

## 1. 要件のリサーチ

実装前に以下を必ず確認する。

**Issue / 要件の把握**
- GitHub Issue があれば `gh issue view <番号>` で内容を確認する
- 対象API（エンドポイント・入出力）を把握する

**既存コードの調査**（並列で読む）
- `packages/shared/src/game-session.ts` — 型定義・スキーマ
- `packages/shared/src/game-session/status.ts` — `GameSessionStatus` enum
- `packages/frontend/src/api/game-session.ts` — 利用できる API 関数
- `packages/frontend/src/stores/auth.ts` — `useAuthStore` の構造（ホスト判定等で必要な場合）
- 同じディレクトリの既存 composable — 命名・パターンの参考

---

## 2. composable の設計

調査結果をもとに以下を決める。

- **ファイル名**: lowerCamelCase（例: `useGameSessionStatus.ts`）
- **引数**: 後述の「引数設計の原則」に従う（`onMounted` 内で fetch する場合は id だけでもよい）
- **返り値**: `{ 状態refs, 操作関数 }` の形で返す
- **テスト境界**: どの依存をモックするか（API関数、Piniaストア）

### 引数設計の原則 ⚠️ 重要

**composable の引数で `Ref<T>` を要求してはいけない。**
依存（とくに書き込みの向き）は常に「呼び出し側 → composable」の一方向に保つ。
`Ref` を渡すと `.value =` で呼び出し側の状態を composable が書き換えられてしまい、
親が所有する状態を子側のロジックが勝手に変える（Vue の一方向データフロー違反）につながる。

関心事ごとに引数の形を分ける。

| 関心事 | ❌ 良くない | ✅ こうする |
|---|---|---|
| 読み取り | `Ref<T>` を要求 | `MaybeRefOrGetter<T>` を受け `toValue()` で読む |
| 書き込み | 受け取った `Ref` に代入 | `onXxx` コールバックで所有者に委譲する |
| 状態の所有 | あちこちで `.value =` | `ref()` を宣言した場所（親）だけが書き換える |

- 読み取りを `MaybeRefOrGetter` にすると、呼び出し側が ref / computed / getter / props の
  どれを持っていても渡せる（props 由来の値も受けられる）
- 更新結果は `onUpdated(updated)` のようなコールバックで返し、
  親コンポーネントが `patchXxx` などで自分の `ref` を差し替える
- 例外: composable がその状態の**所有者自身**（`ref` を自分で宣言している）の場合のみ
  内部で `.value =` してよい。props 境界をまたいで受け取った `Ref` は書き換えない
- 参考実装: `useScheduleConfirm.ts`（getter + callback）、`useMemberEdit.ts`

### 「サーバ値」と「編集ドラフト」を分ける

API 由来の値（真実）と、編集中の値（ドラフト）を**同じ状態にしない**。
分けることで変更検知（`isDirty`）が単純になり、キャンセルはドラフト破棄だけで済む。
（Pinia などのグローバルストアは使わない。コンポーネント所有で完結させる）

| 状態 | 所有 | composable での扱い |
|---|---|---|
| baseline（サーバ値） | 親（props で配る） | getter で受けて `computed` で参照 |
| draft（編集中） | 子（編集UI） | composable 内で `ref` を持つ |

```ts
// baseline は読み取り元（getter）から導出、draft は composable が所有
const baseline = computed(() => toValue(member)?.characterName ?? '');
const draft = ref('');
const isDirty = computed(() => draft.value !== baseline.value);

function startEdit() {
  draft.value = baseline.value; // baseline からコピーして編集開始
}
```

- 変更検知は `isDirty = draft !== baseline` を `computed` で公開する
- プリミティブは代入でコピー扱い。オブジェクトを編集するなら `structuredClone` で連動を切る
- 保存成功時は API 返り値を `onUpdated` で親へ返し、親が baseline（真実）を差し替える
- 参考実装: `useMemberEdit.ts`（`baseline` / `draftCharacterName` / `isDirty`）

---

## 3. テストを先に書く（Red フェーズ）

テストファイルを composable と同じディレクトリに作成する（例: `useGameSessionStatus.test.ts`）。

### テストファイルの構造

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useXxx } from '@/features/.../useXxx';
// 必要に応じて型・enum をインポート
import { GameSessionStatus } from '@taku-biyori/shared';
import type { SomeType } from '@taku-biyori/shared';

// API 関数をモック
vi.mock('@/api/game-session', () => ({
  someApiFunction: vi.fn(),
}));

// Pinia ストアをモック（ホスト判定など認証が必要な場合）
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

import { someApiFunction } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('機能グループ名', () => {
  it('期待する挙動の説明（日本語）', async () => {
    // Arrange
    ...
    // Act
    ...
    // Assert
    ...
  });
});
```

### テストケースの考え方

- **条件分岐ごとにテストを書く**（例: ホストのとき / 非ホストのとき / null のとき）
- **API呼び出しの検証**: `expect(mockFn).toHaveBeenCalledWith(...)` で引数を確認する
- **loading / errorMessage の状態遷移**: 成功時・失敗時それぞれ確認する
- **テスト説明文は日本語**で書く

### AAA パターンを守る

```ts
// Arrange（準備）
const gameSession = ref(makeGameSession({ status: GameSessionStatus.draft }));

// Act（実行）
const { canPublish } = useXxx(SESSION_ID, gameSession);

// Assert（検証）
expect(canPublish.value).toBe(true);
```

複雑な Arrange は `makeXxx()` ヘルパー関数として切り出す。

---

## 4. Red を確認する

```bash
pnpm --filter @taku-biyori/frontend test --run -- src/features/.../useXxx.test.ts
```

テストが失敗していることを確認してから実装に進む。

---

## 5. composable を実装する（Green フェーズ）

### 基本構造

```ts
import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { SomeType } from '@taku-biyori/shared';
import { someApiFunction } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

export const useXxx = (
  id: string,
  // 読み取りは getter で受ける（Ref は要求しない）
  data: MaybeRefOrGetter<SomeType | null>,
  // 書き込みは callback で所有者に委譲する
  onUpdated: (updated: SomeType) => void,
) => {
  const authStore = useAuthStore();
  const loading = ref(false);
  const errorMessage = ref('');

  const derivedValue = computed(() => toValue(data)?.someField);

  async function doSomething() {
    loading.value = true;
    errorMessage.value = '';
    try {
      const updated = await someApiFunction(id, { ... });
      onUpdated(updated); // 親に更新を依頼する（自分では書き換えない）
    } catch {
      errorMessage.value = 'エラーメッセージ（日本語）';
    } finally {
      loading.value = false;
    }
  }

  return { derivedValue, loading, errorMessage, doSomething };
};
```

### インポートルール

- **相対パスは禁止**。必ず `@/` エイリアスを使う
- `@taku-biyori/shared` から型・enum をインポートする
- API 関数は `@/api/game-session` から

### 注意事項

- `template` 内で使う表示用のフォールバック値（`'未設定'` 等）は composable に入れない
- `noUncheckedIndexedAccess` が有効なため、`Record<string, T>` より `Map` を使う
- `useSession`（better-auth）はそのままでは Vue のリアクティビティに乗らないため、`ref` + `onUnmounted` パターンで変換する

---

## 6. Green を確認する

```bash
pnpm --filter @taku-biyori/frontend test --run -- src/features/.../useXxx.test.ts
```

全テストが通ったら完了。ユーザーに返す。

---

## 7. JSDoc を付ける

返り値に含まれる各メンバー（computed・ref・関数）に JSDoc コメントを付ける。

```ts
/** ログインユーザーがホストかどうか */
const isHost = computed(...);

/** 操作が可能かどうか。ホストかつ status が xxx のときのみ true */
const canSomething = computed(...);

/**
 * 〇〇を実行する。
 * 成功後に gameSession を更新する。
 * loading 中の重複呼び出しは無視する。
 */
async function doSomething(...) { ... }
```

---

## 完了後にすること

- 実装ファイルとテストファイルのパスをユーザーに伝える
- 返り値の一覧（`{ ... }` の中身）をまとめて伝える（UI へのつなぎこみに必要なため）
- **.vue ファイルには手を加えない**
