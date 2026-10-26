# Exclusão de etapa do curso

Na página `/admin/cursos/[id]`, cada etapa possui **Excluir etapa**, fora do botão de abrir/fechar. A confirmação identifica a etapa e avisa que as disciplinas permanecem no catálogo. Falhas aparecem junto à etapa. O botão fica indisponível durante gravações da grade.

`DELETE /api/admin/curso-etapas` (também na URL legada `curso-semestres`) recebe `{ id, cursoId }`. Exige sessão administrativa e propriedade pela instituição. A verificação e a exclusão usam a mesma transação serializável.

A operação bloqueia vínculos com matrículas (inclusive histórico cancelado/excluído), rematrículas, períodos de matrícula, regras de disciplinas extras, turmas e snapshots de disciplinas contratadas. Verifica referências diretas e campos legados por número/organização curricular. Também bloqueia cursos recebidos da rede e etapas já publicadas para outras unidades, evitando deixar cópias órfãs.

Somente a etapa sem uso e seus vínculos com disciplinas são removidos. O catálogo de disciplinas, os preços, as parcelas, os demais semestres, a numeração e a quantidade prevista de etapas do curso não são alterados. A quantidade prevista é uma configuração separada e pode ser editada no curso.

Sem migração de banco. Testes: `node --test tests/excluir-etapa-curso.test.cjs` com as dependências do projeto instaladas. Os testes exercitam o handler com dependências simuladas; não substituem a validação com PostgreSQL e o build completo da aplicação.
