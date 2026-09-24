# @raulscoelho/repoclean

Remove arquivos e pastas do projeto com seleção, prévia e confirmação. Requer Node.js 24+.

## Começar

```sh
pnpm add -D @raulscoelho/repoclean
pnpm exec repoclean
```

Execute na raiz do projeto. No menu, marque as opções com Espaço, avance com Enter e confira
a lista antes de confirmar. **Não** é a resposta padrão. Uma barra acompanha a remoção.

Para usar `pnpm clean`, adicione `"clean": "repoclean"` aos `scripts` do `package.json`.

## Usar por argumentos

Conferir todos os builds e caches do Turbo que seriam removidos:

```sh
pnpm exec repoclean --preset build --preset turbo --dry-run
```

Retire `--dry-run` para receber a prévia e a pergunta de confirmação. Para executar sem
perguntas, inclusive em CI, use `--yes`:

```sh
pnpm exec repoclean --preset build --preset turbo --yes
```

Você também pode selecionar itens diretamente:

```sh
pnpm exec repoclean --dir apps/web/cache --ext .log --dry-run
```

Esse exemplo seleciona a pasta `apps/web/cache` inteira e os arquivos `.log` do projeto.

## Presets

Todos procuram também nas subpastas. Combine-os repetindo `--preset`.

| Preset | O que remove |
| --- | --- |
| `build` | Pastas `dist`, `build`, `out` e `.next` |
| `turbo` | Pastas `.turbo` |
| `node-modules` | Pastas `node_modules` |
| `lockfiles` | `pnpm-lock.yaml`, `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `bun.lock` e `bun.lockb` |
| `generated` | Build, Turbo, `coverage` e arquivos `*.tsbuildinfo` |
| `workspace` | Generated e Node Modules |

`workspace` mantém os lockfiles, exceto os que estiverem dentro de uma pasta removida ou forem
selecionados por outro filtro. A busca não percorre dependências instaladas, mas uma pasta
`node_modules` selecionada é removida por inteiro.

## Opções

| Opção | O que faz |
| --- | --- |
| `--preset <nome>` | Seleciona um preset da tabela acima |
| `--file <nome-ou-caminho>` | Seleciona um arquivo; só o nome procura também nas subpastas |
| `--dir <pasta>` | Seleciona uma pasta com todo seu conteúdo |
| `--ext <extensão>` | Seleciona arquivos pela extensão, como `.log` |
| `--glob <padrão>` | Seleciona arquivos ou pastas, como `'apps/**/cache'` |
| `--dry-run` | Mostra a prévia sem apagar nada, mesmo junto de `--yes` |
| `--yes` | Executa sem pedir confirmação |
| `--interactive` | Abre o menu para completar a seleção |
| `--help`, `-h` | Mostra ajuda e exemplos |
| `--version`, `-v` | Mostra a versão |

Os filtros de seleção são repetíveis e combinados. Itens sobrepostos são removidos uma única vez.
Use caminhos relativos à raiz e globs entre aspas. No menu avançado, separe globs com ponto e
vírgula; os demais filtros usam vírgula.

## Cuidados com a remoção

A limpeza é permanente e não tem `undo`. A prévia inclui arquivos ocultos e ignorados pelo Git;
uma pasta listada inclui todo o conteúdo. Encerre builds e instalações antes de confirmar.

A raiz e os metadados `.git` são protegidos. Selecionar uma pasta que contenha `.git` bloqueia
a operação. Links simbólicos não são seguidos; links dentro de pastas selecionadas são removidos
sem apagar seus destinos.

O RepoClean revalida os alvos antes de excluir. Se detectar uma alteração ou falhar durante
a execução, interrompe e informa quantos itens já removeu. Eles não são restaurados.
As verificações não impedem que outro processo altere arquivos simultaneamente.
