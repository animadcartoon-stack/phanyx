# Edição de turma com horário geral e disciplinas opcionais

Base: main 93843a9851216710c99176df258b2e432e6dbc75, após o PR 162.

## Falha confirmada

O PR 162 separou edição de transferência, mas a rota PUT ainda rejeitava qualquer lista vazia de disciplinas. Além disso, os campos de horário exibidos na transferência não eram gravados pelo botão Salvar normal. O caso mostrado é edição da turma existente, não criação de turma ou conversão de todo o PEVI.

## Comportamento

- A edição aceita disciplinas vazias. Lista omitida preserva os vínculos; uma lista vazia explícita retira somente ofertas sem uso, na própria turma.
- Sem disciplinas selecionadas aparece “Horário geral da turma (opcional)”, ligado ao botão Salvar. Quando a turma já possui horário geral, o editor também permanece disponível.
- O formulário carrega o horário geral já salvo; ao retirar a seleção antiga, oferece os horários anteriores como ponto de partida, sem convertê-los ou gravá-los automaticamente.
- A turma conserva seu curso, ano, etapa, status e identidade. Código, sala, capacidade, professor e outros campos omitidos em uma edição parcial não são apagados.
- A lista e a reabertura usam os horários salvos. Horários específicos de uma disciplina prevalecem; na ausência deles, o horário geral é considerado na prévia e na agenda de matrículas anteriores e novas.
- Horários de turmas diferentes não são comparados no cadastro: várias turmas do mesmo curso e professor podem compartilhar dia/horário. Conflitos são verificados para o aluno na matrícula.
- Mensagens novas e campos funcionam em pt-BR, pt-PT, en-US, es-ES e fr-FR, temas claro, escuro e sistema. Continua usando feedback PHANYX.

## Preservação

A transação Serializable bloqueia a turma antes de conferir e gravar. Retirar a última oferta ou alterar horário geral requer ausência de histórico e de referências, inclusive matrícula principal cancelada sem itens, snapshots contratuais e ofertas derivadas compartilhadas. Remover outras disciplinas mantém as proteções acadêmicas existentes. Um horário inalterado permite editar dados gerais mesmo com histórico, sem recriar linhas de horário.

Não há mudança de schema ou migração. A tabela de horários própria da turma já existente é reutilizada; não se cria disciplina fictícia. A rota legada não permite contornar as restrições do fluxo de edição das turmas com matrícula direta. A conversão expressa passa a distinguir um horário geral de uma configuração de matrícula direta, substituindo horários somente na confirmação revisada.

Salvar uma turma curricular sem disciplinas não transforma seu curso em matrícula direta: a grade do PEVI permanece. A matrícula curricular sem ofertas continua sinalizada como pendente, preservando a verificação de integridade. Não há alteração de valores, descontos, cobranças, contratos, flags ou de cadastros de produção pelo aplicador.

## Verificação

- Typecheck completo aprovado.
- 545 testes automatizados aprovados, incluindo edição vazia, omissão de listas, isolamento, histórico, rollback e conversão.
- 32 cenários com componentes reais em Chromium e API simulada passaram: cinco idiomas × três temas × turma já vazia/retirada de seleção, recarga/reabertura, horário vermelho e falha sem conversão.
- Lint dos arquivos alterados sem erros; três avisos de hooks preexistentes na página.
- 18 verificações com handlers reais e PostgreSQL na branch isolada br-blue-base-aclw74mj passaram. Incluem gravação sem disciplina, preservação de curso/grade/catálogo/outra turma, leitura posterior, edição parcial, horários inválidos, várias turmas, isolamento, autorização, histórico cancelado/snapshot/oferta derivada, conflito com matrícula anterior, horário compatível e prioridade do horário específico.
- O teste foi repetido com o script de integração incluído no pacote e os arquivos TS atuais. Fixtures TESTE-EDICAO-HORARIO foram removidas em finally e a ausência foi conferida. Nenhum cadastro real foi utilizado.

O script `tests/edicao-horarios-turma-integracao.cjs --test` exige PHANYX_TEST_BRANCH_ID e PHANYX_TEST_DATABASE_URL apontando exclusivamente para a branch isolada e seu host. Grava fixtures temporárias e limpa em finally. Não usa DATABASE_URL como fallback, nem Asaas, e-mail, WhatsApp ou migrações. Não faz parte do glob de testes unitários *.test.cjs.

## Aplicação

O aplicador confere hashes e prepara uma nova pasta/branch, preservando a pasta original. Validar typecheck, testes e build nessa nova pasta. Depois do push, validar o Preview com banco isolado antes do merge. O aplicador não executa SQL, migração, flags, commit, push ou deploy.
