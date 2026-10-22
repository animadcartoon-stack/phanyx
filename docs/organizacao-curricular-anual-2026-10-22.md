# Organização anual e semestral — terceira etapa acadêmica

Base: main após PR #116, `41344faf5f244f9b0b0fb593a0f4c8881b41da81`.

## Comportamento

- Cada curso escolhe organização SEMESTRAL ou ANUAL. Uma instituição pode manter as duas simultaneamente. Os registros atuais recebem SEMESTRAL, sem tentativa de adivinhar sua organização pelo nome ou por uma quantidade zero.
- A duração curricular é informada em anos ou semestres. Não determina a quantidade de parcelas. Uma oferta anual pode ser contratada em dez parcelas, por exemplo, conforme os valores comerciais já existentes.
- A grade utiliza etapas numeradas e tipadas. Em um curso anual, etapa 2 representa o segundo ano da formação. `periodoLetivo` continua sendo a identificação do calendário (por exemplo, 2027), distinta desse número.
- Criação e edição de turma validam curso, organização, etapa e disciplinas no servidor. Um curso anual exige grade explícita; não reaproveita a classificação direta por semestre do catálogo. Não existe fallback para primeiro semestre anual.
- Disciplinas do catálogo são colocadas nos anos pela grade. A edição de disciplina anual orienta essa configuração e não oferece o campo semestral legado.
- Matrículas tradicionais registram organização e etapa próprias, conferem a etapa da grade por curso/instituição e validam o ano da turma principal anual e de todas as novas ofertas principais. A edição cadastral não reclassifica uma matrícula anual para outro ano ou curso; progressão e transferência são fluxos próprios.
- Contratações por modalidades/combos preservam organização e etapa de cada oferta no snapshot. Um combo pode reunir organizações distintas; a matrícula comercial do conjunto não representa um único ano ou semestre para todos os cursos.
- Os períodos de rematrícula e o portal do aluno continuam usando IDs da grade, com terminologia de etapa. A seleção de turmas de destino passa por validação de curso, instituição, organização e etapa, tanto ao criar como ao editar um período. A progressão existente considera a próxima etapa numerada e exige grade/período publicados; não inventa anos nem converte matrículas.
- Troca de turma dentro do mesmo curso conserva o ano curricular. Cursos publicados para outras unidades levam sua organização e etapas tipadas.
- Novas variáveis de documentos: `etapaAtual` / `currentCurriculumStage`, `organizacaoCurricular` / `curriculumOrganization`, `anoCurricular` / `curriculumYear`. Os contratos e a geração administrativa preenchem esses valores; exemplos e catálogo de tags foram atualizados. Templates já salvos não são reescritos. As variáveis semestrais antigas permanecem compatíveis.
- Curso que já tem grade, disciplinas, turmas, matrículas ou publicação em rede não muda de organização por edição simples. A secretaria deve cadastrar a estrutura nova preservando a antiga. A quantidade de etapas não pode ser reduzida abaixo de etapas já cadastradas.
- As proteções anteriores de horários, professores, vínculos mantidos e histórico continuam aplicadas.

## Compatibilidade dos dados e APIs

Os nomes físicos `CursoSemestre`, `CursoSemestreDisciplina`, `TurmaSemestre` e suas chaves permanecem para conservar IDs e relações históricas. Esses registros passam a ter organização explícita; um registro ANUAL representa um ano curricular, apesar do nome físico legado. Não é um primeiro semestre artificial. Os novos endpoints são `/api/admin/curso-etapas` e `/api/admin/curso-etapa-disciplinas`, mantendo as URLs anteriores.

Turmas anuais gravam `etapaNumero` e `organizacaoCurricular=ANUAL`, com `semestre` vazio. Matrículas anuais gravam os mesmos campos, com `semestre` nulo. Os índices parciais preservam a unicidade antiga das turmas semestrais e usam etapa para turmas anuais. Respostas de opções legadas podem fornecer o número como alias de apresentação; a validação usa os campos canônicos. Os IDs de grade permanecem aceitos pelo nome legado `cursoSemestreId`; o novo alias é `cursoEtapaId`.

A migração é aditiva quanto aos dados e inclui a troca do índice de unicidade das turmas por índices próprios de cada organização. Nenhuma linha é convertida ou apagada e não há recálculo financeiro. Aplicar **antes** de integrar/publicar o código. O verificador do pacote interrompe se houver outras migrações pendentes ou migração anterior interrompida.

## Validação e limites

88 testes passaram: regras e rotas de curso/turma, snapshots de matrícula, elegibilidade de turmas na rematrícula, isolamento institucional, proteção de histórico, horários e regressões dos cálculos de combos. Incluem curso anual vazio, conversão bloqueada com uso, omissão preservando organização, parcelas independentes, ano 2 em 2027, etapa inválida, disciplina fora da grade e turma de destino incompatível. Os testes de persistência usam dados fictícios e mocks com rollback; a migração não foi aplicada a banco real neste ambiente.

Checagem completa de tipos passou. Lint dos arquivos alterados passou com avisos de dependências de hooks já existentes. Geração do Prisma e diff de schema conferidos; as restrições e os índices parciais são SQL explícito adicional ao diff do Prisma. O código passou na compilação otimizada. O build completo continua bloqueado na coleta de dados por ausência de configuração R2 da biblioteca neste ambiente. Validar o build da Vercel após a migração e o envio.

Esta etapa não implementa versionamento completo de matrizes, cursos modulares/livres sem etapas, cadastro normalizado do calendário nem nova configuração bimestral/trimestral de avaliações. O período letivo continua como campo textual separado e a cobrança continua contratual. Os relatórios e templates personalizados que escrevem “semestre” literalmente precisam adotar as variáveis neutras; não foram automaticamente reformulados.

Não foram alterados cadastros nem executadas migrações em produção durante o desenvolvimento.
