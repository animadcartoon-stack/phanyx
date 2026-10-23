# Mensalidade por quantidade de atividades

No cadastro e na edição do curso, **Valores para combos (Opcional)** começa recolhido. Abrir a seção não habilita o combo: a participação é uma escolha independente. A tabela permite cadastrar uma mensalidade individual do curso para cada quantidade exata de atividades participantes.

Exemplo: Robótica custa R$ 240 avulsa, R$ 200 em um combo com 2 atividades e R$ 180 com 3. Outro curso possui sua própria tabela. Ao selecionar duas modalidades participantes, o cálculo soma o preço de cada curso para a quantidade 2. Cada curso/modalidade equivale a uma atividade; disciplinas internas não acrescentam atividades à contagem.

- Cursos sem participação não aumentam a contagem e são cobrados avulsos.
- Quantidades não cadastradas usam a mensalidade avulsa daquele curso. Os preços não são estendidos para outras quantidades.
- As taxas de matrícula continuam sendo as cadastradas nos cursos. Um pacote já existente pode definir sua taxa única.
- A tabela funciona sem cadastrar um pacote separado. Os pacotes existentes continuam disponíveis; o cálculo escolhe a opção elegível com menor total contratual.
- Quantidades precisam ser inteiras entre 2 e 100 e não podem se repetir. Valores aceitam até duas casas decimais e zero explícito.
- A quantidade de mensalidades precisa ser compatível entre os cursos para usar a tabela.

A prévia e a confirmação usam o mesmo cálculo no servidor. O resumo mostra o valor de cada curso. Os valores aplicados ficam no snapshot da contratação e alimentam contrato e cobranças. Editar preços depois não altera contratações anteriores; mudar preços entre a prévia e a confirmação exige um novo cálculo.

## Banco e atualização

A migração `20261023101500_combo_precos_quantidade` adiciona uma coluna JSONB ao curso, com lista vazia como padrão. Não modifica preços existentes. Deve ser aplicada antes da publicação do código. O verificador `scripts/verificar-migracao-combos-quantidade.cjs` carrega a configuração local e recusa históricos interrompidos ou qualquer outra migração pendente.

## Carregamento de Turmas

Uma alteração em commit separado prioriza a lista: consulta turmas e ocupação, publica a lista e então busca os catálogos para criar/editar. Os catálogos possuem estado de carregamento e nova tentativa independentes; uma falha neles não apaga a lista. Edição e criação aguardam as opções completas. A resposta antiga da API permanece disponível.

Medições na sessão autenticada, antes da alteração: navegação da API completa em aproximadamente 2,4 s (duas tentativas) e apenas turmas em aproximadamente 1,6 s. Esses tempos incluem o navegador e a rede de teste; não representam tempo exclusivo do servidor nem garantem o mesmo resultado em outro ambiente.
