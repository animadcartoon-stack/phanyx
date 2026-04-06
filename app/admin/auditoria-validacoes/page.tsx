"use client";

import { useEffect, useState } from "react";

type Item = {
  id: number;
  codigoConsultado: string;
  valido: boolean;
  ip?: string;
  userAgent?: string;
  criadoEm: string;
  suspeito?: boolean;
  risco?: number;
  motivoRisco?: string | null;
};

export default function AuditoriaPage() {
  const [dados, setDados] = useState<Item[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");

  async function carregar() {
    const params = new URLSearchParams();

    if (busca) params.append("busca", busca);
    if (status) params.append("status", status);

    const res = await fetch(
      `/api/admin/auditoria-validacoes?${params.toString()}`
    );

    const json = await res.json();
    setDados(json);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">
          🔍 Auditoria de Validação
        </h1>

        <div className="flex gap-4 mb-4">
          <input
            placeholder="Buscar código..."
            className="border p-2 rounded w-full"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="border p-2 rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="valido">Válidos</option>
            <option value="invalido">Inválidos</option>
            <option value="suspeito">Suspeitos</option>
          </select>

          <button
            onClick={carregar}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Filtrar
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th>Código</th>
                <th>Status</th>
<th>Risco</th>
<th>IP</th>
<th>Data</th>
              </tr>
            </thead>

            <tbody>
              {dados.map((item) => (
                <tr key={item.id} className="border-b">
                  <td>{item.codigoConsultado}</td>

                  <td className={item.suspeito ? "text-yellow-600 font-bold" : ""}>
  {item.suspeito ? "⚠ Suspeito" : item.valido ? "✔ Válido" : "✖ Inválido"}
</td>
<td>{item.risco ?? 0}</td>
                  <td>{item.ip || "-"}</td>

                  <td>
                    {new Date(item.criadoEm).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}