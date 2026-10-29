# Horários compactos e destaque de feriado — 29/10/2026

Branch preparada: `fix/horarios-compactos-feriado-20261029`.

## Alterações

- O resumo de horários deixa de usar uma caixa com título e linhas separadas. Passa a mostrar, por exemplo: `Horários: Quinta · 10:00–11:40`, com o intervalo em vermelho e negrito.
- Com uma disciplina, o nome não é repetido. Com várias disciplinas ou encontros, separadores mantêm a associação entre nome, dia e horário. Em telas estreitas, o texto pode quebrar naturalmente para evitar corte dos dados.
- Horários inativos continuam omitidos; valores ausentes não são inventados.
- Apenas o aviso de feriado recebe fundo âmbar, borda dourada e brilho estático suave, com cores próprias para os temas claro, escuro e sistema. Não há animação ou efeito piscante.
- O banner mensal e a lógica de seleção do feriado, data, antecedência, idioma e mensagens são preservados. O componente genérico BannerPhanyx não foi alterado.

## Verificação

- TypeScript dos componentes alterados e suas dependências diretas aprovado em uma configuração isolada, com React 18 e next-intl 3.
- Componentes reais e folha global do PHANYX compilados para verificação em Chromium; dados de demonstração, sem acesso a banco ou APIs da instituição.
- Nos cinco idiomas e três temas: resumo simples ocupando uma linha, horas na cor vermelha esperada e fundo/brilho de feriado distintos do banner mensal.
- Estados de hoje, amanhã, próximo feriado e título cadastrado preservados.
- Sem horários e vários encontros/disciplinas verificados; sem transbordamento do resumo nas larguras de 390 e 1280 px.
- Sem erros JavaScript ou diálogos nativos nos testes do navegador. Conferência visual nos temas claro e sistema; verificação de cores nos três temas.
- A verificação isolada não substitui o typecheck, testes e build completos do repositório na nova pasta ou no Preview.

## Aplicação

O aplicador confere o repositório PHANYX e hashes normalizados de quatro arquivos antes de escrever. Prepara uma nova pasta/branch a partir de origin/main, preserva a pasta anterior e não copia arquivos de ambiente. Não executa SQL, migrações, mudanças de flags, commit, push ou deploy.
