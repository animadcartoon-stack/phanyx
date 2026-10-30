# Mudar curso para sem grade mantendo suas turmas

## Problema

A conversão do curso era recusada apenas por existirem turmas. A exclusão manual de etapas também era recusada por essas mesmas turmas. Isso criava um caminho sem saída mesmo quando não havia matrículas, aulas ou notas. A caixa de matrícula direta ainda permitia solicitar outra alteração estrutural pelo botão normal de salvar, causando mais confusão.

## Resultado

- A revisão do curso inteiro permite várias turmas sem histórico acadêmico. Preserva IDs, nomes, curso de origem, professores, vagas, preços e horários efetivos. Turmas completas mantêm seu estado ativo; cadastros incompletos aparecem na prévia como inativos para revisão.
- A prévia lista cada turma, professor, horário e estado resultante antes da confirmação. Horários iguais entre turmas não geram bloqueio, com professores iguais ou diferentes.
- Etapas e ofertas curriculares sem uso são retiradas dentro da mesma transação da mudança de modo. As disciplinas continuam no catálogo, e suas associações às grades de outros cursos são preservadas.
- A alteração de uma única turma continua separada da conversão do curso inteiro. Ela não modifica as demais turmas implicitamente.
- Editar nome, descrição e valores continua utilizando a API de edição existente. A conversão usa o cadastro já salvo; alterações pendentes precisam ser salvas ou canceladas antes da revisão.
- O erro ao excluir etapa oferece um acesso à revisão de sem grade, sem pedir para apagar matrículas ou turmas para liberar a configuração.
- Depois da conversão, a página não oferece criação de etapas nem seleção curricular. O cartão informa explicitamente “Sem grade” e apresenta “Ver curso e preços”.
- Textos novos em pt-BR, pt-PT, en-US, es-ES e fr-FR; temas claro, escuro e sistema.

## Preservação e escopo

A conversão não ignora registros acadêmicos, matrículas canceladas, contratos, snapshots, rematrículas, publicações de rede ou referências de outras instituições. Esses registros permanecem protegidos. A edição cadastral comum não solicita conversão. Professores divergentes dentro da mesma turma e horários incompatíveis são identificados, sem escolher ou descartar configurações silenciosamente.

Não há mudança de schema, migração ou flags. O aplicador altera somente arquivos numa nova pasta; não converte cadastros e não executa SQL, commit, push ou deploy. A mudança real de modo depende da revisão e confirmação do administrador no sistema publicado.

## Verificação

- Typecheck e build completos do projeto.
- 572 testes automatizados existentes e ampliados, incluindo os cenários de conversão integral.
- Chromium com páginas reais e APIs simuladas: cinco idiomas × três temas × computador/celular; edição normal, alterações pendentes, prévia sem gravação, cancelamento, confirmação, turmas listadas, atalhos e recusa por histórico. Fluxos próprios de cursos livres e preço por disciplinas preservados.
- 11 verificações com PostgreSQL real em banco isolado: mesma identidade e preços, três turmas com horários paralelos, nove disciplinas no catálogo e grade de outro curso preservadas; matrícula cancelada protegida; rollback integral confirmado e ausência de fixtures conferida.
- Aplicador validado com CRLF, reaplicação e rejeição de arquivo incompatível.

## Conferência no Preview

1. Usar banco isolado com um curso sem matrículas e várias turmas.
2. Abrir Cursos → Editar dados. Salvar uma alteração de nome sem mudar o modo.
3. Reabrir a edição e solicitar Revisar conversão. Conferir cada turma e seus horários.
4. Cancelar: nenhum modo, etapa ou turma deve mudar.
5. Revisar de novo e confirmar: turmas, professores, vagas, horários e preços permanecem; o curso passa a matrícula direta e a etapa sai da configuração.
6. Conferir a lista de turmas e o cadastro do curso após recarregar a página.

Não fazer merge antes da conferência no Preview com banco isolado.
