import fs from "node:fs";
import path from "node:path";

const arquivo = path.resolve(
  "app/admin/mobilidade/page.tsx"
);

let texto = fs.readFileSync(
  arquivo,
  "utf8"
);

/* =========================================================
   1. IMPORT DO LINK
   ========================================================= */

if (
  !texto.includes(
    'import Link from "next/link";'
  )
) {
  const ancora =
    `"use client";`;

  texto = texto.replace(
    ancora,
    `${ancora}

import Link from "next/link";`
  );

  console.log(
    "✓ import Link adicionado"
  );
}

/* =========================================================
   2. SUBSTITUIR CARDS ESTÁTICOS POR LINKS
   ========================================================= */

const inicio =
  texto.indexOf(
    '          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">'
  );

if (inicio === -1) {
  throw new Error(
    "Não encontrei o início dos cards das Áreas da Mobilidade."
  );
}

const fimSection =
  texto.indexOf(
    "        </section>",
    inicio
  );

if (fimSection === -1) {
  throw new Error(
    "Não encontrei o final da seção Áreas da Mobilidade."
  );
}

const novoBloco = `          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                icone: "🌐",
                chave: "partners",
                href: "/admin/mobilidade/instituicoes-parceiras",
              },
              {
                icone: "🤝",
                chave: "agreements",
                href: "/admin/mobilidade/convenios",
              },
              {
                icone: "🎓",
                chave: "programs",
                href: "/admin/mobilidade/programas",
              },
              {
                icone: "📣",
                chave: "offers",
                href: "/admin/mobilidade/ofertas",
              },
              {
                icone: "📝",
                chave: "applications",
                href: "/admin/mobilidade/candidaturas",
              },
            ].map(
              ({
                icone,
                chave,
                href,
              }) => (
                <Link
                  key={chave}
                  href={href}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:focus:ring-offset-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xl">
                      {icone}
                    </div>

                    <span
                      aria-hidden="true"
                      className="text-sm font-bold text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-300"
                    >
                      →
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
                    {t(
                      \`actions.\${chave}\`
                    )}
                  </p>

                  <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {t(
                      "actions.available"
                    )}
                  </span>
                </Link>
              )
            )}
          </div>
`;

texto =
  texto.slice(
    0,
    inicio
  ) +
  novoBloco +
  texto.slice(
    fimSection
  );

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log(
  "✓ cinco cards transformados em links"
);

console.log(
  "✓ selo Disponível preparado"
);

console.log("");
console.log(
  "✓ DASHBOARD DA MOBILIDADE ATUALIZADO"
);
