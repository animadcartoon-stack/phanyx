# Capturas fictícias e ampliação na Central de Ajuda

## Alteração

As capturas de instituição, visibilidade dos portais e apoio docente foram refeitas com a marca fictícia **Escola Horizonte** e dados demonstrativos. Os arquivos antigos dessas capturas foram removidos dos assets públicos, além de suas referências nos guias. Os novos arquivos usam o prefixo `demo-`, evitando reutilizar no artigo o endereço das imagens antigas em cache.

As telas de demonstração reutilizaram os componentes React e os textos da aplicação. Formulários da instituição foram apresentados em trechos separados (identificação, localização e responsáveis), sem reconstruir rótulos com inteligência artificial. Nenhum cadastro ou configuração foi gravado em uma instituição real. CNPJ, telefone e assinatura reais não foram usados; o e-mail de exemplo usa o domínio reservado `example.com`. A marca foi criada somente para o material didático.

As imagens de instituição, portais, acesso docente, planejamento, desenvolvimento, exigências, substituições, publicações, documentos docentes e editor passaram a usar dados fictícios. A legenda dos cinco idiomas identifica essas demonstrações; os rótulos das capturas continuam em português brasileiro.

O visualizador agora ocupa a janela disponível, permite zoom de 10% a 800%, roda do mouse, botões, tamanho original, ajuste à tela e arraste para navegar. O tamanho original conserva a resolução disponível: ampliar além dele não acrescenta detalhes ao arquivo. `+`/`-` ampliam/reduzem, `0` ajusta e `Esc` fecha. O foco volta à imagem acionada.

## Verificação

- Teste no navegador: abrir, ampliar pelos botões, ampliar pela roda, arrastar em ambos os eixos, tamanho original, ajuste, Escape e retorno do foco.
- Renderização e referências de imagens de todas as rotas da ajuda nos cinco idiomas.
- Auditoria de arquivos ausentes e revisão das capturas substituídas.
- O zoom funciona para as capturas dos três perfis; não depende do portal aberto.

## Limites de cobertura

Esta alteração corrige privacidade e leitura das capturas existentes. Não conclui a ilustração de todo o catálogo: 31 dos 202 guias têm pelo menos uma imagem e 171 continuam sem imagens. Mesmo entre os 31, há fluxos e estados ainda sem ilustração. O inventário completo está em `docs/central-ajuda-cobertura-prints.md`.

## Publicação

Não exige migração de banco nem alteração de variáveis de ambiente. Publicar a branch pela rotina normal de pull request e deploy. Os arquivos removidos podem continuar em caches antigos até sua expiração; as páginas novas apontam apenas para os novos nomes.
