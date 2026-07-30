"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import PhanyxToast from "@/components/ui/PhanyxToast";

type ModoParticipacaoPlano =
  | "SOMENTE_PARTICIPANTES_MATRICULA"
  | "TODOS_VINCULADOS_PLANO";

type EscopoRegra =
  | "GERAL"
  | "DEPARTAMENTO"
  | "CARGO"
  | "FUNCIONARIO";

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

type DepartamentoOption = {
  id: number;
  nome: string;
  quantidadeFuncionarios: number;
};

type VinculoVendedor = {
  id: number;
  inicioVigencia: string;
  fimVigencia?: string | null;
  ativo: boolean;
  planoNomeSnapshot?: string | null;
  observacoes?: string | null;
  origemVinculo?: "INDIVIDUAL" | "DEPARTAMENTO";
  departamentoOrigemId?: number | null;
  departamentoNomeSnapshot?: string | null;
  loteVinculoId?: string | null;

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
  modoParticipacao: ModoParticipacaoPlano;
};

type Regra = {
  id: number;
  regraBaseId?: number | null;
  nome: string;
  descricao?: string | null;
  escopoAplicacao: EscopoRegra;
  departamentoAlvoId?: number | null;
  departamentoAlvoNomeSnapshot?: string | null;
  cargoAlvo?: string | null;
  funcionarioAlvoId?: number | null;
  funcionarioAlvoNomeSnapshot?: string | null;
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
  regraBase?: {
    id: number;
    nome: string;
    escopoAplicacao: EscopoRegra;
  } | null;
  _count?: {
    variacoes: number;
  };
};

type RegraForm = {
  nome: string;
  descricao: string;
  escopoAplicacao: EscopoRegra;
  regraBaseId: string;
  departamentoAlvoId: string;
  cargoAlvo: string;
  funcionarioAlvoId: string;
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
  escopoAplicacao: "GERAL",
  regraBaseId: "",
  departamentoAlvoId: "",
  cargoAlvo: "",
  funcionarioAlvoId: "",
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

const ROTULOS_ESCOPO: Record<EscopoRegra, string> = {
  GERAL: "Regra geral",
  DEPARTAMENTO: "Departamento",
  CARGO: "Cargo ou função",
  FUNCIONARIO: "Funcionário específico",
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
    agora.getTime() - agora.getTimezoneOffset() * 60_000,
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

function normalizarTexto(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function alvoDaRegra(regra: Regra) {
  switch (regra.escopoAplicacao) {
    case "DEPARTAMENTO":
      return (
        regra.departamentoAlvoNomeSnapshot ||
        "Departamento não identificado"
      );

    case "CARGO":
      return (
        regra.cargoAlvo ||
        "Cargo não identificado"
      );

    case "FUNCIONARIO":
      return (
        regra.funcionarioAlvoNomeSnapshot ||
        "Funcionário não identificado"
      );

    case "GERAL":
    default:
      return "Todos os participantes sem regra mais específica";
  }
}

export default function RegrasPlanoComissaoPage() {
  const params = useParams();
  const planoId = Number(params.id);

  const [plano, setPlano] = useState<Plano | null>(null);
  const [regras, setRegras] = useState<Regra[]>([]);
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [form, setForm] = useState<RegraForm>(FORM_INICIAL);

  const [funcionarios, setFuncionarios] = useState<FuncionarioOption[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [vinculos, setVinculos] = useState<VinculoVendedor[]>([]);

  const [tipoVinculo, setTipoVinculo] = useState<
    "INDIVIDUAL" | "DEPARTAMENTO"
  >("INDIVIDUAL");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [inicioVigenciaVendedor, setInicioVigenciaVendedor] =
    useState(dataHojeLocal);
  const [fimVigenciaVendedor, setFimVigenciaVendedor] = useState("");
  const [observacoesVendedor, setObservacoesVendedor] = useState("");

  const [vinculandoVendedor, setVinculandoVendedor] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoModo, setSalvandoModo] = useState(false);

  const [
    regraEmEdicaoId,
    setRegraEmEdicaoId,
  ] = useState<number | null>(null);

  const [toast, setToast] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);

  const regrasGerais = useMemo(
    () =>
      regras.filter(
        (regra) =>
          regra.escopoAplicacao === "GERAL" &&
          !regra.regraBaseId,
      ),
    [regras],
  );

  const cargosDisponiveis = useMemo(() => {
    const cargos = new Map<string, string>();

    for (const funcionario of funcionarios) {
      const cargo = String(funcionario.cargo || "").trim();
      const chave = normalizarTexto(cargo);

      if (cargo && chave && !cargos.has(chave)) {
        cargos.set(chave, cargo);
      }
    }

    return [...cargos.values()].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [funcionarios]);

  const regraBaseSelecionada = useMemo(
    () =>
      regrasGerais.find(
        (regra) => String(regra.id) === form.regraBaseId,
      ) || null,
    [form.regraBaseId, regrasGerais],
  );

  const tipoEfetivo = regraBaseSelecionada?.tipo || form.tipo;

  async function carregarDados() {
    try {
      setCarregando(true);

      const [resRegras, resCursos, resVendedores] = await Promise.all([
        fetch(
          `/api/admin/comercial/planos-comissao/${planoId}/regras`,
          {
            credentials: "include",
            cache: "no-store",
          },
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
          },
        ),
      ]);

      const dadosRegras = await resRegras.json();
      const dadosCursos = await resCursos.json();
      const dadosVendedores = await resVendedores.json();

      if (!resRegras.ok) {
        throw new Error(
          dadosRegras?.error ||
          "Não foi possível carregar as regras.",
        );
      }

      if (!resVendedores.ok) {
        throw new Error(
          dadosVendedores?.error ||
          "Não foi possível carregar os participantes do plano.",
        );
      }

      setPlano(dadosRegras?.plano || null);
      setRegras(
        Array.isArray(dadosRegras?.regras)
          ? dadosRegras.regras
          : [],
      );

      const listaCursos = Array.isArray(dadosCursos)
        ? dadosCursos
          .map((curso: any) => ({
            id: Number(curso.id),
            nome: String(curso.nome || "Curso"),
          }))
          .filter(
            (curso: CursoOption) =>
              Number.isFinite(curso.id) && curso.id > 0,
          )
        : [];

      setCursos(listaCursos);
      setFuncionarios(
        Array.isArray(dadosVendedores?.funcionarios)
          ? dadosVendedores.funcionarios
          : [],
      );
      setDepartamentos(
        Array.isArray(dadosVendedores?.departamentos)
          ? dadosVendedores.departamentos
          : [],
      );
      setVinculos(
        Array.isArray(dadosVendedores?.vinculos)
          ? dadosVendedores.vinculos
          : [],
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

  function alterarEscopo(escopoAplicacao: EscopoRegra) {
    setForm((anterior) => ({
      ...anterior,
      escopoAplicacao,
      regraBaseId:
        escopoAplicacao === "GERAL"
          ? ""
          : anterior.regraBaseId,
      departamentoAlvoId: "",
      cargoAlvo: "",
      funcionarioAlvoId: "",
    }));
  }

  function selecionarRegraBase(regraBaseId: string) {
    const regraBase = regrasGerais.find(
      (regra) => String(regra.id) === regraBaseId,
    );

    setForm((anterior) => ({
      ...anterior,
      regraBaseId,
      tipo: regraBase?.tipo || anterior.tipo,
      baseCalculo:
        regraBase?.baseCalculo || anterior.baseCalculo,
      gatilho: regraBase?.gatilho || anterior.gatilho,
      percentual:
        regraBase?.tipo === "PERCENTUAL"
          ? String(regraBase.percentual ?? "")
          : "",
      valorFixo:
        regraBase?.tipo === "VALOR_FIXO"
          ? String(regraBase.valorFixo ?? "")
          : "",
      cursoId: regraBase?.curso?.id
        ? String(regraBase.curso.id)
        : "",
      quantidadeMinima:
        regraBase?.quantidadeMinima === null ||
          regraBase?.quantidadeMinima === undefined
          ? ""
          : String(regraBase.quantidadeMinima),
      quantidadeMaxima:
        regraBase?.quantidadeMaxima === null ||
          regraBase?.quantidadeMaxima === undefined
          ? ""
          : String(regraBase.quantidadeMaxima),
      usarValorLiquidoRecebido:
        regraBase?.usarValorLiquidoRecebido ??
        anterior.usarValorLiquidoRecebido,
      estornarEmCancelamento:
        regraBase?.estornarEmCancelamento ??
        anterior.estornarEmCancelamento,
      estornarEmInadimplencia:
        regraBase?.estornarEmInadimplencia ??
        anterior.estornarEmInadimplencia,
      diasCarenciaEstorno:
        regraBase?.diasCarenciaEstorno === null ||
          regraBase?.diasCarenciaEstorno === undefined
          ? ""
          : String(regraBase.diasCarenciaEstorno),
      ordem:
        regraBase?.ordem === undefined
          ? anterior.ordem
          : String(regraBase.ordem),
    }));
  }

  async function atualizarModoParticipacao(
    modoParticipacao: ModoParticipacaoPlano,
  ) {
    if (!plano || plano.modoParticipacao === modoParticipacao) {
      return;
    }

    try {
      setSalvandoModo(true);

      const resposta = await fetch(
        `/api/admin/comercial/planos-comissao/${planoId}/regras`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ modoParticipacao }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          "Não foi possível alterar o modo de participação.",
        );
      }

      setPlano((anterior) =>
        anterior
          ? {
            ...anterior,
            modoParticipacao,
          }
          : anterior,
      );

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          "Modo de participação atualizado com sucesso.",
      });
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          "Não foi possível alterar o modo de participação.",
      });
    } finally {
      setSalvandoModo(false);
    }
  }

  function criarFormularioDaRegra(
    regra: Regra,
  ): RegraForm {
    return {
      nome: regra.nome,
      descricao: regra.descricao || "",
      escopoAplicacao: regra.escopoAplicacao,
      regraBaseId: regra.regraBaseId
        ? String(regra.regraBaseId)
        : "",
      departamentoAlvoId: regra.departamentoAlvoId
        ? String(regra.departamentoAlvoId)
        : "",
      cargoAlvo: regra.cargoAlvo || "",
      funcionarioAlvoId: regra.funcionarioAlvoId
        ? String(regra.funcionarioAlvoId)
        : "",
      tipo: regra.tipo,
      baseCalculo: regra.baseCalculo,
      gatilho: regra.gatilho,
      percentual:
        regra.tipo === "PERCENTUAL"
          ? String(regra.percentual ?? "")
          : "",
      valorFixo:
        regra.tipo === "VALOR_FIXO"
          ? String(regra.valorFixo ?? "")
          : "",
      cursoId: regra.curso?.id
        ? String(regra.curso.id)
        : "",
      quantidadeMinima:
        regra.quantidadeMinima === null ||
        regra.quantidadeMinima === undefined
          ? ""
          : String(regra.quantidadeMinima),
      quantidadeMaxima:
        regra.quantidadeMaxima === null ||
        regra.quantidadeMaxima === undefined
          ? ""
          : String(regra.quantidadeMaxima),
      usarValorLiquidoRecebido:
        regra.usarValorLiquidoRecebido,
      estornarEmCancelamento:
        regra.estornarEmCancelamento,
      estornarEmInadimplencia:
        regra.estornarEmInadimplencia,
      diasCarenciaEstorno:
        regra.diasCarenciaEstorno === null ||
        regra.diasCarenciaEstorno === undefined
          ? ""
          : String(regra.diasCarenciaEstorno),
      ordem: String(regra.ordem ?? 0),
      ativo: regra.ativo,
    };
  }

  function iniciarEdicaoRegra(
    regra: Regra,
  ) {
    setRegraEmEdicaoId(regra.id);
    setForm(criarFormularioDaRegra(regra));
    setToast(null);

    window.setTimeout(() => {
      document
        .getElementById(
          "formulario-regra-comissao",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 0);
  }

  function cancelarEdicaoRegra() {
    setRegraEmEdicaoId(null);
    setForm(FORM_INICIAL);
    setToast(null);
  }

  async function salvarRegra(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!form.nome.trim()) {
      setToast({
        tipo: "erro",
        mensagem: "Informe o nome da regra.",
      });
      return;
    }

    if (
      form.escopoAplicacao !== "GERAL" &&
      !form.regraBaseId
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          "Selecione a regra geral que receberá esta exceção.",
      });
      return;
    }

    if (
      form.escopoAplicacao === "DEPARTAMENTO" &&
      !form.departamentoAlvoId
    ) {
      setToast({
        tipo: "erro",
        mensagem: "Selecione o departamento desta regra.",
      });
      return;
    }

    if (
      form.escopoAplicacao === "CARGO" &&
      !form.cargoAlvo
    ) {
      setToast({
        tipo: "erro",
        mensagem: "Selecione o cargo ou a função desta regra.",
      });
      return;
    }

    if (
      form.escopoAplicacao === "FUNCIONARIO" &&
      !form.funcionarioAlvoId
    ) {
      setToast({
        tipo: "erro",
        mensagem: "Selecione o funcionário desta regra.",
      });
      return;
    }

    if (
      tipoEfetivo === "PERCENTUAL" &&
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
      tipoEfetivo === "VALOR_FIXO" &&
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

      const editandoRegra =
        regraEmEdicaoId !== null;

      const endereco = editandoRegra
        ? `/api/admin/comercial/planos-comissao/${planoId}/regras/${regraEmEdicaoId}`
        : `/api/admin/comercial/planos-comissao/${planoId}/regras`;

      const resposta = await fetch(
        endereco,
        {
          method: editandoRegra
            ? "PATCH"
            : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
            descricao: form.descricao.trim() || null,
            escopoAplicacao: form.escopoAplicacao,
            regraBaseId: form.regraBaseId
              ? Number(form.regraBaseId)
              : null,
            departamentoAlvoId: form.departamentoAlvoId
              ? Number(form.departamentoAlvoId)
              : null,
            cargoAlvo: form.cargoAlvo || null,
            funcionarioAlvoId: form.funcionarioAlvoId
              ? Number(form.funcionarioAlvoId)
              : null,
            tipo: tipoEfetivo,
            baseCalculo:
              regraBaseSelecionada?.baseCalculo ||
              form.baseCalculo,
            gatilho:
              regraBaseSelecionada?.gatilho || form.gatilho,
            percentual:
              tipoEfetivo === "PERCENTUAL"
                ? Number(form.percentual)
                : null,
            valorFixo:
              tipoEfetivo === "VALOR_FIXO"
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
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            (editandoRegra
              ? "Não foi possível atualizar a regra."
              : "Não foi possível criar a regra."),
        );
      }

      setRegraEmEdicaoId(null);
      setForm(FORM_INICIAL);

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          (editandoRegra
            ? "Regra atualizada com sucesso."
            : "Regra criada com sucesso."),
      });

      await carregarDados();
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          (regraEmEdicaoId !== null
            ? "Não foi possível atualizar a regra."
            : "Não foi possível criar a regra."),
      });
    } finally {
      setSalvando(false);
    }
  }

  async function vincularVendedor(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (tipoVinculo === "INDIVIDUAL" && !funcionarioId) {
      setToast({
        tipo: "erro",
        mensagem: "Selecione o funcionário participante.",
      });
      return;
    }

    if (tipoVinculo === "DEPARTAMENTO" && !departamentoId) {
      setToast({
        tipo: "erro",
        mensagem: "Selecione o departamento participante.",
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
            tipoVinculo,
            funcionarioId:
              tipoVinculo === "INDIVIDUAL"
                ? Number(funcionarioId)
                : null,
            departamentoId:
              tipoVinculo === "DEPARTAMENTO"
                ? Number(departamentoId)
                : null,
            inicioVigencia: inicioVigenciaVendedor,
            fimVigencia: fimVigenciaVendedor || null,
            observacoes: observacoesVendedor.trim() || null,
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          "Não foi possível vincular os participantes.",
        );
      }

      setFuncionarioId("");
      setDepartamentoId("");
      setInicioVigenciaVendedor(dataHojeLocal());
      setFimVigenciaVendedor("");
      setObservacoesVendedor("");

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          "Participantes vinculados ao plano com sucesso.",
      });

      await carregarDados();
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          "Não foi possível vincular os participantes.",
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

  const escopoEhGeral = form.escopoAplicacao === "GERAL";
  const semRegraGeral = regrasGerais.length === 0;

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
          Defina quem participa e qual regra será aplicada a cada
          departamento, cargo ou funcionário.
        </p>
      </header>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <h2 className="text-xl font-black">
          👥 Quem recebe comissão neste plano
        </h2>

        <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">
          Esta escolha define se apenas os responsáveis pela matrícula ou
          todos os funcionários vinculados ao plano receberão comissão.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <button
            type="button"
            disabled={salvandoModo}
            onClick={() =>
              atualizarModoParticipacao(
                "SOMENTE_PARTICIPANTES_MATRICULA",
              )
            }
            className={[
              "phanyx-comissao-card-opcao rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
              plano?.modoParticipacao ===
                "SOMENTE_PARTICIPANTES_MATRICULA"
                ? "phanyx-comissao-card-opcao-ativa"
                : "phanyx-comissao-card-opcao-inativa",
            ].join(" ")}
          >
            <strong className="phanyx-comissao-card-titulo block">
              🎯 Somente participantes da matrícula
            </strong>

            <span className="phanyx-comissao-card-descricao mt-2 block text-sm leading-6">
              Recebem apenas o vendedor responsável e os participantes
              comerciais registrados naquela matrícula.
            </span>
          </button>

          <button
            type="button"
            disabled={salvandoModo}
            onClick={() =>
              atualizarModoParticipacao(
                "TODOS_VINCULADOS_PLANO",
              )
            }
            className={[
              "phanyx-comissao-card-opcao rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
              plano?.modoParticipacao ===
                "TODOS_VINCULADOS_PLANO"
                ? "phanyx-comissao-card-opcao-ativa"
                : "phanyx-comissao-card-opcao-inativa",
            ].join(" ")}
          >
            <strong className="phanyx-comissao-card-titulo block">
              🏢 Todos os vinculados ao plano
            </strong>
            <span className="phanyx-comissao-card-descricao mt-2 block text-sm leading-6">
              Todos os funcionários ativos vinculados ao plano participam,
              mesmo sem login, conforme a regra aplicável ao cargo,
              departamento ou pessoa.
            </span>
          </button>
        </div>

        <div className="phanyx-comissao-aviso mt-4 rounded-2xl border !border-amber-300 !bg-amber-50 p-4 text-sm !text-amber-950 dark:!border-amber-800 dark:!bg-amber-950/30 dark:!text-amber-100">
          Para gerente, coordenador, vendedores, captação de leads e outras
          funções receberem percentuais diferentes dentro do mesmo plano,
          crie uma regra geral e depois cadastre as exceções específicas.
        </div>
      </section>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <h2 className="text-xl font-black">
          {regraEmEdicaoId !== null
            ? "Editar regra de comissão"
            : escopoEhGeral
              ? "Nova regra geral de comissão"
              : "Nova exceção de comissão"}
        </h2>

        <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">
          {regraEmEdicaoId !== null
            ? "Altere os dados abaixo e salve. A edição afeta somente os próximos cálculos de comissão."
            : "A precedência é: funcionário específico, cargo ou função, departamento e, por último, regra geral."}
        </p>

        <form
          id="formulario-regra-comissao"
          onSubmit={salvarRegra}
          className="mt-6 space-y-6"
        >
          <div>
            <label className="mb-2 block text-sm font-bold">
              Aplicação da regra
            </label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  [
                    "GERAL",
                    "🌐 Regra geral",
                    "Aplicada quando não existir uma regra mais específica.",
                  ],
                  [
                    "DEPARTAMENTO",
                    "🏢 Departamento",
                    "Exceção para todos os funcionários de um departamento.",
                  ],
                  [
                    "CARGO",
                    "🪪 Cargo ou função",
                    "Exceção para gerente, coordenador, vendedor, leads etc.",
                  ],
                  [
                    "FUNCIONARIO",
                    "👤 Funcionário específico",
                    "Maior prioridade para uma condição individual.",
                  ],
                ] as const
              ).map(([valor, titulo, descricao]) => {
                const selecionado =
                  form.escopoAplicacao === valor;

                const desabilitado =
                  regraEmEdicaoId !== null ||
                  (valor !== "GERAL" &&
                    semRegraGeral);

                return (
                  <button
                    key={valor}
                    type="button"
                    disabled={desabilitado}
                    onClick={() => alterarEscopo(valor)}
                    className={[
                      "phanyx-comissao-card-opcao rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed",
                      selecionado
                        ? "phanyx-comissao-card-opcao-ativa"
                        : "phanyx-comissao-card-opcao-inativa",
                    ].join(" ")}
                  >
                    <strong className="phanyx-comissao-card-titulo block text-sm">
                      {titulo}
                    </strong>

                    <span className="phanyx-comissao-card-descricao mt-1 block text-xs">
                      {descricao}
                    </span>
                  </button>
                );
              })}
            </div>

            {semRegraGeral && (
              <p className="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
                Crie primeiro uma regra geral. Depois as opções de exceção
                serão liberadas.
              </p>
            )}
          </div>

          {!escopoEhGeral && (
            <div className="phanyx-comissao-painel-excecao rounded-2xl border p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Regra geral de origem
                  </label>

                  <select
                    value={form.regraBaseId}
                    disabled={
                      regraEmEdicaoId !== null
                    }
                    onChange={(evento) =>
                      selecionarRegraBase(evento.target.value)
                    }
                    className="w-full rounded-2xl border px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      Selecione o grupo de comissão...
                    </option>

                    {regrasGerais.map((regra) => (
                      <option key={regra.id} value={String(regra.id)}>
                        {regra.nome} — {formatarValorRegra(regra)}
                      </option>
                    ))}
                  </select>
                </div>

                {form.escopoAplicacao === "DEPARTAMENTO" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Departamento
                    </label>

                    <select
                      value={form.departamentoAlvoId}
                      onChange={(evento) =>
                        setForm((anterior) => ({
                          ...anterior,
                          departamentoAlvoId: evento.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border px-4 py-3"
                    >
                      <option value="">
                        Selecione o departamento...
                      </option>

                      {departamentos.map((departamento) => (
                        <option
                          key={departamento.id}
                          value={String(departamento.id)}
                        >
                          {departamento.nome} — {departamento.quantidadeFuncionarios}{" "}
                          funcionário(s) ativo(s)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.escopoAplicacao === "CARGO" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Cargo ou função
                    </label>

                    <select
                      value={form.cargoAlvo}
                      onChange={(evento) =>
                        setForm((anterior) => ({
                          ...anterior,
                          cargoAlvo: evento.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border px-4 py-3"
                    >
                      <option value="">
                        Selecione o cargo ou a função...
                      </option>

                      {cargosDisponiveis.map((cargo) => (
                        <option key={cargo} value={cargo}>
                          {cargo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.escopoAplicacao === "FUNCIONARIO" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Funcionário
                    </label>

                    <select
                      value={form.funcionarioAlvoId}
                      onChange={(evento) =>
                        setForm((anterior) => ({
                          ...anterior,
                          funcionarioAlvoId: evento.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border px-4 py-3"
                    >
                      <option value="">
                        Selecione o funcionário...
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
                )}
              </div>

              {regraBaseSelecionada && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Base herdada
                    </p>
                    <p className="mt-1 font-bold">
                      {ROTULOS_BASE[regraBaseSelecionada.baseCalculo]}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Gatilho herdado
                    </p>
                    <p className="mt-1 font-bold">
                      {ROTULOS_GATILHO[regraBaseSelecionada.gatilho]}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Valor geral atual
                    </p>
                    <p className="mt-1 font-bold">
                      {formatarValorRegra(regraBaseSelecionada)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
                placeholder={
                  escopoEhGeral
                    ? "Ex.: Comissão principal"
                    : form.escopoAplicacao === "CARGO"
                      ? "Ex.: Comissão do gerente comercial"
                      : "Ex.: Exceção de comissão"
                }
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>

            {escopoEhGeral && (
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
                  <option value="">Todos os cursos</option>

                  {cursos.map((curso) => (
                    <option key={curso.id} value={String(curso.id)}>
                      {curso.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={escopoEhGeral ? "md:col-span-2" : ""}>
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {escopoEhGeral && (
              <>
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
                      }))
                    }
                    className="w-full rounded-2xl border px-4 py-3"
                  >
                    <option value="PERCENTUAL">Percentual</option>
                    <option value="VALOR_FIXO">Valor fixo</option>
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
                          evento.target.value as RegraForm["baseCalculo"],
                        tipo:
                          evento.target.value === "QUANTIDADE_MATRICULAS"
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
                      ),
                    )}
                  </select>
                </div>
              </>
            )}

            {tipoEfetivo === "PERCENTUAL" ? (
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

            {escopoEhGeral && (
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
                    ),
                  )}
                </select>
              </div>
            )}
          </div>

          {escopoEhGeral && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                        diasCarenciaEstorno: evento.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border px-4 py-3"
                  />
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
                        usarValorLiquidoRecebido: evento.target.checked,
                      }))
                    }
                    className="mt-1"
                  />

                  <span>
                    <strong className="block text-sm">
                      Usar valor líquido recebido
                    </strong>
                    <span className="mt-1 block text-xs">
                      Evita comissão sobre valores que não entraram no caixa.
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
                        estornarEmCancelamento: evento.target.checked,
                      }))
                    }
                    className="mt-1"
                  />

                  <span>
                    <strong className="block text-sm">
                      Estornar em cancelamento
                    </strong>
                    <span className="mt-1 block text-xs">
                      Protege a instituição contra vendas canceladas.
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
                        estornarEmInadimplencia: evento.target.checked,
                      }))
                    }
                    className="mt-1"
                  />

                  <span>
                    <strong className="block text-sm">
                      Estornar em inadimplência
                    </strong>
                    <span className="mt-1 block text-xs">
                      Permite recuperar comissão quando o pagamento deixa de
                      ser válido.
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
                    <strong className="block text-sm">Regra ativa</strong>
                    <span className="mt-1 block text-xs">
                      Somente regras ativas participam do cálculo.
                    </span>
                  </span>
                </label>
              </div>
            </>
          )}

          {!escopoEhGeral && (
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
                <strong className="block text-sm">Exceção ativa</strong>
                <span className="mt-1 block text-xs">
                  Quando ativa, esta regra substitui a regra geral para o alvo
                  selecionado.
                </span>
              </span>
            </label>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando
                ? regraEmEdicaoId !== null
                  ? "Salvando alterações..."
                  : "Salvando regra..."
                : regraEmEdicaoId !== null
                  ? "Salvar alterações"
                  : escopoEhGeral
                    ? "Criar regra geral"
                    : "Criar exceção de comissão"}
            </button>

            {regraEmEdicaoId !== null && (
              <button
                type="button"
                disabled={salvando}
                onClick={cancelarEdicaoRegra}
                className="phanyx-comissao-cancelar-edicao rounded-2xl border px-6 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black">👥 Vincular participantes</h2>

          <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">
            Inclua um funcionário específico ou todos os funcionários ativos
            de um departamento. Não é necessário que o funcionário possua login
            no PHANYX.
          </p>
        </div>

        <div className="phanyx-comissao-aviso mt-5 rounded-2xl border !border-amber-300 !bg-amber-50 p-4 text-sm !text-amber-950 dark:!border-amber-800 dark:!bg-amber-950/30 dark:!text-amber-100">
          A vinculação define quem poderá participar. O percentual aplicado é
          escolhido pela precedência: funcionário, cargo, departamento e regra
          geral.
        </div>

        <form onSubmit={vincularVendedor} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold">
              Forma de vinculação
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setTipoVinculo("INDIVIDUAL");
                  setDepartamentoId("");
                }}
                className={[
                  "phanyx-comissao-card-opcao rounded-2xl border px-4 py-4 text-left transition",
                  tipoVinculo === "INDIVIDUAL"
                    ? "phanyx-comissao-card-opcao-ativa"
                    : "phanyx-comissao-card-opcao-inativa",
                ].join(" ")}
              >
                <strong className="phanyx-comissao-card-titulo block text-sm">
                  👤 Funcionário individual
                </strong>

                <span className="phanyx-comissao-card-descricao mt-1 block text-xs">
                  Escolha uma pessoa específica para participar do plano.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoVinculo("DEPARTAMENTO");
                  setFuncionarioId("");
                }}
                className={[
                  "phanyx-comissao-card-opcao rounded-2xl border px-4 py-4 text-left transition",
                  tipoVinculo === "DEPARTAMENTO"
                    ? "phanyx-comissao-card-opcao-ativa"
                    : "phanyx-comissao-card-opcao-inativa",
                ].join(" ")}
              >
                <strong className="phanyx-comissao-card-titulo block text-sm">
                  🏢 Departamento inteiro
                </strong>

                <span className="phanyx-comissao-card-descricao mt-1 block text-xs">
                  Inclua todos os funcionários ativos do departamento de uma
                  vez.
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {tipoVinculo === "INDIVIDUAL" ? (
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
                  <option value="">Selecione o participante...</option>

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
            ) : (
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Departamento
                </label>

                <select
                  value={departamentoId}
                  onChange={(evento) =>
                    setDepartamentoId(evento.target.value)
                  }
                  className="w-full rounded-2xl border px-4 py-3"
                >
                  <option value="">Selecione o departamento...</option>

                  {departamentos.map((departamento) => (
                    <option
                      key={departamento.id}
                      value={String(departamento.id)}
                    >
                      {departamento.nome} — {departamento.quantidadeFuncionarios}{" "}
                      funcionário(s) ativo(s)
                    </option>
                  ))}
                </select>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Funcionários que já possuam outro plano ativo no mesmo
                  período não serão duplicados.
                </p>
              </div>
            )}

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

              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
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
                placeholder={
                  tipoVinculo === "DEPARTAMENTO"
                    ? "Ex.: Equipe comercial vinculada em lote"
                    : "Ex.: Participante com condição individual"
                }
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
              ? "Vinculando participantes..."
              : tipoVinculo === "DEPARTAMENTO"
                ? "Vincular departamento ao plano"
                : "Vincular funcionário ao plano"}
          </button>
        </form>

        <div className="mt-7 border-t border-slate-200 pt-6 dark:border-slate-700">
          <h3 className="text-lg font-black">Participantes vinculados</h3>

          {vinculos.length === 0 ? (
            <div className="phanyx-comercial-config-empty mt-4 rounded-2xl border border-dashed p-6 text-center">
              Nenhum participante vinculado a este plano.
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
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                          : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {vinculo.ativo ? "Ativo" : "Encerrado"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {vinculo.origemVinculo === "DEPARTAMENTO"
                        ? `🏢 Incluído por departamento: ${vinculo.departamentoNomeSnapshot ||
                        vinculo.funcionario.departamento?.nome ||
                        "Departamento"
                        }`
                        : "👤 Vínculo individual"}
                    </span>
                  </div>

                  <div className="mt-4 text-sm">
                    <p>
                      Vigência:{" "}
                      <strong>
                        {formatarData(vinculo.inicioVigencia)} até{" "}
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
        <h2 className="text-xl font-black">Regras cadastradas</h2>

        <p className="phanyx-comercial-regra-recomendacao mt-1 text-sm">
          Dentro do mesmo grupo, somente a regra mais específica será usada
          para cada funcionário.
        </p>

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
                className={[
                  "phanyx-comercial-config-plan-card rounded-3xl border p-5",
                  regraEmEdicaoId === regra.id
                    ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{regra.nome}</h3>

                    <p className="mt-1 text-sm">
                      {regra.descricao || "Sem descrição."}
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-black",
                      regra.ativo
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {regra.ativo ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                    {ROTULOS_ESCOPO[regra.escopoAplicacao]}
                  </span>

                  {regra.regraBase && (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
                      Grupo: {regra.regraBase.nome}
                    </span>
                  )}

                  {regra.escopoAplicacao === "GERAL" &&
                    Number(regra._count?.variacoes || 0) > 0 && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        {regra._count?.variacoes} exceção(ões)
                      </span>
                    )}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Aplicação
                  </p>
                  <p className="mt-1 font-black">{alvoDaRegra(regra)}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <p className="text-xs font-bold uppercase">Comissão</p>
                    <p className="mt-1 font-black">
                      {formatarValorRegra(regra)}
                    </p>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <p className="text-xs font-bold uppercase">Base</p>
                    <p className="mt-1 font-black">
                      {ROTULOS_BASE[regra.baseCalculo]}
                    </p>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3 sm:col-span-2">
                    <p className="text-xs font-bold uppercase">Gatilho</p>
                    <p className="mt-1 font-black">
                      {ROTULOS_GATILHO[regra.gatilho]}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <p>Curso: {regra.curso?.nome || "Todos"}</p>
                  <p>
                    Carência para estorno:{" "}
                    {regra.diasCarenciaEstorno ?? 0} dia(s)
                  </p>
                  <p>
                    Estorno por cancelamento:{" "}
                    {regra.estornarEmCancelamento ? "Sim" : "Não"}
                  </p>
                  <p>
                    Estorno por inadimplência:{" "}
                    {regra.estornarEmInadimplencia ? "Sim" : "Não"}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() =>
                      iniciarEdicaoRegra(regra)
                    }
                    className="phanyx-comissao-editar-regra inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black transition"
                  >
                    ✏️ Editar regra
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}