const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const tabelas = await prisma.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'FeriadoGlobal',
        'FeriadoGlobalTraducao',
        'MobilidadePrograma',
        'MobilidadeOferta',
        'MobilidadeCandidatura'
      )
    ORDER BY table_name;
  `);

  const colunas = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'ConfiguracaoInstituicao' AND column_name = 'paisCodigo')
        OR
        (table_name = 'Polo' AND column_name = 'paisCodigo')
      )
    ORDER BY table_name, column_name;
  `);

  console.log("\n=== TABELAS ENCONTRADAS NO BANCO ===");
  console.table(tabelas);

  console.log("\n=== COLUNAS DE PAÍS ENCONTRADAS ===");
  console.table(colunas);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
