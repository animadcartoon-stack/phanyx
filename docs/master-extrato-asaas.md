# Extrato Asaas no Master

O bloco **Asaas — saldo, entradas e saídas** de `/master` consulta a API Asaas
no servidor, com a chave principal já usada pela integração global. Os valores
não são derivados dos status de adesões ou matrículas do banco PHANYX.

## Consulta

- `GET /finance/balance`: saldo disponível no momento da consulta.
- `GET /financialTransactions`: lançamentos do período, percorrendo as páginas.
- `GET /myAccount/accountNumber`: agência e conta para identificar a conexão.
  Se esta identificação não puder ser consultada, o painel informa sua ausência.

A configuração é a mesma de `lib/asaas.ts`: `ASAAS_API_KEY`, `ASAAS_BASE_URL` e
`ASAAS_ENV`. A classificação Produção/Sandbox vem do endereço efetivo da API.
O modo Sandbox aparece como simulação, sem anunciar movimentação de dinheiro real.
Não há troca automática de ambiente nem compartilhamento de chaves institucionais.
A chave não é enviada ao navegador nem incluída em mensagens de erro.

O escopo é toda a conta principal consultada, incluindo recebimentos, tarifas,
transferências e estornos. Não representa exclusivamente a receita de assinaturas
PHANYX, nem agrega contas Asaas independentes das instituições. As referências
de cobrança e transferência retornadas pelo provedor são exibidas para conferência.

## Totais e limites

Valores são somados em centavos: positivos entram em Entradas e negativos em
Saídas. Movimentação líquida é Entradas menos Saídas. Ela não é lucro e não deve
ser somada ao saldo atual. Cobranças pendentes ou apenas confirmadas não compõem
o total enquanto não houver lançamento no extrato.

Cada período aceita até 366 dias. A leitura respeita 100 registros por página,
até 50 páginas e orçamento de 25 segundos. Se a leitura precisar ser interrompida,
a lista fica explicitamente parcial e os totais do período e a exportação ficam
indisponíveis. A API valida identificadores, datas, valores e contagem informada;
lançamentos repetidos com o mesmo ID não são somados duas vezes. Divergências
retornam erro em vez de um total incompleto apresentado como definitivo.

A busca, o filtro por direção e a paginação visual não alteram os cartões do
período. O CSV contém todos os lançamentos do período completo e seus IDs.
Textos recebidos do provedor são neutralizados contra fórmulas de planilha.

## Segurança e interface

`GET /api/master/asaas/extrato` confere a sessão e o estado atual do usuário no
banco: somente Master ativo tem acesso. Respostas usam `private, no-store`.
Não há endpoints de escrita nem execução de cobranças, saques ou transferências.
Falhas limpam os dados da consulta anterior; não são convertidas em saldo zero.

O painel é independente das consultas de cadastros do Master. O aviso dos
cadastros e o novo extrato usam cores próprias com contraste em claro, escuro
e sistema, sem alterar as regras globais dos outros módulos.

## Verificação

`node --test tests/master-asaas-extrato.test.cjs tests/cursos-feriados-master.test.cjs`
cobre autorização, paginação completa, tarifas, transferências, estornos,
precisão monetária, inconsistências do provedor, limites, sandbox e CSV.
Execute também TypeScript e lint e confira a compilação da Vercel antes de integrar.
Não há migração de banco. A conferência com dados reais depende da publicação e
das permissões da chave Asaas já configurada no servidor.

Referências: documentação oficial em
https://docs.asaas.com/reference/recuperar-extrato,
https://docs.asaas.com/reference/recuperar-saldo-da-conta e
https://docs.asaas.com/reference/recuperar-numero-de-conta-no-asaas.
Os campos de resposta também foram conferidos no SDK oficial `asaasdev/asaas-api-sdk-java`.
