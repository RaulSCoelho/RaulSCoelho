# @raulscoelho/repomove

Mova, copie e renomeie arquivos e pastas com prévia, tratamento de conflitos e histórico para
desfazer. Requer Node.js 24+.

## Começar

```sh
pnpm add -D @raulscoelho/repomove
pnpm exec repomove
```

Execute na raiz do projeto. Sem argumentos, o menu pede as origens, o destino e o comportamento,
mostra a prévia e solicita confirmação. **Não** é a resposta padrão.

Você pode selecionar vários arquivos ou pastas, buscar por extensão ou glob e combinar filtros.
A navegação de caminhos tem autocompletar. No destino, escolha uma pasta existente ou informe
o caminho de uma nova; ela só é criada ao executar.

Para usar `pnpm move`, adicione `"move": "repomove"` aos `scripts` do `package.json`.

## Mover, copiar e renomear

Mover uma foto para `album/praia.jpg`:

```sh
pnpm exec repomove --from fotos/praia.jpg --to album
```

Copiar a foto para o álbum e manter a original em `fotos/`:

```sh
pnpm exec repomove --from fotos/praia.jpg --to album --copy
```

Mover e trocar o nome para `album/ferias.jpg`:

```sh
pnpm exec repomove --from fotos/praia.jpg --to album --rename ferias.jpg
```

`--rename` serve quando há somente um arquivo ou uma pasta sendo transferida. Inclua a extensão
no novo nome do arquivo. Para mais origens, repita `--from`.

No menu, **Copiar e manter os originais** pula as duas perguntas de exclusão. Por argumentos,
você pode combinar `--copy` com exclusões, caso queira copiar só parte da seleção.

## Organização no destino

Para a origem `fotos/viagem/praia.jpg` e o destino `album`:

| Organização | Resultado |
| --- | --- |
| Padrão, escolhendo o arquivo com `--from` | `album/praia.jpg` |
| Padrão, buscando por glob ou extensão | `album/fotos/viagem/praia.jpg` |
| `--preserve-tree` | `album/fotos/viagem/praia.jpg` |
| `--flatten` | `album/praia.jpg` |

Ao selecionar a pasta `fotos/viagem`, o padrão leva a pasta inteira para `album/viagem`.
Com `--preserve-tree`, ela vai para `album/fotos/viagem`. Com `--flatten`, os arquivos vão
direto para `album`, e as pastas de origem permanecem.

Por exemplo, reunir todas as fotos `.jpg` no álbum:

```sh
pnpm exec repomove --ext .jpg --to album --flatten --exclude 'album/**' --dry-run
```

Globs e extensões selecionam arquivos, incluindo os de subpastas. Para transferir uma pasta
inteira, use `--from`. Origens repetidas ou já incluídas em uma pasta selecionada não são
transferidas duas vezes.

## Deixar alguns itens de fora

Entre os arquivos e pastas selecionados, você pode escolher quais devem continuar onde estão:

```sh
pnpm exec repomove --from fotos --to album --exclude fotos/pessoal.jpg
```

Isso transfere as outras fotos e mantém `fotos/pessoal.jpg`. Para excluir todos os logs,
use `--exclude '**/*.log'`. Repita `--exclude` para combinar regras.

Se já tiver uma lista de exclusões, use `--ignore-file .moveignore`. Esse arquivo precisa
existir e pode conter uma regra por linha:

```gitignore
fotos/pessoal.jpg
*.log
```

As regras seguem o formato `.gitignore`, com caminhos relativos à pasta do arquivo de regras.
No menu, separe exclusões com ponto e vírgula e nomes de arquivos de regras com vírgula.
Deixe os campos vazios para pular.

O `.gitignore` é aplicado por padrão nas buscas por glob e extensão. Origens informadas com
`--from` podem incluir conteúdo ignorado pelo Git, com aviso. `--exclude` e `--ignore-file`
valem também para essas origens. Uma pasta com exclusões é dividida em itens permitidos;
a pasta original e o conteúdo excluído ficam no lugar. Essa divisão não aceita `--rename`.

## Conferir e executar

`--dry-run` mostra a prévia sem alterar arquivos, criar pastas ou gravar histórico.
Para buscar globalmente o conteúdo de pastas `build`, mesmo ignoradas pelo Git:

```sh
pnpm exec repomove --glob '**/build/**/*' --to builds/arquivo \
  --exclude 'builds/**' --no-gitignore --dry-run
```

Retire `--dry-run` para confirmar no terminal. Em CI ou para executar sem perguntas, use `--yes`.
Se combinar os dois, `--dry-run` prevalece. Com argumentos incompletos, o terminal pergunta
as origens ou o destino que faltarem; sem terminal, o comando informa o que está faltando.

A prévia mostra caminhos, quantidade de arquivos e pastas, tamanho e conflitos. Listas longas
permitem expandir os itens restantes. Imports não são atualizados; possíveis referências
são apenas um aviso, sem garantia de encontrar todas.

## Conflitos

Quando o destino já existe, escolha `--on-conflict`:

| Valor | Resultado |
| --- | --- |
| `error` | Bloqueia a execução; padrão |
| `skip` | Ignora o item e preserva o destino existente |
| `rename` | Escolhe um nome livre, como `praia-1.jpg` |
| `overwrite` | Guarda o conteúdo anterior em backup e substitui |

```sh
pnpm exec repomove --ext .jpg --to album --flatten --exclude 'album/**' --on-conflict rename
```

Duas origens também podem produzir o mesmo destino. `overwrite` não resolve essa colisão;
use `skip`, `rename` ou ajuste a seleção. `--yes` sozinho não autoriza sobrescritas.

## Histórico e desfazer

Na mesma raiz em que executou a operação:

```sh
pnpm exec repomove history
pnpm exec repomove undo --dry-run
pnpm exec repomove undo
```

`undo` reverte o último registro ainda não desfeito. Para movimentações, devolve os itens à
origem. Para cópias, remove as cópias criadas e mantém os originais. Nos dois casos, restaura
backups de sobrescritas. Arquivos alterados ou caminhos ocupados bloqueiam a reversão;
para desfazer uma cópia, o original também precisa continuar intacto.

Histórico e backups ficam em `.repomove/`. Preserve-os enquanto precisar desfazer e adicione
ao `.gitignore`:

```gitignore
.repomove/
.repomove-tmp-*
```

Falhas parciais ficam registradas. Estados que não puderem ser verificados exigem recuperação
manual; os backups estão em `.repomove/<id>/backups/`. Cópias interrompidas podem deixar
`.repomove-tmp-*` no destino. Pastas criadas pelo comando podem permanecer vazias após o `undo`.

Um lock em `.repomove/lock` impede dois RepoMove simultâneos. Se ele restar após um encerramento
forçado, confira o histórico e remova apenas o lock, depois de verificar que não há outro
RepoMove ativo. Em CI, guarde `.repomove/` como artefato privado se precisar recuperar os dados.

## Argumentos

Use caminhos relativos à raiz; `--to .` usa a própria raiz como destino. Coloque globs entre aspas.

| Opção | O que faz |
| --- | --- |
| `--from <caminho>` | Seleciona arquivo ou pasta; repetível |
| `--to <pasta>` | Define o destino, existente ou novo |
| `--copy` | Mantém os originais e cria cópias no destino |
| `--glob <padrão>` | Seleciona arquivos por glob; repetível |
| `--ext <extensão>` | Seleciona arquivos pela extensão; repetível |
| `--exclude <caminho-ou-glob>` | Exclui itens da seleção; repetível |
| `--ignore-file <arquivo>` | Lê regras de exclusão; repetível |
| `--no-gitignore` | Desativa as regras automáticas do Git |
| `--rename <nome>` | Renomeia uma única origem |
| `--preserve-tree` | Mantém os caminhos relativos à raiz |
| `--flatten` | Reúne os arquivos; incompatível com `--preserve-tree` |
| `--on-conflict <modo>` | Define `error`, `skip`, `rename` ou `overwrite` |
| `--dry-run` | Apenas mostra a prévia |
| `--yes` | Executa sem pedir confirmação |
| `--interactive` | Abre os menus de configuração |
| `--help`, `-h` | Mostra ajuda e exemplos |
| `--version`, `-v` | Mostra a versão |

## API e limites

A API está em [`@raulscoelho/script-utils/move`](https://github.com/RaulSCoelho/RaulSCoelho/tree/main/packages/script-utils#mover-ou-copiar-arquivos).
CLI e API usam o mesmo planejador e executor.

`.git`, `node_modules`, os dados do RepoMove e a raiz são protegidos contra movimentação.
Links simbólicos são rejeitados, inclusive dentro de pastas selecionadas. Destinos fora da
raiz ou dentro da própria origem são bloqueados.

O conteúdo é revalidado por SHA-256. Movimentações no mesmo volume usam `rename`; cópias e
movimentações entre volumes usam um temporário verificado antes de finalizar. A origem só é
removida no modo de movimentação. Cópias não garantem preservar hard links, ACLs ou atributos
estendidos. O tamanho mostrado é a soma dos bytes dos arquivos, não o espaço ocupado em disco.

Encerre processos que escrevam nos arquivos selecionados. As operações não formam uma transação:
falhas de disco, mudanças concorrentes e encerramentos forçados podem exigir recuperação manual.
O limite é de 10.000 operações e 100.000 itens por árvore. A busca de referências lê até 2.000
arquivos de código/configuração de até 256 KiB e não resolve todos os aliases ou imports dinâmicos.
