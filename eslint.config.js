import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Bug-catching rules are errors (undefined names, broken hook rules, unreachable code, duplicate keys).
// Style and "React compiler" advice rules are warnings so they show up without blocking a merge.
const advice = Object.fromEntries(
  Object.keys(reactHooks.configs.flat.recommended.rules)
    .filter((r) => !['react-hooks/rules-of-hooks'].includes(r))
    .map((r) => [r, 'warn']),
)

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'android', '.wrangler', 'public']),
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...advice,
      'react-refresh/only-export-components': 'off',
      // These sanitisers strip control and odd characters on purpose.
      'no-control-regex': 'off',
      'no-misleading-character-class': 'off',
      'no-irregular-whitespace': 'warn',
      'no-useless-escape': 'warn',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^(_|[A-Z])', ignoreRestSiblings: true }],
    },
  },
  { files: ['tests/**', 'rules-tests/**', 'e2e/**', 'scripts/**'], languageOptions: { globals: { ...globals.node, ...globals.browser, ...globals.vitest } } },
])
