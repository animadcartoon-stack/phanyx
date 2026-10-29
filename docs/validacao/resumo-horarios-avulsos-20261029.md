# Resumo de horários de turmas avulsas — 29/10/2026

Base: main `597e5f39680752e8c84db6d621d0f693fff8ed29` (PR #158).
Branch: `fix/resumo-horarios-avulsos-20261029`.

O Balé convertido já possuía horário próprio salvo, quinta-feira das 10:00 às 11:40. A lista geral não consultava TurmaHorarioAvulso e o componente de resumo só recebia horários das disciplinas. Por isso mostrava a mensagem de horário ausente.

O painel passa a incluir apenas horários próprios ativos da mesma instituição, ordenados por dia e início. Isso vale na carga inicial e na atualização somente de turmas. A página encaminha esses horários e o modo do curso ao resumo.

Turmas sem disciplinas usam os horários próprios, na mesma linha compacta e com as horas em vermelho. Se não tiverem horários ativos, mostram a mensagem de ausência e não recorrem a disciplinas legadas. Turmas curriculares continuam usando os horários de suas disciplinas, incluindo nomes quando há múltiplas disciplinas. Não há gravações ou alterações de horários, ativação de turmas, matrículas, preços, flags ou esquema de banco.

Verificação concluída:

- Typecheck completo aprovado.
- 494 testes automatizados aprovados, incluindo carga inicial e atualização do painel com horários próprios ativos e isolamento por instituição.
- ESLint sem erros; três avisos de hooks preexistentes em Turmas.
- Dezessete cenários de navegador com a página real e APIs simuladas: Balé sem disciplinas e Jiu-jitsu curricular nos cinco idiomas e três temas; resumo de uma linha no desktop, horários vermelhos, horários inativos ocultos, múltiplos horários e tela estreita. Sem erros JavaScript ou diálogos nativos.
- Conferência visual dos temas claro, escuro e sistema.
- Aplicador verificado com CRLF, repetição da aplicação e bloqueio de arquivos inesperados.

Build completo no Windows e Preview pendentes para este pacote antes do merge. O aplicador prepara nova pasta e branch e preserva a pasta anterior. Não copia .env nem executa SQL, migração, alteração de flags, commit, push ou deploy. Não é necessário cadastrar o horário novamente.
