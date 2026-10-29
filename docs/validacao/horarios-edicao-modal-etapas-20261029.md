# Horários na edição de turmas e confirmação PHANYX — 29/10/2026

Base: main `985d1e68fa2870fecfdaa70a758b471a417ecbde` (PR #151).
Branch preparada: `fix/horarios-edicao-turmas-20261029`.

## Correções de tela

Na edição de turmas com disciplinas, os horários já eram carregados e enviados no campo `horariosPorDisciplina`, mas os controles não eram renderizados. Agora cada disciplina selecionada possui um editor visível de dias, início e fim, mesmo com a lista de disciplinas fechada. Os horários existentes são exibidos; é possível adicionar mais de um horário e remover os horários.

O preenchimento continua opcional. Uma turma organizada apenas por turno e período letivo pode ser salva sem horários. Para verificar precisamente conflitos de matrícula, é necessário informar dias e intervalos completos. O armazenamento e a validação de conflitos já existentes são preservados; não foram criados novos campos de banco.

Na exclusão de etapas de curso, `window.confirm` foi substituído pelo componente `PhanyxConfirmModal`. O texto traduzido, a confirmação explícita, os estados de processamento e a proteção do servidor contra exclusão de etapas utilizadas foram mantidos. Cancelar não envia requisição de exclusão.

O editor inclui textos nos cinco idiomas e utiliza as cores dos temas claro, escuro e sistema.

## Validação

- TypeScript aprovado.
- 432 testes existentes aprovados.
- ESLint dos arquivos alterados sem erros; quatro avisos de dependências de hooks já existentes nas duas páginas.
- Navegador Chromium com dados e respostas de API fictícios: horários visíveis nos cinco idiomas, envio do intervalo 08:00–09:40 no payload da edição, recarga dos horários e envio de lista vazia ao remover o horário.
- Conferência visual do editor e do modal nos temas claro, escuro e sistema.
- Modal: cancelar sem DELETE, confirmação com bloqueio 409 preservando a etapa, e confirmação com resposta de sucesso removendo a etapa da tela.
- Nenhum diálogo nativo nem erro JavaScript no teste do navegador. O teste de tela não fez gravações em banco nem substitui uma validação futura no Preview da branch.
- A busca em app/components não encontrou outro `window.alert`, `window.confirm` ou `window.prompt`. Os usos restantes de `confirm()` são do provedor de diálogo da aplicação; os `prompt()` de instalação PWA pertencem ao fluxo explícito de instalação.

## Liberação do piloto em produção

Foram criadas exclusivamente para Production as variáveis `PHANYX_ATIVACAO_TURMAS_AVULSAS_HABILITADA=true`, `PHANYX_MATRICULA_SEM_GRADE_HABILITADA=true` e `PHANYX_AVULSOS_INSTITUICOES_HABILITADAS=26`.

O deployment `dpl_8BSBF9AzUFxiEYS9E6Him1P6vsaG`, do mesmo commit de produção já aprovado, foi concluído e o domínio principal passou a apontar para ele. A ativação fica restrita à instituição 26. Nenhuma turma, matrícula ou cobrança foi criada por essa liberação. As alterações de tela deste pacote ainda precisam ser enviadas e revisadas em PR.

## Bloqueio da etapa do Balé

A consulta somente leitura de produção confirmou: curso 28, etapa 36 sem disciplinas na grade, turma 31 `E3V — Balé` ainda vinculada à etapa 1 e com uma disciplina ofertada. A turma não tem aulas nem itens de matrícula; o curso não tem matrículas principais. Esses resultados não representam uma auditoria completa de todas as possíveis referências acadêmicas.

O vínculo da turma explica o bloqueio de exclusão da etapa. Esta correção não remove etapas, turmas nem vínculos e não converte automaticamente o Balé para matrícula direta. A reorganização desse cadastro é uma etapa separada; retirar a proteção do servidor não é necessário para editar os horários da turma atual.

## Aplicação

O aplicador verifica o repositório e os hashes dos quatro arquivos, normalizando CRLF, e prepara uma nova pasta/branch a partir de origin/main. A pasta anterior permanece preservada. Não copia .env, não executa SQL, migrações, alterações de flags, commit, push ou deploy. A liberação de produção acima foi uma operação separada e não será repetida pelo aplicador.
