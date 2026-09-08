import fs from "node:fs";
import path from "node:path";

const arquivo = path.resolve(
  "prisma/schema.prisma"
);

let schema = fs.readFileSync(
  arquivo,
  "utf8"
);

const nomeModelo =
  "MobilidadeOfertaDocumentoRequisito";

function adicionarAntesDoFechamentoDoModel(
  nomeModel,
  linha,
  identificador
) {
  const regex =
    new RegExp(
      `model ${nomeModel} \\{[\\s\\S]*?\\n\\}`,
      "m"
    );

  const bloco =
    schema.match(regex)?.[0];

  if (!bloco) {
    throw new Error(
      `Não encontrei o model ${nomeModel}.`
    );
  }

  if (
    bloco.includes(
      identificador
    )
  ) {
    console.log(
      `✓ relação já existe em ${nomeModel}`
    );
    return;
  }

  const novoBloco =
    bloco.replace(
      /\n\}$/,
      `\n  ${linha}\n}`
    );

  schema =
    schema.replace(
      bloco,
      novoBloco
    );

  console.log(
    `✓ relação adicionada em ${nomeModel}`
  );
}

/* =========================================================
   1. RELAÇÃO EM INSTITUICAO
   ========================================================= */

adicionarAntesDoFechamentoDoModel(
  "Instituicao",
  "mobilidadeOfertaDocumentosRequisitos MobilidadeOfertaDocumentoRequisito[]",
  "mobilidadeOfertaDocumentosRequisitos"
);

/* =========================================================
   2. RELAÇÃO EM MOBILIDADE OFERTA
   ========================================================= */

adicionarAntesDoFechamentoDoModel(
  "MobilidadeOferta",
  "requisitosDocumentos MobilidadeOfertaDocumentoRequisito[]",
  "requisitosDocumentos"
);

/* =========================================================
   3. NOVO MODEL
   ========================================================= */

if (
  !schema.includes(
    `model ${nomeModelo} {`
  )
) {
  const ancora =
    "model MobilidadeOfertaCurso {";

  if (
    !schema.includes(
      ancora
    )
  ) {
    throw new Error(
      "Não encontrei MobilidadeOfertaCurso."
    );
  }

  const novoModelo = `model MobilidadeOfertaDocumentoRequisito {
  id            Int                     @id @default(autoincrement())
  instituicaoId Int
  ofertaId      Int
  tipo          MobilidadeTipoDocumento
  titulo        String
  descricao     String?                 @db.Text
  obrigatorio   Boolean                 @default(true)
  exigeValidade Boolean                 @default(false)
  ordem         Int                     @default(0)
  ativo         Boolean                 @default(true)
  createdAt     DateTime                @default(now())
  updatedAt     DateTime                @updatedAt

  instituicao Instituicao      @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  oferta      MobilidadeOferta @relation(fields: [ofertaId], references: [id], onDelete: Cascade)

  @@unique([ofertaId, tipo, titulo])
  @@index([instituicaoId])
  @@index([ofertaId])
  @@index([tipo])
  @@index([ativo])
  @@index([ordem])
}

`;

  schema =
    schema.replace(
      ancora,
      `${novoModelo}${ancora}`
    );

  console.log(
    `✓ ${nomeModelo} criado`
  );
}
else {
  console.log(
    `✓ ${nomeModelo} já existe`
  );
}

fs.writeFileSync(
  arquivo,
  schema,
  "utf8"
);

console.log("");
console.log(
  "✓ REQUISITOS DOCUMENTAIS DA OFERTA ADICIONADOS AO SCHEMA"
);
