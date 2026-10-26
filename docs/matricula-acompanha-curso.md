# Matrícula acompanha o curso

Ao escolher um curso na nova matrícula, o formulário preenche a taxa, o valor mensal e a quantidade de mensalidades com os valores cadastrados no curso. Os campos continuam editáveis para condições específicas. Trocar de curso substitui os padrões; alterar turma, disciplina ou outro campo não reaplica os preços.

A taxa de matrícula tem seu próprio campo. Preencher esse campo não registra recebimento: os lançamentos continuam pendentes até a baixa pelo Caixa. O campo de informação de valor pago no ato não recebe automaticamente a taxa.

- **Semestral:** mantém a escolha dos semestres e suas grades.
- **Anual com um único ano:** a estrutura é selecionada automaticamente, sem exigir semestre. Se o curso não possui grade estruturada, utiliza suas disciplinas ativas e turmas anuais do primeiro ano. Não cria um semestre ou uma etapa de grade no banco.
- **Anual com vários anos:** usa a escolha do ano/etapa e mantém a validação da grade cadastrada.
- **Livre:** selecionar o curso abre a contratação por período, preservando o aluno selecionado. O preço semanal/mensal continua vindo do curso, sem carnê ou renovação automática.

Ao abrir uma matrícula existente para edição, seus valores históricos são preservados. Os padrões atuais do curso só são reaplicados se o usuário trocar o curso explicitamente. As estruturas da nova matrícula e da edição são carregadas separadamente, com proteção contra respostas atrasadas.

## Publicação

Este ajuste integra o pacote de cursos livres. Não adiciona migrações além das duas já entregues para esse recurso:

1. `20261026160000_curso_livre_organizacao`
2. `20261026160100_periodos_curso_livre`

Antes de mesclar/publicar, execute na pasta preparada:

```powershell
node scripts/aplicar-migracao-curso-livre.cjs
```

Se já estiverem aplicadas, o verificador confirma sem repetir. O instalador detecta se a main já contém o primeiro pacote de cursos livres e aplica apenas o complemento necessário. Nenhuma matrícula antiga é convertida ou tem valores substituídos automaticamente.

## Validação

- `node --test tests/matricula-curso-configuracao.test.cjs tests/cursos-livres.test.cjs tests/academico-grade-ofertas.test.cjs tests/turma-isolamento-integridade.test.cjs tests/combos.test.cjs tests/combos-quantidade.test.cjs`
- `node scripts/verificar-chamada-encontro.cjs`
- `node scripts/verificar-cancelamento-cobrancas.cjs`
- `npm run build`

`tests/matricula-curso-integracao.cjs` é optativo e exige `PHANYX_LIVRE_TESTE=1` com banco local/ponte de uma branch isolada. Não executar em produção. Valida a matrícula anual sem grade, financeiro pendente, edição com bolsa, datas e isolamento. Envios externos de contrato/eventos são bloqueados no teste.
