# @raulscoelho/typescript

Configurações de TypeScript para projetos Node.js, com bundler, Next.js e bibliotecas React.
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
| `@raulscoelho/typescript/node` | Node.js 24+, ES2024, módulos NodeNext e tipos de Node, sem DOM |
| `@raulscoelho/typescript/next` | Base com JSX, DOM, tipos de Node.js, cache incremental e plugin do Next.js |
| `@raulscoelho/typescript/react-library` | Base com JSX, DOM e verificações de código não utilizado e fallthrough em `switch` |

Todos incluem `noEmit`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax` e `skipLibCheck`. Defina `include`, `exclude` e as opções próprias
do projeto no seu arquivo.

### Node.js

Para aplicações, CLIs e bibliotecas executadas no Node.js 24+:

```sh
pnpm add -D @types/node@^24
```

```json
{
  "extends": "@raulscoelho/typescript/node",
  "include": ["src"]
}
```

O preset inclui tipos de Node, imports JSON e verificações de variáveis e parâmetros não
utilizados e de fallthrough em `switch`. Os tipos de navegador, como `document`, ficam de fora.
Use a versão de `@types/node` correspondente ao Node do projeto.

Para ESM, declare `"type": "module"` no `package.json`. Ao compilar `.ts` para `.js`,
escreva imports relativos com a extensão de saída: `import { run } from "./run.js"`.
Imports JSON em ESM precisam de `with { type: "json" }`.

Para gerar JavaScript, acrescente ao `tsconfig.json`:

```json
"compilerOptions": {
  "noEmit": false,
  "rootDir": "src",
  "outDir": "dist"
}
```

Execute `pnpm exec tsc -p tsconfig.json` e depois `node dist/index.js`, considerando
`src/index.ts` como entrada. Para uma biblioteca, adicione também `"declaration": true`.

Para verificar JavaScript existente, como `.mjs`, use `"allowJs": true` e `"checkJs": true`
em `compilerOptions`, mantendo `noEmit` habilitado.

O formato dos módulos segue o `package.json` e as extensões dos arquivos. Com
`verbatimModuleSyntax`, imports ESM não são convertidos em `require`; código CommonJS
em `.cts` deve usar a sintaxe correspondente, como `import fs = require("node:fs")`.
`NodeNext` acompanha a versão do TypeScript utilizada. Este preset foi validado com TypeScript 6.0.3.

Executar `.ts` diretamente no Node é outro fluxo: exige imports com extensão `.ts` e
configuração para a remoção nativa de tipos. Veja a [documentação do Node.js](https://nodejs.org/api/typescript.html).

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
