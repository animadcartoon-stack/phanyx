const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const registros = await prisma.$queryRawUnsafe(`
    SELECT
      migration_name,
      started_at,
      finished_at,
      rolled_back_at
    FROM "_prisma_migrations"
    WHERE migration_name ILIKE '%mobilidade%'
       OR migration_name ILIKE '%feriado%'
    ORDER BY started_at;
  `);

  console.log("\n=== MIGRAÇÕES REGISTRADAS NO BANCO ===");
  console.table(registros);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
