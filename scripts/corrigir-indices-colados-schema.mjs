import fs from "node:fs";

const arquivo = "prisma/schema.prisma";

let schema = fs.readFileSync(
  arquivo,
  "utf8"
);

const correcoes = [
  {
    antigo:
      '@@index([instituicaoDestinoId, status])@@index([matriculaId])',
    novo:
      '@@index([instituicaoDestinoId, status])\n  @@index([matriculaId])',
  },
  {
    antigo:
      '@@index([analisadoDestinoPorId])@@index([dataTransferencia])',
    novo:
      '@@index([analisadoDestinoPorId])\n  @@index([dataTransferencia])',
  },
];

let alteracoes = 0;

for (const item of correcoes) {
  if (schema.includes(item.antigo)) {
    schema = schema.replace(
      item.antigo,
      item.novo
    );

    alteracoes++;
  }
}

if (alteracoes === 0) {
  throw new Error(
    "Nenhuma das duas linhas coladas foi encontrada. Nada foi alterado."
  );
}

fs.writeFileSync(
  arquivo,
  schema,
  "utf8"
);

console.log(
  `✓ ${alteracoes} linha(s) de índice corrigida(s).`
);
