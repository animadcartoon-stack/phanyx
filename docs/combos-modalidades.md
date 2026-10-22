# Matrícula em modalidades e combos

## Configuração

1. Em **Cursos**, mantenha os valores de matrícula e mensalidade avulsos e a quantidade de parcelas. Use zero para isenção, em vez de deixar o preço vazio.
2. Marque **Participa de combos**. Preencha a mensalidade da modalidade no combo quando utilizar o cálculo por soma.
3. Acesse **Cursos → Pacotes e combos** (`/admin/combos`). Defina modalidades, mínimo inclusivo, máximo opcional, taxa única e número de mensalidades.
4. Escolha **Valor fechado do pacote**, **Soma das mensalidades de combo** ou **Desconto percentual sobre os valores avulsos**. O percentual incide uma vez sobre a soma das mensalidades elegíveis, com arredondamento em centavos, sem reduzir a taxa de matrícula. Para faixas diferentes, cadastre regras com mínimo/máximo próprios (por exemplo, duas, três e quatro ou mais modalidades). Para mais de três modalidades, configure mínimo quatro.
5. Cadastre as turmas e todos os encontros obrigatórios, com dia, início e fim. Turmas presenciais com horários incompletos ficam indisponíveis no novo fluxo.

## Matrícula

Em **Matrículas → Matricular em modalidades e combos**, selecione aluno, polo, período e uma turma por modalidade. A nova tela também atende contratações avulsas.

O sistema aplica automaticamente um combo elegível ao atingir o mínimo. Se houver vários, utiliza o de menor total contratual (taxa + todas as mensalidades), com desempate pelo ID. Abaixo do mínimo ou acima do máximo, aplica os preços avulsos. Cursos fora do combo são acrescentados com seus preços avulsos, incluindo as taxas. Contratações avulsas conjuntas precisam ter o mesmo número de mensalidades; extras de um combo precisam ter a mesma duração do pacote.

A seleção é conferida contra todos os encontros e contra outras matrículas ativas do aluno. Uma aula pode começar no instante em que outra termina. Sobreposições parciais bloqueiam a seleção. As alternativas precisam ter vaga, pertencer à mesma modalidade, polo e período e ser compatíveis com toda a seleção. Sua troca exige confirmação.

O administrador pode ajustar taxa, mensalidade e quantidade de parcelas antes de finalizar, informando o motivo. Alterar modalidades depois de um ajuste exige confirmar sua remoção e recalcular. Os valores automáticos e ajustados, motivo, usuário, data e metadados da solicitação são preservados na matrícula.

A conclusão cria uma matrícula com vínculos acadêmicos em cada turma/disciplina, uma taxa e uma sequência de mensalidades. Valores zerados não geram cobranças. O contrato recebe um quadro com modalidades, turmas, horários e valores acordados. Os pagamentos são confirmados pelo fluxo financeiro habitual.

A confirmação revalida preços, horários e vagas dentro da transação. Mudanças de preço invalidam a prévia. A chave da solicitação evita duplicar matrícula, contrato e cobranças no reenvio. Matrículas de modalidades não passam pela edição genérica de curso único: alterações posteriores exigem revisão contratual e financeira. Esta versão oferece os ajustes no momento da contratação.

A chamada e a frequência continuam vinculadas a cada ItemMatricula. A matrícula tradicional também consulta os horários ocupados pelos combos. EAD sem encontros fixos não cria conflitos fictícios.

## Publicação

As migrações `20261022210000_combos_modalidades` e `20261022211000_combo_percentual` adicionam campos, tabelas e a opção de percentual. Os cursos existentes começam com a participação em combos desativada. Contratos e cobranças anteriores não são recalculados.

Aplique `npx prisma migrate deploy` no ambiente de destino **antes** de disponibilizar o código novo. Gere o Prisma Client e execute o build habitual. Não use `db push` em produção.

## Verificação

- `node --test tests/combos.test.cjs`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

A integração é optativa: `tests/combos-integracao.cjs` aceita apenas PostgreSQL local com banco chamado `phanyx_combos` e schema aplicado. Defina `PHANYX_COMBOS_TEST_DATABASE_URL` e execute `node --test tests/combos-integracao.cjs`. O teste cria e remove somente seus dados sintéticos. A identidade autenticada e a resolução de tradução do Next são adaptadas no processo de teste; as rotas, validações, transações, vínculos, contrato e cobranças utilizam o código real.

A planilha comercial de 2027 foi usada como referência de cenários. Os descontos estão identificados nela como propostas e a taxa dos combos está pendente. Nenhum valor da planilha é cadastrado ou ativado automaticamente em produção. A comparação com o PEVI não troca a contratação do aluno nem estabelece teto de preço.
