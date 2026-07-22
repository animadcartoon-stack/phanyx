"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
  salarioBase?: string | number | null;
  elegivel: boolean;
  jaParticipa: boolean;
  motivosInelegibilidade: string[];
  departamento?: {
    id: number;
    nome: string;
  } | null;
};

type Participante = {
  id: number;
  funcionarioId: number;
  funcionarioNomeSnapshot: string;
  funcionarioCargoSnapshot?: string | null;
  funcionarioDepartamentoSnapshot?: string | null;
};

type Programa = {
  id: number;
  nome: string;
  descricao?: string | null;
  tipo: string;
  abrangencia: string;
  metodoDistribuicao: string;
  status: string;
  valorFundo?: string | number | null;
  percentualFundo?: string | number | null;
  competenciaMes?: number | null;
  competenciaAno?: number | null;
  criadoEm: string;
  criadoPorId?: number | null;
  criadoPor?: {
    id: number;
    nome: string;
    email: string;
  } | null;
  departamento?: {
    id: number;
    nome: string;
  } | null;
  participantes: Participante[];
};

type LinhaPreviaDistribuicao = {
  participanteId: number;
  funcionarioId: number;
  funcionarioNome: string;
  funcionarioCargo?: string | null;
  funcionarioDepartamento?: string | null;
  criterio: string;
  baseCalculo: number;
  percentualAplicado?: number | null;
  pesoAplicado?: number | null;
  diasConsiderados?: number | null;
  valorBruto: number;
  valorPrevisto: number;
  alertas: string[];
};

type PreviaDistribuicao = {
  metodoDistribuicao: string;
  totalParticipantes: number;
  valorFundo: number;
  totalDistribuido: number;
  saldo: number;
  linhas: LinhaPreviaDistribuicao[];
  alertasGerais: string[];
};

function formatarMoeda(
  valor?: string | number | null
) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "-";

  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarTexto(valor: string) {
  return valor.replaceAll("_", " ");
}

function normalizarBusca(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function correspondeBusca(
  valores: Array<string | null | undefined>,
  busca: string
) {
  const termos = normalizarBusca(busca)
    .split(/\s+/)
    .filter(Boolean);

  if (termos.length === 0) {
    return true;
  }

  const indice = normalizarBusca(
    valores.filter(Boolean).join(" ")
  );

  return termos.every((termo) => indice.includes(termo));
}

function criarSugestoes(
  valores: Array<string | null | undefined>,
  busca: string
) {
  const sugestoesUnicas = Array.from(
    new Set(
      valores
        .map((valor) => String(valor || "").trim())
        .filter(Boolean)
    )
  );

  const termo = normalizarBusca(busca);

  return sugestoesUnicas
    .filter(
      (sugestao) =>
        !termo ||
        normalizarBusca(sugestao).includes(termo)
    )
    .slice(0, 6);
}

export default function GerenciarRemuneracaoVariavelPage() {
  const params = useParams<{ id: string }>();
  const programaId = Number(params.id);

  const [programa, setPrograma] =
    useState<Programa | null>(null);

  const [funcionarios, setFuncionarios] = useState<
    Funcionario[]
  >([]);

  const [selecionados, setSelecionados] = useState<
    number[]
  >([]);

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [participantesAberto, setParticipantesAberto] =
  useState(true);

const [funcionariosAberto, setFuncionariosAberto] =
  useState(false);

const [buscaParticipantes, setBuscaParticipantes] =
  useState("");

const [buscaFuncionarios, setBuscaFuncionarios] =
  useState("");

  const [previaAberta, setPreviaAberta] =
  useState(true);

const [calculandoPrevia, setCalculandoPrevia] =
  useState(false);

const [previa, setPrevia] =
  useState<PreviaDistribuicao | null>(null);

  const [
  modalAtivacaoAberto,
  setModalAtivacaoAberto,
] = useState(false);

const [ativandoPrograma, setAtivandoPrograma] =
  useState(false);

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        `/api/admin/rh/remuneracao-variavel/${programaId}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            "Não foi possível carregar o programa."
        );
      }

      setPrograma(dados.programa);
      setFuncionarios(dados.funcionarios || []);
    } catch (error: any) {
      setErro(
        error?.message ||
          "Erro ao carregar o programa."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (programaId) {
      carregar();
    }
  }, [programaId]);

 
  function alternarFuncionario(id: number) {
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  }

  async function gerarParticipantes() {
    try {
      setProcessando(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        `/api/admin/rh/remuneracao-variavel/${programaId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acao: "GERAR_PARTICIPANTES",
            funcionarioIds: selecionados,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            "Não foi possível incluir os participantes."
        );
      }

      setSucesso(dados.message);
      setSelecionados([]);
      setPrevia(null);

      await carregar();
    } catch (error: any) {
      setErro(
        error?.message ||
          "Erro ao incluir os participantes."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function calcularPrevia() {
  try {
    setCalculandoPrevia(true);
    setErro("");
    setSucesso("");

    const resposta = await fetch(
      `/api/admin/rh/remuneracao-variavel/${programaId}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "PREVISUALIZAR_DISTRIBUICAO",
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados.error ||
          "Não foi possível calcular a distribuição."
      );
    }

    setPrevia(dados.previa);
    setPreviaAberta(true);
  } catch (error: any) {
    setErro(
      error?.message ||
        "Erro ao calcular a distribuição."
    );
  } finally {
    setCalculandoPrevia(false);
  }
}

async function ativarPrograma() {
  if (!previa) {
    setErro(
      "Calcule a prévia antes de ativar o programa."
    );
    return;
  }

  try {
    setAtivandoPrograma(true);
    setErro("");
    setSucesso("");

    const resposta = await fetch(
      `/api/admin/rh/remuneracao-variavel/${programaId}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao:
            "ATIVAR_E_GERAR_LANCAMENTOS",
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      const detalhes = Array.isArray(
        dados.detalhes
      )
        ? ` ${dados.detalhes.join(" ")}`
        : "";

      throw new Error(
        `${
          dados.error ||
          "Não foi possível ativar o programa."
        }${detalhes}`
      );
    }

    setModalAtivacaoAberto(false);
    setPrevia(null);

    setSucesso(
      dados.message ||
        "Programa ativado e lançamentos gerados."
    );

    await carregar();
  } catch (error: any) {
    setErro(
      error?.message ||
        "Erro ao ativar o programa."
    );
  } finally {
    setAtivandoPrograma(false);
  }
}

  if (carregando) {
    return (
      <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen p-6">
        <p>Carregando programa...</p>
      </main>
    );
  }

  if (!programa) {
    return (
      <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen p-6">
        <p>{erro || "Programa não encontrado."}</p>
      </main>
    );
  }

  const exigeSelecao =
    programa.abrangencia ===
    "FUNCIONARIOS_SELECIONADOS";

    const participantesFiltrados =
  programa.participantes.filter((participante) =>
    correspondeBusca(
      [
        participante.funcionarioNomeSnapshot,
        participante.funcionarioCargoSnapshot,
        participante.funcionarioDepartamentoSnapshot,
        participante.funcionarioCargoSnapshot
          ? `cargo ${participante.funcionarioCargoSnapshot}`
          : null,
        participante.funcionarioDepartamentoSnapshot
          ? `departamento ${participante.funcionarioDepartamentoSnapshot}`
          : "sem departamento",
      ],
      buscaParticipantes
    )
  );

const participantesExibidos =
  participantesFiltrados.slice(0, 30);

const funcionariosFiltrados = funcionarios.filter(
  (funcionario) =>
    correspondeBusca(
      [
        funcionario.nome,
        funcionario.cargo,
        funcionario.departamento?.nome,
        funcionario.cargo
          ? `cargo ${funcionario.cargo}`
          : "cargo não informado",
        funcionario.departamento?.nome
          ? `departamento ${funcionario.departamento.nome}`
          : "sem departamento",
        funcionario.jaParticipa
          ? "já incluído já incluídos participante"
          : "não incluído não incluídos disponível",
        funcionario.elegivel
          ? "elegível elegíveis apto"
          : "inelegível inelegíveis inapto",
      ],
      buscaFuncionarios
    )
);

const funcionariosExibidos =
  funcionariosFiltrados.slice(0, 30);

const sugestoesParticipantes = criarSugestoes(
  [
    ...programa.participantes.map(
      (participante) =>
        participante.funcionarioNomeSnapshot
    ),
    ...programa.participantes.map((participante) =>
      participante.funcionarioCargoSnapshot
        ? `Cargo: ${participante.funcionarioCargoSnapshot}`
        : null
    ),
    ...programa.participantes.map((participante) =>
      participante.funcionarioDepartamentoSnapshot
        ? `Departamento: ${participante.funcionarioDepartamentoSnapshot}`
        : "Sem departamento"
    ),
  ],
  buscaParticipantes
);

const sugestoesFuncionarios = criarSugestoes(
  [
    "Já incluídos",
    "Não incluídos",
    "Elegíveis",
    "Inelegíveis",
    "Sem departamento",
    ...funcionarios.map(
      (funcionario) => funcionario.nome
    ),
    ...funcionarios.map((funcionario) =>
      funcionario.cargo
        ? `Cargo: ${funcionario.cargo}`
        : null
    ),
    ...funcionarios.map((funcionario) =>
      funcionario.departamento?.nome
        ? `Departamento: ${funcionario.departamento.nome}`
        : null
    ),
  ],
  buscaFuncionarios
);

  return (
    <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/rh/remuneracao-variavel"
              className="text-sm font-bold text-blue-400 hover:underline"
            >
              ← Voltar para Remuneração Variável
            </Link>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
              Gerenciamento do programa
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {programa.nome}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {programa.descricao ||
                "Programa sem descrição informada."}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
            {formatarTexto(programa.status)}
          </span>
        </header>

        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-200">
            {sucesso}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Abrangência
            </p>
            <p className="mt-3 font-black">
              {formatarTexto(programa.abrangencia)}
            </p>
            {programa.departamento?.nome && (
              <p className="mt-2 text-xs text-slate-400">
                {programa.departamento.nome}
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Método
            </p>
            <p className="mt-3 font-black">
              {formatarTexto(
                programa.metodoDistribuicao
              )}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Fundo
            </p>
            <p className="mt-3 text-xl font-black">
              {programa.valorFundo
                ? formatarMoeda(programa.valorFundo)
                : programa.percentualFundo
                  ? `${programa.percentualFundo}%`
                  : "-"}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Auditoria
            </p>
            <p className="mt-3 font-black">
              {programa.criadoPor?.nome ||
                programa.criadoPor?.email ||
                `Usuário ID ${programa.criadoPorId ?? "-"}`}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Criado em:{" "}
              {formatarDataHora(programa.criadoEm)}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <button
      type="button"
      aria-expanded={participantesAberto}
      onClick={() =>
        setParticipantesAberto((atual) => !atual)
      }
      className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
    >
      <div>
        <h2 className="text-lg font-black">
          Participantes
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {programa.participantes.length} funcionário(s)
          incluído(s) no programa.
        </p>
      </div>

      <span className="text-2xl font-black">
        {participantesAberto ? "▴" : "▾"}
      </span>
    </button>

    <button
      type="button"
      disabled={
        processando ||
        programa.status !== "RASCUNHO" ||
        (exigeSelecao && selecionados.length === 0)
      }
      onClick={gerarParticipantes}
      className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {processando
        ? "Incluindo..."
        : exigeSelecao
          ? `Incluir selecionados (${selecionados.length})`
          : programa.participantes.length > 0
  ? "Atualizar participantes elegíveis"
  : "Gerar participantes elegíveis"}
    </button>
  </div>

  {participantesAberto && (
    <>
      <div className="mt-5">
        <input
          type="search"
          value={buscaParticipantes}
          onChange={(event) =>
            setBuscaParticipantes(event.target.value)
          }
          placeholder="Busque com suas palavras: nome, cargo ou departamento..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
        />

        {sugestoesParticipantes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {sugestoesParticipantes.map((sugestao) => (
              <button
                key={sugestao}
                type="button"
                onClick={() =>
                  setBuscaParticipantes(sugestao)
                }
                className="phanyx-remuneracao-sugestao rounded-full border px-3 py-1 text-xs font-semibold transition"
              >
                {sugestao}
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400">
          Mostrando {participantesExibidos.length} de{" "}
          {participantesFiltrados.length} resultado(s).
          {participantesFiltrados.length > 30 &&
            " Refine a busca para localizar outros participantes."}
        </p>
      </div>

      {programa.participantes.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          Nenhum participante incluído ainda.
        </div>
      ) : participantesFiltrados.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          Nenhum participante corresponde à busca.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="p-3">Funcionário</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Departamento</th>
              </tr>
            </thead>

            <tbody>
              {participantesExibidos.map(
                (participante) => (
                  <tr
                    key={participante.id}
                    className="border-t border-slate-800"
                  >
                    <td className="p-3 font-bold">
                      {
                        participante.funcionarioNomeSnapshot
                      }
                    </td>

                    <td className="p-3 text-slate-300">
                      {participante.funcionarioCargoSnapshot ||
                        "-"}
                    </td>

                    <td className="p-3 text-slate-300">
                      {participante.funcionarioDepartamentoSnapshot ||
                        "-"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        
      )}
    </>
  )}
</section>

<section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <button
      type="button"
      aria-expanded={previaAberta}
      onClick={() =>
        setPreviaAberta((atual) => !atual)
      }
      className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
    >
      <div>
        <h2 className="text-lg font-black">
          Prévia da distribuição
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Confira quanto cada funcionário receberá antes
          de gerar lançamentos.
        </p>
      </div>

      <span className="text-2xl font-black">
        {previaAberta ? "▴" : "▾"}
      </span>
    </button>

    <button
      type="button"
      disabled={
        calculandoPrevia ||
        programa.participantes.length === 0
      }
      onClick={calcularPrevia}
      className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {calculandoPrevia
        ? "Calculando..."
        : previa
          ? "Recalcular prévia"
          : "Calcular prévia"}
    </button>
  </div>

  {previaAberta && (
    <>
      {!previa ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          Clique em “Calcular prévia” para visualizar
          os valores individuais.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Participantes
              </p>

              <p className="mt-2 text-2xl font-black">
                {previa.totalParticipantes}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Fundo
              </p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(previa.valorFundo)}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Total distribuído
              </p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(
                  previa.totalDistribuido
                )}
              </p>
            </article>

            <article className="phanyx-remuneracao-elegibilidade-card rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Saldo
              </p>

              <p className="mt-2 text-2xl font-black">
                {formatarMoeda(previa.saldo)}
              </p>
            </article>
          </div>

          {previa.alertasGerais.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-black">
                Pontos de atenção
              </p>

              <div className="mt-2 space-y-1 text-sm">
                {previa.alertasGerais.map(
                  (alerta) => (
                    <p key={alerta}>• {alerta}</p>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">Funcionário</th>
                  <th className="p-3">Critério</th>
                  <th className="p-3">Valor previsto</th>
                  <th className="p-3">Observações</th>
                </tr>
              </thead>

              <tbody>
  {previa.linhas.map((linha) => (
    <tr
      key={linha.participanteId}
      className="border-t border-slate-800"
    >
      <td className="p-3">
        <p className="font-black">
          {linha.funcionarioNome}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {linha.funcionarioCargo || "Cargo não informado"}
          {" • "}
          {linha.funcionarioDepartamento || "Sem departamento"}
        </p>
      </td>

      <td className="p-3">
        {linha.criterio}
      </td>

      <td className="p-3 text-base font-black">
        {formatarMoeda(linha.valorPrevisto)}
      </td>

      <td className="p-3">
        {linha.alertas.length === 0 ? (
          <span className="text-emerald-600">
            Cálculo válido
          </span>
        ) : (
          <div className="space-y-1 text-xs text-amber-600">
            {linha.alertas.map((alerta) => (
              <p key={alerta}>• {alerta}</p>
            ))}
          </div>
        )}
      </td>
    </tr>
  ))}
</tbody>
</table>
</div>

{programa.status === "RASCUNHO" && (
  <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-black">
        Ativação do programa
      </p>

      <p className="mt-1 text-sm text-slate-400">
        Serão gerados {previa.totalParticipantes} lançamentos
        pendentes, totalizando{" "}
        {formatarMoeda(previa.totalDistribuido)}.
      </p>

      {previa.saldo > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          Permanecerá um saldo não distribuído de{" "}
          {formatarMoeda(previa.saldo)}.
        </p>
      )}
    </div>

    <button
      type="button"
      disabled={
        previa.totalParticipantes === 0 ||
        previa.totalDistribuido <= 0 ||
        previa.saldo < -0.009
      }
      onClick={() => setModalAtivacaoAberto(true)}
      className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      Ativar programa e gerar lançamentos
    </button>
  </div>
)}


{programa.status === "RASCUNHO" && (
  <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-black">
        Ativação do programa
      </p>

      <p className="mt-1 text-sm text-slate-400">
        Serão gerados{" "}
        {previa.totalParticipantes} lançamentos
        pendentes, totalizando{" "}
        {formatarMoeda(
          previa.totalDistribuido
        )}.
      </p>

      {previa.saldo > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          Permanecerá um saldo não distribuído de{" "}
          {formatarMoeda(previa.saldo)}.
        </p>
      )}
    </div>

    <button
      type="button"
      disabled={
        previa.totalParticipantes === 0 ||
        previa.totalDistribuido <= 0 ||
        previa.saldo < -0.009
      }
      onClick={() =>
        setModalAtivacaoAberto(true)
      }
      className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      Ativar programa e gerar lançamentos
    </button>
  </div>
)}

        </>
      )}
    </>
  )}
</section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
  <button
    type="button"
    aria-expanded={funcionariosAberto}
    onClick={() =>
      setFuncionariosAberto((atual) => !atual)
    }
    className="flex w-full items-center justify-between gap-4 text-left"
  >
    <div>
      <h2 className="text-lg font-black">
        Funcionários disponíveis
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Abra para localizar, revisar ou selecionar
        funcionários.
      </p>
    </div>

    <span className="text-2xl font-black">
      {funcionariosAberto ? "▴" : "▾"}
    </span>
  </button>

  {funcionariosAberto && (
    <>
      <div className="mt-5">
        <input
          type="search"
          value={buscaFuncionarios}
          onChange={(event) =>
            setBuscaFuncionarios(event.target.value)
          }
          placeholder='Busque: "Comercial", "vendedor", "já incluído", "inelegível"...'
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
        />

        <div className="mt-2 flex flex-wrap gap-2">
          {sugestoesFuncionarios.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onClick={() =>
                setBuscaFuncionarios(sugestao)
              }
              className="phanyx-remuneracao-sugestao rounded-full border px-3 py-1 text-xs font-semibold transition"
            >
              {sugestao}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Mostrando {funcionariosExibidos.length} de{" "}
          {funcionariosFiltrados.length} resultado(s).
          {funcionariosFiltrados.length > 30 &&
            " Refine a busca para localizar outros funcionários."}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {funcionariosExibidos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
            Nenhum funcionário corresponde à busca.
          </p>
        ) : (
          funcionariosExibidos.map((funcionario) => (
            <label
              key={funcionario.id}
              className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
            >
              {exigeSelecao && (
                <input
                  type="checkbox"
                  disabled={
                    !funcionario.elegivel ||
                    funcionario.jaParticipa
                  }
                  checked={selecionados.includes(
                    funcionario.id
                  )}
                  onChange={() =>
                    alternarFuncionario(funcionario.id)
                  }
                  className="mt-1"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">
                    {funcionario.nome}
                  </p>

                  {funcionario.jaParticipa && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">
                      Já incluído
                    </span>
                  )}

                  {!funcionario.elegivel && (
                    <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-bold text-red-300">
                      Inelegível
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {funcionario.cargo ||
                    "Cargo não informado"}
                  {" • "}
                  {funcionario.departamento?.nome ||
                    "Sem departamento"}
                  {" • "}
                  {formatarMoeda(
                    funcionario.salarioBase
                  )}
                </p>

                {funcionario.motivosInelegibilidade
                  .length > 0 && (
                  <div className="mt-2 text-xs text-red-300">
                    {funcionario.motivosInelegibilidade.map(
                      (motivo) => (
                        <p key={motivo}>• {motivo}</p>
                      )
                    )}
                  </div>
                )}
              </div>
            </label>
          ))
        )}
      </div>
    </>
  )}
</section>
      </div>
      {modalAtivacaoAberto && previa && (
  <div
    className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-modal-ativacao"
  >
    <button
      type="button"
      aria-label="Fechar confirmação"
      onClick={() =>
        !ativandoPrograma &&
        setModalAtivacaoAberto(false)
      }
      className="absolute inset-0 bg-black/70"
    />

    <div className="phanyx-remuneracao-modal relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Confirmação
          </p>

          <h2
            id="titulo-modal-ativacao"
            className="mt-2 text-2xl font-black"
          >
            Ativar programa?
          </h2>
        </div>

        <button
          type="button"
          aria-label="Fechar"
          disabled={ativandoPrograma}
          onClick={() =>
            setModalAtivacaoAberto(false)
          }
          className="rounded-full border px-3 py-1 text-lg font-black disabled:opacity-50"
        >
          ×
        </button>
      </div>

      <p className="mt-4 text-sm">
        Serão criados{" "}
        <strong>
          {previa.totalParticipantes} lançamentos
          pendentes
        </strong>
        , totalizando{" "}
        <strong>
          {formatarMoeda(
            previa.totalDistribuido
          )}
        </strong>
        .
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-bold uppercase">
            Participantes
          </p>

          <p className="mt-2 text-2xl font-black">
            {previa.totalParticipantes}
          </p>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="text-xs font-bold uppercase">
            Total
          </p>

          <p className="mt-2 text-2xl font-black">
            {formatarMoeda(
              previa.totalDistribuido
            )}
          </p>
        </div>
      </div>

      {previa.saldo > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          O programa possui saldo não distribuído de{" "}
          <strong>
            {formatarMoeda(previa.saldo)}
          </strong>
          .
        </div>
      )}

      <p className="mt-5 text-sm">
        Após a ativação, participantes e regras não
        poderão ser alterados livremente. Os valores
        ainda precisarão ser aprovados antes do envio ao
        holerite.
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={ativandoPrograma}
          onClick={() =>
            setModalAtivacaoAberto(false)
          }
          className="rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={ativandoPrograma}
          onClick={ativarPrograma}
          className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ativandoPrograma
            ? "Ativando..."
            : "Ativar e gerar lançamentos"}
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}