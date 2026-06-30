# ADR 0004: メールアドレス不要の userid + password 認証を採用する

## Status

Proposed

## Context

たく日和は当初、Better Auth のソーシャルログイン（Google OAuth）のみを認証手段として想定していた。
しかし Google アカウントを持たないユーザーへの対応や、開発・テスト時の手軽さを考慮し、
メールアドレス不要の識別子（userid）＋パスワードによる認証を追加することになった。

Better Auth は `emailAndPassword` プラグインによるメール＋パスワード認証をサポートしているが、
ここでは**メールアドレスを一切ユーザーに入力させない**方針を取る。

### 解決したい課題

- Google アカウントを持たないユーザーが登録・ログインできない
- 開発・テスト時に毎回 Google OAuth を通すのが煩雑
- ユーザーにメールアドレスを要求したくない（メール通知機能を持たないアプリのため不要な情報収集になる）

### 検討した選択肢

1. **Better Auth `emailAndPassword` をそのまま使う（メール必須）**  
   既存の `/sign-up/email` エンドポイントをそのまま利用。ユーザーにメールアドレスを入力させる。

2. **Better Auth `username` プラグイン ＋ フロントでプレースホルダーメール生成（採用案）**  
   `username` プラグインで userid による sign-in を実現。sign-up 時はフロントが `crypto.randomUUID()@placeholder.local` を自動生成して渡す。ユーザーはメールアドレスを意識しない。

3. **Hono でカスタム sign-up エンドポイントを独自実装**  
   Better Auth の `/sign-up/email` を使わず、Hono ルートでパスワードハッシュ・セッション管理を自前実装する。DB の email カラムを完全に省略できる。

### 各選択肢の評価

| 観点 | 1. メール必須 | 2. username プラグイン（採用案） | 3. カスタム実装 |
|---|---|---|---|
| ユーザー体験 | ✗ メール入力が必要 | ✓ userid のみで完結 | ✓ userid のみで完結 |
| 実装コスト | 低 | 低 | 高（セッション・ハッシュを自前管理） |
| Better Auth との整合性 | ✓ 完全一致 | △ DB に使われない email が残る | ✗ Better Auth の外に認証ロジックが漏れる |
| セキュリティ | ✓ | ✓（UUID メールは推測不可） | △ 実装品質次第 |
| 将来の拡張性 | △ メール通知を追加しやすい | △ email 列を後から活用可能 | ✗ Better Auth との乖離が広がりやすい |

## Decision

**Better Auth の `username` プラグインを採用し、userid + password による認証を実現する。sign-up 時はフロントが `crypto.randomUUID()` ベースのプレースホルダーメールを自動生成して Better Auth の制約を満たす。**

### 1. Better Auth の制約と回避方法

Better Auth の `/sign-up/email` エンドポイントは、フレームワーク内部の Zod スキーマで email フィールドを必須としている。この制約はプラグインフックでは回避できない（フックは Zod バリデーション後に実行される）。

そのため、フロントエンドで `crypto.randomUUID()@placeholder.local` を生成して送信する。UUID を使うことでメールの一意性を保証しつつ、推測不可能にする。

```ts
// SignupCard.vue
signUp.email({
  name: userName.value,                              // 表示名
  email: `${crypto.randomUUID()}@placeholder.local`, // ユーザーには非公開
  password: password.value,
  username: userId.value,                            // ログイン識別子
});
```

### 2. sign-in は username プラグインのエンドポイントを使用

```ts
// LoginCard.vue
signIn.username({ username: userId.value, password: password.value });
```

`username` プラグインが提供する `/sign-in/username` エンドポイントを使い、email を介さずにログインする。

### 3. フロームの入力項目

| フォーム | 入力項目 |
|---|---|
| 新規登録 | ユーザーID（userid）・ユーザー名（表示名）・パスワード |
| ログイン | ユーザーID（userid）・パスワード |

### 4. DBスキーマ変更

`auth.user` テーブルに `username`（ユニーク）・`display_username` カラムを追加。
マイグレーション: `0005_funny_lila_cheney.sql`

```ts
username: text('username').unique(),
displayUsername: text('display_username'),
```

### 5. username プラグイン設定

```ts
username({
  minUsernameLength: 1,
  maxUsernameLength: 50,
  usernameValidator: () => true,  // 日本語・スペースを含む任意の文字列を許可
  usernameNormalization: false,   // 大文字小文字を区別する
})
```

デフォルトのバリデーター（英数字・アンダースコアのみ）は制限が強すぎるため、任意の文字列を許可する。

### 6. autocomplete 属性

パスワードマネージャーが userid を正しく認識できるよう、`autocomplete` 属性を明示する。

| フィールド | autocomplete 値 |
|---|---|
| userid（ログイン） | `username` |
| パスワード（ログイン） | `current-password` |
| userid（登録） | `username` |
| ユーザー名（登録） | `name` |
| パスワード（登録） | `new-password` |

## Consequences

### Positive

- メールアドレスを収集しないことでユーザーの心理的障壁が下がる
- Google アカウント不要で誰でも登録できる
- Better Auth のセッション管理・パスワードハッシュ・プラグインエコシステムをそのまま使い続けられる

### Negative

- DB の `email` カラムに意味のないプレースホルダーデータが入る
  - → アプリ内で `email` カラムを表示・利用する箇所は存在しないため実害なし
- `signIn.email()` エンドポイントは引き続き動作する（使われないが無効化できない）
  - → プレースホルダーメールは UUID ベースで推測不可能なため、実質的な攻撃経路にならない

### Risks

- DB 漏洩時にプレースホルダーメールが露出した場合、理論上 `signIn.email()` 攻撃が可能になる
  - → パスワードは bcrypt でハッシュ化されており、メールが露出してもパスワードが不明なら悪用不可
- `usernameValidator: () => true` により、空文字やスペースのみの userid が登録できてしまう
  - → フロントエンドのバリデーションで制御する。必要に応じてサーバー側バリデーターを追加する

## 決めていないこと

| 項目 | 決めない理由 | いつ決めるか |
|---|---|---|
| パスワードリセット手段 | メールが使えない状態でのリセットフローは別途設計が必要 | パスワード管理機能を追加するとき |
| userid の変更可否 | 現時点でプロフィール設定画面の仕様が未確定 | プロフィール設定を実装するとき |

## Notes

### 参考資料

- [Better Auth username プラグイン ドキュメント](https://www.better-auth.com/docs/plugins/username)
- 関連 ADR: なし
