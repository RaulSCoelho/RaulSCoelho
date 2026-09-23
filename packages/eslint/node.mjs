import { defineConfig } from 'eslint/config'
import globals from 'globals'

import baseConfig from './base.mjs'

const nodeConfig = defineConfig(baseConfig, {
  name: '@raulscoelho/eslint/node',
  files: ['**/*.{js,jsx,mjs,cjs}', '**/*.{ts,tsx,mts,cts}'],
  languageOptions: {
    globals: globals.node
  }
})

export default nodeConfig
