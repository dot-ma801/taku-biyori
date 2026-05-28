# app-template

このリポジトリは、フルスタック Web アプリケーション開発用のテンプレートです。

> **セットアップ時の注意**: `app-template` を文字列検索して、プロジェクト名に書き換えてください。

## 技術スタック

- **パッケージマネージャ**: pnpm (monorepo)
- **Frontend**: Vue 3 + TypeScript + Vite
  - ルーティング: Vue Router
  - 状態管理: Pinia
  - 認証: Better Auth
  - テスト: Vitest (unit) + Playwright (e2e)
  - リント: ESLint (oxlint) + Prettier
- **Backend**: Hono.js + TypeScript
  - ORM: Drizzle
  - 認証: Better Auth
  - DB: PostgreSQL
  - テスト: Vitest
- **Shared**: 共通型・スキーマ定義 (Zod)

## プロジェクト構成

```
packages/
├── frontend/     # Vue 3 フロントエンドアプリケーション
├── backend/      # Hono.js バックエンドサーバー
└── shared/       # 共通型定義・スキーマ (frontend/backend で共有)
```

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. PostgreSQL の起動（Docker）

```bash
docker compose up -d
```

### 3. データベースマイグレーション

```bash
cd packages/backend

# マイグレーションファイルを生成
pnpm db:generate

# マイグレーションを実行
pnpm db:migrate
```

### 4. 環境変数の設定

各パッケージの `.env.example` をコピーして `.env` を作成し、必要な値を設定してください。

**Backend** (`packages/backend/.env`):
```bash
cp .env.example .env
# 必要に応じて編集
```

**Frontend** (`packages/frontend/.env`):
```bash
cp .env.example .env
# 必要に応じて編集
```

### 5. 開発サーバーの起動

```bash
# 全パッケージの開発サーバーを起動
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### 6. ビルド

```bash
pnpm build
```

### 7. テスト実行

```bash
# 全パッケージのテストを実行
pnpm test

# ユニットテストのみ
pnpm test

# カバレッジ付きテスト
pnpm test:coverage
```

## 各パッケージの詳細

### Frontend (`packages/frontend`)

Vue 3 + Vite で構築されたフロントエンドアプリケーション。

```bash
cd packages/frontend

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# ユニットテスト
pnpm test:unit

# E2E テスト
pnpm test:e2e

# リント・フォーマット
pnpm lint
pnpm format
```

### Backend (`packages/backend`)

Hono.js で構築されたバックエンドサーバー。

```bash
cd packages/backend

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test
pnpm test:unit
pnpm test:integration
```

### Shared (`packages/shared`)

Frontend と Backend で共有する型定義・スキーマ。Zod を使用しています。

```bash
cd packages/shared

# ビルド
pnpm build

# 開発モード（ファイル監視）
pnpm dev
```

## 認証（Better Auth）

このテンプレートには Better Auth によるソーシャルログイン機能が組み込まれています。

### Google OAuth の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. OAuth 2.0 認証情報を生成
3. リダイレクト URI に `http://localhost:3000/api/auth/callback/google` を追加
4. 環境変数を設定：

**Backend** (`packages/backend/.env`):
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

5. `packages/backend/src/auth.ts` の `socialProviders` セクションをコメント解除

### 認証 API エンドポイント

- `POST /api/auth/signin/email` — メール/パスワードでログイン
- `POST /api/auth/signup/email` — メール/パスワードで登録
- `POST /api/auth/signout` — ログアウト
- `GET /api/auth/session` — セッション情報取得
- `POST /api/auth/signin/social` — ソーシャルログイン

## 環境変数

各パッケージのルートに `.env` ファイルを作成して環境変数を設定してください。

**Backend 例** (`packages/backend/.env`):
```
DATABASE_URL=postgresql://app:password@localhost:5432/app_template
PORT=3000
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**Frontend 例** (`packages/frontend/.env`):
```
VITE_API_URL=http://localhost:3000
```

## 開発ワークフロー

1. **共通型の定義**: `packages/shared/src/index.ts` に型・スキーマを定義
2. **Backend 実装**: `packages/backend/src/` に API エンドポイントを実装
3. **Frontend 実装**: `packages/frontend/src/` に UI コンポーネントを実装
4. **テスト**: 各パッケージでテストを作成・実行
5. **ビルド・デプロイ**: `pnpm build` でビルド後、デプロイ
