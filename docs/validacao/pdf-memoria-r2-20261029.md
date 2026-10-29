# PDF de contratos e build sem credenciais R2 — 29/10/2026

## Diagnóstico confirmado

Os logs da Vercel para `/api/admin/contratos/pdf` registraram encerramento da instância por falta de memória. A logo institucional escolhida pelo gerador possui 28.122 × 18.556 pixels (521.831.832 pixels), embora o PNG comprimido tenha aproximadamente 4,6 MB. Os dois arquivos originais de logo foram conferidos pelos cabeçalhos PNG. Não houve alteração no banco ou nas imagens cadastradas.

## Correção do PDF

Antes de incorporar logos e assinatura institucional ao pdf-lib, o helper usa sharp/libvips com leitura sequencial para reduzir imagens grandes a uma área de até 2048 × 2048 pixels, preservando proporção e transparência. PNG e JPEG já pequenos preservam os bytes. O download tem limite de 20 MB, inclusive sem Content-Length; o download e o processamento têm limites de tempo. Falhas de imagens seguem o comportamento anterior de gerar o documento sem a imagem, agora com diagnóstico no log.

O arquivo original permanece no cadastro. Preços, contratos assinados e conteúdo contratual não são modificados.

## Correção do build local

`lib/storage/r2.ts` criava o cliente S3 durante a importação, interrompendo a coleta de páginas do Next.js quando a nova pasta não tinha credenciais. Agora o cliente é criado sob demanda, no momento do acesso ao armazenamento. As validações de credenciais e a configuração de conexão existentes foram preservadas.

Foram ajustados os dois consumidores desse cliente: upload de arquivos e exibição da foto de funcionário. O teste da foto foi atualizado para a função de inicialização sob demanda; suas verificações de autenticação, cache e preservação do original continuam aprovadas. Não é necessário copiar credenciais de produção para executar a compilação desse módulo.

## Evidências de validação

- 432 testes aprovados, incluindo sete novos cenários de imagens e inicialização R2.
- TypeScript sem erros; ESLint dos arquivos alterados sem avisos; git diff --check aprovado.
- Logo original do CREIA Kids reduzida a 2048 × 1351, com transparência. Tempo medido: 4,084 segundos; pico do processo de teste: 334 MB.
- Rota GET real do PDF executada com autenticação e dados contratuais fictícios e a logo original. Resposta 200/application/pdf, 428.622 bytes, uma página; pico do processo: 392 MB. Nenhuma consulta ou gravação de contrato real, cobrança, mensagem ou envio externo foi executado pelo teste da rota.
- PDF renderizado e conferido visualmente, com logo, texto, assinaturas e QR Code.
- O build completo deve ser repetido no Windows após aplicar este complemento. A correção ainda não foi publicada.

## Aplicação

O aplicador complementar exige a branch `fix/turmas-avulsas-fluxo-20261029`, confere o conteúdo dos arquivos e preserva a correção de turmas já aplicada. `--check` é somente leitura. `--apply` cria cópias dos arquivos alterados dentro da área privada do Git e aplica apenas os nove arquivos deste complemento. Não altera .env, banco, flags, dependências, commits, branches ou deploys.
