# Consistência entre grade curricular e ofertas

Base: main após PR #115 (`c05e4cb8b441fa6f7122493e8662e7e4743156cb`). Esta é a segunda etapa da revisão acadêmica, anterior à adaptação anual e ao versionamento das matrizes.

## Comportamento entregue

- Quando um curso tem etapas curriculares cadastradas, as disciplinas dessas etapas são a referência para criar ou acrescentar ofertas à turma. A tela e as APIs utilizam a mesma regra. Uma disciplina compartilhada pela grade pode ser oferecida mesmo que os campos diretos legados apontem outro curso ou semestre.
- Cursos sem nenhuma etapa de grade cadastrada mantêm a classificação direta por curso e semestre. A presença de uma etapa vazia ou de outras etapas não autoriza completar a grade silenciosamente pelos campos diretos. Nesse caso, a secretaria deve completar a grade antes de criar novas ofertas.
- Uma oferta que já existe pode continuar vinculada à turma ao editar dados cadastrais, mesmo se a grade tiver sido modificada depois. Isso preserva o histórico; não autoriza acrescentar outras disciplinas fora da grade. Mudar a etapa exige nova validação e é bloqueado se houver histórico acadêmico.
- Editar uma disciplina não exclui e recria suas ofertas mantidas. Seus IDs, professores por oferta, datas, etapa, status e horários permanecem. O professor padrão do catálogo não sobrescreve professores já atribuídos a turmas.
- O envio parcial de dados não elimina listas de turmas, professores habilitados ou pré-requisitos omitidas. Na edição de turma, mapas omitidos de professor, datas, status e horários também preservam os valores existentes. Uma lista explicitamente vazia continua representando uma retirada, sujeita à proteção de histórico.
- Novas ofertas são validadas por curso, grade, semestre e instituição. Cursos, polos, professores responsáveis, professores por disciplina, disciplinas, turmas e pré-requisitos são conferidos no servidor conforme a operação. IDs duplicados são normalizados; identificadores malformados são recusados.
- Uma oferta com itens de matrícula, aulas, atividades, provas, resultados, disciplinas contratadas ou itens de rematrícula não pode ser retirada por edição cadastral. Notas sem ligação direta à disciplina são protegidas de forma conservadora pelo vínculo com a turma: a existência de notas na turma pode bloquear a retirada de uma oferta mesmo quando a nota não identifica aquela disciplina.
- Alterar curso ou semestre direto de uma disciplina com ofertas que tenham histórico, ou alterar a etapa de uma turma com histórico, exige um fluxo de progressão separado. Não reclassifica silenciosamente o passado.
- As operações relacionadas usam transação serializável. Se o PostgreSQL detectar uma alteração concorrente incompatível, a tela pede para atualizar e conferir a seleção antes de repetir o salvamento.
- Mensagens novas estão traduzidas nos cinco idiomas. A listagem de cursos só inclui os IDs de grade quando a tela solicita `gradeOferta=1`, evitando mudar o volume de dados dos demais consumidores.

## Exemplos de verificação

1. Matemática está na grade do curso A, semestre 1, mas seu cadastro direto ainda aponta curso B/semestre 2: a turma de A/1 lista e aceita Matemática pela grade.
2. A disciplina aparece no cadastro direto de A/1, mas não está na grade já definida: nova oferta é recusada até corrigir a grade.
3. A disciplina tem professor padrão João e uma turma com professora Maria, datas e dois horários: editar a descrição mantém Maria e seus horários.
4. Uma turma tem disciplinas antigas fora da grade atual: editar seu nome preserva as ofertas existentes; acrescentar outra disciplina fora da grade é recusado.
5. Tentar retirar uma disciplina com matrícula, aulas ou rematrícula: o servidor rejeita e reverte toda a operação, inclusive a alteração de nome que acompanhava o pedido.
6. Um ID de professor, polo, curso, turma ou disciplina de outra instituição: a API recusa sem criar vínculos cruzados.

## O que não muda neste pacote

Não exige migração de banco. Não converte matrículas, não recalcula cobranças, não altera os contratos e não modifica o mecanismo de chamada. A proteção de histórico impede a retirada cadastral de ofertas usadas por esses registros.

A opção anual, a separação explícita entre regime curricular e período letivo e o versionamento de matrizes continuam pendentes. Não há criação de novo regime acadêmico neste pacote, nem substituição do cadastro semestral existente.

## Validação

70 testes automatizados passaram: 33 da nova regra e das APIs acadêmicas, 7 de isolamento/exclusão de turma e 30 regressões de cálculos, horários e traduções de combos. Os testes de API usam dados fictícios e dependências de persistência simuladas; não foram testes contra o banco de produção.

A checagem completa de tipos passou. O lint dos arquivos alterados passou, mantendo dois avisos de dependências de hooks já presentes no padrão da página de turmas. A compilação otimizada do código passou. O build completo parou na coleta de dados porque este ambiente não tem R2_ACCOUNT_ID e as demais configurações de armazenamento. Não se usaram credenciais de produção para contornar essa limitação; o build completo precisa ser conferido na Vercel, com as variáveis já configuradas.

Nenhum banco ou cadastro de produção foi alterado durante a implementação e a validação local.
