# Cursos adicionais na mesma matrícula

O curso principal pode permitir cursos adicionais. A lista oferece apenas cursos ativos da mesma instituição marcados como disponíveis como avulso/adicional, com ofertas compatíveis de polo e período letivo. Sem a permissão, a seleção comum de um curso continua no formulário tradicional.

## Configurar

1. Em criar/editar curso, informe a mensalidade própria de cada curso. Desative o preço por quantidade de disciplinas para usar preço por curso.
2. No principal, marque **Permitir cursos adicionais na matrícula deste curso**.
3. Nos cursos que poderão ser oferecidos como adicionais, marque **Disponível como curso avulso/adicional em outras matrículas**. As opções são independentes; um curso pode ter ambas.
4. Cada curso mantém sua grade acadêmica e sua turma com as disciplinas que realmente oferece. Não inclua outros cursos como disciplinas apenas para somar preços. Não remova dados de grades históricas; revise as novas ofertas antes de contratar.
5. Para descontos, configure a participação e a regra de combo no cadastro de modalidades/combos. Marcar como adicional não cria desconto. Confira também a taxa e a quantidade de parcelas definidas no combo.
6. Em Matrículas, escolha o aluno e o principal. O sistema abre a contratação conjunta preservando ambos. Se houver uma única turma compatível do principal, ela é selecionada e calculada automaticamente; com mais de uma, escolha a turma. Acrescente os adicionais desejados e confira a prévia antes de confirmar.

Exemplo: Inglês R$ 188,98 + Robótica R$ 239,00 = R$ 427,98. Com combo percentual de 10%, a mensalidade é R$ 385,18. Sem esse combo, a soma continua R$ 427,98. A taxa segue as regras existentes e aparece separadamente.

Etapas organizam a progressão acadêmica do próprio curso. Elas não são a lista de cursos adicionais. Esta atualização não remove a estrutura acadêmica exigida pelas turmas.

Cursos livres cobrados por período, cursos com preço por disciplina e cursos com seleção de disciplinas incluídas mantêm seus próprios fluxos e não podem receber essas marcações. O fluxo geral de modalidades/combos já existente permanece disponível separadamente.

## Integridade

Prévia e confirmação conferem os mesmos preços, permissões, instituição, curso ativo, turma, vaga, horário e requisitos. A confirmação recalcula e recusa condições alteradas. O principal fica identificado na matrícula e todas as disciplinas contratadas continuam em seus itens. O contrato guarda a composição e os valores da contratação. Nenhuma matrícula ou cobrança anterior é recalculada por esta atualização.

A linha de alunos cancelados passa a usar cores legíveis nos temas claro, escuro e sistema. No modo por disciplinas, o campo da mensalidade explica que o preço depende das disciplinas marcadas; escolher o curso não marca uma disciplina automaticamente.

O card do curso usa a quantidade de etapas criadas na grade quando os campos de quantidade do cadastro estão vazios. A consulta retorna apenas a contagem, sem carregar todas as disciplinas e sem alterar o cadastro.

## Publicação

Aplique antes do deploy a migração `20261027170000_cursos_adicionais_matricula`, que acrescenta duas colunas booleanas com padrão `false`. O aplicador `scripts/aplicar-migracao-cursos-adicionais.cjs --env-root CAMINHO_DO_REPOSITORIO_ORIGINAL` usa a `DIRECT_URL` local sem copiar o `.env`. Ele recusa outras migrações pendentes, migração incompleta e divergência de checksum. Depois confere o histórico e as duas colunas. `--verificar` permite consultar sem aplicar.

O aplicador PowerShell entregue prepara uma branch isolada, verifica o cliente Prisma pelo esquema gerado, executa testes e TypeScript, aplica somente essa migração quando chamado com `-AplicarMigracao` e envia a branch para revisão. Se o envio falhar depois da migração, as duas colunas ficam no banco com as opções desligadas e continuam compatíveis com a versão anterior. Não integre o PR antes de a migração e as verificações da Vercel passarem.
