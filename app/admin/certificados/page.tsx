"use client";

import { useEffect, useMemo, useState } from "react";

type AlunoItem = {
  id: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
  curso?: string | null;
  statusCertificado?: "PRONTO" | "PENDENTE" | "NAO_ELEGIVEL";
  certificadoUrl?: string | null;
};

function normalizarListaAlunos(data: any): AlunoItem[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.alunos)) return data.alunos;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function corStatus(status?: AlunoItem["statusCertificado"]) {
  if (status === "PRONTO") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (status === "PENDENTE") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

function labelStatus(status?: AlunoItem["statusCertificado"]) {
  if (status === "PRONTO") return "Pronto";
  if (status === "PENDENTE") return "Pendente";
  return "Não elegível";
}

export default function AdminCertificadosPage() {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [alunos, setAlunos] = useState<AlunoItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoItem | null>(null);

  async function carregarAlunos(termo = "") {
    try {
      setCarregando(true);

      const url = termo?.trim()
        ? `/api/aluno?busca=${encodeURIComponent(termo.trim())}`
        : "/api/aluno";

      const res = await fetch(url, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao buscar alunos.");
        return;
      }

      const lista = normalizarListaAlunos(data).map((item: any) => ({
        id: Number(item.id),
        nome: item.nome || "Aluno sem nome",
        email: item.email ?? item.user?.email ?? null,
        matricula: item.matricula ?? null,
        curso:
          item.curso?.nome ??
          item.matriculaAtiva?.curso?.nome ??
          item.matriculas?.[0]?.curso?.nome ??
          null,
        statusCertificado: item.statusCertificado ?? "PENDENTE",
        certificadoUrl: item.certificadoUrl ?? null,
      }));

      setAlunos(lista);
    } catch {
      alert("Erro ao carregar alunos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAlunos();
  }, []);

  const totalProntos = useMemo(
    () => alunos.filter((a) => a.statusCertificado === "PRONTO").length,
    [alunos]
  );

  const totalPendentes = useMemo(
    () => alunos.filter((a) => a.statusCertificado === "PENDENTE").length,
    [alunos]
  );

  const totalNaoElegiveis = useMemo(
    () => alunos.filter((a) => a.statusCertificado === "NAO_ELEGIVEL").length,
    [alunos]
  );

  function aplicarBusca() {
    setBuscaAplicada(busca);
    carregarAlunos(busca);
  }

  function limparBusca() {
    setBusca("");
    setBuscaAplicada("");
    carregarAlunos("");
  }

  function acaoAindaNaoLigada(nomeAcao: string, aluno: AlunoItem) {
    setAlunoSelecionado(aluno);
    alert(`${nomeAcao} do certificado de ${aluno.nome} será ligado no próximo passo.`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          Admin • Certificados
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Gestão de certificados
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600">
          Busque alunos, veja o status do certificado, abra o documento pronto
          quando existir e prepare o fluxo de baixar ou enviar por email.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Certificados prontos
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalProntos}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pendentes
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalPendentes}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Não elegíveis
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalNaoElegiveis}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Buscar aluno
            </label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite nome, matrícula ou email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
            />
          </div>

          <button
            type="button"
            onClick={aplicarBusca}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={limparBusca}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Limpar
          </button>
        </div>

        {buscaAplicada && (
          <p className="mt-3 text-sm text-slate-500">
            Resultado da busca por: <span className="font-semibold">{buscaAplicada}</span>
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Alunos e certificados</h2>
          <p className="mt-1 text-sm text-slate-500">
            Clique em um aluno para visualizar melhor as ações disponíveis.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-6 py-4 font-semibold">Aluno</th>
                <th className="px-6 py-4 font-semibold">Curso</th>
                <th className="px-6 py-4 font-semibold">Matrícula</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-slate-500">
                    Carregando alunos...
                  </td>
                </tr>
              ) : alunos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-slate-500">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                alunos.map((aluno) => (
                  <tr
                    key={aluno.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setAlunoSelecionado(aluno)}
                        className="text-left"
                      >
                        <div className="font-semibold text-slate-900">{aluno.nome}</div>
                        <div className="text-sm text-slate-500">
                          {aluno.email || "Sem email"}
                        </div>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {aluno.curso || "Não informado"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {aluno.matricula || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${corStatus(
                          aluno.statusCertificado
                        )}`}
                      >
                        {labelStatus(aluno.statusCertificado)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
  onClick={async () => {
    const res = await fetch("/api/admin/certificados/gerar", {
      method: "POST",
      body: JSON.stringify({ alunoId: aluno.id }),
    });

    const data = await res.json();

    if (data.sucesso) {
      alert("Certificado gerado com sucesso!");
      window.location.reload();
    } else {
      alert(data.error);
    }
  }}
  className="bg-blue-600 text-white px-3 py-1 rounded"
>
  Gerar
</button>

                        <button
                          type="button"
                          onClick={() =>
                            aluno.certificadoUrl
                              ? window.open(aluno.certificadoUrl, "_blank")
                              : acaoAindaNaoLigada("Visualizar", aluno)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Visualizar
                        </button>

                        <button
                          type="button"
                          onClick={() => acaoAindaNaoLigada("Baixar", aluno)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Baixar
                        </button>

                        <button
                          type="button"
                          onClick={() => acaoAindaNaoLigada("Enviar por email", aluno)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Email
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Aluno selecionado</h2>

        {alunoSelecionado ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nome
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {alunoSelecionado.nome}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {alunoSelecionado.email || "Sem email"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Curso
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {alunoSelecionado.curso || "Não informado"}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status do certificado
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {labelStatus(alunoSelecionado.statusCertificado)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Selecione um aluno na tabela acima.
          </p>
        )}
      </div>
    </div>
  );
}