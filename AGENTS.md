# PHANYX — regras de preservação de funcionalidades

Estas regras se aplicam aos três portais e a todos os módulos.

- Antes de editar, leia docs/FUNCIONALIDADES_PROTEGIDAS.md e docs/CHECKLIST_HOMOLOGACAO.md. Identifique o comportamento atual, dependências e testes afetados.
- Trabalhe em branch baseada na main atual. Não restaure arquivos antigos inteiros para corrigir um detalhe. Não remova ferramentas, permissões, traduções, rotas, dados ou comportamentos sem autorização explícita.
- Faça alterações mínimas, preserve mudanças de terceiros, não execute migrações em produção sem aprovação e nunca use dados reais em testes automatizados.
- Adicione um teste que reproduza cada defeito antes de corrigi-lo; execute os testes existentes pertinentes e npm run test:regressao. Não enfraqueça testes para fazer o CI passar.
- Para PDF, confira fonte efetivamente renderizada, tamanho, estilos, cor, paginação e assinatura. Não substitua fontes silenciosamente. A presença do CSS não prova fidelidade do PDF.
- Preserve os cinco idiomas, temas, uso móvel, segurança multi-instituição, acessibilidade e os componentes de modal/toast existentes.
- Informe arquivos modificados, testes executados, resultados e limitações. Não declare homologada uma função que não foi testada.
- Somente publique após CI aprovado, teste de Preview e autorização para merge. Atualize o inventário e checklist quando acrescentar funcionalidades.
