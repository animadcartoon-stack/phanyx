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
    <div className="border rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition"
      >
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{titulo}</span>
          <span className="text-xs text-gray-500">
            {selecionadas.length > 0
              ? `${selecionadas.length} disciplina(s) selecionada(s)`
              : "Nenhuma disciplina selecionada"}
          </span>
        </div>

        <span className="text-lg text-gray-700">{aberto ? "▴" : "▾"}</span>
      </button>

      {aberto && (
        <div className="border-t px-4 py-4 space-y-3">
          <input
            type="text"
            placeholder="Buscar disciplina..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
          />

          {disciplinas.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer bg-gray-50">
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
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg transition"
                >
                  Limpar
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filtradas.length > 0 ? (
                  filtradas.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selecionadas.includes(d.id)}
                        onChange={() => toggle(d.id)}
                      />

                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {d.nome}
                        </span>
                        {d.cargaHoraria ? (
                          <span className="text-xs text-gray-500">
                            Carga horária: {d.cargaHoraria}h
                          </span>
                        ) : null}
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="border rounded-xl p-3 text-sm text-gray-500">
                    Nenhuma disciplina encontrada para essa busca.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="border rounded-xl p-3 text-sm text-gray-500">
              Selecione primeiro o curso e o semestre do curso para listar as disciplinas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}