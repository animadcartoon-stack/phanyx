const fs = require("fs");

const caminho = "prisma/schema.prisma";
let schema = fs.readFileSync(caminho, "utf8");

const eol = schema.includes("\r\n") ? "\r\n" : "\n";

/*
 * 1. País da instituição
 */
const inicioConfiguracao = schema.indexOf("model ConfiguracaoInstituicao {");
const fimConfiguracao = schema.indexOf(
  `${eol}}`,
  inicioConfiguracao
);

if (inicioConfiguracao === -1 || fimConfiguracao === -1) {
  throw new Error(
    "Model ConfiguracaoInstituicao não encontrado."
  );
}

const blocoConfiguracao = schema.slice(
  inicioConfiguracao,
  fimConfiguracao
);

if (!blocoConfiguracao.includes("paisCodigo")) {
  const alvo =
    `  estado                   String?${eol}` +
    `  fusoHorario              String      @default("America/Sao_Paulo")`;

  const substituto =
    `  estado                   String?${eol}` +
    `  paisCodigo               String?     @db.VarChar(2)${eol}` +
    `  fusoHorario              String      @default("America/Sao_Paulo")`;

  if (!schema.includes(alvo)) {
    throw new Error(
      "Ponto de inserção de paisCodigo não encontrado."
    );
  }

  schema = schema.replace(alvo, substituto);
  console.log(
    "✓ paisCodigo adicionado em ConfiguracaoInstituicao"
  );
} else {
  console.log(
    "• ConfiguracaoInstituicao já possui paisCodigo"
  );
}

/*
 * 2. Estrutura global de feriados
 */
if (!schema.includes("model FeriadoGlobal {")) {
  const bloco = `

enum StatusFeriadoGlobal {
  RASCUNHO
  PUBLICADO
  ARQUIVADO
}

enum TipoFeriadoGlobal {
  NACIONAL
  REGIONAL
  LOCAL
}

model FeriadoGlobal {
  id Int @id @default(autoincrement())

  paisCodigo   String @db.VarChar(2)
  regiaoCodigo String? @db.VarChar(30)
  cidade       String?

  dataFeriado    DateTime @db.Date
  inicioExibicao DateTime @db.Date
  fimExibicao    DateTime @db.Date

  tipo   TipoFeriadoGlobal   @default(NACIONAL)
  status StatusFeriadoGlobal @default(RASCUNHO)

  prioridade Int @default(0)

  emoji String?

  criadoPorId     Int?
  atualizadoPorId Int?
  publicadoPorId  Int?

  criadoEm     DateTime  @default(now())
  atualizadoEm DateTime  @updatedAt
  publicadoEm  DateTime?

  traducoes FeriadoGlobalTraducao[]

  @@index([paisCodigo, status])
  @@index([paisCodigo, dataFeriado])
  @@index([inicioExibicao, fimExibicao])
  @@index([status])
}

model FeriadoGlobalTraducao {
  id Int @id @default(autoincrement())

  feriadoId Int
  locale    String @db.VarChar(10)

  nome     String
  titulo   String
  mensagem String @db.Text

  feriado FeriadoGlobal @relation(
    fields: [feriadoId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([feriadoId, locale])
  @@index([locale])
}
`;

  schema =
    schema.replace(/\s+$/, "") +
    bloco.replace(/\n/g, eol) +
    eol;

  console.log(
    "✓ Models e enums de feriados adicionados"
  );
} else {
  console.log(
    "• Estrutura FeriadoGlobal já existe"
  );
}

fs.writeFileSync(caminho, schema, "utf8");

console.log("");
console.log("✓ SCHEMA DE FERIADOS MASTER PREPARADO");
