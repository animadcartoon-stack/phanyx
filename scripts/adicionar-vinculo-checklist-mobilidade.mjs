import fs from "node:fs";

const arquivo = "prisma/schema.prisma";
let schema = fs.readFileSync(arquivo, "utf8");

const marcador = "requisitoOfertaId";

if (schema.includes(marcador)) {
  console.log("✓ Checklist já parece estar modelado. Nenhuma alteração feita.");
  process.exit(0);
}

/* =========================================================
   1. RELAÇÃO NO REQUISITO DA OFERTA
   ========================================================= */

const relacaoOfertaAntiga = `  instituicao Instituicao      @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  oferta      MobilidadeOferta @relation(fields: [ofertaId], references: [id], onDelete: Cascade)

  @@unique([ofertaId, tipo, titulo])`;

const relacaoOfertaNova = `  instituicao Instituicao      @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  oferta      MobilidadeOferta @relation(fields: [ofertaId], references: [id], onDelete: Cascade)

  documentosCandidaturas MobilidadeCandidaturaDocumento[] @relation("MobilidadeDocumentoRequisitoOferta")

  @@unique([ofertaId, tipo, titulo])`;

if (!schema.includes(relacaoOfertaAntiga)) {
  throw new Error(
    "Não encontrei o ponto de relação de MobilidadeOfertaDocumentoRequisito."
  );
}

schema = schema.replace(
  relacaoOfertaAntiga,
  relacaoOfertaNova
);

/* =========================================================
   2. CAMPOS SNAPSHOT NO DOCUMENTO DA CANDIDATURA
   ========================================================= */

const camposAntigos = `  instituicaoId  Int
  candidaturaId  Int
  tipo           MobilidadeTipoDocumento
  titulo         String
  obrigatorio    Boolean                   @default(true)
  arquivoUrl     String?`;

const camposNovos = `  instituicaoId     Int
  candidaturaId     Int
  requisitoOfertaId Int?
  tipo              MobilidadeTipoDocumento
  titulo            String
  obrigatorio       Boolean                   @default(true)
  descricaoRequisito String?                  @db.Text
  exigeValidade     Boolean                   @default(false)
  ordem             Int                       @default(0)
  arquivoUrl        String?`;

if (!schema.includes(camposAntigos)) {
  throw new Error(
    "Não encontrei os campos atuais de MobilidadeCandidaturaDocumento."
  );
}

schema = schema.replace(
  camposAntigos,
  camposNovos
);

/* =========================================================
   3. RELAÇÃO COM O REQUISITO ORIGINAL
   ========================================================= */

const relacoesDocumentoAntigas = `  instituicao  Instituicao           @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  candidatura  MobilidadeCandidatura @relation(fields: [candidaturaId], references: [id], onDelete: Cascade)
  analisadoPor User?                 @relation("MobilidadeCandidaturaDocumentoAnalisadoPor", fields: [analisadoPorId], references: [id], onDelete: SetNull)

  @@index([instituicaoId])
  @@index([candidaturaId])`;

const relacoesDocumentoNovas = `  instituicao     Instituicao                          @relation(fields: [instituicaoId], references: [id], onDelete: Cascade)
  candidatura     MobilidadeCandidatura                @relation(fields: [candidaturaId], references: [id], onDelete: Cascade)
  requisitoOferta MobilidadeOfertaDocumentoRequisito?  @relation("MobilidadeDocumentoRequisitoOferta", fields: [requisitoOfertaId], references: [id], onDelete: SetNull)
  analisadoPor    User?                                @relation("MobilidadeCandidaturaDocumentoAnalisadoPor", fields: [analisadoPorId], references: [id], onDelete: SetNull)

  @@unique([candidaturaId, requisitoOfertaId])
  @@index([instituicaoId])
  @@index([candidaturaId])
  @@index([requisitoOfertaId])`;

if (!schema.includes(relacoesDocumentoAntigas)) {
  throw new Error(
    "Não encontrei as relações atuais de MobilidadeCandidaturaDocumento."
  );
}

schema = schema.replace(
  relacoesDocumentoAntigas,
  relacoesDocumentoNovas
);

fs.writeFileSync(
  arquivo,
  schema,
  "utf8"
);

console.log("✓ Schema preparado para checklist automático da Mobilidade.");
