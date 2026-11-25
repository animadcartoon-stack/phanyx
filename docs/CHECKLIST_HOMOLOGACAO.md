# Checklist antes de publicar

- [ ] Branch baseada na main atual; escopo e arquivos afetados revisados.
- [ ] Teste reproduz o defeito e passa após correção; nenhum teste removido para mascarar falha.
- [ ] npm run test:regressao, npm run lint e npm run typecheck aprovados; build do Preview aprovado.
- [ ] Teste de navegação, permissões, isolamento institucional e fluxos diretamente relacionados.
- [ ] Interface em desktop e celular, temas e cinco idiomas, quando afetados.
- [ ] Editor: botão flutuante, prévia automática, rascunho, seleção e formatação, tabelas e assinatura.
- [ ] PDF: comparar editor, prévia e documento final; conferir fonte efetiva (CDP ou fontes incorporadas), tamanho, cor, peso, estilo, paginação e timbrado. Usar dados fictícios em ambiente isolado.
- [ ] Registrar falhas conhecidas, evidências, riscos e procedimento de reversão. Não mascarar regressão preexistente como sucesso.
- [ ] Aprovação explícita antes de merge; CI obrigatório configurado no GitHub.

## Central de Ajuda — revisão de caminhos (25/11/2026)

- [x] Branch atualizada a partir da main `80703c0`; alterações restritas à ajuda, auditoria e testes.
- [x] Teste do defeito falha na base sem a correção (primeiro acesso à instituição não explica o menu).
- [x] Dez testes específicos aprovados; 209 artigos em cinco idiomas, rotas de origem e assets conferidos.
- [x] `npm run lint` aprovado com avisos já presentes no repositório.
- [ ] `npm run test:regressao` integral verde: 811 aprovados, cinco falhas e um ignorado. As mesmas cinco falhas se reproduzem nos arquivos da main sem esta alteração.
- [ ] `npm run typecheck`: processo encerrado pelo ambiente (`Killed`); resultado não certificado.
- [ ] Build externo e teste visual de Preview. O navegador de testes não concluiu o carregamento da prévia; nenhuma nova captura de menu foi certificada.
- [ ] Revisão do responsável e aprovação antes de merge/publicação.

As cinco falhas preexistentes ficam em `academico-grade-ofertas`, `avulsos-sem-grade-rotas-legadas`, `certificados-logo-qr-validacao`, `desconto-pontualidade` e `matricula-mesma-tela-fonte`. Esta alteração não modifica esses fluxos nem enfraquece seus testes. Usar `docs/central-ajuda-navegacao-previa.html` como prévia local, sem tratá-la como evidência de homologação visual.

## Manual para iniciantes — etapa ilustrada (25/11/2026)

- [x] Capturas novas revistas sem identificação pessoal, separadas por perfil e com hash registrado.
- [x] 17 testes específicos aprovados; 1.045 versões dos artigos conferidas.
- [x] Instituição com 26 passos e 27 recortes de exemplos fictícios.
- [x] Prévia local conferida em português no computador, incluindo zoom por teclado e roda, Escape e retorno de foco.
- [x] Lint aprovado com avisos já presentes.
- [ ] Suíte geral verde: 821 aprovações, cinco falhas preexistentes e um ignorado.
- [ ] Typecheck: processo encerrado pelo ambiente, código 137.
- [ ] Todos os procedimentos ilustrados e explicados: 173 artigos ainda sem imagens do procedimento; a revisão de completude de todos os fluxos está pendente.
- [ ] Conferência em celular e demais idiomas; build/Preview externo; autorização para merge/publicação.

Não considerar concluído o pedido de manual completo apenas porque 166 artigos receberam prints do caminho pelo menu.
