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
| Site público | Contato comercial e suporte abrem opções de e-mail no site, com acesso ao Gmail, Outlook, aplicativo de e-mail e cópia do endereço | Teste de regressão dos destinatários e botões |
| Documentos institucionais | Links de Política de Privacidade e Termos de Uso abrem páginas públicas com o canal pertinente. Enquanto provisórias, as páginas indicam o estado do documento e ficam fora do índice dos buscadores. | Testes de rotas e destinatários |

O editor administrativo remove linhas vazias no fim do modelo em uma única ação reversível. A limpeza preserva os elementos do documento e o espaçamento entre seções.

## Campos interativos em documentos

- O editor insere anexos em nova página nos modelos A4 e permite perguntas de escolha única configuráveis.
- A assinatura eletrônica do contrato exige as respostas obrigatórias e registra a opção escolhida na mesma transação da assinatura. O PDF usa o conteúdo emitido e marca as respostas gravadas.
- O PDF para assinatura presencial deixa as opções livres. O bloco de assinaturas automáticas aceita posição, largura e exibição de testemunhas.

## Defeito aberto
A Segoe Script solicitada no editor é substituída por Open Sans no Chromium do Preview atual. Não tratar como resolvido até verificar a fonte efetiva e o PDF. Não copiar fontes proprietárias nem alterar o catálogo silenciosamente.

## Central de Ajuda — navegação (25/11/2026)

Preservar os guias dos três perfis, os cinco idiomas, as imagens já existentes e o visualizador com zoom. A seção inicial de cada artigo informa o menu e seus rótulos, os botões dentro das páginas e o acesso por celular quando disponível. Os mapas são representações visuais, sem dados de clientes. Acesso direto é indicado quando não há caminho completo identificado no menu. A cobertura por artigo está em `central-ajuda-caminhos-auditoria.md`.

Cobertura: 10 testes de navegação, incluindo 1.045 versões dos artigos e checagem das rotas nos arquivos de origem. Verificação visual no navegador e novas capturas reais dos menus permanecem pendentes; os mapas não substituem a homologação de cada tela protegida.

## Central de Ajuda — apresentação para iniciantes (25/11/2026)

Preservar imagens de procedimentos existentes, os cinco idiomas, acesso em outra guia, zoom por roda/botões/teclado, retorno de foco e os textos de navegação. O catálogo de capturas revisadas separa os perfis e guarda hash e coordenadas; a imagem só é associada quando contém o destino correspondente. Configurações da Instituição usa passos por campo e exemplos fictícios. Figuras do menu não certificam a cobertura das funções. Conferências e pendências estão em `central-ajuda-ilustrada.md` e no relatório por guia.
