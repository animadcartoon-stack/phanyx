# Complemento — edição de turmas e proteção de vínculos

Base: commit 02f12a220687f404ea584254475b4aee89f08bca, branch fix/avisos-matricula-exclusao-20261029.

## Falha reproduzida no Preview isolado

O Preview dpl_5MckUGEpoQ5Yh8UXMqWRPwpxuiJX recebeu o commit correto e configurações específicas da branch, usando exclusivamente o banco de testes br-blue-base-aclw74mj. Os cadastros foram fictícios, com nomes TESTE-PREVIEW-AVISOS e usuários example.invalid; a I3V e os cadastros de produção não foram alterados.

Doze verificações reais passaram: autenticação administrativa, prova do banco isolado por cadastro recém-criado, horários compatíveis na mesma manhã, sobreposição parcial, revalidação na confirmação sem gravação de matrícula/cobrança, conflito com matrícula anterior, horários disponíveis para outro aluno, várias turmas do mesmo curso no mesmo horário com professores diferentes, etapa sem uso excluível, etapa com turma identificada no bloqueio, isolamento institucional e turma vazia excluída com confirmação do ID/404/ausência na lista.

A verificação seguinte encontrou uma falha anterior: DELETE de turma com matrícula e ItemMatricula retornava 200 e permitia cascata sobre os itens e SetNull sobre o vínculo principal. A verificação parou nessa fronteira. Os dados fictícios foram removidos e a limpeza foi confirmada.

## Correção

Antes de remover qualquer configuração, a mesma transação Serializable bloqueia a turma e verifica matrículas principais, itens, matrículas avulsas, aulas, notas, atividades, provas, módulos, resultados, sessões/eventos do aluno, períodos de matrícula, reuniões, substituições, recomendações de biblioteca, atividades externas e rematrículas de ofertas. Qualquer uso, inclusive histórico cancelado, retorna 409 sem remoção.

Snapshots de contratação que referenciam o ID da turma e ofertas válidas com código OFERTA-<origem>-<curso> também impedem a exclusão. Assim a origem de uma oferta compartilhada não desaparece silenciosamente. Configurações de turma sem uso (horários, etapas e ofertas) continuam podendo ser removidas, preservando o catálogo de disciplinas.

Conflitos de concorrência e novas referências retornam 409. A conferência do ID, leitura 404 e recarga da lista do primeiro pacote permanece intacta.

## Edição da turma e conversão do curso

O PEVI pode ter várias turmas. O bloqueio OUTRAS_TURMAS pertence somente à conversão de toda a estrutura do curso, que poderia retirar grade e etapas usadas por outras turmas.

A tela agora distingue “Editar turma no curso atual” de “Vincular turma a um curso avulso”. Ao escolher vincular, o curso curricular atual não vem selecionado e não aparece entre os destinos avulsos por padrão. É necessário escolher explicitamente um curso avulso já habilitado.

A possibilidade anterior de converter conjuntamente o próprio curso continua disponível em uma opção separada, inicialmente desmarcada, que explica a alteração da grade e etapas. Só após esse opt-in o curso atual aparece como destino. A revisão e as proteções do servidor permanecem obrigatórias. A mensagem do servidor explica que essa operação alteraria o curso inteiro e que cursos continuam podendo ter várias turmas. As instruções da interface estão nos cinco idiomas.

## Validação do complemento

- 523 testes automatizados passaram; 26 deles exercitam a rota de turma e seus bloqueios, incluindo cascades, SetNull e concorrência.
- Typecheck completo aprovado.
- 32 cenários de interface aprovados, incluindo os avisos, exclusão e dez cenários nos cinco idiomas para destino avulso explícito e conversão do curso atual somente após opção separada.
- O handler atualizado, compilado a partir do arquivo da rota, passou em oito verificações com PostgreSQL real na branch de testes: turma vazia com suas configurações; matrícula principal sem itens; itens de matrícula; matrícula cancelada; snapshot sem FK; oferta derivada; isolamento institucional; e exclusão após revisão do vínculo. Todos os dados fictícios foram limpos.
- Estas oito verificações usam a implementação atualizada diretamente com o banco real, sem uma nova publicação. Ainda falta repetir a validação HTTP no novo Preview após o push do complemento. O commit 02f12a22 isoladamente não está aprovado para merge.

## Aplicação e próximos passos

O aplicador deste complemento modifica seis arquivos na mesma branch: rota e teste de turma, componente de conversão, regra e teste da conversão e este relatório. Confere os hashes antes de escrever e guarda cópias dos arquivos anteriores na área privada do Git. Não executa SQL, migração, alteração de flags, commit, push ou deploy, nem exclui qualquer turma ao ser aplicado.

Na pasta C:\Users\Denise\Documents\phanyx-avisos-matricula-20261029:

```powershell
node "$env:USERPROFILE\Downloads\PHANYX-complemento-turmas-20261029.cjs" --apply "."
npm run typecheck
$testes = Get-ChildItem ".\tests\*.test.cjs" | ForEach-Object { $_.FullName }
node --test --test-reporter=dot $testes
npm run build
```

Depois do commit e push na mesma branch, repetir a validação HTTP no Preview isolado antes de fazer merge. Não é necessário recriar a pasta ou reinstalar dependências para este complemento.
