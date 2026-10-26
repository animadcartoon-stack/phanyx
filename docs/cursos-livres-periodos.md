# Cursos livres com pagamento por período

O tipo **Livre — pagamento por período** é opcional. Os cursos semestrais e anuais conservam seus fluxos. Não há migração de matrículas existentes para o novo tipo.

## Ativação

Após validar o código na branch, antes de mesclar e publicar:

```powershell
node scripts/aplicar-migracao-curso-livre.cjs
```

Execute na pasta preparada pelo instalador. O aplicador verifica o histórico e só permite as duas migrações desta funcionalidade. Use `DIRECT_URL` com a conexão direta do Neon. Não use `migrate dev`, `db push`, reset ou marcação manual de migração aplicada.

Migrações, nesta ordem:

1. `20261026160000_curso_livre_organizacao`
2. `20261026160100_periodos_curso_livre`

A separação garante que o novo valor do enum seja confirmado antes de ser usado em índices e restrições. A alteração adiciona estruturas; preserva os registros existentes.

## Configurar o reforço

1. Em Cursos, selecione **Livre — pagamento por período**.
2. Informe **150,00** no preço semanal e **480,00** no mensal. É possível deixar uma opção vazia quando não é oferecida.
3. A taxa de matrícula permanece zero, sem etapas curriculares ou parcelas futuras.
4. Cadastre uma disciplina para o curso e uma turma, com polo, professor, datas e horários (exemplo: segunda e quarta). Turmas livres não exigem semestre/ano curricular. O período letivo continua identificando a oferta.
5. A organização de um curso já utilizado é protegida. Nesse caso, preserve o histórico e cadastre o novo curso livre.

## Contratar ou renovar

Abra **Matrículas → Cursos livres — pagamento por período** (`/admin/matriculas/cursos-livres`).

Selecione aluno, curso, turma, semanal/mensal e confira início e fim. O fim é inclusivo. A sugestão semanal abrange sete dias; a mensal vai até a véspera da próxima data mensal, com ajuste para meses menores. As datas podem ser ajustadas dentro dos limites de sete ou 31 dias e das datas da turma.

O primeiro período cria o vínculo do aluno. Os próximos períodos reutilizam esse vínculo e acrescentam registros ao histórico. Períodos sobrepostos não são duplicados, inclusive em solicitações concorrentes. Capacidade e conflitos de agenda consideram os períodos contratados; o histórico antigo permanece.

Somente o período solicitado gera um lançamento financeiro do tipo **OUTRO**, com curso, periodicidade e datas na descrição. Não há taxa de matrícula, carnê, renovação automática ou geração de períodos futuros.

## Receber e fazer chamada

Use **Abrir lançamento financeiro** para registrar/consultar o pagamento no fluxo financeiro existente, com suas permissões e regras de caixa. Volte e use **Atualizar pagamentos**. Pagamentos parciais continuam pendentes; apenas um lançamento integralmente pago identifica o período como pago.

Na chamada por turma, disciplina e data, o professor vê **Período pago**, **Aguardando pagamento** ou **Sem período contratado** para aquela data. Valores financeiros não são enviados ao professor. Essa indicação não altera presenças ou justificativas nem bloqueia correções do histórico. A chamada de aulas publicadas mantém o fluxo anterior.

Matrículas canceladas, encerradas, transferidas, trancadas ou suspensas não recebem novos períodos por esse fluxo. O gerador mensal exclui os vínculos livres. O cancelamento da matrícula alcança os lançamentos pendentes dos períodos conforme a data e a situação financeira informadas, preservando os pagamentos já realizados e o histórico.

## Combos

O curso livre pode compor um combo com cursos regulares conforme as regras de combo já cadastradas. A contratação desse combo continua em **Matrícula por modalidades/combos**, com o prazo e preço do combo. As opções semanais/mensais avulsas não geram cobranças paralelas automaticamente. Uma seleção composta somente por cursos livres deve usar o novo fluxo por período.

## Verificação

- `node --test tests/cursos-livres.test.cjs tests/academico-grade-ofertas.test.cjs tests/turma-isolamento-integridade.test.cjs tests/combos.test.cjs tests/combos-quantidade.test.cjs`
- `node scripts/verificar-chamada-encontro.cjs`
- `node scripts/verificar-cancelamento-cobrancas.cjs`
- `npm run build`

O teste PostgreSQL optativo `tests/cursos-livres-integracao.cjs` exige `PHANYX_LIVRE_TESTE=1` e conexão local/ponte local de uma branch isolada. Ele cria apenas fixtures com nomes e e-mails de teste. Não o execute em produção. O teste foi executado numa branch temporária do Neon derivada de produção, com expiração automática.
