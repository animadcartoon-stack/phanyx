# Etapas opcionais em cursos livres

Cursos com organização LIVRE podem cadastrar uma ou várias etapas na Estrutura do Curso e vincular suas disciplinas a esses agrupamentos. A etapa recebe organização LIVRE; não é um semestre obrigatório do aluno ou da turma.

As disciplinas diretamente vinculadas ao curso continuam disponíveis, mesmo após criar uma etapa vazia. As disciplinas explicitamente vinculadas a qualquer etapa também ficam disponíveis para as ofertas. A grade semestral/anual continua seguindo suas regras anteriores.

A cobrança por período permanece separada: preço semanal ou mensal, matrícula zero e sem criação automática de parcelas futuras. Nenhuma etapa é exigida para contratar um período. A criação de etapas não modifica valores do curso nem matrículas existentes.

Mantidos o isolamento por instituição, o acesso administrativo, a proibição de alterar cursos recebidos da rede e a exclusão protegida de etapas. Sem migração de banco.

Teste: `node --test tests/curso-livre-etapas.test.cjs`. Os testes do handler usam dependências simuladas; validar o build da aplicação antes de publicar.
