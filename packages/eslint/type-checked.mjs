import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

import baseConfig from './base.mjs'

const typeCheckedConfig = defineConfig(baseConfig, {
  name: '@raulscoelho/eslint/type-checked',
  files: ['**/*.{ts,tsx,mts,cts}'],
  extends: [tseslint.configs.recommendedTypeChecked]
})

export default typeCheckedConfig
