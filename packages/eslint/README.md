# @raulscoelho/eslint

Configurações de ESLint para JavaScript, TypeScript, Node.js, React e Next.js, com regras de imports e formatação pelo Prettier.

## Instalação

```sh
pnpm add -D @raulscoelho/eslint eslint@^9.22.0 typescript@~6.0.3 prettier@^3.0.0
```

Compatível com ESLint 9, Prettier 3 e TypeScript `>=5.0.0 <6.1.0`. Os plugins internos são instalados junto com o pacote.

## Uso

Crie um `eslint.config.mjs`:

```js
import baseConfig from '@raulscoelho/eslint/base'

export default baseConfig
```

Adicione os scripts ao `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

Execute `pnpm lint` para verificar o código e `pnpm lint:fix` para aplicar correções.

## Presets

Escolha o subpath no import, como `@raulscoelho/eslint/node`:

| Preset | Configuração | Dependência adicional |
| --- | --- | --- |
| `base` | JavaScript, TypeScript, imports e Prettier; sem globals de ambiente | — |
| `node` | Base com globals do Node.js | — |
| `next` | Next.js, Core Web Vitals, TypeScript, imports e Prettier | `eslint-config-next@^16.0.0` |
| `react-library` | React Hooks, TypeScript, imports, Prettier e globals de navegador em `src/` | `eslint-plugin-react-hooks@^7.0.0` |
| `type-checked` | Base com regras que dependem de informações de tipos | — |
| `prettier` | Integração e opções de formatação do Prettier | — |

Instale a dependência adicional do preset escolhido com `pnpm add -D`. Cada preset pode ser usado diretamente como configuração. Em `react-library`, os globals de navegador se aplicam a `.js`, `.jsx`, `.ts` e `.tsx` em `src/`, exceto arquivos `*.config.*`.

### Análise com tipos

O preset `type-checked` precisa do serviço de projetos do TypeScript:

```js
import typeCheckedConfig from '@raulscoelho/eslint/type-checked'
import { defineConfig } from 'eslint/config'

export default defineConfig(typeCheckedConfig, {
  files: ['**/*.{ts,tsx,mts,cts}'],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  }
})
```

Os arquivos analisados devem pertencer ao `tsconfig.json` da aplicação. Configure os globals de ambiente conforme necessário.

## Personalização

Acrescente regras e exclusões depois do preset:

```js
import baseConfig from '@raulscoelho/eslint/base'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig(baseConfig, globalIgnores(['generated/**']), {
  files: ['**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn'
  }
})
```

## Formatação

Os presets incluem aspas simples, ausência de ponto e vírgula e vírgulas finais, indentação de dois espaços, largura de 120 caracteres e finais de linha LF.

As classes Tailwind são ordenadas também nas funções `cva`, `cn`, `clsx`, `classNames`, `cx`, `tv` e `twMerge`. A formatação é aplicada por `pnpm lint:fix`.
