import { defineConfig } from 'eslint/config'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

const prettierConfig = defineConfig(
  {
    ...prettierRecommended,
    name: '@raulscoelho/eslint/prettier/recommended'
  },
  {
    name: '@raulscoelho/eslint/prettier/options',
    files: ['**/*.{js,jsx,mjs,cjs}', '**/*.{ts,tsx,mts,cts}'],
    rules: {
      'prettier/prettier': [
        'error',
        {
          semi: false,
          singleQuote: true,
          arrowParens: 'avoid',
          trailingComma: 'none',
          endOfLine: 'lf',
          printWidth: 120,
          tabWidth: 2,
          plugins: [import.meta.resolve('prettier-plugin-tailwindcss')],
          tailwindFunctions: ['cva', 'cn', 'clsx', 'classNames', 'cx', 'tv', 'twMerge']
        }
      ]
    }
  }
)

export default prettierConfig
