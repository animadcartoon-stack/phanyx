# Lentidão geral do Admin: controle de atividade

## Evidências

A gravação enviada em 22/10 mostra navegação e rolagem lentas no painel e em Turmas. O usuário informou que a lentidão afeta o PHANYX inteiro e que o desempenho anterior já era satisfatório.

A comparação com o commit `af95ac5` (otimização inicial do Admin, 08/10) confirmou que as otimizações do dashboard e de suas consultas continuam presentes. A camada de inatividade foi alterada posteriormente para preservar a atividade entre abas e separar a sessão do editor. Nesse fluxo, cada movimento do mouse e rolagem passou a executar `localStorage.getItem` e cancelar/recriar o temporizador de cinco minutos. Essa é uma fonte verificável de trabalho síncrono em todas as páginas que usam AdminShell; ainda não está comprovado que seja a causa única da lentidão recente.

No banco de produção, a inspeção somente de leitura não encontrou locks aguardando e observou 17 conexões de um limite de 901. Isso é uma amostra pontual, sem histórico de duração das consultas; a extensão de estatísticas não está instalada e não foi instalada nesta investigação. No navegador de teste, Alunos e Disciplinas abriram, e Alunos carregou seu registro. O travamento intenso da gravação não foi reproduzido. Esses testes não são medições do navegador do usuário.

## Correção

- Manter o instante da última atividade na memória da aba.
- Ler o instante compartilhado uma vez ao iniciar; receber atualizações de outras abas pelo evento `storage`.
- Preservar as escritas compartilhadas limitadas a uma por segundo.
- Manter um temporizador pendente, que confere a última atividade antes de encerrar ou reagendar. Movimentos do mouse, teclado, cliques e rolagem não recriam esse temporizador.
- Preservar o prazo de cinco minutos, as referências de sessão enviadas no logout, o tratamento de sessão substituída (409), as tentativas após falha temporária, a limpeza dos eventos e a sessão separada do editor.

## Comparação reproduzível

O efeito real de AdminShell foi executado com relógio e armazenamento controlados, antes e depois da alteração, com a mesma sequência de dez mil eventos de movimento:

| Trabalho | Versão publicada | Corrigida |
| --- | ---: | ---: |
| Leituras de armazenamento durante os movimentos | 10.000 | 0 |
| Temporizadores criados durante os movimentos | 10.000 | 0 |
| Leituras totais, incluindo início | 10.002 | 1 |
| Temporizadores totais, incluindo início | 10.001 | 1 |

Isso mede operações eliminadas, não a velocidade real em produção.

## Verificação

122 testes passaram: 13 novos casos exercitam o efeito real de inatividade, incluindo carga de eventos, prazo exato, última atividade perto do vencimento, sincronização entre abas, isolamento do editor, valores inválidos, sessão substituída, falhas temporárias e desmontagem. Os demais 109 testes de turmas, grade, organização anual/semestral, combos e migrações também passaram.

TypeScript passou. Lint do arquivo alterado passou com os avisos preexistentes de hooks e imagem. A compilação otimizada passou; o build completo parou na coleta de páginas por ausência de R2_ACCOUNT_ID neste ambiente, como na etapa anterior. A publicação precisa concluir a verificação no ambiente configurado da Vercel.

Sem migração, dependência nova ou alteração de política de acesso. A correção é do AdminShell; não afirma resolver todos os portais. Após publicar, verificar navegação e rolagem no navegador afetado, uma aba e múltiplas abas, além do encerramento por inatividade. Se persistir a demora, coletar uma medição de rede/renderização no navegador afetado para identificar a etapa que bloqueia; não atribuir a causa à internet com base apenas na gravação.
