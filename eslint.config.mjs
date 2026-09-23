import baseConfig from '@raulscoelho/eslint/base'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig(globalIgnores(['**/template/**', 'artifacts/**']), baseConfig, {
  files: ['**/*.{js,mjs,cjs}'],
  languageOptions: { globals: globals.node }
})
