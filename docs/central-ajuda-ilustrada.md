# Manual ilustrado para iniciantes — trabalho em andamento

Esta etapa prepara a apresentação didática e as primeiras ilustrações. **Não representa a conclusão do pedido de ilustrar e explicar todas as páginas e funções.** O relatório por guia está em `central-ajuda-ilustrada-cobertura.md`.

## Alterações desta etapa

- Quatorze capturas reais, recortadas para mostrar somente menus dos três portais, sem fotos, nomes, contatos, dados acadêmicos ou credenciais.
- Figuras de navegação para 166 dos 209 artigos. O retângulo destaca o grupo e a opção correspondente ao guia; quando não há uma captura revisada do destino, o sistema não inventa uma imagem.
- Instruções básicas em cinco idiomas explicam clique simples, rolagem, campos, abas e como voltar à guia do manual.
- Configurações da Instituição foi reescrita em 26 passos, com 27 figuras focadas em campos e botões. Elas reutilizam os exemplos fictícios da Escola Horizonte; os destaques e recortes são camadas da página, sem alterar os pixels da interface.
- O guia distingue selecionar uma imagem pela primeira vez de editar uma imagem existente: o lápis abre o menu e a opção Trocar abre a seleção de arquivo.
- O visualizador mantém o retângulo alinhado no zoom, abre a região indicada e permite roda do mouse, botões, teclado e retorno ao mesmo passo ao fechar.
- As capturas novas de menu estão em português do Brasil. Os outros idiomas informam isso expressamente; não foram produzidas cinco séries traduzidas de capturas nesta etapa.

## Conferências

- Teste da falta de imagens anotadas reproduzido antes da alteração.
- 17 testes específicos passaram, incluindo 1.045 versões dos artigos, dimensões das imagens, hashes dos arquivos revisados, limites dos recortes, separação dos perfis e comportamento dos destaques no zoom.
- Lint aprovado com os avisos preexistentes.
- Suíte geral: 827 testes, 821 aprovados, cinco falhas e um ignorado. As cinco falhas também ocorrem nos testes correspondentes da base `80e861d`, sem esta alteração. Não foram modificados esses testes ou fluxos.
- Typecheck encerrado pelo ambiente com `Killed` (código 137); não certificado.
- Prévia local conferida em português no computador: os campos e seus retângulos ficaram legíveis, o zoom abriu em 200%, o teclado ampliou a 250%, a roda do mouse chegou a 331%, e Escape fechou o diálogo e devolveu o foco à figura Nome fantasia.
- `central-ajuda-ilustrada-previa.jpg` e `central-ajuda-ilustrada-zoom.jpg` mostram esses estados da prévia.
- Uma varredura OCR dos 81 arquivos de imagens de procedimentos referenciados não encontrou as marcas e nomes pessoais conhecidos procurados. OCR não substitui a revisão visual de todas as imagens antigas.
- Houve instabilidade intermitente no navegador: algumas capturas não correspondiam ao recorte solicitado. Esses arquivos foram descartados. Somente os recortes conferidos visualmente entram no catálogo e têm hash registrado.

## O que ainda falta

Há 36 artigos com alguma imagem de procedimento e **173 sem imagens de procedimento**. Ter uma figura não demonstra que todos os campos, botões e estados estejam explicados. A revisão completa de cada fluxo permanece pendente, inclusive nas páginas que já tinham imagens.

A conta docente de demonstração não exibia todas as entradas (por exemplo, Documentos); a Biblioteca administrativa exibia apenas Visão geral. Não foram ampliadas permissões, contratados módulos, alterados cadastros ou geradas credenciais para contornar essas limitações. O menu do aluno no tema claro apresentou contraste insuficiente; a captura usada foi feita no tema escuro e o tema anterior foi restaurado. Esse problema da aplicação precisa de uma correção própria.

Faltam ainda a revisão visual em celular e nos demais idiomas, a validação externa de build/Preview e o aceite do conteúdo completo antes da publicação. Esta etapa não foi publicada em produção.

## Preservação e reversão

As alterações ficam nos arquivos de ajuda, imagens, documentação e testes. Não há migração, variável de ambiente, alteração de permissão ou gravação em registros da produção. A branch parte de `6f7f8fc`, sobre a main `80e861d`, e acrescenta esta etapa ao trabalho de caminhos de menu já enviado pelo responsável. Para reverter, reverta apenas o commit desta etapa, preservando o trabalho anterior.
