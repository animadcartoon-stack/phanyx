import fs from "node:fs";
import path from "node:path";

const arquivo = path.resolve(
  "app/api/admin/mobilidade/programas/[id]/route.ts"
);

let texto = fs.readFileSync(
  arquivo,
  "utf8"
);

const selectAntigo = `        select: {
          id: true,
        },`;

const selectNovo = `        select: {
          id: true,
          status: true,
        },`;

if (!texto.includes(selectAntigo)) {
  throw new Error(
    "Select do programa não encontrado."
  );
}

texto = texto.replace(
  selectAntigo,
  selectNovo
);

const dataAntigo = `        data: {
          ativo:
            corpo.ativo,

          ...(corpo.ativo
            ? {}
            : {
                status:
                  MobilidadeStatusPrograma.INATIVO,
              }),
        },`;

const dataNovo = `        data: {
          ativo:
            corpo.ativo,

          ...(corpo.ativo
            ? (
                atual.status ===
                  MobilidadeStatusPrograma.INATIVO ||
                atual.status ===
                  MobilidadeStatusPrograma.ARQUIVADO
                  ? {
                      status:
                        MobilidadeStatusPrograma.ATIVO,
                    }
                  : {}
              )
            : {
                status:
                  MobilidadeStatusPrograma.INATIVO,
              }),
        },`;

if (!texto.includes(dataAntigo)) {
  throw new Error(
    "Bloco ALTERAR_ATIVO não encontrado."
  );
}

texto = texto.replace(
  dataAntigo,
  dataNovo
);

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log(
  "✓ Reativação de Programas corrigida"
);
