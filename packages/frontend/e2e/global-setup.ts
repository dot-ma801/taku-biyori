import { execSync } from 'node:child_process';

/**
 * e2e はブラウザから実 DB に書き込むため、毎回シードで初期状態に戻してから走らせる。
 * これが無いと、卓を作るテストや回答を書き換えるテストが2回目から前提を失う。
 */
export default function globalSetup() {
  execSync('pnpm --filter @taku-biyori/backend db:e2e:setup', {
    stdio: 'inherit',
  });
}
