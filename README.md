# たく日和

マーダーミステリー・TRPG 向けのセッション管理・卓建て補助 Web アプリです。

## API ドキュメント

**[https://dot-ma801.github.io/taku-biyori/api-doc/](https://dot-ma801.github.io/taku-biyori/api-doc/)**

ブランチごとの Redoc / Swagger UI へのリンクをまとめたページです。`docs/openapi.yml` を変更して push すると自動更新されます。

## 技術スタック

- **パッケージマネージャ**: pnpm (monorepo)
- **Frontend**: Vue 3 + TypeScript + Vite
  - ルーティング: Vue Router
  - 状態管理: Pinia
  - 認証: Better Auth（ソーシャルログインのみ）
  - テスト: Vitest (unit) + Playwright (e2e)
  - リント: ESLint (oxlint) + Prettier
- **Backend**: Hono.js + TypeScript
  - ORM: Drizzle ORM
  - 認証: Better Auth
  - DB: PostgreSQL（Neon）
  - テスト: Vitest
- **Shared**: フロントエンド・バックエンド共通型定義 (Zod)
- **デプロイ**: Vercel

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

### 2. 環境変数の設定

#### .env

各パッケージの `.env.example` をコピーして `.env` を作成し、必要な値を設定してください。

**Backend** (`packages/backend/.env`):
```
DATABASE_URL=postgresql://...
PORT=3000
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

**Frontend** (`packages/frontend/.env`):
```
VITE_API_URL=http://localhost:3000
```

#### その他

プロジェクトルート直下の、`.mcp.json.example` をコピーし、`.mcp.json` を作成し`packages/backend/.env` にて設定した DB の情報に揃える。

### 3. データベースマイグレーション

```bash
pnpm --filter @taku-biyori/backend db:generate
pnpm --filter @taku-biyori/backend db:migrate
```

### 4. 開発サーバーの起動

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 各パッケージのコマンド

### Frontend (`packages/frontend`)

```bash
pnpm --filter @taku-biyori/frontend dev        # 開発サーバー
pnpm --filter @taku-biyori/frontend build      # ビルド
pnpm --filter @taku-biyori/frontend test:unit  # ユニットテスト
pnpm --filter @taku-biyori/frontend test:e2e   # E2E テスト
pnpm --filter @taku-biyori/frontend lint
pnpm --filter @taku-biyori/frontend format
```

### Backend (`packages/backend`)

```bash
pnpm --filter @taku-biyori/backend dev              # 開発サーバー
pnpm --filter @taku-biyori/backend build            # ビルド
pnpm --filter @taku-biyori/backend test             # 全テスト
pnpm --filter @taku-biyori/backend test:unit        # ユニットテスト
pnpm --filter @taku-biyori/backend test:integration # インテグレーションテスト
pnpm --filter @taku-biyori/backend db:generate      # マイグレーションファイル生成
pnpm --filter @taku-biyori/backend db:migrate       # マイグレーション実行
```

### Shared (`packages/shared`)

```bash
pnpm --filter @taku-biyori/shared build  # ビルド（backend テスト前に必要）
pnpm --filter @taku-biyori/shared dev    # ファイル監視モード
```

## 認証（Better Auth）

Google OAuth によるソーシャルログインのみサポートしています。

### Google OAuth の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. OAuth 2.0 認証情報を生成
3. リダイレクト URI に `http://localhost:3000/api/auth/callback/google` を追加
4. 環境変数 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を設定

### 認証 API エンドポイント

- `POST /api/auth/signout` — ログアウト
- `GET /api/auth/session` — セッション情報取得
- `POST /api/auth/signin/social` — ソーシャルログイン
