# Desconto da mensalidade no curso

O campo **Desconto da mensalidade (%)** aparece na criação e na edição do curso, com prévia do valor final. É opcional: vazio ou zero conserva o preço integral. Aceita de 0 a 100%, com duas casas decimais. O preço integral continua salvo no cadastro.

Na nova matrícula, a mensalidade recebe o preço líquido uma única vez, arredondado em centavos. Exemplo: R$ 539,10 com 40% resulta em R$ 323,46. A taxa de matrícula e a quantidade de mensalidades não mudam. Os campos continuam editáveis; bolsas adicionais seguem as regras da matrícula.

A mudança do desconto no curso não atualiza matrículas, períodos ou cobranças já contratados. Ao abrir uma matrícula existente, seus valores são preservados. No gerador mensal, o preço contratado na matrícula tem prioridade; o desconto do curso só entra quando é necessário recorrer ao preço padrão atual do curso.

Nos cursos livres, o desconto afeta apenas a opção mensal. O servidor calcula o preço a partir do curso, sem confiar em valores enviados pelo navegador. O valor semanal permanece integral. O período e o financeiro guardam o valor contratado, o valor original e o desconto aplicado. Com 100%, o período fica quitado por desconto integral, sem pagamento ou movimento de caixa.

Na matrícula por modalidades, o desconto vale para o preço avulso. Preços específicos de combos e faixas por quantidade mantêm suas próprias regras. O cálculo compara as opções sem aplicar o desconto do curso novamente sobre um preço específico de combo.

## Ativação

Exige a migração adicional `20261026170000_desconto_mensalidade_curso`. Ela adiciona um campo opcional ao curso e permite períodos de valor zero para desconto integral, mantendo a proibição de valores negativos. Não recalcula registros existentes.

Após preparar/validar a branch e antes de mesclar, execute na pasta preparada:

```powershell
node scripts/aplicar-migracao-curso-livre.cjs
```

O aplicador aceita somente as duas migrações dos cursos livres e esta migração do desconto. As duas primeiras já foram aplicadas em produção nesta sessão pelo Prisma; não serão repetidas. Para Neon, o aplicador troca o endereço com `-pooler` pela conexão direta apenas durante a execução, sem alterar o arquivo de ambiente.

## Validação

- `node --test tests/desconto-mensalidade-curso.test.cjs tests/matricula-curso-configuracao.test.cjs tests/cursos-livres.test.cjs tests/academico-grade-ofertas.test.cjs tests/turma-isolamento-integridade.test.cjs tests/combos.test.cjs tests/combos-quantidade.test.cjs`
- `node scripts/verificar-chamada-encontro.cjs`
- `node scripts/verificar-cancelamento-cobrancas.cjs`
- `npm run build`

`tests/desconto-curso-integracao.cjs` é optativo e exige banco local/ponte local de uma branch isolada com `PHANYX_LIVRE_TESTE=1`. Nunca executar em produção. Os testes de integração e navegador foram realizados com dados de teste e sem envio externo de contratos ou eventos.
