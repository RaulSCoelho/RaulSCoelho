# @raulscoelho/typescript

Presets de `tsconfig.json` para TypeScript, Next.js e bibliotecas React, com tipagem estrita e resolução de módulos para bundlers.

## Instalação

```sh
pnpm add -D @raulscoelho/typescript typescript@~6.0.3
```

## Uso

Estenda o preset no `tsconfig.json`:

```json
{
  "extends": "@raulscoelho/typescript/base",
  "include": ["src"]
}
```

Adicione o script ao `package.json` e execute `pnpm typecheck`:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

## Presets

| Valor de `extends` | Configuração |
| --- | --- |
| `@raulscoelho/typescript/base` | Modo estrito, alvo ES2023, módulos preservados e resolução por bundler |
| `@raulscoelho/typescript/next` | Base com JSX, DOM, tipos de Node.js, compilação incremental e plugin do Next.js |
| `@raulscoelho/typescript/react-library` | Base com JSX, DOM e verificações de código não utilizado e fallthrough em `switch` |

Todos usam `noEmit: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` e `skipLibCheck`. Defina `include`, `exclude` e as opções específicas da aplicação no seu `tsconfig.json`.

### Next.js

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

Use em uma aplicação com Next.js, React e os tipos `@types/node`, `@types/react` e `@types/react-dom` instalados.

### Bibliotecas React

```json
{
  "extends": "@raulscoelho/typescript/react-library",
  "include": ["src"]
}
```

A biblioteca precisa de React e `@types/react`. Se usar React DOM, inclua também `@types/react-dom`.

## Emissão de declarações

Para gerar arquivos `.d.ts`, habilite a emissão no `tsconfig.json`:

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

Execute `pnpm exec tsc -p tsconfig.json`. Esse exemplo emite apenas declarações; a geração de JavaScript fica a cargo da ferramenta de build da biblioteca.
