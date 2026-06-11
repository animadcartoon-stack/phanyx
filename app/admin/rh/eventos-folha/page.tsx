"use client";

import { useEffect, useState } from "react";

type EventoFolha = {
  id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  natureza?: string | null;
  incideINSS: boolean;
  incideFGTS: boolean;
  incideIRRF: boolean;
  ativo: boolean;
};

export default function EventosFolhaPage() {
  const [eventos, setEventos] = useState<EventoFolha[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("VENCIMENTO");
  const [natureza, setNatureza] = useState("");
  const [incideINSS, setIncideINSS] = useState(false);
  const [incideFGTS, setIncideFGTS] = useState(false);
  const [incideIRRF, setIncideIRRF] = useState(false);

  async function carregar() {
    try {
      const res = await fetch("/api/admin/rh/eventos-folha");
      const dados = await res.json();
      setEventos(Array.isArray(dados) ? dados : []);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    const res = await fetch("/api/admin/rh/eventos-folha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo,
        descricao,
        tipo,
        natureza,
        incideINSS,
        incideFGTS,
        incideIRRF,
      }),
    });

    if (!res.ok) return;

    setCodigo("");
    setDescricao("");
    setNatureza("");
    setIncideINSS(false);
    setIncideFGTS(false);
    setIncideIRRF(false);

    carregar();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">
          Departamento Pessoal
        </p>

        <h1 className="mt-3 text-4xl font-black">Eventos da Folha</h1>

        <p className="mt-2 text-sm text-slate-400">
          Cadastro dos códigos usados no holerite: vencimentos, descontos,
          benefícios, bases e informativos.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
          />

          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm md:col-span-2"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
          >
            <option value="VENCIMENTO">Vencimento</option>
            <option value="DESCONTO">Desconto</option>
            <option value="INFORMATIVO">Informativo</option>
          </select>

          <input
            value={natureza}
            onChange={(e) => setNatureza(e.target.value)}
            placeholder="Natureza: SALARIO, INSS, IRRF..."
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm md:col-span-2"
          />

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={incideINSS}
              onChange={(e) => setIncideINSS(e.target.checked)}
            />
            Incide INSS
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={incideFGTS}
              onChange={(e) => setIncideFGTS(e.target.checked)}
            />
            Incide FGTS
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={incideIRRF}
              onChange={(e) => setIncideIRRF(e.target.checked)}
            />
            Incide IRRF
          </label>

          <button
            type="button"
            onClick={salvar}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Salvar evento
          </button>
          
          <button
  type="button"
  onClick={async () => {
    try {
      const res = await fetch("/api/admin/rh/eventos-folha/padrao", {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        console.error(json.error || "Erro ao importar eventos.");
        return;
      }

      console.log(
        `Eventos importados. Criados: ${json.criados} | Já existentes: ${json.ignorados}`
      );

      await carregar();
    } catch (error) {
      console.error("Erro ao importar eventos.", error);
    }
  }}
  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
>
  Importar eventos padrão CLT
</button>

        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-bold">Eventos cadastrados</h2>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
                <th className="p-3">Código</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Natureza</th>
                <th className="p-3">INSS</th>
                <th className="p-3">FGTS</th>
                <th className="p-3">IRRF</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : eventos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Nenhum evento cadastrado ainda.
                  </td>
                </tr>
              ) : (
                eventos.map((evento) => (
                  <tr key={evento.id} className="border-b border-slate-800">
                    <td className="p-3 text-white">{evento.codigo}</td>
                    <td className="p-3 text-slate-300">
                      {evento.descricao}
                    </td>
                    <td className="p-3 text-slate-300">{evento.tipo}</td>
                    <td className="p-3 text-slate-300">
                      {evento.natureza || "-"}
                    </td>
                    <td className="p-3 text-slate-300">
                      {evento.incideINSS ? "Sim" : "Não"}
                    </td>
                    <td className="p-3 text-slate-300">
                      {evento.incideFGTS ? "Sim" : "Não"}
                    </td>
                    <td className="p-3 text-slate-300">
                      {evento.incideIRRF ? "Sim" : "Não"}
                    </td>
                    <td className="p-3 text-slate-300">
                      {evento.ativo ? "Ativo" : "Inativo"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}