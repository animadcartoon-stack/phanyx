const fs = require("fs");

const path = "app/professor/aulas/page.tsx";

let s = fs.readFileSync(path, "utf8");

const nl = s.includes("\r\n") ? "\r\n" : "\n";

if (s.includes('data-view="compact-list"')) {
  console.log("OK: lista compacta já está aplicada.");
  process.exit(0);
}

const inicioMarcador =
  '          {aulasOrdenadas.map((aula) => (';

const inicio = s.indexOf(inicioMarcador);

if (inicio === -1) {
  throw new Error(
    "Início do map de aulas não encontrado."
  );
}

const corpoInicio =
  inicio + inicioMarcador.length;

const fimMarcador =
  `${nl}          ))}`;

const fim = s.indexOf(
  fimMarcador,
  corpoInicio
);

if (fim === -1) {
  throw new Error(
    "Final do map de aulas não encontrado."
  );
}

const cardAtual = s.slice(
  corpoInicio,
  fim
);

const listaCompacta =
`              <article
                key={aula.id}
                data-view="compact-list"
                className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-blue-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {typeof aula.ordem === "number"
                    ? aula.ordem
                    : "—"}
                </div>

                <div className="min-w-0 flex-[2]">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2
                      className="truncate text-sm font-black text-slate-900 dark:text-white"
                      title={
                        aula.titulo ||
                        aula.nome ||
                        t("untitled")
                      }
                    >
                      {aula.titulo ||
                        aula.nome ||
                        t("untitled")}
                    </h2>

                    {aula.substituicaoAtiva && (
                      <span className="hidden shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 xl:inline">
                        {t("substitution.title")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 md:block">
                  <p
                    className="truncate text-xs text-slate-600 dark:text-slate-300"
                    title={aula.disciplina?.nome || "-"}
                  >
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">
                      {t("subject")}:
                    </strong>{" "}
                    {aula.disciplina?.nome || "-"}
                  </p>
                </div>

                <div className="hidden min-w-0 flex-1 lg:block">
                  <p
                    className="truncate text-xs text-slate-600 dark:text-slate-300"
                    title={aula.turma?.nome || "-"}
                  >
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">
                      {t("class")}:
                    </strong>{" "}
                    {aula.turma?.nome || "-"}
                  </p>
                </div>

                <a
                  href={\`/professor/aulas/\${aula.id}/materiais/novo\`}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <span className="hidden sm:inline">
                    {aula.substituicaoAtiva
                      ? t("addMaterialAsSubstitute")
                      : t("addMaterial")}
                  </span>

                  <span
                    className="text-base sm:hidden"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </a>
              </article>`;

const novoMap =
`          {aulasOrdenadas.map((aula) =>
            visualizacao === "lista" ? (
${listaCompacta}
            ) : (${cardAtual}
            )
          )}`;

s =
  s.slice(0, inicio) +
  novoMap.replace(/\n/g, nl) +
  s.slice(fim + fimMarcador.length);


// Lista ainda mais compacta verticalmente
s = s.replace(
  '"grid grid-cols-1 gap-3"',
  '"grid grid-cols-1 gap-2"'
);

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log("OK: lista compacta aplicada.");
console.log("OK: cada aula ocupa uma linha no desktop.");
console.log("OK: Cards permaneceram preservados.");
