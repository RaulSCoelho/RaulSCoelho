# @raulscoelho/typescript

Configurações de TypeScript para projetos com bundler, Next.js e bibliotecas React.
Ativam a checagem estrita e, por padrão, verificam o código sem gerar arquivos.

## Instalar e usar

```sh
pnpm add -D @raulscoelho/typescript typescript@~6.0.3
```

Crie `tsconfig.json` apontando para os arquivos do projeto:

```json
{
  "extends": "@raulscoelho/typescript/base",
  "include": ["src"]
}
```

Adicione `"typecheck": "tsc --noEmit"` aos `scripts` do `package.json` e execute:

```sh
pnpm typecheck
```

## Escolher o preset

| Valor de `extends` | Configuração |
| --- | --- |
| `@raulscoelho/typescript/base` | Modo estrito, alvo ES2023, módulos preservados e resolução por bundler |
| `@raulscoelho/typescript/next` | Base com JSX, DOM, tipos de Node.js, cache incremental e plugin do Next.js |
| `@raulscoelho/typescript/react-library` | Base com JSX, DOM e verificações de código não utilizado e fallthrough em `switch` |

Todos incluem `noEmit`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax` e `skipLibCheck`. Defina `include`, `exclude` e as opções próprias
do projeto no seu arquivo.

### Next.js

Em uma aplicação com Next.js, React e os tipos `@types/node`, `@types/react` e `@types/react-dom`:

```json
{
  "extends": "@raulscoelho/typescript/next",
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### Biblioteca React

Em uma biblioteca com React e `@types/react` instalados:

```json
{
  "extends": "@raulscoelho/typescript/react-library",
  "include": ["src"]
}
```

Se usar React DOM, instale também seus tipos, `@types/react-dom`.

## Gerar declarações de tipos

Para emitir `.d.ts`, sobrescreva `noEmit` e configure a saída:

```json
{
  "extends": "@raulscoelho/typescript/react-library",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Execute `pnpm exec tsc -p tsconfig.json`. As declarações serão geradas em `dist/`.
Esse exemplo não gera JavaScript; configure a ferramenta de build da biblioteca para isso.
