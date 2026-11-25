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

## Campos interativos e anexos

- [ ] Adicionar três escolhas ao Anexo IV de um contrato fictício. Conferir a quebra entre contrato e anexo e imprimir com todas as opções em branco.
- [ ] Tentar assinar com pergunta obrigatória em branco. Assinar depois com respostas mistas e conferir a marcação no PDF. Reabrir o link e a via administrativa.
- [ ] Arrastar o bloco automático para antes e depois do anexo. Conferir as três assinaturas, a largura, a opção de testemunhas e a ausência de duplicação.
- [ ] Aplicar a migração de respostas no banco de Preview, com dados fictícios, antes de testar o fluxo completo.
