# Cursos obrigatórios em conjunto

## Configuração

O bloco opcional **Cursos obrigatórios em conjunto** está disponível ao criar ou editar um curso. Cada instituição configura suas próprias regras. Todos os cursos marcados são obrigatórios; vazio mantém o comportamento anterior. O sistema rejeita autorreferência, duplicidade, cursos externos, inativos/excluídos e ciclos de dependência. Alterações da configuração e do curso são feitas na mesma transação serializável.

Exemplo: Curso B exige Curso A. O aluno pode contratar ambos juntos ou contratar B quando já possui matrícula ATIVA em A no mesmo período letivo. Cursos concluídos, cancelados, trancados, suspensos, excluídos ou de outro aluno não atendem à exigência. Matrículas A_INICIAR/AGUARDANDO também não contam como já ativas. A escolha conjunta pode ser feita em qualquer ordem; selecionar primeiro o dependente mantém a seleção e mostra o que falta.

A verificação é aplicada nas matrículas administrativas comuns (API principal e legada), na contratação de múltiplas modalidades e na contratação/renovação de cursos por período. Também ocorre ao trocar curso ou aluno na edição pela API principal. A confirmação das modalidades verifica novamente a regra dentro da transação, após a prévia. As condições atendidas entram no snapshot/versionamento dessa contratação.

Na matrícula existente de modalidades, o curso exigido é identificado pelos itens ativos, sem depender de cursoId (que é nulo no pacote). Para cursos regulares, o período letivo precisa coincidir e as datas informadas devem ser compatíveis. Para cursos LIVRE, é necessária cobertura contínua das datas solicitadas por períodos contratados não cancelados; não se usa apenas o status permanente da matrícula para aceitar um período já expirado. Um vínculo existente sem identificação de período não libera silenciosamente outro curso regular.

## Preços e histórico

A regra é de elegibilidade. Os descontos e os preços continuam sendo calculados pelo mecanismo de combos e pelas regras de disciplinas já existentes. Um curso já ativo não é adicionado nem cobrado outra vez automaticamente. Selecionar o curso obrigatório não cria taxas/parcelas até a confirmação válida. Grades, disciplinas e matrículas anteriores não são alteradas nem canceladas pela configuração. Cancelar posteriormente o curso obrigatório não cancela automaticamente os dependentes. Regras novas não são aplicadas retroativamente a edições exclusivamente financeiras.

Os fluxos legados específicos de matrícula pública/pagamento do IBE não fazem parte da contratação administrativa de cursos em conjunto. Não configurar essa regra para liberar compras nesses fluxos sem adaptar sua validação prévia ao pagamento.

A publicação de um curso com requisitos para uma instituição independente fica impedida: os IDs e as regras não são copiados entre instituições. É necessário revisar a configuração local antes de ampliar esse fluxo para a rede.

## Publicação

Aplicar **20261027120000_cursos_obrigatorios_conjunto** antes de mesclar/publicar a aplicação. A migração cria somente uma tabela de vínculos, índices e FKs compostas por instituição; não atribui requisitos a nenhum curso existente. O banco bloqueia autorreferência, duplicidade e referências cruzadas entre instituições. A exclusão física de um curso que ainda é obrigatório para outro é protegida.

O instalador prepara uma branch isolada e não executa migração automaticamente. A partir da pasta original do PHANYX, executar `node 'PASTA_PREPARADA/scripts/aplicar-migracao-requisitos-cursos.cjs'`. O aplicador utiliza o Prisma e o ambiente da pasta original, consulta o status e recusa aplicar se houver outras migrações pendentes. Se a migração já estiver concluída, não a repete. Depois revisar/mesclar o PR e aguardar o build e a publicação na Vercel.

Testes: `node --test tests/requisitos-cursos.test.cjs tests/requisitos-modalidades-integracao.test.cjs`. Incluem grafo, isolamento, vínculo ativo, período, cobertura contínua, ordem de seleção, preservação de preços, confirmação e revalidação após mudanças. Esses testes usam dependências simuladas; DDL/FKs/rollback foram conferidos separadamente em PostgreSQL embarcado. Build completo e integração com Neon de produção não são executados pelo instalador.
