# Disciplinas incluídas na mensalidade

Recurso opcional por curso e por instituição. Em Admin → Cursos → abrir o curso, expanda “Disciplinas incluídas”. Use uma mensalidade fixa, cadastre as disciplinas na grade existente e configure as obrigatórias e os grupos de escolha. Uma disciplina pertence a um único grupo ou às obrigatórias. Cada grupo tem um mínimo e um máximo próprios; nome e composição são livres. Não há IDs, dias, nomes ou preços de instituição fixados no código.

O recurso não acumula cobrança por disciplinas, cálculo automático de combos ou períodos de curso livre. Pacotes como PEVI + IA podem ser cursos próprios com preço fixo e grade compartilhada, como os cadastros atuais do CREIA Kids. Selecionar disciplinas incluídas não multiplica a mensalidade nem cria matrículas financeiras avulsas para as escolhas. Bolsas e valores autorizados pelo administrador continuam nos campos financeiros existentes.

Na matrícula por curso, os grupos substituem a seleção genérica, preservando a escolha da turma principal e da oferta de cada disciplina. Todas as obrigatórias e os limites dos grupos são conferidos pelo servidor. Os itens cursados devem coincidir com o escopo contratado. Turmas e ofertas precisam existir; marcar horários pendentes dispensa apenas os horários individuais. Os conflitos que já podem ser calculados continuam bloqueados. A chamada continua usando os itens por disciplina já existentes.

Cada matrícula nova guarda uma cópia das regras. Editar a configuração do curso altera apenas as futuras matrículas. A edição das disciplinas de uma matrícula com benefício usa a cópia contratada; não permite trocar o curso para contornar as regras. Matrículas anteriores sem essa cópia seguem seu fluxo original. Contratos continuam usando o escopo de disciplinas contratado, sem incorporar todas as opções não escolhidas do grupo.

Quando uma disciplina já está incluída em matrícula ativa do aluno, uma contratação sobreposta da mesma disciplina em outro curso é bloqueada, nas duas ordens, nos fluxos de matrícula por curso, modalidades e períodos livres. A comparação usa identidade da disciplina e intervalo de datas; não adivinha equivalência entre disciplinas duplicadas com IDs diferentes. Canceladas, encerradas e períodos que não coincidem mantêm o tratamento anterior. Transferências de turma preservam as disciplinas contratadas e podem permanecer aguardando compatibilidade, conforme o fluxo existente.

A configuração é restrita a administradores da própria instituição, valida IDs da grade e usa controle de concorrência. Cursos recebidos pela rede mantêm sua estrutura sob gestão da origem; estas regras não são publicadas automaticamente para outra instituição. Cursos sem ativação continuam usando seu fluxo anterior. A seleção por grupos está disponível na página administrativa de Matrículas; o antigo endpoint simplificado orienta a usar essa página. Este recurso não cria um novo portal público de matrícula.

## Exemplo: CREIA Kids

Nos cursos que incluem PEVI, configurar um grupo “Terça-feira” com mínimo 2 e máximo 2 (Jiu-Jitsu, Tênis de Mesa, Mini Futsal e Xadrez) e outro “Quinta-feira” com mínimo 2 e máximo 2 (Dança, Ukulele e Inglês). Educação para a Vida e as atividades centrais contratadas ficam nas obrigatórias, conforme a grade do pacote. Vincular Robótica à grade do PEVI + Robótica e as disciplinas de Reforço à grade do Combo Completo antes de incluí-las nas obrigatórias. Reutilizar as disciplinas existentes, sem duplicar IDs.

Ativar horários pendentes permite matricular antes de distribuir as aulas individuais. As ofertas de turma continuam necessárias. Quando houver a distribuição, cadastrar os horários reais nas ofertas; não usar o mesmo bloco completo para duas aulas sequenciais, pois isso representaria sobreposição.

O Complementar avulso continua no modo de preço por disciplinas: R$ 139,00 por disciplina, faixas exatas 1/0%, 2/10%, 3/10%, 4/10%, conforme a tabela aprovada. Esse cadastro é independente das escolhas incluídas. O recurso não altera automaticamente a tabela comercial: conferir R$ 360,00, R$ 539,10 e R$ 790,80 nos respectivos cursos. Não reprocessar cobranças ou valores históricos para atualizar o catálogo.

## Instalação e validação

Aplicar `20261027150000_selecao_disciplinas_incluidas` antes de publicar. A migração acrescenta JSON opcionais a Curso e Matricula, sem ativar regras ou alterar preços. `node scripts/aplicar-migracao-selecao-disciplinas.cjs --verificar` apenas verifica. Sem a opção, aplica somente esta migração, recusando outras pendências, histórico incompleto e divergências de checksum. Usa conexão direta e não exibe credenciais.

Validação: `node --test tests/selecao-disciplinas-incluidas.test.cjs`, testes de preço por disciplinas, combos, quantidade, cursos livres e conversão anual/semestral; `npm run build`. Testes de handler usam banco simulado. A migração foi aplicada em branch isolada do Neon com expiração automática; não representa publicação no banco principal.
