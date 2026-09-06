import fs from "node:fs";
import path from "node:path";

const [previewPath, outputPath] = process.argv.slice(2);

if (!previewPath || !outputPath) {
  throw new Error(
    "Uso: node extrair-migration-mobilidade.mjs <preview.sql> <migration.sql>"
  );
}

const preview = fs.readFileSync(path.resolve(previewPath), "utf8");

// O migrate diff gera instruções terminadas por ;
// Mantemos somente instruções que pertencem à Mobilidade.
const statements = preview
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean)
  .filter((statement) => statement.includes("Mobilidade"))
  .map((statement) => `${statement};`);

if (statements.length === 0) {
  throw new Error("Nenhuma instrução de Mobilidade foi encontrada.");
}

const sql = [
  "-- Núcleo de Mobilidade Acadêmica e Intercâmbio Internacional",
  "-- Migration isolada gerada a partir do prisma migrate diff",
  "",
  ...statements,
  "",
].join("\n\n");

const forbidden = [
  "FeriadoGlobal",
  "ConfiguracaoInstituicao",
  "StudentSuccess",
  "DROP TABLE",
  "DROP COLUMN",
  "TRUNCATE",
];

for (const term of forbidden) {
  if (sql.includes(term)) {
    throw new Error(`Conteúdo indevido encontrado na migration: ${term}`);
  }
}

const required = [
  'CREATE TYPE "MobilidadeDirecao"',
  'CREATE TABLE "MobilidadeInstituicaoParceira"',
  'CREATE TABLE "MobilidadeConvenio"',
  'CREATE TABLE "MobilidadePrograma"',
  'CREATE TABLE "MobilidadeOferta"',
  'CREATE TABLE "MobilidadeCandidatura"',
  'CREATE TABLE "MobilidadeCandidaturaDocumento"',
];

for (const term of required) {
  if (!sql.includes(term)) {
    throw new Error(`Instrução obrigatória não encontrada: ${term}`);
  }
}

fs.mkdirSync(path.dirname(path.resolve(outputPath)), {
  recursive: true,
});

fs.writeFileSync(path.resolve(outputPath), sql, "utf8");

console.log(`✓ Migration isolada criada`);
console.log(`✓ ${statements.length} instruções SQL`);
console.log(`✓ Nenhum SQL de Feriados`);
console.log(`✓ Nenhum SQL de Student Success`);
console.log(`✓ Nenhum DROP TABLE/COLUMN`);
console.log(`✓ Arquivo: ${outputPath}`);
