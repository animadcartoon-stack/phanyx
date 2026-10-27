# Troca entre semestral e anual com grade preservada

O administrador pode corrigir a organização de um curso em preparação entre SEMESTRAL e ANUAL, mesmo que já existam etapas e disciplinas. As etapas mantêm IDs, números, títulos, descrições, cargas e todos os vínculos de disciplinas. Apenas o tipo das etapas acompanha o novo tipo do curso. Etapa 1 continua sendo etapa 1; não ocorre agrupamento ou divisão automática de etapas.

A alteração das etapas ocorre dentro da mesma transação serializável que grava o curso. Qualquer falha, inclusive quantidade prevista inferior à numeração existente, reverte a operação inteira. Preços, parcelas, participação e faixas de combo seguem os mesmos campos financeiros da edição; nenhuma regra de desconto é recalculada ou recriada pela conversão. As faixas por quantidade de disciplinas também são preservadas.

A troca permanece bloqueada quando há turmas, matrículas de qualquer situação, períodos de matrícula, rematrículas, snapshots de contratação ou publicações na rede. Não se modifica histórico acadêmico. Cursos recebidos da rede continuam com a estrutura controlada pela origem. A operação restringe a leitura e a alteração à instituição e ao curso selecionado.

Se houver apenas disciplinas diretas, ainda sem grade, é preciso organizá-las em etapas antes da troca; o sistema não adivinha sua distribuição. Mudanças de/para LIVRE conservam a proteção anterior, pois também envolvem regras financeiras próprias.

A edição mostra orientação sobre preservação da grade e recarrega curso e etapas após o sucesso. Erros ficam visíveis até a próxima ação, em vez de desaparecer após 3,5 segundos. Mensagens nos cinco idiomas.

Sem alteração de schema ou migração. Teste: `node --test tests/conversao-organizacao-curso.test.cjs`. Testes de handler com banco simulado, incluindo rollback, isolamento, combo e faixas de disciplinas. O build completo e PostgreSQL real devem ser verificados antes da publicação.
