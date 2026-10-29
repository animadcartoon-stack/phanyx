# Conversão revisada de cursos e turmas avulsas — 29/10/2026

Base: main `cd37d453b91e5f7c45863827450f6ed20fd89fdf` (PR #155).
Branch: `fix/conversao-turmas-cursos-avulsos-20261029`.

## Comportamento

Na edição de uma turma curricular existente, o administrador escolhe entre curso com disciplinas e curso avulso sem disciplinas. O modo avulso retira da tela os controles de disciplinas/etapa e o salvamento tradicional; apresenta cursos de destino já habilitados para matrícula direta e horários próprios da turma. Professor, nome, código, ano, turno e capacidades usam os campos da edição. Horários completos das disciplinas selecionadas são sugeridos para revisão, sem duplicar intervalos iguais.

Revisar conversão consulta o servidor sem gravar. A confirmação mostra destino, quantidade de etapas e associações retiradas, disciplinas preservadas e encontros. Ao confirmar, o servidor verifica novamente os dados, bloqueia divergências da prévia e atualiza o mesmo cadastro da turma, mantendo seu ID. Somente ofertas e etapas estruturais sem uso dessa turma são retiradas. O catálogo, as grades de origem e as outras turmas são preservados. A turma convertida fica inativa e deve passar pela ativação existente antes de receber matrículas.

Na edição de curso, o novo comando de revisão permite converter uma estrutura ainda sem uso para matrícula direta. Usa os dados já salvos; outras alterações devem ser guardadas antes. Retira apenas as associações curriculares e etapas não utilizadas do curso. Disciplinas que pertenciam diretamente ao curso continuam no catálogo com o mesmo ID, sem curso direto, preservando suas associações às grades dos demais cursos. Nome, código, preços, parcelamento e demais propriedades do curso são mantidos.

Cursos que já possuem turmas, matrículas, períodos, documentos ou outros vínculos continuam bloqueados nesta conversão de curso. Disciplinas diretas com ofertas ou registros acadêmicos e estruturas de rede também bloqueiam. Na conversão de turma, o destino precisa já estar habilitado e sem grade. Não há conversão automática de históricos, nem liberação automática de cursos com turmas como o Balé.

## Segurança e concorrência

- Administrador autenticado, com instituição válida. As consultas de curso, turma e destino são limitadas à instituição; vínculos estruturais de outra instituição são rejeitados.
- Prévia e confirmação usam transações Serializable e bloqueios de linha. A confirmação exige a versão calculada a partir dos dados atuais e dos dados escolhidos; mudanças exigem nova revisão.
- Verificação de matrículas principais e diretas, itens, aulas, notas, módulos, atividades, provas, resultados, rematrículas, documentos, períodos e demais relações pertinentes.
- Contratações anteriores preservadas em snapshots JSON também bloqueiam. Não há exceção para registros cancelados ou históricos.
- Erros de integridade ou concorrência causam rollback; nenhum retry silencioso da conversão.
- Confirmação pelo modal PHANYX, com rolagem em telas pequenas. Não usa alert/confirm/prompt do navegador.
- Nenhuma alteração de cobrança, preço, contrato, flag de ambiente ou esquema de banco.

## Diagnóstico somente leitura em produção

Durante a investigação, o curso 34 de IA possuía uma etapa, dez associações curriculares, uma disciplina direta e nenhuma turma ou matrícula principal. A disciplina direta 98 também estava associada à grade de outros dois cursos. Essas grades precisam ser preservadas.

A turma salva E3M (28) pertence ao PEVI (18). O curso Avulso Robótica (20) foi habilitado pelo usuário para matrícula direta. A investigação não executou conversões, remoções de grade ou alterações de turma em produção.

## Verificação concluída

- Prisma Client gerado e typecheck completo aprovados.
- 484 testes automatizados aprovados, incluindo 52 novos testes de prévia, confirmação, isolamento, preservação do catálogo e rejeição de vínculos acadêmicos ou dados inválidos.
- ESLint dos arquivos alterados sem erros; quatro avisos de hooks preexistentes nas páginas.
- Navegador com páginas reais e APIs simuladas: modo avulso sem controles de disciplinas, seleção de curso, horários, prévia sem gravação, cancelamento, bloqueio 409, confirmação e recarga do cadastro nos cinco idiomas.
- Conferência visual do modal nos temas claro, escuro e sistema. Modal longo testado em viewport de 390×844, com rolagem e botão de confirmação acessível.
- Nenhum erro JavaScript ou diálogo nativo nos testes de interface.

## Verificação pendente antes do merge

Foi preparada a integração manual `tests/conversao-avulsos-integracao.cjs`, restrita ao banco isolado `br-blue-base-aclw74mj`. Cria somente registros fictícios dentro de uma transação e exige rollback integral ao terminar. Não usa DATABASE_URL do projeto. A conexão PostgreSQL deste ambiente falhou antes da criação das fixtures, inclusive na tentativa pelo proxy; portanto este teste não está aprovado.

Após o envio da branch, configurar o Preview com banco isolado e integrações externas desativadas e validar a gravação real, rollback, preservação de IDs, vínculo composto dos horários e integridade das grades de outros cursos. Não usar o Preview com banco de produção para esse teste. Build completo local/Preview também precisa ser confirmado antes do merge.

## Aplicação

O aplicador confere hashes de nove arquivos, normaliza CRLF e prepara uma nova pasta/branch a partir de origin/main. Preserva a pasta anterior e arquivos locais. Não copia .env e não executa SQL, migrações, alterações de flags, commit, push, deploy ou conversão de dados. A conversão será uma ação separada e explícita na interface, após publicação e confirmação do administrador.
