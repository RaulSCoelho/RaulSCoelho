# @raulscoelho/repoclip

Reúne o caminho e o conteúdo dos arquivos do projeto em um texto pronto para colar.
Pode enviar para a área de transferência ou para a saída do terminal. Requer Node.js 24+.

## Começar

```sh
pnpm add -D @raulscoelho/repoclip
pnpm exec repoclip
```

Sem argumentos, escolha o que copiar e o que excluir nos menus. Você pode combinar arquivos,
pastas, extensões e globs. A exclusão padrão usa os `.gitignore` da raiz e das subpastas.

Para usar `pnpm copy`, adicione `"copy": "repoclip"` aos `scripts` do `package.json`.

## Usar por argumentos

Copiar os arquivos de `src/` para a área de transferência:

```sh
pnpm exec repoclip --dir src
```

Conferir quais arquivos TypeScript serão incluídos, deixando os testes de fora:

```sh
pnpm exec repoclip --ext .ts --exclude '**/*.test.ts' --dry-run
```

Gerar um arquivo de texto, inclusive em CI ou em um servidor sem clipboard:

```sh
pnpm exec repoclip --dir src --stdout > codigo.txt
```

`--stdout` escreve apenas o conteúdo selecionado na saída padrão; avisos vão para stderr.
O resultado tem este formato:

```text
src/soma.ts
export const soma = (a: number, b: number) => a + b

src/mensagem.ts
export const mensagem = 'Olá'
```

## Opções

Execute na raiz do projeto. Use caminhos relativos e coloque globs entre aspas.
As opções de seleção podem ser repetidas e combinadas; basta um arquivo corresponder a uma delas.

| Opção | O que faz |
| --- | --- |
| `--all` | Seleciona todo o projeto; use sem outros filtros de seleção |
| `--file <nome-ou-caminho>` | Seleciona um arquivo; só o nome procura também nas subpastas |
| `--dir <pasta>` | Seleciona os arquivos de uma pasta e suas subpastas |
| `--ext <extensão>` | Seleciona pela extensão, como `.ts` |
| `--glob <padrão>` | Seleciona por padrão, como `'src/**/*.tsx'` |
| `--exclude <glob>` | Exclui pelo padrão, como `'**/*.test.ts'` |
| `--exclude-file <nome-ou-caminho>` | Exclui um arquivo |
| `--exclude-dir <pasta>` | Exclui uma pasta com seu conteúdo |
| `--exclude-ext <extensão>` | Exclui todos os arquivos dessa extensão |
| `--ignore-file <arquivo>` | Lê regras de exclusão no formato `.gitignore` |
| `--no-gitignore` | Desativa as regras automáticas do Git |
| `--stdout` | Escreve no terminal, sem acessar o clipboard |
| `--dry-run` | Mostra a lista de arquivos, sem copiar o conteúdo |
| `--yes` | Autoriza também arquivos identificados como potencialmente sensíveis |
| `--interactive` | Pergunta os filtros que ainda não foram informados |
| `--help`, `-h` | Mostra ajuda e exemplos |
| `--version`, `-v` | Mostra a versão |

Os filtros de exclusão e `--ignore-file` também são repetíveis. Por exemplo,
`--ignore-file .copyignore` lê uma lista com uma regra por linha, como `*.log` ou `temp/`.
`--dry-run` e `--stdout` são saídas diferentes e não podem ser combinados.

## Antes de copiar

Sem `--stdout`, o sistema precisa oferecer acesso à área de transferência.
No WSL, o RepoClip usa o PowerShell do Windows para preservar acentos e quebras de linha.
Arquivos com nomes como `.env` e chaves privadas exigem confirmação; sem terminal, exclua-os
ou autorize com `--yes`. Essa identificação por nome não detecta todo conteúdo sensível.

`node_modules` fica sempre de fora. A leitura ignora links simbólicos, binários, arquivos que
não sejam UTF-8 e arquivos acima de 2 MiB. A seleção aceita até 10.000 arquivos e o texto final,
até 20 MiB. `--dry-run` mostra a seleção antes desses limites de leitura serem aplicados.
