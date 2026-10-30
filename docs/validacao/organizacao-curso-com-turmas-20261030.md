# Organização anual de curso sem grade com turmas

## Problema e comportamento

O formulário normal de edição recusava a mudança SEMESTRAL/ANUAL apenas porque o curso possuía turmas. O PEVI já convertido para matrícula direta na turma, sem disciplinas, etapas ou matrículas, continuava bloqueado.

O mesmo PUT usado por **Guardar alterações** agora permite mudar a organização curricular desse curso sem grade, inclusive junto com o tipo/modalidade. Não exige nova conversão nem curso de destino. Todas as turmas sem uso acompanham a organização escolhida. Seus números de etapa são preservados; o campo legado semestre fica vazio em ANUAL e recebe o número em SEMESTRAL.

Identidades, nomes, docentes, dias, horários, registros de horário, período letivo, vagas, estado ativo, preços e parcelas permanecem intactos. A quantidade de parcelas não depende da organização curricular. O curso pode manter várias turmas e docentes iguais ou diferentes.

## Integridade

- Curso e turmas são lidos na instituição autenticada, com bloqueio das linhas e transação Serializable. Todos os planos são validados antes de atualizar qualquer turma.
- Matrículas, inclusive canceladas, snapshots contratuais sem FK, ofertas compartilhadas e registros acadêmicos reais continuam protegidos contra retipagem estrutural. Uma edição apenas de modalidade continua permitida com histórico.
- A exceção aplica-se somente a cursos com matrícula direta e sem grade. A conversão de cursos com grade mantém as verificações existentes. Configurações inconsistentes não são corrigidas inventando números de etapa.
- Nenhuma migração, SQL de produção, alteração de flags, commit, push ou deploy é necessário ou executado pelo aplicador.

## Verificação

1. Executar `npm ci`, `npx prisma generate` e `npm run typecheck`.
2. Executar `node --test tests/conversao-organizacao-curso.test.cjs tests/academico-grade-ofertas.test.cjs` e a suíte `node --test tests/*.test.cjs`.
3. Executar `npm run build`.
4. Em Preview com banco isolado: editar um curso sem grade com três turmas, escolher ANUAL e mudar o tipo/modalidade, usando Guardar alterações. Recarregar e conferir curso, turmas e os mesmos horários; repetir a volta para SEMESTRAL.
5. O teste explícito `tests/organizacao-curso-turmas-integracao.cjs --test` utiliza os handlers reais com Prisma/PostgreSQL e exige `PHANYX_TEST_DATABASE_URL` e `PHANYX_TEST_BRANCH_ID` da branch isolada indicada no próprio script. Não utiliza DATABASE_URL como alternativa. Cria e remove somente cadastros fictícios identificados, verificando a limpeza.

Cobertura inclui três turmas com horários e docentes distintos, manutenção dos registros de horário, preços e parcelas, gravação conjunta da modalidade, retorno para semestral, matrícula cancelada, snapshot sem FK, rollback e isolamento de instituição/perfil.
