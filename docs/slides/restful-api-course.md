---
marp: true
theme: default
paginate: true
title: はじめての RESTful API 入門 — taku-biyori のコードで学ぶ
---

# はじめての RESTful API 入門

## taku-biyori の実コードで学ぶ

TRPG セッション管理アプリ（Hono + Zod + クリーンアーキテクチャ風）を題材に、
REST API の考え方を基礎から学びます。

対象: Web 開発の基礎はある / REST はこれから

---

## この講座のゴール

- API / Web API とは何かを説明できる
- REST の基本概念（リソース・URL・HTTP メソッド・ステートレス）を理解する
- ステータスコードを「意味」で使い分けられる
- リクエスト / レスポンスの契約（Zod スキーマ）の役割がわかる
- 実務でぶつかる設計トピックの入り口に立つ

---

## そもそも API とは

- **API = Application Programming Interface**
- ソフトウェア同士が「決まった作法」でやり取りするための窓口
- 内部の実装を隠し、**契約（入力と出力の約束）**だけを公開する
- 例: 「タイトルを送れば、卓（セッション）を作って返す」という約束

> 中身がどう動くかを知らなくても、約束さえ守れば使える

---

## Web API とは

- HTTP を通じてネットワーク越しに呼び出せる API
- クライアント（ブラウザ・アプリ）が **リクエスト**を送り、
  サーバーが **レスポンス**を返す
- taku-biyori では:
  - フロント（Vue）が `fetch` でリクエスト
  - バック（Hono）が JSON でレスポンス

```
[ブラウザ] --- HTTP リクエスト ---> [サーバー]
[ブラウザ] <-- JSON レスポンス ---- [サーバー]
```

---

## REST とは

- **RE**presentational **S**tate **T**ransfer
- Web の仕組み（HTTP）を素直に活かす設計スタイル
- 中心にある考え方は **「リソース」**
- 世界を「操作の手順」ではなく「モノ（リソース）」で捉える

本講座で押さえる4本柱:

1. リソース 2. URL 設計 3. HTTP メソッド 4. ステートレス

---

## 柱1: リソース

- REST では扱う対象を**リソース（名詞）**として捉える
- taku-biyori の主なリソース:
  - 卓（game session）
  - メンバー（member）
  - 候補日（availability date）
  - プロフィール（profile）
- 「卓を作成する」ではなく「**卓というリソース**が存在する」と考える

---

## 柱2: URL 設計

- リソースは URL で指し示す
- 命名の基本ルール（taku-biyori 準拠）:
  - **複数形**: `/game-sessions`
  - **ケバブケース**: `game-sessions`（`gameSessions` にしない）
  - **所有関係は階層のネスト**で表す

```
/api/game-sessions          … 卓の集合
/api/game-sessions/:id      … 特定の1つの卓
/api/game-sessions/:id/members … その卓に属するメンバー
```

---

## 柱3: HTTP メソッド

同じ URL でも「メソッド」で操作の意味が変わる。

| メソッド | 意味 | 例 |
|---|---|---|
| GET | 取得（読むだけ） | 卓の一覧・詳細 |
| POST | 新規作成（追加） | 卓を作る |
| PUT | 全体を置換 | 候補日を一括更新 |
| PATCH | 一部を更新 | 卓のタイトルだけ変更 |
| DELETE | 削除 | 卓を消す |

URL = 対象、メソッド = 動作、と分けて考えるのがコツ。

---

## 柱4: ステートレス

- サーバーは前のリクエストを**覚えていない**前提で設計する
- 各リクエストは、それ単体で処理に必要な情報を持つ
  - 「誰か」は Cookie セッションやトークンで毎回伝える
- 利点: スケールしやすい・挙動が予測しやすい

> 「さっき送ったから省略」は通じない。毎回きちんと伝える。

---

## 実例: taku-biyori のエンドポイント（卓）

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/game-sessions` | 一覧（認証任意） |
| POST | `/api/game-sessions` | 作成（要認証） |
| GET | `/api/game-sessions/:id` | 詳細（非公開は host のみ） |
| PATCH | `/api/game-sessions/:id` | 更新（要認証） |
| DELETE | `/api/game-sessions/:id` | 削除（host のみ） |
| PATCH | `/api/game-sessions/:id/status` | ステータス遷移専用 |

一覧/作成は集合の URL、詳細/更新/削除は個別の URL。

---

## 実例: ネストしたリソース（メンバー）

メンバーは「卓に属する」ので URL も卓の下にネストする。

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/game-sessions/:id/members` | メンバー一覧 |
| POST | `/api/game-sessions/:id/members` | 参加（要認証） |
| POST | `/.../:id/guest-members` | ゲスト参加 |
| PATCH | `/.../members/:memberId` | メンバー更新 |
| DELETE | `/.../members/:memberId` | 退出 |

「どの卓の」メンバーかが URL 階層で一目でわかる。

---

## 実例: 日程調整リソース

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/.../availability-dates` | 候補日一覧 |
| POST | `/.../availability-dates` | 1件追加（非冪等） |
| PUT | `/.../availability-dates` | 一括置換（冪等） |
| DELETE | `/.../availability-dates/:dateId` | 削除 |
| POST | `/.../:dateId/confirm` | 確定アクション |
| PUT | `/.../:dateId/responses` | 自分の回答登録 / 更新 |

POST と PUT の使い分けは後半で詳しく解説します。

---

## HTTP ステータスコードとは

- レスポンスの結果を表す3桁の数字
- 大まかな分類:
  - **2xx** 成功
  - **4xx** クライアント側の問題（送り方が悪い）
  - **5xx** サーバー側の問題
- 「意味に合ったコード」を返すことがクライアントへの親切

---

## taku-biyori で使うステータスコード

| コード | 意味 | 使う場面 |
|---|---|---|
| 200 | OK | GET / PATCH 成功 |
| 201 | Created | 作成成功 |
| 204 | No Content | DELETE 成功（本文なし） |
| 400 | Bad Request | バリデーション失敗 |
| 401 | Unauthorized | 未ログイン |
| 403 | Forbidden | 権限なし |
| 404 | Not Found | 存在しない |
| 409 | Conflict | 状態の競合 |
| 422 | Unprocessable | 業務ルール違反 |
| 423 | Locked | 回答受付停止中 |

---

## 実コード: 作成 (POST) の 400 / 201

```ts
const parsed = CreateGameSessionInputSchema.safeParse(body);
if (!parsed.success) {
  return c.json({ error: parsed.error.issues }, 400);
}
const gameSession = await options.createGameSession(
  authSession.user.id,
  parsed.data,
);
return c.json(gameSession, 201);
```

- 入力が不正 → **400**（エラー内容を返す）
- 作成成功 → **201**（作られたリソースを返す）

---

## 実コード: 取得 (GET) の 404 / 401 / 403

```ts
const result = await options.getGameSession(c.req.param('id'), userId);
if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
if (result.type === 'forbidden') {
  return userId === null
    ? c.json({ error: 'Unauthorized' }, 401)
    : c.json({ error: 'Forbidden' }, 403);
}
return c.json(result.gameSession);
```

- 存在しない → **404**
- 非公開に未ログインでアクセス → **401**
- ログイン済みだが権限なし → **403**

---

## 401 と 403 の違い

- **401 Unauthorized**: あなたが「誰か」わからない（＝ログインして）
- **403 Forbidden**: 誰かはわかるが「その権限がない」（＝ログインしても無理）

taku-biyori では非公開の卓に対し:

- 未ログイン → 401（ログインすれば見られるかも）
- ログイン済みの他人 → 403（host ではないので見られない）

同じ「見せない」でも、次にすべきことが違う。

---

## 実コード: 削除 (DELETE) の 204

```ts
return new Response(null, { status: 204 });
```

- 削除成功時は **204 No Content**
- レスポンス本文は**なし**（返すものがない）
- 「成功したが、返す内容はない」を的確に表現する

---

## 実コード: 状態競合の 409

```ts
if (result.type === 'conflict')
  return c.json({ error: 'Conflict: already scheduled' }, 409);
```

- **409 Conflict**: 現在の状態と操作が矛盾する
- 例: すでに日程確定済みなのに、また確定しようとした
- 「リクエストは正しいが、今の状態では実行できない」

---

## 実コード: 業務ルール違反の 422

```ts
if (result.type === 'sessionNotOpen') {
  return c.json({ error: 'Session is not open for joining' }, 422);
}
```

- **422 Unprocessable Entity**: 形式は正しいが業務ルールに反する
- 例: 募集中でない卓に参加しようとした
- 400（形式が不正）とは区別する点がポイント

---

## 実コード: めずらしい 423 Locked

```ts
if (result.type === 'locked')
  return c.json({ error: 'Locked: session is not open for responses' }, 423);
```

- **423 Locked**: 対象が「ロック中」で操作を受け付けない
- 例: 回答受付が締め切られた候補日への回答
- 標準コードの中から**意味の近いもの**を選ぶ好例

---

## リクエスト / レスポンスの契約

- API は「入力」と「出力」の**契約**で成り立つ
- 契約が曖昧だと、フロントとバックの認識がズレてバグる
- taku-biyori では **Zod スキーマ**を契約として共有
  - `packages/shared` に定義
  - フロントとバック**両方**が同じ型を参照する

---

## 実コード: 共有 Zod スキーマ

```ts
export const CreateGameSessionInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  maxMembers: z.number().int().min(2).max(20).optional(),
  openUntil: z.iso.date().optional(),
});
export type CreateGameSessionInput =
  z.infer<typeof CreateGameSessionInputSchema>;
```

- 制約（文字数・範囲・必須）をスキーマで宣言
- `z.infer` で TypeScript の型を自動生成

---

## 契約を共有する利点

- **1つの定義**からバリデーションと型の両方が得られる
- フロント: 送信前に同じスキーマで検証できる
- バック: 受信時に `safeParse` で検証（→ 失敗なら 400）
- スキーマを変えれば、両側の型が同時に追従する

> 「型定義が契約」— ズレようがない仕組みを作る

---

## 発展1: ステータスは「導出」する

- 卓の状態: `draft / open / scheduling / confirmed / today / completed`
- これらを **DB に保存しない**
- 代わりに「事実」から**導出**する
  - `isPublished` / `openUntil` / `scheduledAt` / `completedAt`

> 表現（status）は、サーバー側の事実の投影にすぎない

保存すると事実とズレる余地が生まれる。事実だけを持つ。

---

## 発展2: 状態遷移は専用サブリソース

- 状態変更を通常の PATCH に混ぜず、専用の URL に分ける

```
PATCH /api/game-sessions/:id         … 内容の更新（タイトル等）
PATCH /api/game-sessions/:id/status  … 状態遷移専用
```

- 「何を変えるのか」が URL で明確になる
- 遷移ルールのバリデーションもここに集約できる

---

## 発展3: 動詞的な操作の表し方

- REST は名詞（リソース）中心だが、「確定する」等の動詞も必要
- **サブリソースへの POST** で表現する

```
POST /api/game-sessions/:id/availability-dates/:dateId/confirm
```

- 「confirm というアクション（リソース）を作る」と捉える
- URL に動詞をベタ書き（`/confirmDate`）するより一貫性が保てる

---

## 発展4: 冪等性 — POST と PUT

- **冪等（idempotent）**: 何回実行しても結果が同じ
- taku-biyori の候補日での使い分け:

```
POST /.../availability-dates   … 1件追加（呼ぶたび増える＝非冪等）
PUT  /.../availability-dates   … 全件置換（何回でも同じ＝冪等）
PUT  /.../:dateId/responses    … 自分の回答を登録/更新（冪等）
```

- 「追加」は POST、「置換・更新」は PUT が基本

---

## 発展5: 認証の入口を分ける

- 通常ユーザー: **Cookie セッション**で認証
- ゲスト: **Guest-Token ヘッダー**で認証（別エンドポイント）

```
POST /api/game-sessions/:id/members        … 通常ユーザー参加
POST /api/game-sessions/:id/guest-members  … ゲスト参加
```

- 認証方式ごとに入口を分け、各処理をシンプルに保つ
- ステートレスの原則どおり、毎回「誰か」を伝える

---

## 発展6: エラーの優先順位

```ts
// sessionNotOpen を alreadyJoined より先にチェックする。
// セッションが非公開の場合でも alreadyJoined (409) を返すのは不適切なため、
// ステータス不一致を先に検出して 422 を返す。
```

- 複数のエラー条件が同時に起こりうる
- **どれを先に返すか**まで設計する
- 情報を漏らさない・利用者を混乱させない順序を選ぶ

---

## 発展7: レイヤ分離

- **application 層**: 判別ユニオンで結果を返す（HTTP を知らない）

```ts
{ type: 'notFound' } | { type: 'forbidden' } | { type: 'conflict' } | ...
```

- **presentation 層**: それを HTTP ステータスに翻訳する

```ts
if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
```

> 業務ロジックは HTTP を知らない。翻訳は端（presentation）だけが担う。

---

## レイヤ分離のうれしさ

- 業務ロジックを HTTP から切り離せる
  - テストしやすい（HTTP を立てずに `type` を検証）
  - 別の入口（gRPC・CLI 等）にも再利用しやすい
- 「404 を返すか」は業務の関心事ではなく、Web 表現の関心事
- 関心事を分けることで、変更に強くなる

---

## まとめ (1/2)

- API は「入力と出力の契約」
- REST の4本柱: **リソース / URL / HTTP メソッド / ステートレス**
- URL = 対象（名詞・複数形・ネスト）、メソッド = 動作
- ステータスコードは「意味」で使い分ける
  - 401 と 403、400 と 422 の違いを意識する

---

## まとめ (2/2)

- 契約は Zod スキーマで共有し、型のズレをなくす
- 発展トピック:
  - 状態は保存せず**導出**する
  - 状態遷移・動詞操作は**サブリソース**で表す
  - POST と PUT を**冪等性**で使い分ける
  - 業務ロジックは HTTP を知らない（**レイヤ分離**）

---

## おわりに

- まずは taku-biyori の `game-session-route.ts` を読んでみよう
- 「このエンドポイントはどのリソース？ どのメソッド？ なぜこのコード？」
  を1つずつ問いながら読むと理解が深まる
- REST は「絶対のルール」ではなく「一貫性のための指針」
- 迷ったら「リソースとして素直か」に立ち返る

ご清聴ありがとうございました 🎲
