# @raulscoelho/eslint

Configurações de ESLint para JavaScript, TypeScript, Node.js, React e Next.js.
Inclui regras de imports e formatação, aplicadas pelo próprio ESLint.

## Instalar e usar

```sh
pnpm add -D @raulscoelho/eslint eslint@^9.22.0 typescript@~6.0.3 prettier@^3.0.0
```

Os plugins internos vêm com o pacote. As versões aceitas são ESLint 9, Prettier 3 e
TypeScript `>=5.0.0 <6.1.0`.

Crie `eslint.config.mjs`:

```js
import config from '@raulscoelho/eslint/base'

export default config
```

Adicione ao `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

Use `pnpm lint` para verificar e `pnpm lint:fix` para corrigir e formatar.

## Escolher a configuração

Troque o final do import pelo preset adequado. Para um projeto Node.js, por exemplo,
use `@raulscoelho/eslint/node`.

| Preset | Quando usar | Instalação adicional |
| --- | --- | --- |
| `base` | JS/TS com imports e formatação, sem globais de ambiente | — |
| `node` | Base com globais como `process` e `Buffer` | — |
| `next` | Next.js com Core Web Vitals e TypeScript | `pnpm add -D eslint-config-next@^16` |
| `react-library` | Bibliotecas React com Hooks e globais de navegador | `pnpm add -D eslint-plugin-react-hooks@^7` |
| `type-checked` | Regras que precisam conhecer os tipos do projeto | Configuração abaixo |
| `prettier` | Somente integração e opções de formatação | — |

Cada preset pode ser usado diretamente como configuração. Em `react-library`, os globais de
navegador valem para JS/TS em `src/`, exceto arquivos `*.config.*`.

### Verificações que usam tipos

Crie um `tsconfig.json` que inclua os arquivos analisados e habilite o serviço de projetos:

```js
import config from '@raulscoelho/eslint/type-checked'
import { defineConfig } from 'eslint/config'

export default defineConfig(config, {
  files: ['**/*.{ts,tsx,mts,cts}'],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  }
})
```

Esse preset usa a base; acrescente globais de Node.js ou navegador se o projeto precisar.

## Personalizar

Acrescente exclusões e regras depois do preset:

```js
import config from '@raulscoelho/eslint/node'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig(config, globalIgnores(['generated/**']), {
  rules: { 'no-console': 'warn' }
})
```

## Formatação incluída

Os presets usam aspas simples, dois espaços, linhas de até 120 caracteres e finais LF,
sem ponto e vírgula ou vírgulas finais. `pnpm lint:fix` aplica essas opções.

Também ordenam classes Tailwind, inclusive nas funções `cva`, `cn`, `clsx`, `classNames`,
`cx`, `tv` e `twMerge`. Essas regras já estão configuradas no preset.
