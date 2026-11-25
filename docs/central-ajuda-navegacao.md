# Caminhos de acesso na Central de Ajuda

A alteração adiciona “Como chegar a esta tela” antes das instruções de cada artigo. O caminho deixa de depender de conhecer previamente o menu: explica a lateral esquerda, a posição de Configurações no final do menu, a expansão das seções e os rótulos reais dos itens. Os caminhos internos indicam o botão ou cartão que abre a tela após entrar na página principal.

O catálogo contém 209 artigos em cinco idiomas (1.045 versões). Há 187 caminhos pelo menu, sete acessos ao site/login, 11 acessos diretos e quatro casos específicos (tema, idioma, notificações e contratação da biblioteca). Os controles especiais têm mapas próprios. As opções de celular derivam da navegação móvel existente; quando não há atalho, o guia oferece um link que abre a tela em outra guia do navegador. A assinatura e as permissões da instituição continuam determinando o acesso.

Os mapas visuais reproduzem os nomes e a ordem do menu usando texto legível e destacam a opção que deve ser selecionada. São diagramas, não capturas de uma sessão autenticada. Os prints de formulários já existentes e o zoom foram preservados. Não foram usados dados reais e não houve gravação em cadastros, alterações de permissões ou migrações.

## Verificação realizada

- A regressão do primeiro acesso à instituição foi reproduzida na base sem a alteração.
- Os dez testes específicos passaram, incluindo a renderização de todas as versões dos artigos, imagens referenciadas, nomes dos controles e links em nova guia.
- 1.155 rotas normais da ajuda foram renderizadas com status 200, incluindo diretórios e pesquisa.
- A auditoria de imagens encontrou 31 dos 202 guias ampliados com pelo menos uma imagem existente; 171 ainda não possuem prints. O novo mapa não foi contado como screenshot.
- `npm run lint` terminou com código 0 e avisos preexistentes.
- A suíte geral registrou 817 testes: 811 aprovados, cinco falhas, um ignorado. Os cinco arquivos com falhas foram executados separadamente contra a main sem a alteração (103 testes: 98 aprovados, as mesmas cinco falhas).
- `npm run typecheck` foi interrompido pelo ambiente com `Killed`. Não foi declarado aprovado.
- A prévia visual e novas capturas dos menus não puderam ser concluídas: houve bloqueio inicial por limite de uso e, após o acesso voltar, falhas de navegação do navegador de testes. Não foi usada uma ferramenta alternativa para contornar o bloqueio.

## Arquivos e revisão

`navigation-menus.json` guarda os rótulos e as rotas observados nos menus reais; `navigation-actions.json` registra botões internos com seus arquivos de origem; `navigation-details.json` identifica seções e abas; os módulos `navigation` e `navigation-copy` resolvem e traduzem as instruções. `render.mjs` e `style.css` exibem a seção e o mapa. A auditoria completa está em `central-ajuda-caminhos-auditoria.md`.

A prévia local é `central-ajuda-navegacao-previa.html`, com CSS, JavaScript e imagens incorporados para abrir sem servidor. Os links para o PHANYX e outros guias apontam para a versão pública atual, sem publicar esta alteração.

A aplicação não exige variáveis de ambiente nem migração de banco. Publicar somente após o fluxo normal de CI e Preview; as falhas e verificações pendentes acima precisam ser consideradas pelo responsável. Para reverter, reverta apenas o commit desta alteração, preservando os ajustes anteriores de prints e zoom.
