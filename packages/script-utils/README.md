# @raulscoelho/script-utils

Seleção de arquivos, coleta de código, limpeza, movimentação e cópia para ferramentas Node.js.
As funções de terminal usam Clack; as APIs de planejamento podem ser usadas em outras interfaces.
Requer Node.js 24+ e módulos ESM.

```sh
pnpm add @raulscoelho/script-utils
```

## Reunir conteúdo de arquivos

```js
import { findFiles, buildClipboard } from '@raulscoelho/script-utils/copy/collect'

const root = process.cwd()
const files = await findFiles(
  { folders: ['src'] },
  { mode: 'gitignore' },
  root,
  { quiet: true }
)
const result = await buildClipboard(files, root, { quiet: true })
console.log(result.output)
```

`findFiles` retorna caminhos relativos à raiz. `buildClipboard` reúne os caminhos e conteúdos
em um texto, sem escrever no clipboard. O resultado contém `output`, `copied` (quantidade),
`skipped` (caminhos ignorados) e `bytes`. Omita `quiet: true` para exibir progresso.

A inclusão aceita `files`, `folders`, `extensions` e `globs`, combinados por união.
`{ mode: 'all' }` seleciona todo o projeto. Um nome em `files`, como `package.json`, procura
nas subpastas; um caminho como `apps/web/package.json` seleciona esse arquivo.

Para aplicar o Git e mais exclusões:

```js
const exclusion = {
  mode: 'advanced',
  ignoreMode: 'gitignore',
  globs: ['**/*.test.ts'],
  folders: ['src/generated']
}
```

Para carregar arquivos de regras, use `ignoreMode: 'ignore-files'` e
`ignoreFiles: ['.gitignore', '.copyignore']`. `{ mode: 'none' }` desativa exclusões opcionais.
`node_modules` é sempre excluído.

A seleção aceita até 10.000 arquivos. A leitura ignora binários, links simbólicos, texto que
não seja UTF-8 e arquivos acima de 2 MiB. O texto final tem limite de 20 MiB.

## Mover ou copiar arquivos

```js
import { planMove, executeMove } from '@raulscoelho/script-utils/move'

const plan = await planMove({
  from: ['fotos/praia.jpg'],
  to: 'album',
  copy: true,
  dryRun: true
})
console.table(plan.operations)
await executeMove(plan)
```

Esse exemplo simula uma cópia para `album/praia.jpg`, mantendo o original. Para executar,
gere outro plano sem `dryRun`, revise-o e chame `executeMove` após autorização da sua aplicação.
Sem `copy`, os itens são movidos.

`planMove(options, root)` retorna `operations`, `errors`, `warnings`, `conflicts`, `references`,
`files`, `directories` e `bytes`. O executor recusa planos com erros.

| Opção | Uso |
| --- | --- |
| `from` | Lista de arquivos ou pastas explícitas |
| `to` | Pasta de destino, criada se necessário; `.` permite a raiz |
| `copy` | Manter os originais; padrão `false` |
| `globs`, `extensions` | Selecionar arquivos em lote |
| `exclude`, `ignoreFiles` | Excluir caminhos/globs ou ler arquivos de regras |
| `gitignore` | Aplicar o Git à seleção em lote; padrão `true` |
| `rename` | Novo nome para uma única origem |
| `preserveTree`, `flatten` | Preservar caminhos ou reunir arquivos; incompatíveis entre si |
| `onConflict` | `error` (padrão), `skip`, `rename` ou `overwrite` com backup |
| `dryRun` | Simular sem alterar arquivos |

`normalizeMove(options)` retorna os valores normalizados. O padrão mantém o nome de origens
explícitas e preserva os caminhos de seleções em lote. Todos os caminhos são relativos à raiz,
que por padrão é `process.cwd()`.

### Histórico e reversão

```js
import { readHistory, planUndo, executeUndo } from '@raulscoelho/script-utils/move'

console.log(await readHistory())
const plan = await planUndo()
console.table(plan.operations)
await executeUndo(plan, { dryRun: true })
```

`planUndo(root)` prepara a reversão do último registro pendente. Movimentações voltam à origem;
cópias são removidas sem apagar os originais. Sobrescritas restauram o backup. Conteúdo alterado
ou caminhos ocupados bloqueiam a reversão. Cópias exigem que o original também continue intacto.

`executeMove(plan, options)` e `executeUndo(plan, options)` aceitam `signal` e
`onProgress(completed)`. Planos são imutáveis, consumidos na execução e válidos somente no processo
que os criou. Os executores não pedem confirmação; essa autorização cabe à aplicação chamadora.

Preserve `.repomove/`, onde ficam histórico e backups. Consulte os
[exemplos e limites do RepoMove](https://github.com/RaulSCoelho/RaulSCoelho/tree/main/packages/repomove#histórico-e-desfazer)
para recuperação após falhas.

Com `contents: true`, `from` e `globs` selecionam pastas e transferem seu conteúdo,
preservando caminhos internos. Por exemplo, `from: ["dist"]`, `to: "output"` e
`contents: true` levam `dist/lib/util.js` para `output/lib/util.js`. Combine com
`copy: true` para manter os arquivos de origem. As pastas de origem permanecem.

## Limpar arquivos

```js
import { planClean, removeCleanPlan } from '@raulscoelho/script-utils/clean/plan'

const plan = await planClean({ presets: ['build', 'turbo'] })
console.log(plan.targets, plan.count, plan.bytes)

// Depois de apresentar a prévia e obter autorização:
await removeCleanPlan(plan, { onProgress: removed => console.log(removed) })
```

A seleção aceita `presets`, `files`, `folders`, `extensions` e `globs`. Presets disponíveis:
`build`, `turbo`, `node-modules`, `lockfiles`, `generated` e `workspace`.

O plano informa `root`, `targets`, `count` e `bytes`. Ele só pode ser executado uma vez,
no processo que o criou. A remoção revalida os alvos, protege `.git` e não segue links simbólicos.
É permanente e pode ser parcial em caso de erro. Para simular, apenas gere e apresente o plano.

## Usar os fluxos de terminal

```js
import { copy } from '@raulscoelho/script-utils/copy'
import { clean } from '@raulscoelho/script-utils/clean'
import { runMove } from '@raulscoelho/script-utils/move'

await copy()    // Abre os menus do RepoClip.
await clean()   // Abre os menus do RepoClean.
await runMove([]) // Abre os menus do RepoMove.
```

Chame o fluxo desejado. `copy({ root, inclusion, exclusion, interactive, yes, dryRun, stdout })`
e `clean({ root, selection, interactive, yes, dryRun })` também aceitam configuração direta.
Com seleção informada, podem rodar sem terminal. `copy` escreve no clipboard por padrão;
`stdout: true` envia o texto para a saída padrão.

`runCopy(args)`, `runClean(args)` e `runMove(args, root)` recebem os mesmos argumentos dos
respectivos CLIs. São exportados de `copy`, `clean` e `move`, junto da string `help` de cada comando.

## Utilitários públicos

Os caminhos abaixo são relativos a `@raulscoelho/script-utils/`.

| Módulo | Funções |
| --- | --- |
| `copy/choices` | `chooseInclusion`, `chooseExclusion`, `discoverIgnoreFiles` |
| `lib/cli` | `ask`, `splitList`, `formatBytes`, `createProgress`, `runCli` |
| `lib/paths` | `withinRoot`, `isNodeModulesPath`, `isGitMetadataPath`, `hasControlCharacters` |
| `lib/filters` | `inputList`, `advancedFilters` |
| `lib/patterns` | `filePattern`, `folderPattern`, `extensionPattern`, `globPattern` |

`createProgress(total, label)` oferece `update(current)` e `stop(message)`.
`runCli` trata ajuda, versão e erros; `allowArgs: true` delega os argumentos ao callback `run`.
`ask` encerra o processo com código `0` quando um prompt é cancelado.
