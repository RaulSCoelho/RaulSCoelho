# @raulscoelho/repoclip

## 0.2.3

### Patch Changes

- Usa Execa no clipboard WSL, com limite de espera e preservação de UTF-8. Delega a gravação do histórico ao write-file-atomic, mantendo sincronização em disco, validação de caminhos e bloqueio entre processos.
- Updated dependencies
  - @raulscoelho/script-utils@0.4.1

## 0.2.2

### Patch Changes

- Updated dependencies
  - @raulscoelho/script-utils@0.4.0

## 0.2.1

### Patch Changes

- Updated dependencies
  - @raulscoelho/script-utils@0.3.1

## 0.2.0

### Minor Changes

- Adiciona seleção e exclusões por argumentos, simulação com `--dry-run` e saída de conteúdo com `--stdout`. Atualiza a documentação com exemplos para terminal e automação.

### Patch Changes

- Corrige a escrita no clipboard do Windows ao executar pelo WSL, preservando acentos, caracteres Unicode e quebras de linha.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @raulscoelho/script-utils@0.3.0

## 0.1.1

### Patch Changes

- Adiciona limpeza de projetos com presets combináveis, prévia, confirmação e revalidação dos alvos para o RepoClean. Compartilha prompts, filtros e tratamento de comandos entre os CLIs.
- Updated dependencies
  - @raulscoelho/script-utils@0.2.0
