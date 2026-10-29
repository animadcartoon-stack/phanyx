# Conversão conjunta no próprio curso — 29/10/2026

Base: main `0898634818dd2ffbfad5763f2383c665f3d5d285` (PR #157).
Branch: `fix/conversao-mesmo-curso-20261029`.

## Problema e comportamento

Na edição da turma do Avulso Balé, o modo sem disciplinas exigia selecionar um curso de destino já habilitado. O próprio Balé não aparecia porque ainda tinha uma etapa e sua turma curricular; a conversão isolada do curso também bloqueava essa turma. O botão Revisar conversão ficava desabilitado.

O curso atual passa a aparecer selecionado. A prévia pode propor a conversão conjunta do curso e da turma, mantendo ambos os IDs e o vínculo entre eles, quando esta for a única turma do curso e todas as verificações de ausência de uso acadêmico passarem. A confirmação inclui o efeito sobre o curso, as etapas, os vínculos curriculares e o catálogo. Somente a confirmação grava; a turma permanece inativa para revisão antes da ativação existente.

Uma função interna reutiliza os bloqueios da conversão de curso. A exceção à contagem de turmas só é aplicada após verificar a turma exata, o mesmo curso e a mesma instituição. Ofertas da própria turma podem ser retiradas; ofertas de disciplinas diretas em outras turmas continuam bloqueando. Catálogo, IDs, preços, parcelamento e associações às grades de outros cursos são preservados.

Cursos com outras turmas, matrículas, contratos, documentos, períodos ou outros vínculos continuam bloqueados. A conversão isolada de curso mantém os bloqueios anteriores. Para mudar para outro curso, o destino precisa já estar habilitado para matrícula direta. Não há mudança de esquema, preços, cobranças ou flags.

## Verificação

- Typecheck completo aprovado.
- 492 testes automatizados aprovados, incluindo oito novos casos de conversão conjunta, versão da prévia e bloqueios.
- ESLint sem erros nos arquivos alterados; três avisos de hooks preexistentes em Turmas.
- Onze cenários de navegador aprovados com páginas reais e APIs simuladas: seleção inicial do próprio curso, revisão, confirmação nos cinco idiomas e preservação do fluxo anterior. Sem erros JavaScript ou diálogos nativos; modal conferido nos três temas.
- Integração Prisma real no banco isolado `br-blue-base-aclw74mj`: conversão conjunta com disciplina direta e catálogo compartilhado, bloqueio por segunda turma, IDs e preço preservados. Rollback integral confirmado.
- Prévia do caso Balé existente na cópia isolada: curso 28 e turma 31 elegíveis à revisão conjunta; nenhum deles foi convertido nessa conferência.
- Nenhuma gravação, conversão, SQL de alteração, migração ou troca de ambiente em produção.

Build completo no Windows e Preview ainda precisam ser conferidos para este complemento antes do merge. O aplicador prepara uma nova pasta sem copiar .env ou executar banco, commit, push ou deploy.
