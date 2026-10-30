# Cursos no menu e edição explícita dos dados

## Problema e resultado

O catálogo de cursos não aparecia no menu Acadêmico e o acesso aos dados cadastrais era apresentado como “Montar grade curricular”.

- O menu Acadêmico agora inclui Cursos, no computador e no celular, com destaque para a rota atual e suas páginas no menu lateral.
- Cada cartão tem o acesso principal “Editar dados”, que abre o formulário existente já em edição e posiciona a página nos dados do curso.
- A grade curricular continua com seu acesso separado. As ações de polos, exclusão e restauração permanecem disponíveis como antes.
- Cursos recebidos da rede usam “Configurar valores locais” e preservam os bloqueios dos campos acadêmicos.
- Os acessos e rótulos estão traduzidos em pt-BR, pt-PT, en-US, es-ES e fr-FR. O novo botão e a ação secundária acompanham os temas existentes.

## Escopo

Mudança de navegação e apresentação em três componentes e cinco catálogos de tradução. O parâmetro `editar=1` apenas abre o formulário: nenhum dado é gravado ao navegar. Salvar continua utilizando a API e as validações existentes. Nenhum SQL, migração, alteração de flags, conversão de cursos ou turmas foi executado pelo aplicador.

## Verificação

- Typecheck do projeto.
- 13 testes existentes do comportamento de sessão do AdminShell.
- 32 cenários com os componentes reais em Chromium e APIs simuladas: cinco idiomas × três temas × computador/celular; abertura direta; links separados; cancelamento sem gravação; salvamento pela API existente; URL antiga em visualização; restrições de curso recebido da rede.
- Inspeção visual dos botões em tema claro e escuro, no computador e no celular.
- Build completo do projeto e `git diff --check`.
- Verificação do aplicador com base em CRLF, repetição sem mudanças extras e rejeição de arquivo incompatível.

## Conferência após publicação

1. Atualizar o navegador e abrir Acadêmico → Cursos.
2. Clicar em Editar dados no curso desejado e conferir os campos preenchidos.
3. Cancelar para manter o cadastro ou usar Salvar alterações para gravar.
4. Conferir separadamente o acesso à grade curricular e, no celular, o menu Acadêmico.

O build e os testes de interface não substituem a conferência do Preview publicado antes do merge.
