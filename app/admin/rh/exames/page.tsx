"use client";

import { useEffect, useMemo, useState } from "react";

type Funcionario = {
  id: number;
  nome: string;
  cpf?: string | null;
  cargo?: string | null;
  departamento?: { nome?: string | null } | null;
};

type ExameMedicoRH = {
  id: number;
  tipo: string;
  dataExame: string;
  clinica?: string | null;
  medico?: string | null;
  crm?: string | null;
  resultado?: string | null;
  validade?: string | null;
  arquivoUrl?: string | null;
  observacoes?: string | null;
  funcionario?: Funcionario | null;
};

const tiposExame = [
  "ASO Admissional",
  "ASO Periódico",
  "ASO Retorno ao Trabalho",
  "ASO Mudança de Função",
  "ASO Demissional",
  "Outro",
];

function dataBR(data?: string | null) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

function diasParaVencer(data?: string | null) {
  if (!data) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const validade = new Date(data);
  validade.setHours(0, 0, 0, 0);

  if (Number.isNaN(validade.getTime())) return null;

  return Math.ceil(
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function ExamesMedicosRHPage() {
  const [exames, setExames] = useState<ExameMedicoRH[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [funcionarioId, setFuncionarioId] = useState("");
  const [tipo, setTipo] = useState("ASO Admissional");
  const [dataExame, setDataExame] = useState("");
  const [validade, setValidade] = useState("");
  const [clinica, setClinica] = useState("");
  const [medico, setMedico] = useState("");
  const [crm, setCrm] = useState("");
  const [resultado, setResultado] = useState("APTO");
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const resumo = useMemo(() => {
    const vencidos = exames.filter((e) => {
      const dias = diasParaVencer(e.validade);
      return dias !== null && dias < 0;
    }).length;

    const vencendo = exames.filter((e) => {
      const dias = diasParaVencer(e.validade);
      return dias !== null && dias >= 0 && dias <= 30;
    }).length;

    const aptos = exames.filter((e) =>
      String(e.resultado || "").toUpperCase().includes("APTO")
    ).length;

    return {
      total: exames.length,
      aptos,
      vencendo,
      vencidos,
    };
  }, [exames]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function lerJsonSeguro(res: Response, nomeRota: string) {
    const texto = await res.text();

    try {
      return JSON.parse(texto);
    } catch {
      throw new Error(
        `${nomeRota} não retornou JSON. Verifique se a rota existe e se não está redirecionando para HTML.`
      );
    }
  }

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const resFuncionarios = await fetch("/api/admin/funcionarios", {
        credentials: "include",
        cache: "no-store",
      });

      const dataFuncionarios = await lerJsonSeguro(
        resFuncionarios,
        "/api/admin/funcionarios"
      );

      if (!resFuncionarios.ok) {
        throw new Error(
          dataFuncionarios?.error || "Erro ao carregar funcionários."
        );
      }

      setFuncionarios(
        Array.isArray(dataFuncionarios)
          ? dataFuncionarios
          : Array.isArray(dataFuncionarios?.funcionarios)
          ? dataFuncionarios.funcionarios
          : []
      );

      const resExames = await fetch("/api/admin/rh/exames", {
        credentials: "include",
        cache: "no-store",
      });

      const dataExames = await lerJsonSeguro(
        resExames,
        "/api/admin/rh/exames"
      );

      if (!resExames.ok) {
        throw new Error(dataExames?.error || "Erro ao carregar exames.");
      }

      setExames(Array.isArray(dataExames) ? dataExames : []);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  function limparFormulario() {
    setFuncionarioId("");
    setTipo("ASO Admissional");
    setDataExame("");
    setValidade("");
    setClinica("");
    setMedico("");
    setCrm("");
    setResultado("APTO");
    setArquivoUrl("");
    setObservacoes("");
  }

  async function arquivarExame(id: number) {
  try {
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/admin/rh/exames/${id}/arquivar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        motivo: "Arquivamento realizado pela tela de exames médicos.",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao arquivar exame médico.");
    }

    setMensagem("Exame médico arquivado com sucesso.");
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || "Erro ao arquivar exame médico.");
  }
}

async function cancelarExame(id: number) {
  try {
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/admin/rh/exames/${id}/cancelar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        motivo: "Cancelamento realizado pela tela de exames médicos.",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao cancelar exame médico.");
    }

    setMensagem("Exame médico cancelado com sucesso.");
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || "Erro ao cancelar exame médico.");
  }
}

  async function salvarExame() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      if (!funcionarioId) {
        setErro("Selecione um funcionário antes de registrar o exame.");
        return;
      }

      if (!tipo.trim()) {
        setErro("Informe o tipo de exame.");
        return;
      }

      if (!dataExame) {
        setErro("Informe a data do exame.");
        return;
      }

      const res = await fetch("/api/admin/rh/exames", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          funcionarioId,
          tipo,
          dataExame,
          validade,
          clinica,
          medico,
          crm,
          resultado,
          arquivoUrl,
          observacoes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao registrar exame médico.");
      }

      setMensagem("Exame médico registrado com sucesso.");
      limparFormulario();
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar exame médico.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="phanyx-rh-page space-y-6 text-slate-950 dark:text-white">
      <div>
        <p className="text-sm font-bold uppercase text-purple-700 dark:text-purple-400">
          Departamento Pessoal
        </p>

        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          Exames Médicos / ASO
        </h1>

        <p className="text-sm text-slate-700 dark:text-slate-300">
          Registre ASO admissional, periódico, retorno ao trabalho, mudança de função e demissional.
        </p>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Total</p>
          <p className="text-2xl font-bold text-slate-950 dark:text-white">{resumo.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Aptos</p>
          <p className="text-2xl font-bold text-slate-950 dark:text-white">{resumo.aptos}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Vencendo em 30 dias
          </p>
          <p className="text-2xl font-bold text-slate-950 dark:text-white">{resumo.vencendo}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Vencidos</p>
          <p className="text-2xl font-bold text-slate-950 dark:text-white">{resumo.vencidos}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Registrar exame médico
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Funcionário</label>
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Selecione</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.cargo ? `- ${f.cargo}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de exame</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {tiposExame.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data do exame</label>
            <input
              type="date"
              value={dataExame}
              onChange={(e) => setDataExame(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 dark:placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Validade</label>
            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 dark:placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Clínica</label>
            <input
              value={clinica}
              onChange={(e) => setClinica(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 dark:placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Nome da clínica"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Médico</label>
            <input
              value={medico}
              onChange={(e) => setMedico(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 dark:placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Nome do médico"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CRM</label>
            <input
              value={crm}
              onChange={(e) => setCrm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 dark:placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="CRM"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Resultado</label>
            <select
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="APTO">APTO</option>
              <option value="INAPTO">INAPTO</option>
              <option value="APTO COM RESTRIÇÕES">APTO COM RESTRIÇÕES</option>
              <option value="PENDENTE">PENDENTE</option>
            </select>
          </div>

         <div>
  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
    Documento do Exame (PDF, JPG ou PNG)
  </label>

  <input
    type="file"
    accept=".pdf,.png,.jpg,.jpeg"
    className="mt-1 block w-full text-sm text-slate-700 dark:text-slate-300
      file:mr-4 file:rounded-xl file:border-0
      file:bg-blue-600 file:px-4 file:py-2
      file:text-white hover:file:bg-blue-700"
    onChange={async (e) => {
      const arquivo = e.target.files?.[0];
      if (!arquivo) return;

      const formData = new FormData();
      formData.append("arquivo", arquivo);

      try {
        const resp = await fetch(
          "/api/admin/rh/exames/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.error);
        }

        setArquivoUrl(data.url);
      } catch (err: any) {
        setErro(err.message || "Erro ao enviar arquivo.");
      }
    }}
  />

  {arquivoUrl && (
    <a
      href={arquivoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex text-sm text-blue-600 hover:underline dark:text-blue-400"
    >
      Visualizar documento enviado
    </a>
  )}
</div>

          <div className="md:col-span-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 dark:placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Observações internas"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={salvarExame}
          disabled={salvando}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {salvando ? "Salvando..." : "Registrar exame"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Exames cadastrados
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                <th className="p-3 text-slate-700 dark:text-slate-300">Funcionário</th>
                <th className="p-3 text-slate-700 dark:text-slate-300">Tipo</th>
                <th className="p-3 text-slate-700 dark:text-slate-300">Data</th>
                <th className="p-3 text-slate-700 dark:text-slate-300">Validade</th>
                <th className="p-3 text-slate-700 dark:text-slate-300">Resultado</th>
                <th className="p-3 text-slate-700 dark:text-slate-300">Clínica/Médico</th>
                <th className="p-3 text-slate-700 dark:text-slate-300">Arquivo</th>
                <th className="p-3 text-slate-700 dark:text-slate-300">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={8}>
                    Carregando...
                  </td>
                </tr>
              ) : exames.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={8}>
                    Nenhum exame médico cadastrado.
                  </td>
                </tr>
              ) : (
                exames.map((item) => {
                  const dias = diasParaVencer(item.validade);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-medium">
                        {item.funcionario?.nome || "-"}
                      </td>

                      <td className="p-3">{item.tipo}</td>

                      <td className="p-3">{dataBR(item.dataExame)}</td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            dias !== null && dias < 0
                              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200"
                              : dias !== null && dias <= 30
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                          }`}
                        >
                          {item.validade ? dataBR(item.validade) : "Sem validade"}
                        </span>
                      </td>

                      <td className="p-3">{item.resultado || "-"}</td>

                      <td className="p-3">
                        <div>{item.clinica || "-"}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-700 dark:text-slate-400">
                          {item.medico || ""} {item.crm ? `• CRM ${item.crm}` : ""}
                        </div>
                      </td>

                      <td className="p-3">
  {item.arquivoUrl ? (
    <div className="flex flex-wrap gap-2">
      <a
        href={item.arquivoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
      >
        Abrir
      </a>

      <a
        href={item.arquivoUrl}
        download
        className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
      >
        Baixar
      </a>
    </div>
  ) : (
    <span className="text-slate-500 dark:text-slate-400">-</span>
  )}
</td>
                      <td className="p-3">
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => arquivarExame(item.id)}
      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      Arquivar
    </button>

    {item.resultado !== "CANCELADO" && (
      <button
        type="button"
        onClick={() => cancelarExame(item.id)}
        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        Cancelar
      </button>
    )}
  </div>
</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}