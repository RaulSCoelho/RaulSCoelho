import { defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

import { ignoresConfig, importRules, javascriptConfig } from './base.mjs'
import prettierConfig from './prettier.mjs'

const nextConfig = defineConfig(
  ignoresConfig,
  javascriptConfig,
  nextVitals,
  nextTs,
  {
    name: '@raulscoelho/eslint/next/imports',
    files: ['**/*.{js,jsx,mjs,cjs}', '**/*.{ts,tsx,mts,cts}'],
    rules: importRules
  },
  prettierConfig
)

export default nextConfig
