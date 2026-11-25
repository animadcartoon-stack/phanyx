# Inventário inicial de funcionalidades protegidas

Estado: inventário inicial, não certificado como homologado. Expandir por módulo e registrar evidências de testes. A presença de uma funcionalidade nesta lista não comprova seu funcionamento atual.

| Área | Comportamentos a preservar | Cobertura inicial |
|---|---|---|
| Editor administrativo | Botão flutuante PDF, prévia automática, modal PDF, rascunho, fontes, tamanhos, HEX, negrito, itálico, sublinhado, marca-texto, alinhamento, listas, tabelas, imagens, réguas, margens e paginação | Contratos estáticos e testes existentes; homologação visual pendente |
| Documentos | Variáveis formatadas, assinaturas, uma/duas vias, seis timbrados, período personalizado | Testes existentes; fidelidade de fonte no Chromium pendente (defeito conhecido) |
| Docentes | Turmas com/sem disciplina, chamadas, planejamento, cobertura, documentos, anexos, assinaturas | Inventário inicial; ampliar testes ponta a ponta |
| Discentes | Acesso às turmas, notas, frequência, documentos, biblioteca e comunicação | Inventário inicial; ampliar testes ponta a ponta |
| Acadêmico | Matrícula, rematrícula, cursos, turmas, optativas, transferências, cancelamentos | Inventário inicial; ampliar testes ponta a ponta |
| Financeiro | Planos, descontos, boletos, baixa, contratos e histórico | Inventário inicial; ampliar testes ponta a ponta |
| Transversal | Cinco idiomas, temas, responsividade, autenticação, permissões e isolamento institucional | Inventário inicial; ampliar testes ponta a ponta |

O editor administrativo remove linhas vazias no fim do modelo em uma única ação reversível. A limpeza preserva os elementos do documento e o espaçamento entre seções.

## Defeito aberto
A Segoe Script solicitada no editor é substituída por Open Sans no Chromium do Preview atual. Não tratar como resolvido até verificar a fonte efetiva e o PDF. Não copiar fontes proprietárias nem alterar o catálogo silenciosamente.
