"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import PhanyxToast from "@/components/ui/PhanyxToast";

type CursoOption = {
  id: number;
  nome: string;
};

type FuncionarioOption = {
  id: number;
  nome: string;
  cargo?: string | null;
  departamento?: {
    id: number;
    nome: string;
  } | null;
};

type VinculoVendedor = {
  id: number;
  inicioVigencia: string;
  fimVigencia?: string | null;
  ativo: boolean;
  planoNomeSnapshot?: string | null;
  observacoes?: string | null;

  funcionario: {
    id: number;
    nome: string;
    cargo?: string | null;
    ativo: boolean;
    statusFuncionario?: string | null;
    departamento?: {
      id: number;
      nome: string;
    } | null;
  };

  criadoPor?: {
    id: number;
    nome?: string | null;
    email: string;
  } | null;
};

type Plano = {
  id: number;
  nome: string;
  ativo: boolean;
};

type Regra = {
  id: number;
  nome: string;
  descricao?: string | null;
  tipo: "PERCENTUAL" | "VALOR_FIXO";
  baseCalculo:
    | "VALOR_MATRICULA"
    | "VALOR_MENSALIDADE"
    | "VALOR_TOTAL_CONTRATO"
    | "VALOR_RECEBIDO"
    | "LUCRO"
    | "QUANTIDADE_MATRICULAS";
  gatilho:
    | "MATRICULA_CONFIRMADA"
    | "PAGAMENTO_MATRICULA_CONFIRMADO"
    | "PRIMEIRA_MENSALIDADE_PAGA"
    | "MENSALIDADE_PAGA"
    | "MANUAL";
  percentual?: number | string | null;
  valorFixo?: number | string | null;
  quantidadeMinima?: number | null;
  quantidadeMaxima?: number | null;
  usarValorLiquidoRecebido: boolean;
  estornarEmCancelamento: boolean;
  estornarEmInadimplencia: boolean;
  diasCarenciaEstorno?: number | null;
  ordem: number;
  ativo: boolean;
  curso?: {
    id: number;
    nome: string;
  } | null;
};

type RegraForm = {
  nome: string;
  descricao: string;
  tipo: "PERCENTUAL" | "VALOR_FIXO";
  baseCalculo: Regra["baseCalculo"];
  gatilho: Regra["gatilho"];
  percentual: string;
  valorFixo: string;
  cursoId: string;
  quantidadeMinima: string;
  quantidadeMaxima: string;
  usarValorLiquidoRecebido: boolean;
  estornarEmCancelamento: boolean;
  estornarEmInadimplencia: boolean;
  diasCarenciaEstorno: string;
  ordem: string;
  ativo: boolean;
};

const FORM_INICIAL: RegraForm = {
  nome: "",
  descricao: "",
  tipo: "PERCENTUAL",
  baseCalculo: "VALOR_RECEBIDO",
  gatilho: "PRIMEIRA_MENSALIDADE_PAGA",
  percentual: "5",
  valorFixo: "",
  cursoId: "",
  quantidadeMinima: "",
  quantidadeMaxima: "",
  usarValorLiquidoRecebido: true,
  estornarEmCancelamento: true,
  estornarEmInadimplencia: false,
  diasCarenciaEstorno: "30",
  ordem: "0",
  ativo: true,
};

const ROTULOS_BASE: Record<Regra["baseCalculo"], string> = {
  VALOR_MATRICULA: "Valor da matrícula",
  VALOR_MENSALIDADE: "Valor da mensalidade",
  VALOR_TOTAL_CONTRATO: "Valor total do contrato",
  VALOR_RECEBIDO: "Valor efetivamente recebido",
  LUCRO: "Lucro apurado",
  QUANTIDADE_MATRICULAS: "Quantidade de matrículas",
};

const ROTULOS_GATILHO: Record<Regra["gatilho"], string> = {
  MATRICULA_CONFIRMADA: "Matrícula confirmada",
  PAGAMENTO_MATRICULA_CONFIRMADO:
    "Pagamento da matrícula confirmado",
  PRIMEIRA_MENSALIDADE_PAGA: "Primeira mensalidade paga",
  MENSALIDADE_PAGA: "Cada mensalidade paga",
  MANUAL: "Liberação manual pelo RH/Comercial",
};

function formatarValorRegra(regra: Regra) {
  if (regra.tipo === "PERCENTUAL") {
    return `${Number(regra.percentual || 0).toLocaleString("pt-BR")}%`;
  }

  return Number(regra.valorFixo || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataHojeLocal() {
  const agora = new Date();
  const compensado = new Date(
    agora.getTime() - agora.getTimezoneOffset() * 60_000
  );

  return compensado.toISOString().slice(0, 10);
}

function formatarData(valor?: string | null) {
  if (!valor) return "Sem limite";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data inválida";
  }

  return data.toLocaleDateString("pt-BR");
}

export default function RegrasPlanoComissaoPage() {
  const params = useParams();
  const planoId = Number(params.id);

  const [plano, setPlano] = useState<Plano | null>(null);
  const [regras, setRegras] = useState<Regra[]>([]);
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [form, setForm] = useState<RegraForm>(FORM_INICIAL);

  const [funcionarios, setFuncionarios] = useState<FuncionarioOption[]>([]);
const [vinculos, setVinculos] = useState<VinculoVendedor[]>([]);

const [funcionarioId, setFuncionarioId] = useState("");
const [inicioVigenciaVendedor, setInicioVigenciaVendedor] =
  useState(dataHojeLocal);
const [fimVigenciaVendedor, setFimVigenciaVendedor] = useState("");
const [observacoesVendedor, setObservacoesVendedor] = useState("");

const [vinculandoVendedor, setVinculandoVendedor] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [toast, setToast] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);

  async function carregarDados() {
    try {
      setCarregando(true);

      const [resRegras, resCursos, resVendedores] = await Promise.all([
        fetch(
          `/api/admin/comercial/planos-comissao/${planoId}/regras`,
          {
            credentials: "include",
            cache: "no-store",
          }
        ),
        fetch("/api/admin/cursos", {
          credentials: "include",
          cache: "no-store",
        }),
fetch(
  `/api/admin/comercial/planos-comissao/${planoId}/vendedores`,
  {
    credentials: "include",
    cache: "no-store",
  }
),

      ]);

      const dadosRegras = await resRegras.json();
      const dadosCursos = await resCursos.json();
      const dadosVendedores = await resVendedores.json();

      if (!resRegras.ok) {
        throw new Error(
          dadosRegras?.error ||
            "Não foi possível carregar as regras."
        );
      }

      if (!resVendedores.ok) {
  throw new Error(
    dadosVendedores?.error ||
      "Não foi possível carregar os vendedores do plano."
  );
}

      setPlano(dadosRegras?.plano || null);
      setRegras(
        Array.isArray(dadosRegras?.regras)
          ? dadosRegras.regras
          : []
      );

      const listaCursos = Array.isArray(dadosCursos)
        ? dadosCursos
            .map((curso: any) => ({
              id: Number(curso.id),
              nome: String(curso.nome || "Curso"),
            }))
            .filter(
              (curso: CursoOption) =>
                Number.isFinite(curso.id) && curso.id > 0
            )
        : [];

      setCursos(listaCursos);
      setFuncionarios(
  Array.isArray(dadosVendedores?.funcionarios)
    ? dadosVendedores.funcionarios
    : []
);

setVinculos(
  Array.isArray(dadosVendedores?.vinculos)
    ? dadosVendedores.vinculos
    : []
);
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          "Não foi possível carregar a configuração.",
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (Number.isInteger(planoId) && planoId > 0) {
      carregarDados();
    }
  }, [planoId]);

  async function criarRegra(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!form.nome.trim()) {
      setToast({
        tipo: "erro",
        mensagem: "Informe o nome da regra.",
      });
      return;
    }

    if (
      form.tipo === "PERCENTUAL" &&
      (!Number(form.percentual) || Number(form.percentual) > 100)
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          "Informe um percentual maior que zero e de no máximo 100%.",
      });
      return;
    }

    if (
      form.tipo === "VALOR_FIXO" &&
      !Number(form.valorFixo)
    ) {
      setToast({
        tipo: "erro",
        mensagem: "Informe o valor fixo da comissão.",
      });
      return;
    }

    try {
      setSalvando(true);

      const resposta = await fetch(
        `/api/admin/comercial/planos-comissao/${planoId}/regras`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
            descricao: form.descricao.trim() || null,
            tipo: form.tipo,
            baseCalculo: form.baseCalculo,
            gatilho: form.gatilho,

            percentual:
              form.tipo === "PERCENTUAL"
                ? Number(form.percentual)
                : null,

            valorFixo:
              form.tipo === "VALOR_FIXO"
                ? Number(form.valorFixo)
                : null,

            cursoId: form.cursoId
              ? Number(form.cursoId)
              : null,

            quantidadeMinima:
              form.quantidadeMinima === ""
                ? null
                : Number(form.quantidadeMinima),

            quantidadeMaxima:
              form.quantidadeMaxima === ""
                ? null
                : Number(form.quantidadeMaxima),

            usarValorLiquidoRecebido:
              form.usarValorLiquidoRecebido,

            estornarEmCancelamento:
              form.estornarEmCancelamento,

            estornarEmInadimplencia:
              form.estornarEmInadimplencia,

            diasCarenciaEstorno:
              form.diasCarenciaEstorno === ""
                ? null
                : Number(form.diasCarenciaEstorno),

            ordem: Number(form.ordem || 0),
            ativo: form.ativo,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível criar a regra."
        );
      }

      setForm(FORM_INICIAL);

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          "Regra criada com sucesso.",
      });

      await carregarDados();
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          "Não foi possível criar a regra.",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function vincularVendedor(
  evento: FormEvent<HTMLFormElement>
) {
  evento.preventDefault();

  if (!funcionarioId) {
    setToast({
      tipo: "erro",
      mensagem: "Selecione o funcionário que será vendedor.",
    });
    return;
  }

  if (!inicioVigenciaVendedor) {
    setToast({
      tipo: "erro",
      mensagem: "Informe o início da vigência do vínculo.",
    });
    return;
  }

  try {
    setVinculandoVendedor(true);

    const resposta = await fetch(
      `/api/admin/comercial/planos-comissao/${planoId}/vendedores`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funcionarioId: Number(funcionarioId),
          inicioVigencia: inicioVigenciaVendedor,
          fimVigencia: fimVigenciaVendedor || null,
          observacoes: observacoesVendedor.trim() || null,
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados?.error ||
          "Não foi possível vincular o vendedor."
      );
    }

    setFuncionarioId("");
    setInicioVigenciaVendedor(dataHojeLocal());
    setFimVigenciaVendedor("");
    setObservacoesVendedor("");

    setToast({
      tipo: "sucesso",
      mensagem:
        dados?.message ||
        "Vendedor vinculado ao plano com sucesso.",
    });

    await carregarDados();
  } catch (error: any) {
    setToast({
      tipo: "erro",
      mensagem:
        error?.message ||
        "Não foi possível vincular o vendedor.",
    });
  } finally {
    setVinculandoVendedor(false);
  }
}

  if (!Number.isInteger(planoId) || planoId <= 0) {
    return (
      <main className="p-6">
        <p>Plano inválido.</p>
      </main>
    );
  }

  return (
    <main className="phanyx-comercial-config-page mx-auto w-full max-w-7xl space-y-7 p-6 lg:p-8">
      {toast && (
        <PhanyxToast
          tipo={toast.tipo}
          mensagem={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}

      <header>
        <Link
  href="/admin/comercial/configuracoes"
  className="phanyx-comercial-voltar-planos mb-5 inline-flex items-center rounded-xl border px-4 py-2 text-sm font-bold transition"
>
  ← Voltar aos planos
</Link>

        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
          Plano de comissão
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
          ⚙️ {plano?.nome || "Configurar regras"}
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Defina quando uma venda será considerada válida e quando
          a comissão poderá ser bloqueada ou estornada.
        </p>
      </header>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <h2 className="text-xl font-black">
          Nova regra de comissão
        </h2>

        <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">
  A configuração inicial recomendada considera somente valores
  efetivamente recebidos.
</p>

        <form
          onSubmit={criarRegra}
          className="mt-6 space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">
                Nome da regra
              </label>

              <input
                value={form.nome}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    nome: evento.target.value,
                  }))
                }
                placeholder="Ex.: 5% após primeira mensalidade"
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Curso específico
              </label>

              <select
                value={form.cursoId}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    cursoId: evento.target.value,
                  }))
                }
                className="w-full rounded-2xl border px-4 py-3"
              >
                <option value="">
                  Todos os cursos
                </option>

                {cursos.map((curso) => (
                  <option
                    key={curso.id}
                    value={String(curso.id)}
                  >
                    {curso.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                Descrição
              </label>

              <textarea
                rows={3}
                value={form.descricao}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    descricao: evento.target.value,
                  }))
                }
                placeholder="Explique quando esta regra deverá ser aplicada."
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Tipo da comissão
              </label>

              <select
                value={form.tipo}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    tipo: evento.target.value as RegraForm["tipo"],
                    baseCalculo:
                      evento.target.value === "VALOR_FIXO" &&
                      anterior.baseCalculo ===
                        "QUANTIDADE_MATRICULAS"
                        ? anterior.baseCalculo
                        : anterior.baseCalculo,
                  }))
                }
                className="w-full rounded-2xl border px-4 py-3"
              >
                <option value="PERCENTUAL">
                  Percentual
                </option>
                <option value="VALOR_FIXO">
                  Valor fixo
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Base de cálculo
              </label>

              <select
                value={form.baseCalculo}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    baseCalculo:
                      evento.target
                        .value as RegraForm["baseCalculo"],
                    tipo:
                      evento.target.value ===
                      "QUANTIDADE_MATRICULAS"
                        ? "VALOR_FIXO"
                        : anterior.tipo,
                  }))
                }
                className="w-full rounded-2xl border px-4 py-3"
              >
                {Object.entries(ROTULOS_BASE).map(
                  ([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  )
                )}
              </select>
            </div>

            {form.tipo === "PERCENTUAL" ? (
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Percentual
                </label>

                <input
                  type="number"
                  min="0.0001"
                  max="100"
                  step="0.0001"
                  value={form.percentual}
                  onChange={(evento) =>
                    setForm((anterior) => ({
                      ...anterior,
                      percentual: evento.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border px-4 py-3"
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Valor fixo
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.valorFixo}
                  onChange={(evento) =>
                    setForm((anterior) => ({
                      ...anterior,
                      valorFixo: evento.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border px-4 py-3"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold">
                Gatilho para comissão
              </label>

              <select
                value={form.gatilho}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    gatilho:
                      evento.target.value as RegraForm["gatilho"],
                  }))
                }
                className="w-full rounded-2xl border px-4 py-3"
              >
                {Object.entries(ROTULOS_GATILHO).map(
                  ([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Quantidade mínima
              </label>

              <input
                type="number"
                min="0"
                value={form.quantidadeMinima}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    quantidadeMinima: evento.target.value,
                  }))
                }
                placeholder="Sem mínimo"
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Quantidade máxima
              </label>

              <input
                type="number"
                min="0"
                value={form.quantidadeMaxima}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    quantidadeMaxima: evento.target.value,
                  }))
                }
                placeholder="Sem máximo"
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Carência para estorno
              </label>

              <input
                type="number"
                min="0"
                value={form.diasCarenciaEstorno}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    diasCarenciaEstorno:
                      evento.target.value,
                  }))
                }
                className="w-full rounded-2xl border px-4 py-3"
              />

              <p className="mt-1 text-xs text-slate-500">
                Quantidade de dias usada na análise de
                cancelamentos e desistências.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Ordem de aplicação
              </label>

              <input
                type="number"
                min="0"
                value={form.ordem}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    ordem: evento.target.value,
                  }))
                }
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.usarValorLiquidoRecebido}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    usarValorLiquidoRecebido:
                      evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm">
                  Usar valor líquido recebido
                </strong>
                <span className="mt-1 block text-xs">
                  Evita comissão sobre valores que não entraram
                  no caixa.
                </span>
              </span>
            </label>

            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.estornarEmCancelamento}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    estornarEmCancelamento:
                      evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm">
                  Estornar em cancelamento
                </strong>
                <span className="mt-1 block text-xs">
                  Protege a instituição contra vendas
                  canceladas.
                </span>
              </span>
            </label>

            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.estornarEmInadimplencia}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    estornarEmInadimplencia:
                      evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm">
                  Estornar em inadimplência
                </strong>
                <span className="mt-1 block text-xs">
                  Permite recuperar comissão quando o pagamento
                  deixa de ser válido.
                </span>
              </span>
            </label>

            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    ativo: evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm">
                  Regra ativa
                </strong>
                <span className="mt-1 block text-xs">
                  Somente regras ativas liberam o plano.
                </span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando
              ? "Criando regra..."
              : "Criar regra de comissão"}
          </button>
        </form>
      </section>

<section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
  <div>
    <h2 className="text-xl font-black">
      👤 Vincular vendedor
    </h2>

    <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">
      Selecione um funcionário ativo para que suas matrículas possam
      participar do cálculo de comissão deste plano.
    </p>
  </div>

  <form
    onSubmit={vincularVendedor}
    className="mt-6 space-y-5"
  >
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-bold">
          Funcionário
        </label>

        <select
          value={funcionarioId}
          onChange={(evento) =>
            setFuncionarioId(evento.target.value)
          }
          className="w-full rounded-2xl border px-4 py-3"
        >
          <option value="">
            Selecione o vendedor...
          </option>

          {funcionarios.map((funcionario) => (
            <option
              key={funcionario.id}
              value={String(funcionario.id)}
            >
              {funcionario.nome}
              {funcionario.cargo
                ? ` — ${funcionario.cargo}`
                : ""}
              {funcionario.departamento?.nome
                ? ` — ${funcionario.departamento.nome}`
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold">
          Início da vigência
        </label>

        <input
          type="date"
          value={inicioVigenciaVendedor}
          onChange={(evento) =>
            setInicioVigenciaVendedor(evento.target.value)
          }
          className="w-full rounded-2xl border px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold">
          Fim da vigência
        </label>

        <input
          type="date"
          value={fimVigenciaVendedor}
          onChange={(evento) =>
            setFimVigenciaVendedor(evento.target.value)
          }
          className="w-full rounded-2xl border px-4 py-3"
        />

        <p className="mt-1 text-xs text-slate-500">
          Deixe vazio para manter o vínculo sem data final.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold">
          Observações
        </label>

        <input
          value={observacoesVendedor}
          onChange={(evento) =>
            setObservacoesVendedor(evento.target.value)
          }
          placeholder="Ex.: Vendedora da equipe comercial"
          className="w-full rounded-2xl border px-4 py-3"
        />
      </div>
    </div>

    <button
      type="submit"
      disabled={vinculandoVendedor}
      className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {vinculandoVendedor
        ? "Vinculando vendedor..."
        : "Vincular vendedor ao plano"}
    </button>
  </form>

  <div className="mt-7 border-t border-slate-200 pt-6 dark:border-slate-700">
    <h3 className="text-lg font-black">
      Vendedores vinculados
    </h3>

    {vinculos.length === 0 ? (
      <div className="phanyx-comercial-config-empty mt-4 rounded-2xl border border-dashed p-6 text-center">
        Nenhum vendedor vinculado a este plano.
      </div>
    ) : (
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {vinculos.map((vinculo) => (
          <article
            key={vinculo.id}
            className="phanyx-comercial-config-plan-card rounded-3xl border p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-black">
                  {vinculo.funcionario.nome}
                </h4>

                <p className="mt-1 text-sm">
                  {vinculo.funcionario.cargo ||
                    "Cargo não informado"}
                  {vinculo.funcionario.departamento?.nome
                    ? ` • ${vinculo.funcionario.departamento.nome}`
                    : ""}
                </p>
              </div>

              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-black",
                  vinculo.ativo
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {vinculo.ativo ? "Ativo" : "Encerrado"}
              </span>
            </div>

            <div className="mt-4 text-sm">
              <p>
                Vigência:{" "}
                <strong>
                  {formatarData(vinculo.inicioVigencia)}
                  {" até "}
                  {formatarData(vinculo.fimVigencia)}
                </strong>
              </p>

              {vinculo.observacoes && (
                <p className="mt-2">
                  Observações: {vinculo.observacoes}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    )}
  </div>
</section>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <h2 className="text-xl font-black">
          Regras cadastradas
        </h2>

        {carregando ? (
          <p className="mt-5 text-sm">Carregando regras...</p>
        ) : regras.length === 0 ? (
          <div className="phanyx-comercial-config-empty mt-5 rounded-2xl border border-dashed p-8 text-center">
            Nenhuma regra cadastrada neste plano.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {regras.map((regra) => (
              <article
                key={regra.id}
                className="phanyx-comercial-config-plan-card rounded-3xl border p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">
                      {regra.nome}
                    </h3>

                    <p className="mt-1 text-sm">
                      {regra.descricao || "Sem descrição."}
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-black",
                      regra.ativo
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {regra.ativo ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <p className="text-xs font-bold uppercase">
                      Comissão
                    </p>
                    <p className="mt-1 font-black">
                      {formatarValorRegra(regra)}
                    </p>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <p className="text-xs font-bold uppercase">
                      Base
                    </p>
                    <p className="mt-1 font-black">
                      {ROTULOS_BASE[regra.baseCalculo]}
                    </p>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3 sm:col-span-2">
                    <p className="text-xs font-bold uppercase">
                      Gatilho
                    </p>
                    <p className="mt-1 font-black">
                      {ROTULOS_GATILHO[regra.gatilho]}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <p>
                    Curso: {regra.curso?.nome || "Todos"}
                  </p>
                  <p>
                    Carência para estorno:{" "}
                    {regra.diasCarenciaEstorno ?? 0} dia(s)
                  </p>
                  <p>
                    Estorno por cancelamento:{" "}
                    {regra.estornarEmCancelamento
                      ? "Sim"
                      : "Não"}
                  </p>
                  <p>
                    Estorno por inadimplência:{" "}
                    {regra.estornarEmInadimplencia
                      ? "Sim"
                      : "Não"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}