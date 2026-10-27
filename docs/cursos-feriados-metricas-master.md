# Cursos, feriados e métricas Master

## Disponibilidade dos cursos

A criação de matrícula usa somente cursos ativos e sem exclusão. A verificação é
repetida no servidor dentro da transação para cobrir uma tela aberta antes de um
curso ser desativado. Matrículas antigas continuam com seus vínculos; a edição
financeira de uma matrícula histórica não reativa o curso.

O cadastro de cursos mostra excluídos durante as 72 horas de recuperação. Depois
do prazo, o registro deixa essa lista e sua restauração é recusada. Repetir a
exclusão não reinicia o prazo. O cron existente continua responsável pela limpeza
física de registros sem vínculos. Cursos com matrículas ou outros vínculos não
são apagados para preservar o histórico acadêmico e financeiro.

## Avisos de feriado

O aviso automático brasileiro começa quatro dias corridos antes. Para Finados de
02/11/2026, segunda-feira, o início é 29/10/2026, quinta-feira, permanecendo visível
na sexta-feira. Usa-se a data civil no fuso da instituição, sem confundir meia-noite
UTC com o início do dia local. Feriados nacionais publicados também respeitam
essa antecedência mínima; início anterior e fim configurado são preservados.
Rascunhos e registros arquivados pelo Master não são publicados pelo fallback.

O banner é consultado ao abrir a página, ao retornar à aba/janela e a cada hora
com a página visível. É um aviso dentro do PHANYX; esta correção não envia mensagens
por e-mail, WhatsApp ou outros canais.

## Master e plataforma

O painel Master deixa de reconhecer instituições por uma lista fixa de nomes.
Conta os cadastros existentes, identifica sua origem e não mistura os valores de
matrículas online do IBE com adesões institucionais ao PHANYX. Os valores de
adesões pendentes não incluem testes grátis, erros ou pagamentos já confirmados.
Cobranças com o mesmo identificador e origem não são somadas duas vezes.
Instituições isentas são excluídas da soma financeira de adesões vinculadas.

As tabelas legadas não identificam com segurança ambiente de teste/produção.
Por isso, valores marcados como pagos são apresentados como estados do cadastro,
com uma nota explícita, sem anunciar receita conciliada com o Asaas ou clientes
comerciais certificados. Nenhum registro foi reclassificado por nome ou excluído.

Em `/master/plataforma`, as contagens são consultadas em um snapshot do banco,
com data da consulta. Contas habilitadas não significam usuários online. Os
marcadores fixos de capacidade foram substituídos por indicação de que testes
de carga não foram medidos pelo painel. Falhas de consulta não viram zeros.

Na auditoria de leitura de 27/10/2026, a base continha 32 instituições cadastradas
(31 habilitadas, incluindo testes), 19 alunos ativos, 10 professores ativos,
21 cursos disponíveis, 7 matrículas ativas e 15 turmas ativas. Esses valores são
uma fotografia da auditoria, não constantes usadas na aplicação.

## Validação e publicação

Testes em `tests/cursos-feriados-master.test.cjs` verificam isolamento por
instituição, disponibilidade e recuperação, limites de datas e fuso, quatro dias
de antecedência, autorização Master, separação financeira e consultas de métricas.
Execute os testes acadêmicos existentes e `npm run build` antes de publicar.
Esta alteração não acrescenta migrações nem modifica registros de produção.
