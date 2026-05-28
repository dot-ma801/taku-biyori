import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import skipFormatting from 'eslint-config-prettier/flat';

export const sharedEslintBaseConfig = [
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),
  skipFormatting,
];

export const sharedTypeScriptEslintConfig = [...tseslint.configs.recommended];

export default sharedEslintBaseConfig;
