import sharedEslintConfig, {
  sharedTypeScriptEslintConfig,
} from '../shared/eslint.config.mjs';
import pluginVitest from '@vitest/eslint-plugin';
import pluginOxlint from 'eslint-plugin-oxlint';

export default [
  ...sharedEslintConfig,
  ...sharedTypeScriptEslintConfig,
  {
    files: ['src/**/*.{ts,mts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['./*', '../*'],
        },
      ],
    },
  },
  {
    files: ['test/**/*.{test,spec}.{ts,mts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['./*', '../*', '../../*'],
        },
      ],
    },
  },
  {
    ...pluginVitest.configs.recommended,
    files: [
      'test/**/*.{test,spec}.{ts,mts,tsx}',
      'src/**/__tests__/**/*.{ts,mts,tsx}',
    ],
  },
  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
];
