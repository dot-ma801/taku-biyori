#!/usr/bin/env node
// コミット前チェック。.github/workflows/ci.yml と同じ検証をローカルでまとめて走らせる。
// 既定は自動修正あり（format --write / lint --fix）。--ci で検査のみに切り替わる。
import { spawnSync } from 'node:child_process';

const ciMode = process.argv.includes('--ci');
const packages = ['shared', 'backend', 'frontend'];
const name = (pkg) => `@taku-biyori/${pkg}`;

const dbHint = [
  'テスト DB が未作成なら pnpm --filter @taku-biyori/backend db:test:setup を実行する。',
  'それでも落ちるなら PostgreSQL が起動しているか確認する（pg_isready）。',
].join('\n  ');

const steps = [
  { label: 'build (shared)', args: ['--filter', name('shared'), 'build'] },
  ...packages.map((pkg) => ({
    label: `format (${pkg})`,
    args: ['--filter', name(pkg), ciMode ? 'format:check' : 'format'],
  })),
  ...packages.map((pkg) => ({
    label: `lint (${pkg})`,
    args: ['--filter', name(pkg), ciMode ? 'lint:check' : 'lint'],
  })),
  { label: 'typecheck (backend)', args: ['--filter', name('backend'), 'typecheck'] },
  { label: 'typecheck (frontend)', args: ['--filter', name('frontend'), 'type-check'] },
  { label: 'test (backend)', args: ['--filter', name('backend'), 'test'], hint: dbHint },
  { label: 'test (frontend)', args: ['--filter', name('frontend'), 'test'] },
];

// vitest はローカルだと watch で止まるため、CI と同じ 1 回実行にそろえる。
const env = { ...process.env, CI: 'true' };

for (const step of steps) {
  console.log(`\n▶ ${step.label}`);
  const result = spawnSync('pnpm', step.args, { stdio: 'inherit', shell: true, env });
  if (result.status !== 0) {
    console.error(`\n✖ ${step.label} で失敗しました`);
    if (step.hint) {
      console.error(`  ${step.hint}`);
    }
    process.exit(result.status ?? 1);
  }
}

console.log('\n✔ すべて通過しました');
