"use client";

import { useEffect, useState } from "react";

type Bloqueio = {
  id: number;
  ip: string;
  motivo?: string | null;
  ativo: boolean;
  bloqueadoAte?: string | null;
  criadoEm: string;
};

export default function IpsBloqueadosPage() {
  const [dados, setDados] = useState<Bloqueio[]>([]);

  async function carregar() {
    const res = await fetch("/api/admin/ips-bloqueados");
    const json = await res.json();
    setDados(json);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">🚫 IPs Bloqueados</h1>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th>IP</th>
                <th>Motivo</th>
                <th>Bloqueado até</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((item) => (
                <tr key={item.id} className="border-b">
                  <td>{item.ip}</td>
                  <td>{item.motivo || "-"}</td>
                  <td>
                    {item.bloqueadoAte
                      ? new Date(item.bloqueadoAte).toLocaleString("pt-BR")
                      : "Indeterminado"}
                  </td>
                  <td>{new Date(item.criadoEm).toLocaleString("pt-BR")}</td>
                  <td>
  <button
    onClick={async () => {
      await fetch("/api/admin/ips-bloqueados", {
        method: "PATCH",
        body: JSON.stringify({ id: item.id }),
      });
      location.reload();
    }}
    className="bg-green-600 text-white px-3 py-1 rounded"
  >
    Desbloquear
  </button>
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