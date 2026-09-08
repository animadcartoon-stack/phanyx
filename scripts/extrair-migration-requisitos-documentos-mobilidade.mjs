import fs from "node:fs";
import path from "node:path";

const preview = path.resolve(
  "mobilidade-requisitos-documentos-migration-preview.sql"
);

const migrationDir =
  process.env.MOBILIDADE_MIGRATION_DIR;

if (!migrationDir) {
  throw new Error(
    "MOBILIDADE_MIGRATION_DIR não informado."
  );
}

const destino = path.resolve(
  migrationDir,
  "migration.sql"
);

const sql = fs.readFileSync(
  preview,
  "utf8"
);

const statements = sql
  .split(/;\s*(?:\r?\n|$)/)
  .map((item) => item.trim())
  .filter(Boolean);

const selecionados = statements.filter(
  (item) =>
    item.includes(
      "MobilidadeOfertaDocumentoRequisito"
    )
);

if (selecionados.length !== 9) {
  console.error(
    "Statements encontrados:",
    selecionados.length
  );

  throw new Error(
    "Esperava exatamente 9 statements da nova tabela."
  );
}

const migrationSql =
  selecionados
    .map((item) => `${item};`)
    .join("\n\n") +
  "\n";

const proibidos = [
  "StudentSuccess",
  "FeriadoGlobal",
  "ConfiguracaoInstituicao",
  "DROP TABLE",
  "DROP COLUMN",
  "TRUNCATE",
];

for (const termo of proibidos) {
  if (
    migrationSql.includes(
      termo
    )
  ) {
    throw new Error(
      `Conteúdo proibido encontrado: ${termo}`
    );
  }
}

const obrigatorios = [
  'CREATE TABLE "MobilidadeOfertaDocumentoRequisito"',
  'CREATE UNIQUE INDEX "MobilidadeOfertaDocumentoRequisito_ofertaId_tipo_titulo_key"',
  '"MobilidadeOfertaDocumentoRequisito_instituicaoId_fkey"',
  '"MobilidadeOfertaDocumentoRequisito_ofertaId_fkey"',
];

for (const termo of obrigatorios) {
  if (
    !migrationSql.includes(
      termo
    )
  ) {
    throw new Error(
      `SQL obrigatório ausente: ${termo}`
    );
  }
}

fs.writeFileSync(
  destino,
  migrationSql,
  "utf8"
);

console.log(
  `✓ Migration isolada criada em: ${destino}`
);

console.log(
  `✓ ${selecionados.length} statements`
);

console.log(
  "✓ Nenhum conteúdo de Student Success ou outro setor"
);
