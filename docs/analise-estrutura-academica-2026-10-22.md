# Revisão da estrutura acadêmica do PHANYX

Data: 22/10/2026. Base examinada: `3308d9419710c6ec76df3cdf1d653c17377296cb` (main após PR #114).

## Conclusão

A base já separa curso, disciplina, turma, matrícula, horários, contratos e cobranças. Existem filtros por instituição em vários cadastros, transações e registros das disciplinas contratadas. Entretanto, a organização acadêmica continua centrada em semestres e não é aplicada uniformemente por todos os fluxos.

A liberação de turmas anuais precisa começar pelo modelo do curso e se estender à matriz, às ofertas, à matrícula e à rematrícula. Apenas esconder o campo ou gravar “Anual” no campo de semestre não resolve a integração. Nenhum curso existente deve ser convertido automaticamente.

Escopo desta revisão: leitura do schema e dos principais fluxos administrativos, mais reprodução isolada de duas falhas com dados fictícios. Não é certificação de todo o produto nem auditoria de todos os portais e relatórios. Não foram consultados registros reais nem feitas alterações em produção.

## Evidências e prioridades

| Prioridade | Constatação no código | Consequência | Tratamento |
|---|---|---|---|
| P0 | O GET de detalhe em `app/api/turma/[id]/route.ts` consultava apenas pelo ID, sem autenticação no handler nem filtro institucional. | A consulta não assegurava o isolamento entre instituições. A ausência de verificação foi reproduzida com mocks, sem testar dados de terceiros em produção. | Correção preparada neste pacote: autenticação, validação de ID e busca com `instituicaoId`. |
| P0 | O DELETE da mesma rota removia `TurmaDisciplina` antes de tentar excluir a turma, fora de uma transação conjunta. | Se a turma tiver referências que bloqueiem a exclusão, a resposta pode ser de erro após a remoção de vínculos. Os horários desses vínculos têm exclusão em cascata. | Correção preparada: as duas operações na mesma transação; um bloqueio desfaz ambas. |
| P1 | `Curso.quantidadeSemestres`, `CursoSemestre` e `TurmaSemestre` são a estrutura curricular atual. `Turma.semestre` é texto obrigatório; não há organização anual/modular/livre explícita no curso. | Cursos sem quantidade de semestres ainda encontram exigência de semestre no cadastro da turma. | Introduzir organização curricular explícita no curso e matrizes com etapas tipadas, mantendo compatibilidade com o legado. |
| P1 | POST `/api/turma` exige semestre e cria `TurmaSemestre` com `Number(semestre) || 1`. PUT também procura/cria semestre com fallback para 1. | Um valor não numérico pode acabar com um registro de primeiro semestre, embora a instituição não trabalhe assim. | Não criar semestre artificial para cursos anuais/livres. A turma deve referenciar a etapa correta ou não possuir etapa, conforme a organização do curso. |
| P1 | A grade é salva em `CursoSemestreDisciplina`; o cadastro de disciplina mantém `cursoId` e `semestre` diretos. A gravação da grade não sincroniza esses campos diretos. | Existem duas fontes de classificação que podem divergir. | A matriz curricular deve ser a referência da participação da disciplina no curso/etapa. Campos legados precisam de política explícita de compatibilidade. |
| P1 | A matrícula consulta `CursoSemestreDisciplina`, mas a tela e a criação de turma filtram `Disciplina.cursoId`/`Disciplina.semestre`. A API da grade aceita disciplinas da instituição sem exigir que seu `cursoId` seja o mesmo da matriz. | Uma disciplina pode constar na grade e ser omitida ou recusada na criação da turma desse curso. Reutilizar uma disciplina entre matrizes não é coerente entre os fluxos. | Catálogo de disciplinas da instituição; vínculos pela matriz e pela oferta. A mesma validação precisa ser compartilhada por tela e servidor. |
| P1 | PUT `/api/disciplina/[id]` apaga os vínculos `TurmaDisciplina` e os recria a partir da seleção enviada. | Editar uma disciplina pode recriar ofertas existentes e perder seus horários por cascata. Essa não é uma mera atualização cadastral. | Atualizar diferenças, preservar os vínculos mantidos e separar edição do catálogo da gestão da oferta e de seus horários. |
| P1 | POST `/api/turma` valida disciplinas por instituição/curso, mas recebe IDs de polo e professor sem a mesma consulta de pertencimento usada em outros cadastros. PUT também precisa de validação uniforme das disciplinas e dos professores por oferta. | As regras de integridade dependem da rota usada; a interface sozinha não garante vínculos válidos para a instituição. | Validar no servidor todos os IDs relacionados e, progressivamente, reforçar relações compostas por instituição no banco. |
| P2 | A rematrícula usa `cursoSemestreId` e `RematriculaSemestral`; a seleção de turmas compara semestres. | Uma organização anual ou modular não recebe um fluxo completo apenas pela mudança da tela da turma. | Evoluir a progressão para etapas curriculares e períodos letivos; preservar o fluxo semestral e seu histórico. |
| P2 | Há políticas de acesso diferentes entre rotas: por exemplo, criação de disciplina exige ADMIN, enquanto outras usam `isAdminLike`. | Perfis autorizados podem ter experiências diferentes em cadastros relacionados. | Definir permissões por operação e reutilizar a mesma política no servidor e na interface. |

## O que precisa ser separado

| Conceito | Pergunta que responde | Exemplos |
|---|---|---|
| Organização curricular | Como o curso está dividido? | Semestral, anual, modular, sem divisão em etapas. |
| Etapa curricular | Em qual posição da formação o aluno está? | 3º semestre da graduação, 2º ano escolar, módulo introdutório. |
| Período letivo | Quando as aulas acontecem? | Ano de 2027, primeiro semestre de 2027, intervalo com início e fim. |
| Período de avaliação | Em quais intervalos se apuram notas e resultados? | Quatro bimestres ou três trimestres dentro de um curso anual. |
| Condição financeira | Como o contrato é cobrado? | Matrícula e 10 ou 12 parcelas, bolsas, isenção, combo. |

O terceiro semestre da formação pode acontecer em 2027.1. Uma escola anual pode avaliar por bimestres. Um curso anual não determina, por si só, que haverá 12 mensalidades. Esses conceitos precisam conversar por vínculos explícitos, sem serem tratados como o mesmo campo.

## Modelo recomendado

1. **Instituição:** define padrões e permissões, sem impor uma única organização a todos os seus cursos. Uma instituição pode oferecer cursos anuais e semestrais simultaneamente.
2. **Curso:** define a formação, organização curricular e sua relação com as matrizes. “Modalidade do certificado” não substitui organização curricular.
3. **Matriz curricular versionada:** contém etapas (semestre, ano ou módulo) e disciplinas. Alterações futuras criam nova versão quando houver matrículas vinculadas à versão anterior.
4. **Disciplina:** pertence ao catálogo da instituição e pode participar das matrizes permitidas. Professor, sala e horário são atributos da oferta, não a definição da disciplina.
5. **Período letivo:** possui identificação, datas e tipo; é distinto da etapa da formação e do período de avaliação.
6. **Turma e oferta de disciplina:** vinculam curso/matriz, período e etapa quando aplicável. A oferta define professor, vagas, horários e datas, considerando todos os encontros obrigatórios.
7. **Matrícula:** registra aluno, contratação, versão da matriz, etapa/período e ofertas contratadas, preservando o retrato contratado. Combos reúnem modalidades sem gerar cobranças avulsas adicionais para os mesmos itens incluídos.
8. **Rematrícula, frequência, avaliações e documentos:** utilizam esses vínculos. A próxima etapa depende da regra de progressão, e não da soma automática de um campo chamado semestre. Documentos apresentam a terminologia correta para o curso.

Para cursos livres sem divisão curricular, o sistema pode cadastrar a turma com período/datas, sem criar um semestre fictício. A oferta ainda precisa fornecer a unidade acadêmica usada por frequência e atividades; não se deve exigir que a secretaria crie uma disciplina artificial apenas para satisfazer detalhes de implementação.

## Aplicação ao CREIA Kids

É necessário decidir qual é o papel do PEVI em cada contratação: um programa com suas próprias atividades e modalidades opcionais, ou um pacote comercial que agrupa cursos independentes. Curso, disciplina e combo são conceitos diferentes. Uma modalidade já registrada como disciplina dentro do PEVI não deve virar curso automaticamente nem receber uma segunda cobrança pela mesma oferta.

Essa definição não exige eliminar o PEVI atual. O histórico deve ser mantido, com um caminho explícito para as novas matrículas e, se necessário, uma conversão assistida separada para vínculos antigos.

## Ordem de implementação

1. **Integridade e isolamento:** publicar as duas correções preparadas, corrigir a atualização de vínculos da disciplina e uniformizar a validação dos IDs e permissões nas APIs acadêmicas.
2. **Fonte curricular única:** definir a matriz e seu versionamento, resolver o papel dos campos diretos legados de curso/semestre e garantir consistência entre grade e oferta.
3. **Organização configurável no curso:** permitir semestral/anual e preparar a extensão para modular/livre. Defaults institucionais devem admitir exceção por curso.
4. **Oferta e calendário:** adaptar criação/edição de turma, lista de disciplinas, períodos, datas e horários.
5. **Matrícula e progressão:** integrar contratação tradicional, combos, rematrícula e preservação do histórico. A cobrança segue as condições do contrato.
6. **Operação completa:** adaptar frequência, avaliações, boletins, certificados, contratos, filtros e relatórios nos portais correspondentes.

A implantação deve ser incremental, com compatibilidade temporária para campos e APIs existentes. Migrar estrutura não significa recalcular contratos, converter matrículas ou reescrever chamadas anteriores.

## Critérios de aceite

- Curso semestral: mantém suas etapas, ofertas, matrícula e rematrícula atuais.
- Curso anual: informa ano/etapa quando necessário e período letivo; não cria “semestre 1” artificial.
- Curso livre: trabalha com ofertas e datas sem obrigação de etapas curriculares fictícias.
- Curso anual com avaliação bimestral: mantém ano curricular e bimestres de avaliação separados.
- Disciplina compartilhada entre matrizes: aparece nas ofertas válidas e na matrícula conforme o vínculo da matriz.
- Edição de disciplina: não apaga horários, frequência, notas nem ofertas mantidas.
- Alteração de matriz: não muda retroativamente o que um aluno já contratou.
- Exclusão bloqueada: não deixa registros parcialmente removidos.
- Outra instituição: não pode ler nem relacionar IDs fora de seu escopo.
- Combo: respeita as ofertas e regras acadêmicas; a seleção não duplica cobranças e pode reunir cursos com estruturas diferentes quando comercial e academicamente compatíveis.

## Validação das correções incluídas

Sete testes automatizados de API com dependências de banco simuladas: autenticação, isolamento entre instituições, IDs inválidos, consulta válida, exclusão bloqueada com rollback, exclusão permitida em transação e bloqueio de exclusão de outra instituição. A semântica de transação usada é a fornecida pelo Prisma; não foi aplicado nenhum comando a banco de produção.

A opção anual e a reestruturação curricular ampla permanecem pendentes. Este pacote não anuncia sua implementação nem modifica currículos, matrículas ou configurações em produção.
