# @raulscoelho/script-utils

Utilitários para selecionar arquivos, reunir conteúdo de código e criar fluxos de cópia em CLIs. Requer Node.js 24+ e usa módulos ESM.

## Instalação

```sh
pnpm add @raulscoelho/script-utils
```

## Coleta de arquivos

```js
import { buildClipboard, findFiles } from '@raulscoelho/script-utils/copy/collect'

const root = process.cwd()
const files = await findFiles({ mode: 'all' }, { mode: 'gitignore' }, root)
const result = await buildClipboard(files, root)

console.log(result.output)
```

`findFiles(inclusion, exclusion, root)` retorna os caminhos relativos dos arquivos selecionados. `buildClipboard(files, root)` lê esses arquivos e retorna:

| Campo | Conteúdo |
| --- | --- |
| `output` | Caminho e conteúdo de cada arquivo, separados por linhas em branco |
| `copied` | Quantidade de arquivos incluídos |
| `skipped` | Caminhos dos arquivos ignorados durante a leitura |
| `bytes` | Tamanho do texto final em bytes |

A raiz padrão é `process.cwd()`. Ambas as funções exibem progresso no terminal; a coleta retorna o texto sem escrever na área de transferência.

Para combinar filtros, informe `files`, `folders`, `extensions` ou `globs`. Basta o arquivo corresponder a um dos filtros de inclusão:

```js
const files = await findFiles(
  { files: ['package.json'], extensions: ['ts', 'tsx'] },
  { mode: 'gitignore' }
)
```

## Cópia interativa

```js
import { copy } from '@raulscoelho/script-utils/copy'

await copy()
```

`copy({ root })` conduz a seleção e escreve o resultado na área de transferência. Requer terminal interativo e suporte ao clipboard no sistema. Ao cancelar um prompt, o processo é encerrado com código `0`.

## Outros módulos

| Importação | Funções |
| --- | --- |
| `@raulscoelho/script-utils/copy/choices` | `chooseInclusion`, `chooseExclusion`, `discoverIgnoreFiles` |
| `@raulscoelho/script-utils/lib/cli` | `ask`, `splitList`, `formatBytes` |
| `@raulscoelho/script-utils/lib/paths` | `withinRoot`, `isNodeModulesPath`, `isGitMetadataPath` |

## Limites

`node_modules` é sempre excluído. A busca aceita até 10.000 arquivos. A leitura ignora links simbólicos, binários, arquivos que não sejam UTF-8 e arquivos acima de 2 MiB; o texto final é limitado a 20 MiB.
