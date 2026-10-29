# Edição de turma sem curso de destino obrigatório

Base: main 25b27d9702b16c3b16a85e28fa2a05d7ce0a0afa, após o PR 161.

## Problema e comportamento

A seleção de “Vincular turma a um curso avulso” substituía a edição normal por uma conversão: escondia Guardar, as disciplinas, os horários curriculares e o estado ativo. Sem destino, Revisar conversão ficava desativado. Isso fazia uma edição parecer exigir outro curso.

A edição normal agora permanece disponível com os dados do curso atual e Guardar/Cancelar. O aviso explica que outro curso não é necessário. As ações de transferência e oferta em outro curso ficam abaixo dos botões, recolhidas e identificadas como opcionais, nos cinco idiomas. Abrir a transferência sem destino não remove nem desabilita Guardar. Somente solicitações em andamento bloqueiam ações concorrentes.

Guardar continua fazendo PUT /api/turma/:id com os dados normais e horários por disciplina, sem enviar cursoDestinoId e sem chamar a API de conversão. A transferência só utiliza a API de conversão por ação expressa, com destino e revisão. Não altera automaticamente o curso atual.

## Escopo preservado

Não há alteração de API, Prisma, banco, grade, matrícula, cobrança ou flags. A edição curricular continua preservando as disciplinas existentes; esta correção não converte um curso com grade em curso sem disciplinas. O fluxo próprio das turmas avulsas permanece sem exigir disciplinas. Cursos continuam permitindo várias turmas. Proteções de histórico, exclusão e revisão da conversão permanecem.

## Verificação

- Typecheck completo aprovado.
- 110 testes de conversão, integridade/exclusão e consulta do painel aprovados.
- Lint dos dois arquivos TSX: sem erros; três avisos de hooks já existentes na página.
- 18 cenários com a interface real compilada e exercitada em Chromium com APIs simuladas: edição, gravação sem destino, preservação do curso e de outra turma, horário vermelho na lista, cinco idiomas, temas claro/escuro/sistema, falha de gravação e bloqueio de ações concorrentes.
- Não houve escrita em banco nem teste de cadastros reais nesta correção de interface. O build completo será executado no ambiente do usuário.

## Aplicação

O aplicador confere os arquivos, cria uma nova pasta/branch a partir da main e preserva a pasta original e suas alterações. Não executa commit, push, deploy, SQL, migração ou alteração de flags. Depois de aplicar, validar typecheck, testes e build na nova pasta. Revisar o Preview antes do merge.
