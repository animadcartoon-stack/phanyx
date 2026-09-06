const fs = require("fs");

const arquivo = "app/admin/AdminShell.tsx";
let texto = fs.readFileSync(arquivo, "utf8");

const inicio = texto.indexOf(
  '                    {podeVerMobilidade && (\n                      <Link\n                        href="/admin/mobilidade"\n                        data-mobile-mobilidade="true"'
);

const fimMarcador =
  '                    {podeVerBiblioteca && (';

if (inicio === -1) {
  throw new Error("Início do bloco mobile de Mobilidade não encontrado.");
}

const fim = texto.indexOf(fimMarcador, inicio);

if (fim === -1) {
  throw new Error("Fim do bloco mobile de Mobilidade não encontrado.");
}

const novoBloco = `                    {podeVerMobilidade && (
                      <>
                        <Link
                          href="/admin/mobilidade"
                          data-mobile-mobilidade="true"
                          className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          🌍 {tNav("internationalMobility")}
                        </Link>

                        <Link
                          href="/admin/mobilidade/instituicoes-parceiras"
                          className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          🌐 {tNav("partnerInstitutions")}
                        </Link>
                      </>
                    )}

`;

texto =
  texto.slice(0, inicio) +
  novoBloco +
  texto.slice(fim);

fs.writeFileSync(arquivo, texto, "utf8");

console.log("✓ Bloco mobile de Mobilidade corrigido");
