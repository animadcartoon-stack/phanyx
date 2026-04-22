"use client";

import { useState } from "react";

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

  const toggle = (id: number) => {
    if (selecionadas.includes(id)) {
      setSelecionadas(selecionadas.filter((d) => d !== id));
    } else {
      setSelecionadas([...selecionadas, id]);
    }
  };

  const selecionarTodas = () => {
    setSelecionadas(disciplinas.map((d) => d.id));
  };

  const limpar = () => {
    setSelecionadas([]);
  };

  const filtradas = disciplinas.filter((d) =>
    d.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="border rounded-xl p-4">
      <div
        onClick={() => setAberto(!aberto)}
        className="cursor-pointer flex justify-between items-center"
      >
        <span className="font-semibold">{titulo}</span>
        <span>{aberto ? "▲" : "▼"}</span>
      </div>

      {aberto && (
        <div className="mt-3 space-y-3">
          <input
            type="text"
            placeholder="Buscar disciplina..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={selecionarTodas}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
            >
              Selecionar todas
            </button>

            <button
              type="button"
              onClick={limpar}
              className="text-sm bg-gray-300 px-3 py-1 rounded"
            >
              Limpar
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filtradas.map((d) => (
              <label
                key={d.id}
                className="flex items-center gap-2 border rounded-lg p-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selecionadas.includes(d.id)}
                  onChange={() => toggle(d.id)}
                />
                <span>
                  {d.nome}
                  {d.cargaHoraria
                    ? ` (${d.cargaHoraria}h)`
                    : ""}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}