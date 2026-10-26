# Matrícula com preço por disciplinas

Este modo é opcional e configurado no curso existente. Ele não cria outro curso nem duplica a grade. Os cursos sem a opção mantêm seu funcionamento atual.

## Configuração do PEVI Complementar

Na edição do curso, mantenha a organização anual, a taxa de matrícula de R$ 98,50 e as 12 mensalidades. Ative o preço por disciplinas e informe R$ 139,00 como valor mensal unitário. Cadastre duas faixas:

| Quantidade exata de disciplinas | Desconto sobre a soma |
| --- | --- |
| 1 | 0% |
| 2 | 10% |

A matrícula mostra uma única seleção de disciplinas. Uma disciplina resulta em R$ 139,00 mensais; duas resultam em R$ 278,00 menos R$ 27,80, totalizando R$ 250,20. A taxa do curso fica separada e não é multiplicada pela quantidade de disciplinas. A quantidade de parcelas e o primeiro vencimento precisam estar preenchidos para gerar a cobrança.

Uma quantidade sem faixa configurada impede a contratação. Não há regra implícita para três ou mais disciplinas. As ofertas precisam ter horários cadastrados e compatíveis. Disciplinas reutilizadas por uma grade explícita continuam vinculadas às suas origens; não devem ser movidas ou recriadas.

## Valores contratados e financeiro

O servidor valida as disciplinas e calcula o preço novamente. A matrícula guarda o valor unitário, as regras e o resultado da contratação. Alterações posteriores na tabela do curso não modificam esses valores. Ao editar as disciplinas de uma matrícula deste modo, o cálculo usa a tabela guardada na contratação e registra a revisão. Cobranças pagas ou parcialmente pagas são preservadas; a reconciliação das cobranças em aberto segue o fluxo existente.

O desconto por quantidade é aplicado uma vez. O desconto geral do curso e os combos por quantidade de cursos não são acumulados com este modo. Os preços fixos dos outros combos, inclusive o Combo Completo de R$ 667,10 por mês, não são recalculados por este recurso. Matrículas anteriores sem contratação por disciplinas não são convertidas automaticamente.

## Cursos livres e preços por período

Os cartões e a página do curso livre exibem separadamente o preço semanal e o preço por período mensal, conforme os valores cadastrados. O Reforço Escolar pode apresentar R$ 150,00 por semana e R$ 480,00 por período mensal. As informações de pagamento antecipado e ausência de renovação automática ficam visíveis. Os cursos regulares mantêm suas informações de mensalidades e parcelas.

## Ativação

Antes de publicar o código, aplique a migração `20261026180000_preco_por_disciplinas`. Ela adiciona duas colunas JSON opcionais e não altera preços, disciplinas ou matrículas existentes. O aplicador `node scripts/aplicar-migracao-curso-livre.cjs --verificar` consulta o histórico sem aplicar alterações. Sem `--verificar`, ele aplica apenas as migrações autorizadas deste conjunto, sem repetir as já concluídas, e bloqueia outras pendências ou histórico inconsistente.

Depois de publicar, configure as faixas no curso existente. A instalação do código não ativa automaticamente a regra comercial em nenhuma instituição.

## Validação

Foram verificados os cálculos, as cinco traduções, os fluxos de criação e edição na interface, o financeiro em Postgres isolado, os horários, o isolamento entre instituições e as regressões de chamada e cancelamento. O teste `tests/preco-disciplinas-integracao.cjs` exige explicitamente o ambiente isolado e não deve ser executado em produção.
