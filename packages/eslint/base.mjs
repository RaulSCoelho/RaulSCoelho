import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintPluginImport from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

import prettierConfig from './prettier.mjs'

export const ignoresConfig = globalIgnores([
  '**/dist/',
  '**/build/',
  '**/.next/',
  '**/out/',
  '**/.turbo/',
  '**/coverage/',
  '**/next-env.d.ts'
])

export const javascriptConfig = {
  name: '@raulscoelho/eslint/javascript',
  files: ['**/*.{js,jsx,mjs,cjs}'],
  extends: [js.configs.recommended],
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true
      }
    }
  }
}

export const typescriptConfig = {
  name: '@raulscoelho/eslint/typescript',
  files: ['**/*.{ts,tsx,mts,cts}'],
  extends: [js.configs.recommended, tseslint.configs.recommended]
}

/** @type {import('eslint').Linter.RulesRecord} */
export const importRules = {
  'import/no-duplicates': ['error', { 'prefer-inline': true }],
  'import/order': [
    'warn',
    {
      groups: [
        ['builtin', 'external', 'internal'],
        ['parent', 'sibling', 'index']
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }
  ]
}

export const importsConfig = {
  name: '@raulscoelho/eslint/imports',
  files: ['**/*.{js,jsx,mjs,cjs}', '**/*.{ts,tsx,mts,cts}'],
  plugins: {
    import: eslintPluginImport
  },
  rules: importRules
}

const baseConfig = defineConfig(ignoresConfig, javascriptConfig, typescriptConfig, importsConfig, prettierConfig)

export default baseConfig
