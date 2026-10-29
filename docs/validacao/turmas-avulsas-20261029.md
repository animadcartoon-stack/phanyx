# Turmas avulsas sem disciplinas — validação de 29/10/2026

Base: `b8937fbf985eadf6f6ee6655140eb2c06cf0893a` (main, PR #150).
Branch preparada: `fix/turmas-avulsas-fluxo-20261029`.

## Correções

- Escolha explícita entre turma avulsa e turma com disciplinas em `/admin/turmas`.
- Links para configurar cursos ainda não habilitados, com orientação de preservar a grade antiga.
- Ano letivo informado pelo administrador, sem valor fixo no cadastro.
- Turma anual grava `semestre=""`, conforme a restrição já existente no banco.
- Criação aninhada de horários e vínculos diretos herda a instituição do registro pai; a chave composta continua impedindo relações entre instituições.
- Ativação envia `horariosAvulsos` para a propriedade `horarios` esperada pelo validador.
- Lista administrativa contabiliza matrículas diretas e encaminha sua edição ao formulário adequado.
- Ativação e confirmação exigem flags próprias e uma lista explícita de instituições autorizadas.

## Validações concluídas

- 425 testes automatizados: 425 aprovados.
- TypeScript sem erros; `prisma validate` aprovado; `git diff --check` aprovado.
- ESLint dos arquivos alterados sem erros; três avisos de dependências de hooks já existentes na página de turmas.
- 13 testes integrados aprovados com gravação real em Neon isolado, usando as rotas e os helpers do projeto, Prisma 5.22 e transporte WebSocket apenas no executor de testes. Nenhuma dependência ou schema de produção foi alterado para esse transporte.
- Criação e ativação de turmas; matrícula individual; repetição idempotente; dois e três cursos; taxa única; desconto configurável; bolsa e ajuste justificado; contrato e documento; parcelas; duplicidade; conflito de horários; chamada com auditoria; isolamento institucional; disputa concorrente pela última vaga.
- Trancamento e cancelamento: validados os filtros de vagas, chamada e painel após alterar o estado de matrículas fictícias. O processo administrativo completo de cancelamento com documento e baixa no caixa não foi executado nesta etapa.
- Navegador Chromium, autenticado com administrador fictício: seleção dos dois formulários, consulta da API e renderização sem erros JavaScript.

## Ambiente de testes

Projeto Neon: `nameless-forest-99814904`.
Branch: `teste-avulsos-20261029`, ID `br-little-river-aco0aqq9`.
Pai: homologação `br-winter-scene-ac1vmlap`.
Fixtures aprovadas: instituição fictícia ID 50; dados exclusivamente de teste.
A branch permanece disponível para revisão. Tentativas anteriores deixaram outras instituições fictícias apenas nesta branch descartável.
Nenhuma alteração foi feita nos registros de produção nem nas flags da Vercel.

## Liberação por instituição

Somente após publicar e verificar um Preview com banco isolado:

```text
PHANYX_ATIVACAO_TURMAS_AVULSAS_HABILITADA=true
PHANYX_MATRICULA_SEM_GRADE_HABILITADA=true
PHANYX_AVULSOS_INSTITUICOES_HABILITADAS=26
```

A lista aceita IDs positivos separados por vírgula. Ausência, lista inválida ou instituição fora da lista bloqueiam a operação. As duas flags continuam independentes. Nenhum script deste pacote configura essas variáveis.

## Pendências para produção

1. Enviar a branch pelo Git autenticado do usuário; criar PR e Preview. A conexão GitHub desta sessão recusou criar branch (403), e o Git local não tem autenticação de escrita. Nenhum PR foi criado.
2. Configurar `DATABASE_URL` e `DIRECT_URL` SOMENTE para o Preview desta branch, usando o banco isolado. Desabilitar credenciais de cobrança, mensagens, e-mail e armazenamento externo nesse Preview. A tentativa de configurar a Vercel foi recusada porque a branch remota ainda não existe; nenhuma variável foi criada.
3. Conferir o fluxo administrativo completo de cancelamento e trancamento, incluindo documento e caixa, sem Asaas real.
4. Revisar e publicar a correção; liberar o piloto somente para a instituição 26 após essa validação.
5. No curso Robótica ID 20, habilitar matrícula direta no cadastro. Consulta de produção em 29/10 confirmou ausência de etapas, disciplinas, turmas e matrículas.
6. Criar a turma real de 2027 com os dados confirmados de professor, dias, horários e capacidade. Esses dados não foram inventados.
7. Balé ID 28: preservar grade e turma antigas. A alternativa compatível com o modelo atual é um novo curso avulso para 2027, com preço e elegibilidade configurados no cadastro e inclusão explícita no combo. Reutilizar o curso 28 exigiria uma alteração mais ampla, pois o modo atual é por curso, não por turma. Nenhuma conversão ou exclusão foi feita.

## Executar os testes

```text
npm ci
npx prisma generate
npm run typecheck
node --test tests/*.test.cjs
```

Integração optativa: `tests/avulsos-sem-grade-integracao.cjs`. Exige `PHANYX_AVULSOS_TEST_DATABASE_URL` e aceita exclusivamente o host da branch descartável indicada no próprio arquivo. Cria e preserva cadastros fictícios para revisão; nunca apontar para produção. Credenciais não estão incluídas no pacote.
