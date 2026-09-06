const fs = require("fs");

const caminho = "prisma/schema.prisma";
let schema = fs.readFileSync(caminho, "utf8");

const padrao =
  /feriado\s+FeriadoGlobal\s+@relation\(\s*fields:\s*\[feriadoId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\s*\)/m;

if (!padrao.test(schema)) {
  throw new Error("Relação FeriadoGlobal não encontrada no formato esperado.");
}

schema = schema.replace(
  padrao,
  "feriado FeriadoGlobal @relation(fields: [feriadoId], references: [id], onDelete: Cascade)"
);

fs.writeFileSync(caminho, schema, "utf8");

console.log("✓ Relação FeriadoGlobal corrigida");
