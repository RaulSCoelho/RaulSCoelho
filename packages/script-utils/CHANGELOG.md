# @raulscoelho/script-utils

## 0.3.1

### Patch Changes

- Preserva a precisão dos identificadores de arquivos na limpeza para evitar confundir hard links distintos, inclusive no Windows. Informa quais metadados mudaram quando a remoção é interrompida.

## 0.3.0

### Minor Changes

- Adiciona seleção e exclusões por argumentos, simulação com `--dry-run` e saída de conteúdo com `--stdout`. Atualiza a documentação com exemplos para terminal e automação.
- Adiciona presets e filtros por argumentos, simulação com `--dry-run` e execução sem perguntas com `--yes`. Atualiza a documentação de seleção, confirmação e remoção.
- Adiciona RepoMove para mover, copiar e renomear arquivos com seleção interativa ou argumentos, prévia, resolução de conflitos, backups e histórico com reversão. Disponibiliza a API de planejamento e execução em `@raulscoelho/script-utils/move`.

### Patch Changes

- Corrige a escrita no clipboard do Windows ao executar pelo WSL, preservando acentos, caracteres Unicode e quebras de linha.

## 0.2.0

### Minor Changes

- Adiciona limpeza de projetos com presets combináveis, prévia, confirmação e revalidação dos alvos para o RepoClean. Compartilha prompts, filtros e tratamento de comandos entre os CLIs.
