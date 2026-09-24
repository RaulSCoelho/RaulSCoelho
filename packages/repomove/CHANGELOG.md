# @raulscoelho/repomove

## 0.3.1

### Patch Changes

- Usa Execa no clipboard WSL, com limite de espera e preservação de UTF-8. Delega a gravação do histórico ao write-file-atomic, mantendo sincronização em disco, validação de caminhos e bloqueio entre processos.
- Updated dependencies
  - @raulscoelho/script-utils@0.4.1

## 0.3.0

### Minor Changes

- Adiciona --contents para transferir o conteúdo de várias pastas preservando suas subpastas, com seleção por caminhos ou globs. Corrige a transferência de diretórios no Windows sem renomear sobre a pasta reservada no destino.

  Preserva identificadores de arquivos de 64 bits nas verificações de conteúdo e de reserva do destino.

### Patch Changes

- Updated dependencies
  - @raulscoelho/script-utils@0.4.0

## 0.2.1

### Patch Changes

- Updated dependencies
  - @raulscoelho/script-utils@0.3.1

## 0.2.0

### Minor Changes

- Adiciona RepoMove para mover, copiar e renomear arquivos com seleção interativa ou argumentos, prévia, resolução de conflitos, backups e histórico com reversão. Disponibiliza a API de planejamento e execução em `@raulscoelho/script-utils/move`.

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @raulscoelho/script-utils@0.3.0
