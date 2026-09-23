import { defineConfig } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

import { ignoresConfig, importsConfig, javascriptConfig, typescriptConfig } from './base.mjs'
import prettierConfig from './prettier.mjs'

const reactLibraryConfig = defineConfig(
  ignoresConfig,
  javascriptConfig,
  typescriptConfig,
  {
    name: '@raulscoelho/eslint/react-library',
    files: ['**/*.{js,jsx,mjs,cjs}', '**/*.{ts,tsx,mts,cts}'],
    extends: [reactHooks.configs.flat.recommended]
  },
  {
    name: '@raulscoelho/eslint/react-library/browser',
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['**/*.config.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser
    }
  },
  importsConfig,
  prettierConfig
)

export default reactLibraryConfig
