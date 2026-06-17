"use client";

import { useMemo, useState } from "react";

type Disciplina = {
  id: number;
  nome: string;
  cargaHoraria?: number | null;
};

type Props = {
  titulo: string;
  disciplinas: Disciplina[];
  selecionadas: number[];
  setSelecionadas: (ids: number[]) => void;
};

export default function MultiSelectDisciplinas({
  titulo,
  disciplinas,
  selecionadas,
  setSelecionadas,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const disciplinasOrdenadas = useMemo(() => {
    return [...disciplinas].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    );
  }, [disciplinas]);

  const filtradas = useMemo(() => {
    return disciplinasOrdenadas.filter((d) =>
      d.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [disciplinasOrdenadas, busca]);

  const cargaHorariaSelecionada = useMemo(() => {
    return disciplinas
      .filter((d) => selecionadas.includes(d.id))
      .reduce((total, d) => total + Number(d.cargaHoraria || 0), 0);
  }, [disciplinas, selecionadas]);

  const todasSelecionadas =
    disciplinas.length > 0 &&
    disciplinas.every((d) => selecionadas.includes(d.id));

  const toggle = (id: number) => {
    if (selecionadas.includes(id)) {
      setSelecionadas(selecionadas.filter((d) => d !== id));
    } else {
      setSelecionadas([...selecionadas, id]);
    }
  };

  const toggleSelecionarTodas = () => {
    if (todasSelecionadas) {
      setSelecionadas([]);
      return;
    }

    setSelecionadas(disciplinas.map((d) => d.id));
  };

  const limpar = () => {
    setSelecionadas([]);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-white dark:hover:bg-slate-800"
      >
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
  {titulo}
</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {selecionadas.length > 0
              ? `${selecionadas.length} disciplina(s) selecionada(s) • ${cargaHorariaSelecionada}h selecionadas`
              : "Nenhuma disciplina selecionada"}
          </span>
        </div>

        <span className="text-lg text-slate-700 dark:text-slate-200">
          {aberto ? "▴" : "▾"}
        </span>
      </button>

      {aberto && (
        <div className="space-y-3 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
          <input
            type="text"
            placeholder="Buscar disciplina..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          {disciplinas.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={todasSelecionadas}
                    onChange={toggleSelecionarTodas}
                  />
                  <span className="text-sm font-medium">Selecionar todas</span>
                </label>

                <button
                  type="button"
                  onClick={limpar}
                  className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Limpar
                </button>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filtradas.length > 0 ? (
                  filtradas.map((d) => (
                    <label
                      key={d.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 transition hover:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={selecionadas.includes(d.id)}
                        onChange={() => toggle(d.id)}
                      />

                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {d.nome}
                        </span>
                        {d.cargaHoraria ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Carga horária: {d.cargaHoraria}h
                          </span>
                        ) : null}
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                    Nenhuma disciplina encontrada para essa busca.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              Selecione primeiro o curso e o semestre do curso para listar as disciplinas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}