# Carregamento de Turmas e atualização do chat

A tela de Turmas fazia cinco chamadas iniciais: turmas, disciplinas, cursos com grade, polos e professores. A lista de professores trazia cadastro de usuário, vínculos de RH e até 50 registros de remuneração por professor, embora o seletor use somente identificação e nome. O chat continuava consultando mensagens a cada cinco segundos depois de fechado.

## Alterações

- Uma chamada inicial a `/api/admin/turmas/painel` reúne os dados utilizados pela tela, com uma validação de sessão. As consultas de catálogos são paralelas. As rotas completas continuam disponíveis aos demais módulos.
- Relacionamentos recebem seleção de campos. Dados de RH, credenciais e preços não são necessários nesse painel. Permanecem disponíveis nos cadastros correspondentes.
- A grade mantém organização anual/semestral, número da etapa e IDs das disciplinas. Turmas conservam seus campos de edição, ofertas, professores, datas, horários ativos e ocupação por matrículas distintas não canceladas. Turmas legadas sem curso direto mantêm a identificação do curso pela primeira disciplina.
- Salvar/excluir atualiza somente turmas e ocupação; não recarrega os quatro catálogos.
- O seletor de polo usa os polos locais da instituição, em vez da resposta de gestão de instituições em rede, cujo formato não correspondia ao esperado pela tela.
- A leitura respeita o perfil administrativo e o escopo da instituição. O catálogo de disciplinas conserva a restrição administrativa existente; cursos continuam disponíveis aos funcionários. As APIs de escrita e validações acadêmicas não mudam.
- O chat consulta mensagens somente com a conversa aberta e a aba visível. Ao retornar, consulta imediatamente. Cada ciclo aguarda o pedido anterior; fechar/trocar de conversa cancela o pedido do ciclo. Presença, notificações e envio de mensagens/anexos continuam disponíveis.
- Falhas no carregamento inicial são informadas nos cinco idiomas. Sair da tela cancela a consulta pendente.

## Validação

109 testes passaram, incluindo 14 novos cenários sobre dados necessários à edição, grade anual/semestral, horários, contagem de vagas, isolamento institucional, permissões, recarga parcial e atualização do chat.

Comandos:

```text
node --test tests/verificar-migracao-organizacao.test.cjs tests/academico-grade-ofertas.test.cjs tests/turma-isolamento-integridade.test.cjs tests/combos.test.cjs tests/painel-turmas-desempenho.test.cjs
npm run typecheck
npm run lint
```

TypeScript e lint passaram; lint mantém avisos existentes de imagens e dependências de hooks. A compilação otimizada de produção passou (`npm run build:next`); o build completo parou na coleta de páginas da biblioteca por ausência de `R2_ACCOUNT_ID` neste ambiente. A validação completa da publicação depende do ambiente configurado.

## Publicação e medição

Sem dependências novas, alterações no schema ou migração de banco. O pacote aplica o commit em uma pasta separada, confere integridade e envia uma branch para revisão. Não integra o PR nem publica automaticamente.

A redução comprovada é de cinco para uma chamada inicial de dados de Turmas, além da retirada de dados não utilizados e das consultas de mensagens com o chat fechado/aba oculta. Isso não equivale a uma medição de tempo em produção. Após a publicação, comparar abertura autenticada de Turmas, navegação e edição no navegador afetado, confirmar chamadas e carga transferida na rede, testar retorno ao chat e observar responsividade. Esta etapa não demonstra a causa única de uma página sem resposta nem encerra a avaliação de desempenho dos demais módulos.
