# Central de Ajuda: expansão do manual

A atualização adiciona 202 guias editoriais em cinco idiomas, organizados por módulo. Os guias anteriores mantêm seus endereços. As páginas são públicas e renderizadas no servidor; o sitemap inclui os guias e os índices dos módulos.

## Conteúdo e manutenção

- `lib/central-ajuda/manual.json`: identificação, rota funcional, perfil, módulo, textos e referência de campos por idioma.
- `lib/central-ajuda/manual-ui.json`: títulos de módulos e elementos de navegação.
- `lib/central-ajuda/manual.mjs`: adaptação do catálogo para a interface existente.
- `lib/central-ajuda/guide-images.mjs`: associação dos prints aos artigos.

Os textos foram confrontados com as páginas, componentes, traduções e regras do repositório. As referências de controles complementam as instruções; rótulos sem descrição não constituem explicação individual completa. A revisão editorial detalhada deve continuar nas operações mais complexas.

## Cobertura

Configuração inicial; acadêmico; coordenação e documentos docentes; atividades externas; documentos, crachás e certificados; comunicação; financeiro; RH; biblioteca; mobilidade; comercial; integrações; conta, idiomas e temas; portais do professor e aluno.

O roteiro inicial orienta instituição → departamentos e cargos → permissões → funcionários. Os guias distinguem as ações de administrador, professor e aluno. Substituições usam a conta própria do substituto e o vínculo temporário, sem compartilhar senha do titular.

## Prints e pendências

Foram adicionados 22 prints reais: quatro seções da criação de atividade externa em cada um dos cinco idiomas, cadastro de departamentos/cargos e permissões em português do Brasil. Os prints anteriores foram preservados e identificados como exemplos de interface anterior quando aplicável.

Ainda faltam prints das telas internas de uma atividade externa cadastrada e de outras operações complexas, incluindo todas as configurações de turmas, certificados, RH e financeiro. Não há atividade externa cadastrada na instituição consultada. A sessão administrativa encerrou durante a continuação da captura. Não foram criados registros reais para ilustrar o tutorial.

## Comercial

A antiga rota `/admin/funcionarios/comercial` exibia uma página estática com indicação de implantação e indicadores vazios. Agora encaminha para o painel existente `/admin/comercial`, preservando a proteção de acesso do aplicativo.

Foram revisados destinos de navegação e traduções das telas comerciais. Não foram executadas cobranças, pagamentos, envios de e-mail, integrações externas ou lançamentos de comissão. Fluxos dependentes de provedores e credenciais exigem validação em ambiente configurado; a revisão não certifica todas as transações comerciais.

## Verificação

- TypeScript sem erros.
- ESLint da alteração funcional sem avisos.
- Renderização de 1.150 URLs de ajuda, com rotas únicas, canonical, âncoras válidas e arquivos de imagem existentes.
- Rotas Next.js, busca e sitemap exercitados localmente durante a implementação.

A preparação local não publica a atualização. A disponibilização depende de envio da branch, revisão/merge e implantação de produção bem-sucedida.
