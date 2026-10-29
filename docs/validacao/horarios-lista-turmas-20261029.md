# Horários no resumo da lista de turmas — 29/10/2026

Base: árvore do commit `105dcc25a9eedb3b062f3c7694935a6bc9a75379`, integrada à main pelo PR #152 (`48d845da`).
Branch: `fix/horarios-lista-turmas-20261029`.

## Comportamento

A lista de turmas com disciplinas agora apresenta um resumo de horários no cartão, sem abrir a edição. Cada disciplina mostra seus dias e intervalos; vários encontros aparecem em linhas separadas. Horários inativos são omitidos. Disciplinas sem horários e turmas sem disciplinas apresentam uma indicação traduzida de horários não informados. Em intervalos incompletos, os valores ausentes aparecem como travessão, sem inventar horários.

O resumo utiliza exclusivamente os dados já recebidos pelo painel. Não adiciona requisições, campos, regras de matrícula ou gravações em banco. Após salvar na edição, acompanha a recarga da lista existente. A lista própria de turmas avulsas sem grade já exibe horários e foi preservada.

## Validação

- TypeScript aprovado.
- ESLint dos dois arquivos TSX sem erros; três avisos de hooks preexistentes na página de turmas.
- Navegador Chromium com a página real e APIs simuladas: vários dias e disciplinas, omissão de horários inativos e tradução dos dias nos cinco idiomas.
- Edição, gravação simulada e recarga: o cartão refletiu a alteração de 08:00 para 08:15; recarregar a página preservou o resumo recebido da API simulada.
- Casos sem disciplinas, sem horários e com intervalo incompleto verificados.
- Conferência visual e de cores nos temas claro, escuro e sistema; sem transbordamento do resumo na largura de 390 px.
- Nenhum erro JavaScript ou diálogo nativo nos testes de navegador.
- Sem acesso ou gravação em banco nos testes. Build completo e teste no ambiente publicado ainda dependem da aplicação e do envio desta branch.

## Aplicação

O aplicador verifica os três arquivos com hashes normalizados para CRLF e prepara uma nova pasta/branch a partir de origin/main. Preserva a pasta anterior e rejeita conteúdo inesperado antes de escrever. Não executa SQL, migrações, configuração de flags, commit, push ou deploy e não copia arquivos de ambiente.
