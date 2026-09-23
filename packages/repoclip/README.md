# @raulscoelho/repoclip

CLI para copiar o código de um projeto para a área de transferência, com filtros interativos de inclusão e exclusão.

Requer Node.js 24+, terminal interativo e acesso à área de transferência do sistema.

## Instalação e uso

```sh
pnpm add -D @raulscoelho/repoclip
pnpm exec repoclip
```

Execute no diretório que deseja copiar. Selecione arquivos, pastas, extensões ou globs e escolha as regras de exclusão. A opção `.gitignore` também aplica as regras das subpastas.

Para adicionar um atalho ao `package.json`:

```json
{
  "scripts": {
    "copy": "repoclip"
  }
}
```

Depois, execute `pnpm copy`.

## Opções

```sh
pnpm exec repoclip --help
pnpm exec repoclip --version
```

## Limites de cópia

`node_modules` é sempre excluído. Links simbólicos, binários, arquivos que não sejam UTF-8 e arquivos acima de 2 MiB são ignorados. A seleção aceita até 10.000 arquivos e o conteúdo final é limitado a 20 MiB.

O CLI pede confirmação quando encontra nomes de arquivos potencialmente sensíveis, como `.env` e chaves privadas.
