# PHANYX — avisos de matrícula e conferência de exclusão

Base: origin/main 83dacf9c69ac944a3a17176458fbe78d2fa667fb.
Branch sugerida: fix/avisos-matricula-exclusao-20261029.

## Comportamento

- O aviso de conflito de matrícula usa o modal PHANYX, com os nomes das duas turmas/atividades, dia e intervalos. O texto está disponível nos cinco idiomas do portal.
- O sinal sonoro curto usa um contexto de áudio por aba, preparado durante uma interação com o formulário. Quando o navegador ou o dispositivo bloqueia áudio, o modal continua funcionando. Preparar o áudio não reproduz som.
- O mesmo tratamento atende o seletor de adicionais, confirmação de matrícula individual/conjunta, edição tradicional e contratação por período. O formulário de modalidades mantém suas alternativas de horários dentro do modal padrão.
- As verificações de horários continuam no servidor, incluindo matrículas anteriores do mesmo aluno. A matrícula sobreposta permanece recusada; não há novo botão para ignorar o conflito. Nenhuma regra de preço, desconto, cobrança, limite de turmas ou conversão foi alterada.
- Dois cursos na mesma manhã, como 08:00–09:40 e 10:00–11:40, não geram conflito. Turmas distintas podem funcionar simultaneamente; a verificação é feita para o aluno selecionado.
- A exclusão de turma exige resposta com o ID exato, leitura posterior retornando 404 e ausência na lista recarregada. Um HTTP 200 inesperado, outra identificação, falha de consulta ou permanência do registro não produz mensagem de sucesso. A mensagem informa o nome da turma. Requisições antigas da lista não substituem uma resposta mais recente.
- A exclusão de etapa mantém as proteções existentes e passa a indicar um exemplo de turma vinculada, mesmo quando não existem matrículas.

## Diagnóstico e limites

A consulta de produção foi somente leitura. A turma I3V (ID 23, instituição 26) permanecia cadastrada; não foram encontradas matrículas, itens, aulas, atividades, provas, notas, módulos, resultados, matrículas avulsas ou períodos de matrícula ligados a ela nas verificações realizadas. Não houve uma nova tentativa de exclusão em produção por este trabalho. A causa exata do relato de sucesso seguido de permanência não foi reproduzida na sessão real; a alteração evita anunciar sucesso sem conferir o resultado e identifica melhor o alvo para investigação.

A etapa 1 do PEVI ainda tinha nove turmas vinculadas no momento da consulta. A ausência de matrícula não remove esse vínculo. Este pacote não exclui nem desloca essas turmas automaticamente, não converte o PEVI e não retira sua grade.

## Validação local

- 504 testes automatizados, sem falhas, incluindo intervalos compatíveis/sobrepostos, isolamento de instituição, exclusão com ID divergente, leitura posterior e recusa com vínculos.
- Typecheck completo aprovado.
- Lint dos componentes/páginas alterados: sem erros; permanecem avisos de dependências de hooks já existentes.
- 22 cenários de interface aprovados com os componentes reais, respostas de API fictícias e instrumentação do áudio: cinco idiomas, temas claro/escuro/sistema, seletor de adicionais, modalidades, períodos, matrícula tradicional, conferência de exclusão e identificação de turma no bloqueio de etapa. Sem diálogos nativos de navegador. O teste de som verifica a programação do sinal; não mede a saída física dos alto-falantes.

## Validação na nova pasta do Windows

```powershell
npm ci
npx prisma generate
npm run typecheck
$testes = Get-ChildItem ".\tests\*.test.cjs" | ForEach-Object { $_.FullName }
node --test --test-reporter=dot $testes
npm run build
```

Antes do merge, validar em Preview com banco isolado: matrícula de um aluno fictício com aulas 08:00–09:40 e 10:00–11:40 no mesmo dia; recusa/modal/som para sobreposição parcial; repetição com uma aula já matriculada; duas turmas paralelas destinadas a alunos diferentes; tentativa de exclusão de turma fictícia sem uso seguida de atualização da página; recusa da exclusão com matrícula; e etapa bloqueada por turma sem matrícula, identificando o nome. Confirmar que nenhuma matrícula/cobrança é gravada após conflito. Usar somente dados fictícios e limpar as fixtures.

O aplicador cria uma pasta e uma branch novas, valida os hashes dos arquivos e preserva a pasta de origem. Não copia arquivos de ambiente e não executa SQL, migração, alteração de flags, commit, push ou deploy. A aplicação local do pacote não exclui a I3V nem altera dados de produção.
