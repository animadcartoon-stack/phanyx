# Checklist antes de publicar

- [ ] Branch baseada na main atual; escopo e arquivos afetados revisados.
- [ ] Teste reproduz o defeito e passa após correção; nenhum teste removido para mascarar falha.
- [ ] npm run test:regressao, npm run lint e npm run typecheck aprovados; build do Preview aprovado.
- [ ] Teste de navegação, permissões, isolamento institucional e fluxos diretamente relacionados.
- [ ] Interface em desktop e celular, temas e cinco idiomas, quando afetados.
- [ ] Editor: botão flutuante, prévia automática, rascunho, seleção e formatação, tabelas e assinatura.
- [ ] Editor: limpar o fim de um modelo com uma folha vazia, conferir a prévia e usar Desfazer para restaurar as linhas removidas.
- [ ] PDF: comparar editor, prévia e documento final; conferir fonte efetiva (CDP ou fontes incorporadas), tamanho, cor, peso, estilo, paginação e timbrado. Usar dados fictícios em ambiente isolado.
- [ ] Registrar falhas conhecidas, evidências, riscos e procedimento de reversão. Não mascarar regressão preexistente como sucesso.
- [ ] Aprovação explícita antes de merge; CI obrigatório configurado no GitHub.
