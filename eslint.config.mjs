import js from '@eslint/js'
import globals from 'globals'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import perfectionistPlugin from 'eslint-plugin-perfectionist'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

export default [
  {
    ignores: ['**/dist/', '**/node_modules/', '**/eslint.config.mjs']
  },
  js.configs.recommended,
  prettierRecommended,
  perfectionistPlugin.configs['recommended-line-length'],
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
      sourceType: 'module',
      ecmaVersion: 'latest'
    },
    plugins: {
      'react-refresh': reactRefreshPlugin,
      'react-hooks': reactHooksPlugin
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'prettier/prettier': [
        'error',
        { trailingComma: 'none', singleQuote: true, printWidth: 120, tabWidth: 2, semi: false }
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal', 'parent', 'sibling', 'type']
          ],
          newlinesBetween: 1,
          type: 'line-length',
          order: 'asc'
        }
      ],
      'perfectionist/sort-objects': ['error', { partitionByComment: true, type: 'line-length', order: 'desc' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'perfectionist/sort-modules': 'off',
      'perfectionist/sort-classes': 'off',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
    }
  }
]