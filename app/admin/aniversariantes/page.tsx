"use client";

import { useEffect, useMemo, useState } from "react";

type TipoPessoa = "ALUNO" | "PROFESSOR" | "FUNCIONARIO";

type Aniversariante = {
  chave: string;
  id: number;
  tipo: TipoPessoa;
  nome: string;
  dataNascimento: string;
  dataAniversario: string;
  dia: number;
  mes: number;
  telefone: string | null;
  whatsapp: string;
  temWhatsapp: boolean;
  userId: number;
  fotoPerfil: string | null;
  status: string;
  contexto: string;
  departamentoId: number | null;
  departamento: string | null;
};

type Departamento = {
  id: number;
  nome: string;
};

const meses = [
  { valor: "1", nome: "Janeiro" },
  { valor: "2", nome: "Fevereiro" },
  { valor: "3", nome: "Março" },
  { valor: "4", nome: "Abril" },
  { valor: "5", nome: "Maio" },
  { valor: "6", nome: "Junho" },
  { valor: "7", nome: "Julho" },
  { valor: "8", nome: "Agosto" },
  { valor: "9", nome: "Setembro" },
  { valor: "10", nome: "Outubro" },
  { valor: "11", nome: "Novembro" },
  { valor: "12", nome: "Dezembro" },
];

function classeTipo(tipo: TipoPessoa) {
  if (tipo === "ALUNO") {
    return "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-800";
  }

  if (tipo === "PROFESSOR") {
    return "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-800";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800";
}

function classeStatus(status: string) {
  const normalizado = status.toLowerCase();

  if (normalizado.includes("ativo")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800";
  }

  if (
    normalizado.includes("cancel") ||
    normalizado.includes("inativo") ||
    normalizado.includes("deslig")
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800";
  }

  if (
    normalizado.includes("afast") ||
    normalizado.includes("atestado") ||
    normalizado.includes("suspens")
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800";
  }

  return "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700";
}

function nomeTipo(tipo: TipoPessoa) {
  if (tipo === "ALUNO") return "Aluno";
  if (tipo === "PROFESSOR") return "Professor";
  return "Funcionário";
}

export default function AdminAniversariantesPage() {
  const mesAtual = String(new Date().getMonth() + 1);

  const [mes, setMes] = useState(mesAtual);
  const [tipo, setTipo] = useState("TODOS");
  const [status, setStatus] = useState("TODOS");
  const [whatsapp, setWhatsapp] = useState("TODOS");
  const [departamentoId, setDepartamentoId] = useState("TODOS");
  const [busca, setBusca] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>(
    []
  );
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const selecionadosSet = useMemo(
    () => new Set(selecionados),
    [selecionados]
  );

  async function carregarAniversariantes() {
    try {
      setCarregando(true);
      setErro("");

      const params = new URLSearchParams();

      params.set("mes", mes);
      params.set("tipo", tipo);
      params.set("status", status);
      params.set("whatsapp", whatsapp);

      if (departamentoId !== "TODOS") {
        params.set("departamentoId", departamentoId);
      }

      if (busca.trim()) {
        params.set("busca", busca.trim());
      }

      const resposta = await fetch(`/api/admin/aniversariantes?${params}`, {
        credentials: "include",
      });

      const json = await resposta.json();

      if (!resposta.ok) {
        throw new Error(json.error || "Erro ao carregar aniversariantes.");
      }

      setAniversariantes(json.aniversariantes || []);
      setDepartamentos(json.departamentos || []);
      setSelecionados([]);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Erro ao carregar aniversariantes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAniversariantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, tipo, status, whatsapp, departamentoId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarAniversariantes();
    }, 450);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function alternarSelecionado(chave: string) {
    setSelecionados((atuais) => {
      if (atuais.includes(chave)) {
        return atuais.filter((item) => item !== chave);
      }

      return [...atuais, chave];
    });
  }

  function alternarTodos() {
    if (selecionados.length === aniversariantes.length) {
      setSelecionados([]);
      return;
    }

    setSelecionados(aniversariantes.map((item) => item.chave));
  }

  const todosSelecionados =
    aniversariantes.length > 0 &&
    selecionados.length === aniversariantes.length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Administração
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                Aniversariantes
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                Consulte aniversariantes por mês, perfil, status, WhatsApp e
                departamento. A lista é gerada automaticamente pelos cadastros
                de alunos, professores e funcionários.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
              <p className="font-semibold">Selecionados</p>
              <p className="text-2xl font-bold">{selecionados.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Mês
              </span>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900"
              >
                {meses.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Tipo
              </span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900"
              >
                <option value="TODOS">Todos</option>
                <option value="ALUNO">Alunos</option>
                <option value="PROFESSOR">Professores</option>
                <option value="FUNCIONARIO">Funcionários</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900"
              >
                <option value="TODOS">Todos</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="AFASTADO">Afastado</option>
                <option value="ATESTADO">Atestado médico</option>
                <option value="SUSPENSO">Suspenso</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                WhatsApp
              </span>
              <select
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900"
              >
                <option value="TODOS">Todos</option>
                <option value="COM">Com WhatsApp</option>
                <option value="SEM">Sem WhatsApp</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Departamento
              </span>
              <select
                value={departamentoId}
                onChange={(e) => setDepartamentoId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900"
              >
                <option value="TODOS">Todos</option>
                {departamentos.map((departamento) => (
                  <option key={departamento.id} value={departamento.id}>
                    {departamento.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Buscar
              </span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900"
              />
            </label>
          </div>
        </section>

        {erro && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100">
            {erro}
          </section>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Lista de aniversariantes
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {carregando
                  ? "Carregando..."
                  : `${aniversariantes.length} registro(s) encontrado(s).`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                title="Será implementado na próxima etapa com modal padrão PHANYX."
              >
                Enviar mensagem
              </button>

              <button
                type="button"
                disabled
                className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                title="Será implementado na próxima etapa."
              >
                Gerar WhatsApp
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={todosSelecionados}
                      onChange={alternarTodos}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Aniversário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Departamento / Contexto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    WhatsApp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {carregando && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                    >
                      Carregando aniversariantes...
                    </td>
                  </tr>
                )}

                {!carregando && aniversariantes.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                    >
                      Nenhum aniversariante encontrado para os filtros
                      selecionados.
                    </td>
                  </tr>
                )}

                {!carregando &&
                  aniversariantes.map((item) => (
                    <tr
                      key={item.chave}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                    >
                      <td className="px-4 py-4 align-middle">
                        <input
                          type="checkbox"
                          checked={selecionadosSet.has(item.chave)}
                          onChange={() => alternarSelecionado(item.chave)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
                        />
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {item.fotoPerfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.fotoPerfil}
                                alt={item.nome}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              item.nome.slice(0, 1).toUpperCase()
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">
                              {item.nome}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              ID {item.id} · Usuário {item.userId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${classeTipo(
                            item.tipo
                          )}`}
                        >
                          {nomeTipo(item.tipo)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.dataAniversario}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <p className="text-sm text-slate-800 dark:text-slate-200">
                          {item.departamento || item.contexto || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        {item.telefone ? (
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {item.telefone}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.temWhatsapp
                                ? "Possui número"
                                : "Número incompleto"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Sem telefone
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${classeStatus(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}