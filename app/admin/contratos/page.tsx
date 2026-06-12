"use client";

import { useEffect, useState } from "react";

type AlunoOption = {
  id: number;
  nome: string;
  matricula?: string | null;
  email?: string | null;
  statusAluno?: string | null;
};

type ContratoResposta = {
    matricula?: {
    id: number;
    status?: string | null;
    semestre?: number | null;
  };
  contrato?: {
    id: number;
    status: string;
    tokenAssinatura?: string | null;
    dataCriacao?: string | null;
    dataAssinatura?: string | null;
  } | null;
  aluno: {
    id: number;
    nome: string;
    cpf?: string | null;
    matricula?: string | null;
  };
  instituicao: {
    nomeFantasia: string;
    cnpj: string;
    responsavelNome: string;
    responsavelCargo: string;
    cidadeAssinatura: string;
    logoUrl?: string | null;
  };
  curso: string;
  disciplinas: string[];
  valorContrato: number;
  contratoFinal: string;
  observacoesContrato?: string;
};

function formatarMoeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AdminContratosPage() {
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [alunoId, setAlunoId] = useState("");
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingContrato, setLoadingContrato] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [contrato, setContrato] = useState<ContratoResposta | null>(null);
  const [enviandoAssinatura, setEnviandoAssinatura] = useState(false);

  async function buscarAlunos() {
    try {
      setLoadingAlunos(true);
      setMensagem("");

      const query = new URLSearchParams();
      if (busca.trim()) query.set("busca", busca.trim());

      const res = await fetch(
        `/api/admin/alunos/busca-simples?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao buscar alunos");
      }

      setAlunos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMensagem(error?.message || "Erro ao buscar alunos");
      setAlunos([]);
    } finally {
      setLoadingAlunos(false);
    }
  }

  async function carregarContrato(id: string) {
    if (!id) {
      setContrato(null);
      return;
    }

    try {
      setLoadingContrato(true);
      setMensagem("");

      const res = await fetch(`/api/admin/contratos/gerar?alunoId=${id}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao gerar contrato");
      }

      setContrato(data);
    } catch (error: any) {
      setMensagem(error?.message || "Erro ao gerar contrato");
      setContrato(null);
    } finally {
      setLoadingContrato(false);
    }
  }

async function enviarParaAssinatura() {
  try {
    if (!contrato?.contrato?.id) {
      setMensagem("Gere o contrato antes de enviar para assinatura.");
      return;
    }

    setEnviandoAssinatura(true);
    setMensagem("");

    const res = await fetch("/api/admin/documentos/enviar-assinatura", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contratoId: contrato.contrato.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao enviar contrato para assinatura");
    }

    setMensagem("Contrato enviado para assinatura com sucesso.");
  } catch (error: any) {
    setMensagem(error?.message || "Erro ao enviar contrato para assinatura");
  } finally {
    setEnviandoAssinatura(false);
  }
}

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/y/g, "i")
    .trim();
}

const termoBuscaNormalizado = normalizarTexto(busca);

const alunosFiltrados = [...alunos]
  .filter((aluno) => {
    if (!termoBuscaNormalizado) return true;

    const nome = normalizarTexto(aluno.nome || "");
    const email = normalizarTexto(aluno.email || "");
    const matricula = normalizarTexto(aluno.matricula || "");

    return (
      nome.includes(termoBuscaNormalizado) ||
      email.includes(termoBuscaNormalizado) ||
      matricula.includes(termoBuscaNormalizado)
    );
  })
  .sort((a, b) => {
    const nomeA = normalizarTexto(a.nome || "");
    const nomeB = normalizarTexto(b.nome || "");

    const aComeca = nomeA.startsWith(termoBuscaNormalizado);
    const bComeca = nomeB.startsWith(termoBuscaNormalizado);

    if (aComeca && !bComeca) return -1;
    if (!aComeca && bComeca) return 1;

    return nomeA.localeCompare(nomeB, "pt-BR");
  });

  useEffect(() => {
    const t = setTimeout(() => {
      buscarAlunos();
    }, 300);

    return () => clearTimeout(t);
  }, [busca]);

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          📄 Contratos
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Gere contratos automaticamente com dados da instituição, aluno, curso e disciplinas.
        </p>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {mensagem}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Selecionar aluno
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Buscar aluno
            </label>
            <div className="relative">
  <input
    autoComplete="off"
    spellCheck={false}
    name="buscarAlunoContrato"
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
    placeholder="Digite nome, matrícula ou email"
    
  />

  {busca.trim() && alunosFiltrados.length > 0 && (
    <div className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
      {alunosFiltrados.map((aluno) => (
        <button
          key={aluno.id}
          type="button"
          onClick={() => {
            setAlunoId(String(aluno.id));
            setBusca(
              `${aluno.nome}${aluno.matricula ? ` - ${aluno.matricula}` : ""}${
                aluno.email ? ` - ${aluno.email}` : ""
              }`
            );
            carregarContrato(String(aluno.id));
          }}
          className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-blue-600"
        >
          <div className="flex flex-col">
  <span className="font-medium text-white">
    {aluno.nome}
  </span>

  <span className="text-xs text-blue-400">
    {aluno.matricula || ""}
    {aluno.email ? ` • ${aluno.email}` : ""}
  </span>
</div>
        </button>
      ))}
    </div>
  )}
</div>
            {loadingAlunos && (
              <p className="mt-1 text-xs text-slate-500">Buscando alunos...</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Selecionar aluno
            </label>
            <select
              value={alunoId}
              onChange={(e) => {
                setAlunoId(e.target.value);
                carregarContrato(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option
  value=""
  className="bg-slate-900 text-white"
>
  Selecione um aluno
</option>
              {alunosFiltrados.map((aluno) => (
                <option
  key={aluno.id}
  value={aluno.id}
  className="bg-slate-900 text-white"
>
                  {aluno.nome}
                  {aluno.matricula ? ` - ${aluno.matricula}` : ""}
                  {aluno.email ? ` - ${aluno.email}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loadingContrato ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">
          Gerando contrato...
        </div>
      ) : contrato ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Pré-visualização do contrato
              </h2>

              <div
  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800 [&_p]:mb-4 [&_h1]:mb-6 [&_h1]:text-center [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-6 [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
  dangerouslySetInnerHTML={{
    __html: contrato.contratoFinal,
  }}
/>

              {contrato.observacoesContrato && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Observações contratuais</p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {contrato.observacoesContrato}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Resumo do contrato
              </h2>

              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-slate-500">Instituição</p>
                  <p className="font-medium">{contrato.instituicao.nomeFantasia}</p>
                </div>

                <div>
                  <p className="text-slate-500">Aluno</p>
                  <p className="font-medium">{contrato.aluno.nome}</p>
                </div>

                <div>
                  <p className="text-slate-500">CPF</p>
                  <p className="font-medium">{contrato.aluno.cpf || "-"}</p>
                </div>

                <div>
                  <p className="text-slate-500">Matrícula</p>
                  <p className="font-medium">{contrato.aluno.matricula || "-"}</p>
                </div>

                <div>
                  <p className="text-slate-500">Curso</p>
                  <p className="font-medium">{contrato.curso}</p>
                </div>

                <div>
                  <p className="text-slate-500">Valor do contrato</p>
                  <p className="font-medium">{formatarMoeda(contrato.valorContrato)}</p>
                </div>

                <div>
                  <p className="text-slate-500">Cidade de assinatura</p>
                  <p className="font-medium">{contrato.instituicao.cidadeAssinatura}</p>
                </div>

                <div>
                  <p className="text-slate-500">Responsável legal</p>
                  <p className="font-medium">
                    {contrato.instituicao.responsavelNome} - {contrato.instituicao.responsavelCargo}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => {
  if (!alunoId) return;
  window.open(`/api/admin/contratos/pdf?alunoId=${alunoId}`, "_blank");
}}
                >
                  Gerar PDF do contrato
                </button>

<button
  type="button"
  onClick={enviarParaAssinatura}
  disabled={enviandoAssinatura || contrato?.contrato?.status === "ASSINADO"}
  className="mt-3 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
>
  {contrato?.contrato?.status === "ASSINADO"
    ? "Contrato já assinado"
    : enviandoAssinatura
    ? "Enviando..."
    : "Enviar para assinatura"}
</button>

              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Disciplinas contratadas
            </h2>

            {contrato.disciplinas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma disciplina encontrada.</p>
            ) : (
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                {contrato.disciplinas.map((disciplina, index) => (
                  <li key={`${disciplina}-${index}`}>{disciplina}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}