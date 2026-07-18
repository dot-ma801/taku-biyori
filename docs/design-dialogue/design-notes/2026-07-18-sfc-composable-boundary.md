# SFC と composable の境界・composable の置き場所

- Status: 結論（一部保留あり）
- タグ: #frontend #SFCとcomposableの境界 #featureディレクトリ構成

## 迷い

`features/` 配下の実装パターンとして自分の中に「ほぼ確立している」原則があるが、文章化されておらず、実コードにも揺れがある。原則を言語化し、実コードとの矛盾を洗い出したい。

ユーザーが語った原則（対話開始時点）:

1. feature 単位で SFC を分割する
2. SFC にロジックを書き込みすぎず、表示に関わるものだけ SFC に記載し、具体的な処理は composable に逃がす
3. composable の引数には toValue（`MaybeRefOrGetter`）を活用し、リアクティブ性と一方向性を保つ
4. 責務の分離を重要視する

## 対話の要点

- 原則3は既に CLAUDE.md「composable の引数は `Ref` を要求しない」に明文化済みのため、今回は対象外とした
- 原則4は現時点では抽象度が高く、実質的に原則1・2の言い換え。グレーゾーンの裁き方で中身が決まると整理した
- 実コードとの照合で見つかった揺れ:

| 箇所 | 内容 | 判断 |
|------|------|------|
| `ScheduleDisplay.vue` の `myMemberId` | `members.find(...)` による導出が SFC 内にある | **処理** → composable に逃がすべき |
| `MemberDisplay.vue` の `displayMembers` | `map` による表示用変換が SFC 内にある | **処理** → composable に逃がすべき |
| `LoginCard.vue` の `userIdRules` | バリデーション関数が SFC 直書き。一方 `GameSession/Edit/` は `maxMembersValidation.ts` に切り出し済み | **処理** → 切り出す側に揃える |
| `Lobby/Edit/composables/` vs `GameSession/Edit/`（フラット置き） | composable の置き場所が feature 間で不統一 | `composables/` を切る側に統一 |
| `user/` 配下の構造 | 小文字・画面階層なし・`UserAvatar/` のみ stories/README 付き独立ディレクトリ | **保留**（下記） |

- 良い実例として確認できたもの:
  - `MemberDisplay.vue` → `useMemberEdit` への委譲（getter + callback）
  - `Detail/index.vue` のフォールバック文言（`'未設定'`）を NOTE コメント付きで SFC 側に置く判断

## 結論

1. **`map`・`find` 等によるデータの導出・変換は、表示目的であっても「処理」であり composable に切り出す。** SFC に置いてよいのは構造制御（`v-if` / `v-for`・イベント転送・props マッピング）と表示フォールバック文言のみ
2. **バリデーション関数も「処理」。SFC に直書きせず、別ファイル（`xxxValidation.ts` 等）に切り出す**
3. **feature 内の composable は `composables/` サブディレクトリに置く方向に統一する。** 既存のフラット置き（`GameSession/Edit/`・`GameSession/Detail/` 等）は今すぐリファクタリングせず、**次にその feature を触るタイミングで**揃える

※ 今回のセッションは原則の抽出のみで、実コードの修正は行っていない。上記の違反例（`myMemberId` / `displayMembers` / `userIdRules`）の是正も「次に触るとき」の適用対象。

## 保留事項（次回の問答への問い）

- **`user/` 配下の構造の違いをどう裁くか**: 他 feature は PascalCase・画面ごとの階層（`GameSession/Detail/` 等）だが、`user/` だけ小文字・階層なし・`UserAvatar/` のみ stories/README 付きの独立ディレクトリ。feature ディレクトリの命名・階層規約として次回言語化する
- `composables/` を切る閾値（1本でも切るのか、複数になったら切るのか）は数値では決めていない。運用してみて迷いが出たら再度問答する

## CLAUDE.md 追記候補

**反映先の提案**: ルート CLAUDE.md「フロントエンド実装方針 > コンポーネントが持っていいもの・composable に寄せるもの」セクションへの追記（将来 `packages/frontend/CLAUDE.md` を新設する場合はそちらへ移設）

---

### 追記候補1: 「表示のための計算」の具体化（既存セクションの ❌ 例を補強）

```markdown
`map`・`find`・`filter` などによるデータの導出は、表示目的であっても「処理」として composable に切り出す。

<!-- ❌ NG — SFC 内で members から表示用データを導出している -->
const displayMembers = computed(() =>
  props.gameSession.members.map((member) => ({ ... })),
);
const myMemberId = computed(
  () => props.gameSession.members.find((m) => m.userId === userId)?.id ?? null,
);

<!-- ✅ OK — composable に切り出し、SFC は結果を受け取るだけ -->
const { displayMembers, myMemberId } = useMemberView(() => props.gameSession);
```

### 追記候補2: バリデーション関数の置き場所

```markdown
バリデーション関数は SFC に直書きせず、別ファイルに切り出す。

<!-- ❌ NG — SFC 内に rules を直書き -->
const userIdRules = [(v) => /^[a-zA-Z0-9_.]+$/.test(v) || '...'];

<!-- ✅ OK — xxxValidation.ts に切り出す（例: maxMembersValidation.ts） -->
import { userIdRules } from '@/features/user/composables/userIdValidation';
```

### 追記候補3: composable の置き場所

```markdown
feature 内の composable は `composables/` サブディレクトリに置く。

features/Lobby/Edit/
  composables/          ← composable とそのテストはここ
    useCreateLobby.ts
    useCreateLobby.test.ts
  index.vue
  InputBasicInfo.vue

既存のフラット置き（`GameSession/Edit/` 等）は、次にその feature を触るタイミングで揃える。
```
