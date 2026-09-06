// UI 移行のガードレール。
// 色は必ず variables.css のトークン（var(--color-*) / var(--shadow-*)）経由で参照する。
// SFC や CSS に生の色リテラルが残っていると、トークンを差し替えても
// そこだけ旧デザインのまま取り残されるため、CI で機械的に落とす。
//
// 逃げ道が必要な行には、同じ行に `raw-color-ok: <理由>` を含むコメントを書く。
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

// トークンそのものを定義する場所と、外部ブランド由来で色が固定されている場所。
const ALLOWED_FILES = new Set([
  'src/style/variables.css',
  // Google のブランドガイドラインで配色が指定されているため、トークン化できない。
  'src/features/user/GoogleLoginButton.vue',
]);

const TARGET_GLOBS = ['src/**/*.vue', 'src/**/*.css'];

// #fff / #ffffff / #ffffffff / rgb() / rgba() / hsl() / hsla()
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/;
const ESCAPE_HATCH = /raw-color-ok:/;

const violations = [];

for (const pattern of TARGET_GLOBS) {
  for (const file of globSync(pattern, { cwd: packageRoot })) {
    const path = file.split('\\').join('/');
    if (ALLOWED_FILES.has(path)) continue;

    const lines = readFileSync(join(packageRoot, file), 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (!RAW_COLOR.test(line)) return;
      if (ESCAPE_HATCH.test(line)) return;
      violations.push({ path, line: index + 1, text: line.trim() });
    });
  }
}

if (violations.length > 0) {
  console.error(
    '生の色リテラルが残っています。variables.css のトークンを参照してください。\n',
  );
  for (const { path, line, text } of violations) {
    console.error(`  ${path}:${line}  ${text}`);
  }
  console.error(
    [
      '',
      `${violations.length} 件`,
      '',
      '対処:',
      '  1. 対応するトークンがある     → var(--color-xxx) に置き換える',
      '  2. 対応するトークンが無い     → variables.css にトークンを足してから参照する',
      '  3. 外部ブランド等で固定が必要 → 同じ行に `raw-color-ok: 理由` のコメントを書く',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

console.log(
  `生の色リテラルは見つかりませんでした（対象: ${TARGET_GLOBS.join(', ')}）`,
);
