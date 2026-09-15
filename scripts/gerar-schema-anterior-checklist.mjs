import fs from "node:fs";

const origem = "prisma/schema.prisma";
const destino = "prisma/tmp-schema-antes-checklist.prisma";

let schema = fs.readFileSync(origem, "utf8");

function alterarModel(nome, alterar) {
  const regex = new RegExp(
    `model ${nome} \\{[\\s\\S]*?\\n\\}`,
    "m"
  );

  const encontrado = schema.match(regex);

  if (!encontrado) {
    throw new Error(
      `Model ${nome} não encontrado. Nenhuma alteração foi feita.`
    );
  }

  const original = encontrado[0];
  const atualizado = alterar(original);

  schema = schema.replace(
    original,
    atualizado
  );
}


/* =========================================================
   REQUISITO DA OFERTA
   Remove somente a relação reversa nova.
   ========================================================= */

alterarModel(
  "MobilidadeOfertaDocumentoRequisito",
  (model) => {
    return model
      .split(/\r?\n/)
      .filter(
        (linha) =>
          !linha.includes(
            "documentosCandidaturas"
          )
      )
      .join("\n");
  }
);


/* =========================================================
   DOCUMENTO DA CANDIDATURA
   Remove somente os campos/relações do checklist novo.
   ========================================================= */

alterarModel(
  "MobilidadeCandidaturaDocumento",
  (model) => {
    return model
      .split(/\r?\n/)
      .filter((linha) => {
        const texto = linha.trim();

        if (
          texto.startsWith(
            "requisitoOfertaId "
          )
        ) {
          return false;
        }

        if (
          texto.startsWith(
            "descricaoRequisito "
          )
        ) {
          return false;
        }

        if (
          texto.startsWith(
            "exigeValidade "
          )
        ) {
          return false;
        }

        if (
          texto.startsWith(
            "ordem "
          )
        ) {
          return false;
        }

        if (
          texto.startsWith(
            "requisitoOferta "
          )
        ) {
          return false;
        }

        if (
          texto.includes(
            "@@unique([candidaturaId, requisitoOfertaId])"
          )
        ) {
          return false;
        }

        if (
          texto.includes(
            "@@index([requisitoOfertaId])"
          )
        ) {
          return false;
        }

        return true;
      })
      .join("\n");
  }
);


fs.writeFileSync(
  destino,
  schema,
  "utf8"
);

console.log(
  "✓ Schema temporário criado alterando somente os models da Mobilidade."
);
