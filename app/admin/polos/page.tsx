"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import withAuth from "@/components/auth/withAuth";
import { useLocale, useTranslations } from "next-intl";

type TipoUnidadePolo =
  | "SEDE"
  | "CAMPUS"
  | "POLO"
  | "FILIAL"
  | "UNIDADE";

type StatusComercialPolo =
  | "ATIVO"
  | "PENDENTE_ATIVACAO"
  | "SUSPENSO"
  | "ENCERRADO";

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
  cnpj?: string | null;
  descricao?: string | null;
  tipoUnidade?: TipoUnidadePolo;
  statusComercial?: StatusComercialPolo;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  responsavelNome?: string | null;
  responsavelEmail?: string | null;
  responsavelTelefone?: string | null;
  responsavelCargo?: string | null;
  instituicaoGeradaId?: number | null;
  podeCriarGerenciarPolos?: boolean | null;
  ativo: boolean;
  createdAt?: string;
};

type CredenciaisAcesso = {
  instituicaoId: number;
  instituicaoNome: string;
  login: string;
  senha: string;
  precisaTrocarSenha: boolean;
  titulo?: string;
  orientacao?: string;
  podeCriarGerenciarPolos?: boolean;
};

type ContextoGestaoPolosUI = {
  instituicaoId: number;
  instituicaoContratanteId: number;
  ehInstituicaoContratante: boolean;
  permissaoDelegada: boolean;
  podeGerenciarPolos: boolean;
};

type FeedbackTipo = "sucesso" | "aviso" | "erro" | "";

type AcaoStatusPolo =
  | "SUSPENDER"
  | "REATIVAR"
  | "ENCERRAR";

const TIPOS_UNIDADE: Array<{
  valor: TipoUnidadePolo;
  nome: string;
}> = [
    { valor: "SEDE", nome: "Sede" },
    { valor: "CAMPUS", nome: "Campus" },
    { valor: "POLO", nome: "Polo" },
    { valor: "FILIAL", nome: "Filial" },
    { valor: "UNIDADE", nome: "Unidade" },
  ];

function nomeTipoUnidade(tipo?: TipoUnidadePolo) {
  return (
    TIPOS_UNIDADE.find((item) => item.valor === tipo)?.nome ||
    "Polo"
  );
}

function nomeStatusPolo(polo: Polo) {
  switch (polo.statusComercial) {
    case "ATIVO":
      return "Ativo";

    case "PENDENTE_ATIVACAO":
      return "Aguardando ativação";

    case "SUSPENSO":
      return "Suspenso";

    case "ENCERRADO":
      return "Encerrado";

    default:
      return polo.ativo ? "Ativo" : "Aguardando ativação";
  }
}

function classesStatusPolo(polo: Polo) {
  switch (polo.statusComercial) {
    case "ATIVO":
      return "border border-emerald-300 bg-emerald-100 !text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:!text-emerald-200";

    case "PENDENTE_ATIVACAO":
      return "border border-amber-300 bg-amber-100 !text-amber-900 dark:border-amber-800 dark:bg-amber-950/70 dark:!text-amber-200";

    case "SUSPENSO":
      return "border border-red-300 bg-red-100 !text-red-900 dark:border-red-800 dark:bg-red-950/70 dark:!text-red-200";

    case "ENCERRADO":
      return "border border-slate-400 bg-slate-200 !text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:!text-slate-200";

    default:
      return polo.ativo
        ? "border border-emerald-300 bg-emerald-100 !text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:!text-emerald-200"
        : "border border-amber-300 bg-amber-100 !text-amber-900 dark:border-amber-800 dark:bg-amber-950/70 dark:!text-amber-200";
  }
}

function mensagemStatusPolo(polo: Polo) {
  switch (polo.statusComercial) {
    case "PENDENTE_ATIVACAO":
      return "Ativação sujeita ao limite e à contratação do plano.";

    case "SUSPENSO":
      return "Este polo está temporariamente suspenso.";

    case "ENCERRADO":
      return "Este polo foi encerrado e permanece disponível apenas para histórico.";

    default:
      return null;
  }
}

function formatarEndereco(polo: Polo) {
  const primeiraLinha = [
    polo.endereco,
    polo.numero,
    polo.complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const segundaLinha = [
    polo.bairro,
    polo.cidade,
    polo.estado,
    polo.cep,
  ]
    .filter(Boolean)
    .join(" - ");

  return [primeiraLinha, segundaLinha]
    .filter(Boolean)
    .join(" | ");
}

function normalizarBusca(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\/|,;-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatarCep(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);

  if (numeros.length <= 5) {
    return numeros;
  }

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

function AdminPolosPage() {
  const t = useTranslations("AdminPoles");
  const locale = useLocale();

  const tiposUnidadeTraduzidos = useMemo(
    () => [
      { valor: "SEDE" as const, nome: t("unitTypes.headquarters") },
      { valor: "CAMPUS" as const, nome: t("unitTypes.campus") },
      { valor: "POLO" as const, nome: t("unitTypes.pole") },
      { valor: "FILIAL" as const, nome: t("unitTypes.branch") },
      { valor: "UNIDADE" as const, nome: t("unitTypes.unit") },
    ],
    [t]
  );

  function nomeTipoUnidadeTraduzido(
    tipo?: TipoUnidadePolo
  ) {
    return (
      tiposUnidadeTraduzidos.find(
        (item) => item.valor === tipo
      )?.nome || t("unitTypes.pole")
    );
  }

  function nomeStatusPoloTraduzido(
    polo: Polo
  ) {
    switch (polo.statusComercial) {
      case "ATIVO":
        return t("status.active");

      case "PENDENTE_ATIVACAO":
        return t("status.pendingActivation");

      case "SUSPENSO":
        return t("status.suspended");

      case "ENCERRADO":
        return t("status.closed");

      default:
        return polo.ativo
          ? t("status.active")
          : t("status.pendingActivation");
    }
  }

  function mensagemStatusPoloTraduzida(
    polo: Polo
  ) {
    switch (polo.statusComercial) {
      case "PENDENTE_ATIVACAO":
        return t("statusMessages.pendingActivation");

      case "SUSPENSO":
        return t("statusMessages.suspended");

      case "ENCERRADO":
        return t("statusMessages.closed");

      default:
        return null;
    }
  }

  const [polos, setPolos] = useState<Polo[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [tipoUnidade, setTipoUnidade] =
    useState<TipoUnidadePolo>("POLO");
  const [codigo, setCodigo] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");

  const [buscandoCep, setBuscandoCep] =
    useState(false);

  const [mensagemCep, setMensagemCep] =
    useState("");

  const [
    mensagemCepTipo,
    setMensagemCepTipo,
  ] = useState<"sucesso" | "aviso" | "erro" | "">("");

  const numeroInputRef =
    useRef<HTMLInputElement | null>(null);

  const consultaCepEmAndamentoRef =
    useRef<string | null>(null);

  const [
    contextoGestaoPolos,
    setContextoGestaoPolos,
  ] = useState<ContextoGestaoPolosUI | null>(
    null
  );

  const [
    permitirNovoPoloGerenciarPolos,
    setPermitirNovoPoloGerenciarPolos,
  ] = useState(false);

  const [
    poloParaAlterarPermissao,
    setPoloParaAlterarPermissao,
  ] = useState<Polo | null>(null);

  const [
    habilitarGestaoOutrosPolos,
    setHabilitarGestaoOutrosPolos,
  ] = useState(false);

  const [
    motivoPermissaoPolos,
    setMotivoPermissaoPolos,
  ] = useState("");

  const [
    alterandoPermissaoPolos,
    setAlterandoPermissaoPolos,
  ] = useState(false);

  const [
    erroPermissaoPolos,
    setErroPermissaoPolos,
  ] = useState("");

  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelEmail, setResponsavelEmail] = useState("");
  const [responsavelTelefone, setResponsavelTelefone] =
    useState("");
  const [responsavelCargo, setResponsavelCargo] = useState("");

  const [criando, setCriando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] =
    useState<FeedbackTipo>("");

  const [editandoId, setEditandoId] = useState<number | null>(
    null
  );

  const [editNome, setEditNome] = useState("");
  const [editTipoUnidade, setEditTipoUnidade] =
    useState<TipoUnidadePolo>("POLO");
  const [editCodigo, setEditCodigo] = useState("");
  const [editCnpj, setEditCnpj] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editCep, setEditCep] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editNumero, setEditNumero] = useState("");
  const [editComplemento, setEditComplemento] = useState("");
  const [editBairro, setEditBairro] = useState("");
  const [editCidade, setEditCidade] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editResponsavelNome, setEditResponsavelNome] =
    useState("");
  const [editResponsavelEmail, setEditResponsavelEmail] =
    useState("");
  const [
    editResponsavelTelefone,
    setEditResponsavelTelefone,
  ] = useState("");
  const [editResponsavelCargo, setEditResponsavelCargo] =
    useState("");

  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const inputClass =
    "phanyx-polos-input w-full rounded-xl border px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const [poloParaProvisionar, setPoloParaProvisionar] =
    useState<Polo | null>(null);

  const [provisionandoId, setProvisionandoId] =
    useState<number | null>(null);

  const [credenciaisAcesso, setCredenciaisAcesso] =
    useState<CredenciaisAcesso | null>(null);

  const [credenciaisCopiadas, setCredenciaisCopiadas] =
    useState(false);

  const [erroProvisionamento, setErroProvisionamento] =
    useState("");

  const [
    poloParaRedefinirSenha,
    setPoloParaRedefinirSenha,
  ] = useState<Polo | null>(null);

  const [redefinindoSenhaId, setRedefinindoSenhaId] =
    useState<number | null>(null);

  const [erroRedefinicaoSenha, setErroRedefinicaoSenha] =
    useState("");

  const [
    poloParaAlterarStatus,
    setPoloParaAlterarStatus,
  ] = useState<Polo | null>(null);

  const [
    acaoStatusPolo,
    setAcaoStatusPolo,
  ] = useState<AcaoStatusPolo | null>(null);

  const [
    motivoStatusPolo,
    setMotivoStatusPolo,
  ] = useState("");

  const [
    alterandoStatusPolo,
    setAlterandoStatusPolo,
  ] = useState(false);

  const [
    erroStatusPolo,
    setErroStatusPolo,
  ] = useState("");

  async function buscarEnderecoPorCep(
    valorInformado: string
  ) {
    const cepNumerico = valorInformado.replace(/\D/g, "");

    if (cepNumerico.length !== 8) {
      setMensagemCep(
        t("cep.invalid")
      );
      setMensagemCepTipo("erro");
      return;
    }

    if (
      consultaCepEmAndamentoRef.current === cepNumerico
    ) {
      return;
    }

    consultaCepEmAndamentoRef.current = cepNumerico;

    try {
      setBuscandoCep(true);
      setMensagemCep(t("cep.searching"));
      setMensagemCepTipo("aviso");

      const resposta = await fetch(
        `/api/admin/cep/${cepNumerico}`,
        {
          credentials: "include",
        }
      );

      const dados = await resposta
        .json()
        .catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          t("cep.notFound")
        );
      }

      setCep(
        formatarCep(
          String(dados?.cep || cepNumerico)
        )
      );

      setEndereco(
        String(dados?.endereco || "")
      );

      setBairro(
        String(dados?.bairro || "")
      );

      setCidade(
        String(dados?.cidade || "")
      );

      setEstado(
        String(dados?.estado || "").toUpperCase()
      );

      if (
        dados?.complemento &&
        !complemento.trim()
      ) {
        setComplemento(
          String(dados.complemento)
        );
      }

      if (dados?.endereco) {
        setMensagemCep(
          t("cep.autoFilled")
        );
        setMensagemCepTipo("sucesso");

        requestAnimationFrame(() => {
          numeroInputRef.current?.focus();
        });
      } else {
        setMensagemCep(
          t("cep.noStreet")
        );
        setMensagemCepTipo("aviso");
      }
    } catch (error: unknown) {
      setMensagemCep(
        error instanceof Error
          ? error.message
          : t("cep.lookupError")
      );

      setMensagemCepTipo("erro");
    } finally {
      setBuscandoCep(false);

      if (
        consultaCepEmAndamentoRef.current ===
        cepNumerico
      ) {
        consultaCepEmAndamentoRef.current = null;
      }
    }
  }

  function limparFormulario() {
    setNome("");
    setTipoUnidade("POLO");
    setCodigo("");
    setCnpj("");
    setDescricao("");
    setCep("");
    setEndereco("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setResponsavelNome("");
    setResponsavelEmail("");
    setResponsavelTelefone("");
    setResponsavelCargo("");
    setMensagemCep("");
    setMensagemCepTipo("");
    consultaCepEmAndamentoRef.current = null;
  }

  function iniciarEdicao(polo: Polo) {
    setEditandoId(polo.id);
    setEditNome(polo.nome || "");
    setEditTipoUnidade(polo.tipoUnidade || "POLO");
    setEditCodigo(polo.codigo || "");
    setEditCnpj(polo.cnpj || "");
    setEditDescricao(polo.descricao || "");
    setEditCep(polo.cep || "");
    setEditEndereco(polo.endereco || "");
    setEditNumero(polo.numero || "");
    setEditComplemento(polo.complemento || "");
    setEditBairro(polo.bairro || "");
    setEditCidade(polo.cidade || "");
    setEditEstado(polo.estado || "");
    setEditResponsavelNome(polo.responsavelNome || "");
    setEditResponsavelEmail(polo.responsavelEmail || "");
    setEditResponsavelTelefone(
      polo.responsavelTelefone || ""
    );
    setEditResponsavelCargo(polo.responsavelCargo || "");
  }

  async function carregarPolos() {
    try {
      setCarregando(true);

      const res = await fetch("/api/admin/polos", {
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || t("errors.load")
        );
      }

      const polosRecebidos = Array.isArray(data)
        ? data
        : data?.polos;

      setPolos(
        Array.isArray(polosRecebidos)
          ? polosRecebidos
          : []
      );

      if (data?.gestao) {
        setContextoGestaoPolos({
          instituicaoId: Number(
            data.gestao.instituicaoId
          ),

          instituicaoContratanteId: Number(
            data.gestao.instituicaoContratanteId
          ),

          ehInstituicaoContratante:
            data.gestao
              .ehInstituicaoContratante === true,

          permissaoDelegada:
            data.gestao.permissaoDelegada ===
            true,

          podeGerenciarPolos:
            data.gestao.podeGerenciarPolos ===
            true,
        });
      } else {
        setContextoGestaoPolos(null);
      }
    } catch (error: unknown) {
      setPolos([]);
      setContextoGestaoPolos(null);
      setFeedback(
        error instanceof Error
          ? error.message
          : t("errors.load")
      );
      setFeedbackTipo("erro");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPolos();
  }, []);

  useEffect(() => {
    setFeedback("");
    setFeedbackTipo("");
    setMensagemCep("");
    setMensagemCepTipo("");
    setErroProvisionamento("");
    setErroRedefinicaoSenha("");
    setErroStatusPolo("");
    setErroPermissaoPolos("");
  }, [locale]);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [feedback]);

  async function criarPolo(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setCriando(true);

      const res = await fetch("/api/admin/polos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nome,
          tipoUnidade,
          codigo,
          cnpj,
          descricao,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          responsavelNome,
          responsavelEmail,
          responsavelTelefone,
          responsavelCargo,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || t("errors.create")
        );
      }

      limparFormulario();
      setBusca("");
      await carregarPolos();

      setFeedback(
        data?.aviso || t("feedback.created")
      );

      setFeedbackTipo(
        data?.aviso ? "aviso" : "sucesso"
      );
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : t("errors.create")
      );
      setFeedbackTipo("erro");
    } finally {
      setCriando(false);
    }
  }

  async function salvarEdicao() {
    if (!editandoId) return;

    try {
      setSalvandoEdicao(true);

      const res = await fetch("/api/admin/polos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: editandoId,
          nome: editNome,
          tipoUnidade: editTipoUnidade,
          codigo: editCodigo,
          cnpj: editCnpj,
          descricao: editDescricao,
          cep: editCep,
          endereco: editEndereco,
          numero: editNumero,
          complemento: editComplemento,
          bairro: editBairro,
          cidade: editCidade,
          estado: editEstado,
          responsavelNome: editResponsavelNome,
          responsavelEmail: editResponsavelEmail,
          responsavelTelefone: editResponsavelTelefone,
          responsavelCargo: editResponsavelCargo,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || t("errors.update")
        );
      }

      setEditandoId(null);
      setBusca("");
      await carregarPolos();

      setFeedback(t("feedback.updated"));
      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : t("errors.update")
      );
      setFeedbackTipo("erro");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function provisionarPolo() {
    if (!poloParaProvisionar) return;

    setErroProvisionamento("");

    try {
      setProvisionandoId(poloParaProvisionar.id);

      const res = await fetch(
        `/api/admin/polos/${poloParaProvisionar.id}/provisionar`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            permitirGerenciarPolos:
              contextoGestaoPolos
                ?.ehInstituicaoContratante ===
              true &&
              permitirNovoPoloGerenciarPolos,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("errors.provision")
        );
      }

      if (
        !data?.instituicao?.id ||
        !data?.instituicao?.nome ||
        !data?.credenciaisTemporarias?.login ||
        !data?.credenciaisTemporarias?.senha
      ) {
        throw new Error(
          t("errors.invalidProvisionCredentials")
        );
      }

      setPoloParaProvisionar(null);
      setBusca("");

      setCredenciaisAcesso({
        instituicaoId: Number(data.instituicao.id),
        instituicaoNome: String(data.instituicao.nome),
        login: String(data.credenciaisTemporarias.login),
        senha: String(data.credenciaisTemporarias.senha),
        precisaTrocarSenha:
          data.credenciaisTemporarias.precisaTrocarSenha ===
          true,
        podeCriarGerenciarPolos:
          data?.permissaoPolos
            ?.podeCriarGerenciarPolos === true,
      });

      setCredenciaisCopiadas(false);

      await carregarPolos();

      setFeedback(
        t("feedback.provisioned")
      );
      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t("errors.provision");

      setErroProvisionamento(mensagem);
    } finally {
      setProvisionandoId(null);
    }
  }

  {
    erroProvisionamento && (
      <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
        {erroProvisionamento}
      </div>
    )
  }

  async function copiarCredenciais() {
    if (!credenciaisAcesso) return;

    const texto = [
      t("credentials.copyTitle"),
      "",
      t("credentials.institution", { name: credenciaisAcesso.instituicaoNome }),
      t("credentials.login", { login: credenciaisAcesso.login }),
      t("credentials.temporaryPassword", { password: credenciaisAcesso.senha }),
      "",
      t("credentials.changeOnFirstAccess"),
      t("credentials.oldPasswordInvalid"),
      t("credentials.signOutOtherSessions"),
      "",
      t("credentials.doNotShare"),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      setCredenciaisCopiadas(true);
    } catch {
      setFeedback(
        t("errors.copyCredentials")
      );
      setFeedbackTipo("erro");
    }
  }

  async function redefinirSenhaPolo() {
    if (!poloParaRedefinirSenha) return;

    setErroRedefinicaoSenha("");

    try {
      setRedefinindoSenhaId(poloParaRedefinirSenha.id);

      const res = await fetch(
        `/api/admin/polos/${poloParaRedefinirSenha.id}/redefinir-senha`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("errors.resetPassword")
        );
      }

      if (
        !data?.instituicao?.id ||
        !data?.instituicao?.nome ||
        !data?.credenciaisTemporarias?.login ||
        !data?.credenciaisTemporarias?.senha
      ) {
        throw new Error(
          t("errors.invalidResetCredentials")
        );
      }

      setPoloParaRedefinirSenha(null);

      setCredenciaisAcesso({
        instituicaoId: Number(data.instituicao.id),
        instituicaoNome: String(data.instituicao.nome),
        login: String(data.credenciaisTemporarias.login),
        senha: String(data.credenciaisTemporarias.senha),
        precisaTrocarSenha:
          data.credenciaisTemporarias.precisaTrocarSenha ===
          true,
        titulo: t("credentials.resetTitle"),
        orientacao:
          t("credentials.resetGuidance"),
      });

      setCredenciaisCopiadas(false);

      setFeedback(
        t("feedback.passwordReset")
      );
      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      setErroRedefinicaoSenha(
        error instanceof Error
          ? error.message
          : t("errors.resetPassword")
      );
    } finally {
      setRedefinindoSenhaId(null);
    }
  }

  function abrirModalStatusPolo(
    polo: Polo,
    acao: AcaoStatusPolo
  ) {
    setPoloParaAlterarStatus(polo);
    setAcaoStatusPolo(acao);
    setMotivoStatusPolo("");
    setErroStatusPolo("");
  }

  async function confirmarAlteracaoStatusPolo() {
    if (!poloParaAlterarStatus || !acaoStatusPolo) {
      return;
    }

    const exigeMotivo =
      acaoStatusPolo === "SUSPENDER" ||
      acaoStatusPolo === "ENCERRAR";

    if (
      exigeMotivo &&
      motivoStatusPolo.trim().length < 5
    ) {
      setErroStatusPolo(
        t("validation.reasonMin")
      );
      return;
    }

    try {
      setAlterandoStatusPolo(true);
      setErroStatusPolo("");

      const resposta = await fetch(
        `/api/admin/polos/${poloParaAlterarStatus.id}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            acao: acaoStatusPolo,
            motivo: motivoStatusPolo.trim(),
          }),
        }
      );

      const dados = await resposta
        .json()
        .catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          t("errors.changeStatus")
        );
      }

      setPoloParaAlterarStatus(null);
      setAcaoStatusPolo(null);
      setMotivoStatusPolo("");
      setBusca("");

      await carregarPolos();

      setFeedback(
        dados?.mensagem ||
        t("feedback.statusChanged")
      );
      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      setErroStatusPolo(
        error instanceof Error
          ? error.message
          : t("errors.changeStatus")
      );
    } finally {
      setAlterandoStatusPolo(false);
    }
  }

  function abrirModalPermissaoPolos(
    polo: Polo,
    habilitar: boolean
  ) {
    setPoloParaAlterarPermissao(polo);

    setHabilitarGestaoOutrosPolos(
      habilitar
    );

    setMotivoPermissaoPolos("");
    setErroPermissaoPolos("");
  }

  function fecharModalPermissaoPolos() {
    if (alterandoPermissaoPolos) return;

    setPoloParaAlterarPermissao(null);
    setHabilitarGestaoOutrosPolos(false);
    setMotivoPermissaoPolos("");
    setErroPermissaoPolos("");
  }

  async function confirmarPermissaoPolos() {
    if (!poloParaAlterarPermissao) {
      return;
    }

    if (
      motivoPermissaoPolos.trim().length < 5
    ) {
      setErroPermissaoPolos(
        t("validation.reasonMin")
      );
      return;
    }

    try {
      setAlterandoPermissaoPolos(true);
      setErroPermissaoPolos("");

      const resposta = await fetch(
        `/api/admin/polos/${poloParaAlterarPermissao.id}/permissao-gerenciar`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            habilitar:
              habilitarGestaoOutrosPolos,

            motivo:
              motivoPermissaoPolos.trim(),
          }),
        }
      );

      const dados = await resposta
        .json()
        .catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          t("errors.changePermission")
        );
      }

      setPoloParaAlterarPermissao(null);
      setHabilitarGestaoOutrosPolos(false);
      setMotivoPermissaoPolos("");
      setErroPermissaoPolos("");

      await carregarPolos();

      setFeedback(
        dados?.mensagem ||
        t("feedback.permissionChanged")
      );

      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      setErroPermissaoPolos(
        error instanceof Error
          ? error.message
          : t("errors.changePermission")
      );
    } finally {
      setAlterandoPermissaoPolos(false);
    }
  }

  const polosFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca);

    if (!termo) return polos;

    return polos.filter((polo) => {
      const conteudoPolo = normalizarBusca(
        [
          polo.nome,
          polo.codigo,
          polo.cnpj,
          polo.tipoUnidade,
          polo.statusComercial,
          polo.cep,
          polo.endereco,
          polo.numero,
          polo.complemento,
          polo.bairro,
          polo.cidade,
          polo.estado,
          `${polo.cidade || ""} ${polo.estado || ""}`,
          polo.responsavelNome,
          polo.responsavelEmail,
          polo.responsavelTelefone,
          polo.responsavelCargo,
          polo.descricao,
        ].join(" ")
      );

      return conteudoPolo.includes(termo);
    });
  }, [polos, busca]);

  return (
    <div className="phanyx-polos-page max-w-6xl space-y-6">

      {poloParaAlterarPermissao && (
        <div className="fixed inset-0 z-[1000003] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-permissao-polos"
            className="phanyx-polos-card w-full max-w-xl rounded-2xl border p-6 shadow-2xl"
          >
            <h2
              id="titulo-permissao-polos"
              className="text-xl font-bold"
            >
              {habilitarGestaoOutrosPolos
                ? t("modals.permission.allowTitle")
                : t("modals.permission.removeTitle")}
            </h2>

            <p className="mt-3 text-sm leading-6">
              {t("modals.permission.unit")}:{" "}
              <strong>
                {poloParaAlterarPermissao.nome}
              </strong>
            </p>

            <div className="phanyx-polos-alerta-provisionamento mt-4 rounded-xl border p-4">
              {habilitarGestaoOutrosPolos ? (
                <>
                  <p className="text-sm font-bold">
                    {t("modals.permission.canDoTitle")}
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    {t("modals.permission.canDoDescription")}
                  </p>

                  <p className="mt-3 text-sm leading-6">
                    {t("modals.permission.billingDescription")}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold">
                    {t("modals.permission.removeDescription")}
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    {t("modals.permission.existingRemain")}
                  </p>
                </>
              )}
            </div>

            <div className="mt-5">
              <label
                htmlFor="motivo-permissao-polos"
                className="mb-2 block text-sm font-semibold"
              >
                {t("modals.common.reasonChange")}
              </label>

              <textarea
                id="motivo-permissao-polos"
                value={motivoPermissaoPolos}
                onChange={(e) =>
                  setMotivoPermissaoPolos(
                    e.target.value
                  )
                }
                placeholder={
                  habilitarGestaoOutrosPolos
                    ? t("modals.permission.allowReasonPlaceholder")
                    : t("modals.permission.removeReasonPlaceholder")
                }
                className={`${inputClass} min-h-[100px] resize-y`}
                autoFocus
              />

              <p className="mt-1 text-xs">
                {t("modals.common.reasonMin")}
              </p>
            </div>

            {erroPermissaoPolos && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                {erroPermissaoPolos}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={fecharModalPermissaoPolos}
                disabled={alterandoPermissaoPolos}
                className="rounded-xl border border-slate-400 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {t("modals.common.back")}
              </button>

              <button
                type="button"
                onClick={
                  confirmarPermissaoPolos
                }
                disabled={alterandoPermissaoPolos}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${habilitarGestaoOutrosPolos
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {alterandoPermissaoPolos
                  ? t("modals.common.saving")
                  : habilitarGestaoOutrosPolos
                    ? t("modals.permission.confirmAllow")
                    : t("modals.permission.confirmRemove")}
              </button>
            </div>
          </div>
        </div>
      )}

      {poloParaAlterarStatus && acaoStatusPolo && (
        <div className="fixed inset-0 z-[1000002] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-alterar-status-polo"
            className="phanyx-polos-card w-full max-w-xl rounded-2xl border p-6 shadow-2xl"
          >
            <h2
              id="titulo-alterar-status-polo"
              className="text-xl font-bold"
            >
              {acaoStatusPolo === "SUSPENDER"
                ? t("modals.status.deactivateTitle")
                : acaoStatusPolo === "REATIVAR"
                  ? t("modals.status.reactivateTitle")
                  : t("modals.status.closeTitle")}
            </h2>

            <p className="mt-3 text-sm leading-6">
              {t("modals.status.changing")}{" "}
              <strong>{poloParaAlterarStatus.nome}</strong>.
            </p>

            <div className="phanyx-polos-alerta-provisionamento mt-4 rounded-xl border p-4">
              {acaoStatusPolo === "SUSPENDER" && (
                <p className="text-sm leading-6">
                  {t("modals.status.deactivateDescription")}
                </p>
              )}

              {acaoStatusPolo === "REATIVAR" && (
                <p className="text-sm leading-6">
                  {t("modals.status.reactivateDescription")}
                </p>
              )}

              {acaoStatusPolo === "ENCERRAR" && (
                <p className="text-sm leading-6">
                  {t("modals.status.closeDescription")}
                </p>
              )}
            </div>

            {acaoStatusPolo !== "REATIVAR" && (
              <div className="mt-5">
                <label
                  htmlFor="motivo-status-polo"
                  className="mb-2 block text-sm font-semibold"
                >
                  {t("modals.common.reason")}
                </label>

                <textarea
                  id="motivo-status-polo"
                  value={motivoStatusPolo}
                  onChange={(e) =>
                    setMotivoStatusPolo(e.target.value)
                  }
                  placeholder={
                    acaoStatusPolo === "ENCERRAR"
                      ? t("modals.status.closeReasonPlaceholder")
                      : t("modals.status.deactivateReasonPlaceholder")
                  }
                  className={`${inputClass} min-h-[100px] resize-y`}
                  autoFocus
                />

                <p className="mt-1 text-xs">
                  {t("modals.common.reasonMin")}
                </p>
              </div>
            )}

            {erroStatusPolo && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                {erroStatusPolo}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPoloParaAlterarStatus(null);
                  setAcaoStatusPolo(null);
                  setMotivoStatusPolo("");
                  setErroStatusPolo("");
                }}
                disabled={alterandoStatusPolo}
                className="rounded-xl border border-slate-400 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {t("modals.common.back")}
              </button>

              <button
                type="button"
                onClick={confirmarAlteracaoStatusPolo}
                disabled={alterandoStatusPolo}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${acaoStatusPolo === "SUSPENDER"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : acaoStatusPolo === "REATIVAR"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {alterandoStatusPolo
                  ? t("modals.common.processing")
                  : acaoStatusPolo === "SUSPENDER"
                    ? t("modals.status.confirmDeactivate")
                    : acaoStatusPolo === "REATIVAR"
                      ? t("modals.status.confirmReactivate")
                      : t("modals.status.confirmClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {erroProvisionamento && (
        <div className="fixed inset-0 z-[1000001] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-erro-provisionamento"
            className="phanyx-polos-modal-erro w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="phanyx-polos-modal-erro-icone flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl">
                ⚠️
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="titulo-erro-provisionamento"
                  className="phanyx-polos-modal-erro-titulo text-xl font-bold"
                >
                  {t("modals.provisionError.title")}
                </h2>

                <p className="phanyx-polos-modal-erro-texto mt-2 text-sm leading-6">
                  {erroProvisionamento}
                </p>
              </div>
            </div>

            {erroProvisionamento
              .toLowerCase()
              .includes("já existe um usuário") && (
                <div className="phanyx-polos-modal-erro-ajuda mt-5 rounded-xl border p-4">
                  <p className="phanyx-polos-modal-erro-ajuda-titulo text-sm font-bold">
                    {t("modals.provisionError.whatToDo")}
                  </p>

                  <p className="phanyx-polos-modal-erro-ajuda-texto mt-2 text-sm leading-6">
                    {t("modals.provisionError.emailAlreadyUsed")}
                  </p>

                  {poloParaProvisionar?.responsavelEmail && (
                    <div className="phanyx-polos-modal-erro-email mt-3 rounded-lg border px-3 py-2">
                      <p className="text-xs font-semibold uppercase">
                        {t("modals.provisionError.reportedEmail")}
                      </p>

                      <p className="mt-1 break-all text-sm font-bold">
                        {poloParaProvisionar.responsavelEmail}
                      </p>
                    </div>
                  )}
                </div>
              )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setErroProvisionamento("")}
                className="phanyx-polos-modal-erro-voltar rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                {t("modals.common.back")}
              </button>

              <button
                type="button"
                onClick={() => {
                  const polo = poloParaProvisionar;

                  setErroProvisionamento("");
                  setPoloParaProvisionar(null);
                  setPermitirNovoPoloGerenciarPolos(false);

                  if (polo) {
                    iniciarEdicao(polo);
                  }
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("modals.provisionError.editResponsible")}
              </button>
            </div>
          </div>
        </div>
      )}

      {poloParaProvisionar && !erroProvisionamento && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmar-provisionamento"
            className="phanyx-polos-card w-full max-w-xl rounded-2xl border p-6 shadow-2xl"
          >
            <h2
              id="titulo-confirmar-provisionamento"
              className="text-xl font-bold"
            >
              {t("modals.provision.title")}
            </h2>

            <p className="mt-3 text-sm">
              {t("modals.provision.introBefore")}{" "}
              <strong>{poloParaProvisionar.nome}</strong>{" "}
              {t("modals.provision.introAfter")}
            </p>

            <div className="phanyx-polos-alerta-provisionamento mt-4 rounded-xl border p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="phanyx-polos-alerta-icone mt-0.5 text-base"
                >
                  ⚠️
                </span>

                <div>
                  <p className="phanyx-polos-alerta-titulo text-sm font-bold">
                    {t("modals.common.attention")}
                  </p>

                  <p className="phanyx-polos-alerta-texto mt-1 text-sm leading-6">
                    {t("modals.provision.billingNotice")}
                  </p>
                </div>
              </div>
            </div>

            {contextoGestaoPolos
              ?.ehInstituicaoContratante && (
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <input
                    type="checkbox"
                    checked={
                      permitirNovoPoloGerenciarPolos
                    }
                    onChange={(e) =>
                      setPermitirNovoPoloGerenciarPolos(
                        e.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                  />

                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-slate-100">
                      {t("modals.provision.delegateTitle")}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {t("modals.provision.delegateDescription")}
                    </p>
                  </div>
                </label>
              )}

            {contextoGestaoPolos
              ?.permissaoDelegada &&
              !contextoGestaoPolos
                .ehInstituicaoContratante && (
                <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {t("modals.provision.delegatedWarning")}
                </div>
              )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setErroProvisionamento("");
                  setPoloParaProvisionar(null);

                  setPermitirNovoPoloGerenciarPolos(
                    false
                  );
                }}
                disabled={
                  provisionandoId === poloParaProvisionar.id
                }
                className="rounded-xl border border-slate-400 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("modals.common.cancel")}
              </button>

              <button
                type="button"
                onClick={provisionarPolo}
                disabled={
                  provisionandoId === poloParaProvisionar.id
                }
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {provisionandoId === poloParaProvisionar.id
                  ? t("modals.provision.creating")
                  : t("modals.provision.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {poloParaRedefinirSenha && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-redefinir-senha-polo"
            className="phanyx-polos-card w-full max-w-xl rounded-2xl border p-6 shadow-2xl"
          >
            <h2
              id="titulo-redefinir-senha-polo"
              className="text-xl font-bold"
            >
              {t("modals.resetPassword.title")}
            </h2>

            <p className="mt-3 text-sm leading-6">
              {t("modals.resetPassword.introBefore")}{" "}
              <strong>{poloParaRedefinirSenha.nome}</strong>.
            </p>

            <div className="phanyx-polos-alerta-provisionamento mt-4 rounded-xl border p-4 shadow-sm">
              <p className="phanyx-polos-alerta-titulo text-sm font-bold">
                {t("modals.common.attention")}
              </p>

              <p className="phanyx-polos-alerta-texto mt-1 text-sm leading-6">
                {t("modals.resetPassword.passwordNotice")}
              </p>

              <p className="phanyx-polos-alerta-texto mt-3 text-sm leading-6">
                <strong>{t("modals.common.important")}</strong>{" "}
                {t("modals.resetPassword.sessionNotice")}
              </p>
            </div>

            {erroRedefinicaoSenha && (
              <div className="mt-4 rounded-xl border border-red-300 !bg-red-50 p-4 text-sm font-semibold !text-red-800 dark:border-red-800 dark:!bg-red-950/40 dark:!text-red-200">
                {erroRedefinicaoSenha}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setErroRedefinicaoSenha("");
                  setPoloParaRedefinirSenha(null);
                }}
                disabled={
                  redefinindoSenhaId ===
                  poloParaRedefinirSenha.id
                }
                className="rounded-xl border border-slate-400 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {t("modals.common.cancel")}
              </button>

              <button
                type="button"
                onClick={redefinirSenhaPolo}
                disabled={
                  redefinindoSenhaId ===
                  poloParaRedefinirSenha.id
                }
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {redefinindoSenhaId ===
                  poloParaRedefinirSenha.id
                  ? t("modals.resetPassword.generating")
                  : t("modals.resetPassword.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {credenciaisAcesso && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-credenciais-unidade"
            className="phanyx-polos-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-2xl"
          >
            <h2
              id="titulo-credenciais-unidade"
              className="text-xl font-bold"
            >
              {credenciaisAcesso.titulo ||
                t("modals.credentials.defaultTitle")}
            </h2>

            <p className="mt-2 text-sm">
              {credenciaisAcesso.orientacao ||
                t("modals.credentials.defaultGuidance")}
            </p>

            <div className="mt-5 space-y-3">
              <div className="phanyx-polos-input rounded-xl border p-3">
                <p className="text-xs font-semibold uppercase">
                  {t("modals.credentials.institution")}
                </p>

                <p className="mt-1 font-bold">
                  {credenciaisAcesso.instituicaoNome}
                </p>
              </div>

              <div className="phanyx-polos-input rounded-xl border p-3">
                <p className="text-xs font-semibold uppercase">
                  {t("modals.credentials.login")}
                </p>

                <p className="mt-1 break-all font-mono font-bold">
                  {credenciaisAcesso.login}
                </p>
              </div>

              <div className="phanyx-polos-input rounded-xl border p-3">
                <p className="text-xs font-semibold uppercase">
                  {t("modals.credentials.temporaryPassword")}
                </p>

                <p className="mt-1 break-all font-mono text-lg font-bold">
                  {credenciaisAcesso.senha}
                </p>
              </div>

              {typeof credenciaisAcesso
                .podeCriarGerenciarPolos ===
                "boolean" && (
                  <div className="phanyx-polos-input rounded-xl border p-3">
                    <p className="text-xs font-semibold uppercase">
                      {t("modals.credentials.otherPolesManagement")}
                    </p>

                    <p className="mt-1 font-bold">
                      {credenciaisAcesso
                        .podeCriarGerenciarPolos
                        ? t("modals.credentials.enabledByContracting")
                        : t("modals.credentials.notEnabled")}
                    </p>
                  </div>
                )}

            </div>

            {credenciaisAcesso.precisaTrocarSenha && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {t("modals.credentials.changeOnFirstAccess")}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={copiarCredenciais}
                className="rounded-xl border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
              >
                {credenciaisCopiadas
                  ? t("modals.credentials.copied")
                  : t("modals.credentials.copy")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCredenciaisAcesso(null);
                  setCredenciaisCopiadas(false);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("modals.credentials.closeAndClear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${feedbackTipo === "sucesso"
            ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200"
            : feedbackTipo === "aviso"
              ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            }`}
        >
          {feedback}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold !text-slate-950 dark:!text-slate-100">
          {t("header.title")}
        </h1>

        <p className="phanyx-polos-subtitulo mt-1">
          {t("header.description")}
        </p>
      </div>

      <div className="phanyx-polos-aviso rounded-2xl border p-4 text-sm font-semibold">
        {t("header.notice")}
      </div>

      <form
        onSubmit={criarPolo}
        className="phanyx-polos-card space-y-6 rounded-2xl border p-6 shadow-sm"
      >
        <div>
          <h2 className="font-semibold !text-slate-950 dark:!text-slate-100">
            {t("create.title")}
          </h2>

          <p className="mt-1 text-sm !text-slate-700 dark:!text-slate-300">
            {t("create.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <select
            value={tipoUnidade}
            onChange={(e) =>
              setTipoUnidade(
                e.target.value as TipoUnidadePolo
              )
            }
            className={inputClass}
          >
            {tiposUnidadeTraduzidos.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder={t("form.namePlaceholder")}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder={t("form.codePlaceholder")}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={inputClass}
          />

          <input
            type="text"
            placeholder={t("form.taxIdOptionalPlaceholder")}
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {t("form.addressSection")}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={9}
                placeholder={t("form.postalCodePlaceholder")}
                value={cep}
                disabled={buscandoCep}
                onChange={(e) => {
                  const valorFormatado = formatarCep(
                    e.target.value
                  );

                  setCep(valorFormatado);
                  setMensagemCep("");
                  setMensagemCepTipo("");

                  const numeros =
                    valorFormatado.replace(/\D/g, "");

                  if (numeros.length === 8) {
                    void buscarEnderecoPorCep(
                      valorFormatado
                    );
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;

                  e.preventDefault();

                  void buscarEnderecoPorCep(cep);
                }}
                className={inputClass}
              />

              {buscandoCep && (
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {t("cep.searching")}
                </p>
              )}

              {!buscandoCep && mensagemCep && (
                <p
                  role={
                    mensagemCepTipo === "erro"
                      ? "alert"
                      : undefined
                  }
                  className={`text-xs font-medium ${mensagemCepTipo === "sucesso"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : mensagemCepTipo === "aviso"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-red-700 dark:text-red-300"
                    }`}
                >
                  {mensagemCep}
                </p>
              )}
            </div>

            <input
              type="text"
              placeholder={t("form.addressPlaceholder")}
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className={inputClass}
              required
            />

            <input
              ref={numeroInputRef}
              type="text"
              placeholder={t("form.numberPlaceholder")}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className={inputClass}
            />

            <input
              type="text"
              placeholder={t("form.complementPlaceholder")}
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className={inputClass}
            />

            <input
              type="text"
              placeholder={t("form.neighborhoodPlaceholder")}
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className={inputClass}
            />

            <input
              type="text"
              placeholder={t("form.cityPlaceholder")}
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className={inputClass}
              required
            />

            <input
              type="text"
              placeholder={t("form.stateExamplePlaceholder")}
              value={estado}
              maxLength={2}
              onChange={(e) =>
                setEstado(e.target.value.toUpperCase())
              }
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {t("form.responsibleSection")}
            </h3>

            <p className="mt-1 text-sm !text-slate-700 dark:!text-slate-300">
              {t("form.responsibleHelp")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder={t("form.responsibleNamePlaceholder")}
              value={responsavelNome}
              onChange={(e) =>
                setResponsavelNome(e.target.value)
              }
              className={inputClass}
            />

            <input
              type="email"
              placeholder={t("form.responsibleEmailPlaceholder")}
              value={responsavelEmail}
              onChange={(e) =>
                setResponsavelEmail(e.target.value)
              }
              className={inputClass}
            />

            <input
              type="text"
              placeholder={t("form.responsiblePhonePlaceholder")}
              value={responsavelTelefone}
              onChange={(e) =>
                setResponsavelTelefone(e.target.value)
              }
              className={inputClass}
            />

            <input
              type="text"
              placeholder={t("form.responsibleRolePlaceholder")}
              value={responsavelCargo}
              onChange={(e) =>
                setResponsavelCargo(e.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>

        <textarea
          placeholder={t("form.descriptionPlaceholder")}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={`${inputClass} min-h-[100px] resize-y`}
        />

        <button
          type="submit"
          disabled={criando}
          className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {criando ? t("actions.creating") : t("actions.create")}
        </button>
      </form>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold !text-slate-950 dark:!text-slate-100">
            {t("list.title")}
          </h2>

          <input
            type="search"
            name="filtro-interno-polos"
            autoComplete="off"
            spellCheck={false}
            aria-label={t("list.searchAria")}
            placeholder={t("list.searchPlaceholder")}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`${inputClass} md:w-[420px]`}
          />
        </div>

        {carregando ? (
          <div className="phanyx-polos-card rounded-2xl border p-4 text-sm">
            {t("list.loading")}
          </div>
        ) : polosFiltrados.length === 0 ? (
          <div className="phanyx-polos-card rounded-2xl border p-4 text-sm">
            {t("list.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {polosFiltrados.map((polo) => {
              const mensagemStatus =
                mensagemStatusPoloTraduzida(polo);

              const unidadeContratante =
                String(polo.codigo || "")
                  .trim()
                  .toUpperCase() === "SEDE" &&
                !polo.instituicaoGeradaId;

              const possuiResponsavel =
                Boolean(String(polo.responsavelNome || "").trim()) &&
                Boolean(String(polo.responsavelEmail || "").trim());

              const statusPermiteProvisionamento =
                polo.statusComercial
                  ? polo.statusComercial === "ATIVO"
                  : polo.ativo === true;

              const podeCriarAcesso =
                !unidadeContratante &&
                !polo.instituicaoGeradaId &&
                possuiResponsavel &&
                polo.ativo === true &&
                statusPermiteProvisionamento;

              return (
                <div
                  key={polo.id}
                  className="phanyx-polos-card rounded-2xl border p-4 shadow-sm"
                >
                  {editandoId === polo.id ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <select
                          value={editTipoUnidade}
                          onChange={(e) =>
                            setEditTipoUnidade(
                              e.target
                                .value as TipoUnidadePolo
                            )
                          }
                          className={inputClass}
                        >
                          {tiposUnidadeTraduzidos.map((tipo) => (
                            <option
                              key={tipo.valor}
                              value={tipo.valor}
                            >
                              {tipo.nome}
                            </option>
                          ))}
                        </select>

                        <input
                          value={editNome}
                          onChange={(e) =>
                            setEditNome(e.target.value)
                          }
                          className={inputClass}
                          placeholder={t("form.namePlaceholder")}
                        />

                        <input
                          value={editCodigo}
                          onChange={(e) =>
                            setEditCodigo(e.target.value)
                          }
                          className={inputClass}
                          placeholder={t("form.codePlaceholder")}
                        />

                        <input
                          value={editCnpj}
                          onChange={(e) =>
                            setEditCnpj(e.target.value)
                          }
                          className={inputClass}
                          placeholder={t("form.taxIdPlaceholder")}
                        />

                        <input
                          value={editCep}
                          onChange={(e) =>
                            setEditCep(e.target.value)
                          }
                          className={inputClass}
                          placeholder={t("form.postalCodePlaceholder")}
                        />

                        <input
                          value={editEndereco}
                          onChange={(e) =>
                            setEditEndereco(e.target.value)
                          }
                          className={inputClass}
                          placeholder={t("form.addressPlaceholder")}
                        />

                        <input
                          value={editNumero}
                          onChange={(e) =>
                            setEditNumero(e.target.value)
                          }
                          className={inputClass}
                          placeholder={t("form.numberPlaceholder")}
                        />

                        <input
                          value={editComplemento}
                          onChange={(e) =>
                            setEditComplemento(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder={t("form.complementPlaceholder")}
                        />

                        <input
                          value={editBairro}
                          onChange={(e) =>
                            setEditBairro(e.target.value)
                          }
                          className={inputClass}
                          placeholder={t("form.neighborhoodPlaceholder")}
                        />

                        <input
                          value={editCidade}
                          onChange={(e) =>
                            setEditCidade(e.target.value)
                          }
                          className={inputClass}
                          placeholder={t("form.cityPlaceholder")}
                        />

                        <input
                          value={editEstado}
                          maxLength={2}
                          onChange={(e) =>
                            setEditEstado(
                              e.target.value.toUpperCase()
                            )
                          }
                          className={inputClass}
                          placeholder={t("form.statePlaceholder")}
                        />

                        <input
                          value={editResponsavelNome}
                          onChange={(e) =>
                            setEditResponsavelNome(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder={t("form.responsibleNamePlaceholder")}
                        />

                        <input
                          type="email"
                          value={editResponsavelEmail}
                          onChange={(e) =>
                            setEditResponsavelEmail(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder={t("form.responsibleEmailPlaceholder")}
                        />

                        <input
                          value={editResponsavelTelefone}
                          onChange={(e) =>
                            setEditResponsavelTelefone(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder={t("form.responsiblePhonePlaceholder")}
                        />

                        <input
                          value={editResponsavelCargo}
                          onChange={(e) =>
                            setEditResponsavelCargo(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder={t("form.responsibleRolePlaceholder")}
                        />

                        <textarea
                          value={editDescricao}
                          onChange={(e) =>
                            setEditDescricao(e.target.value)
                          }
                          className={`${inputClass} min-h-[90px] resize-y md:col-span-2`}
                          placeholder={t("form.descriptionEditPlaceholder")}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={salvarEdicao}
                          disabled={salvandoEdicao}
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {salvandoEdicao
                            ? t("actions.saving")
                            : t("actions.save")}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditandoId(null)
                          }
                          disabled={salvandoEdicao}
                          className="rounded-xl bg-slate-500 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {t("actions.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="text-base font-bold !text-slate-950 dark:!text-slate-100">
                          {polo.nome}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          {t("list.type")}:{" "}
                          {nomeTipoUnidadeTraduzido(
                            polo.tipoUnidade
                          )}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          {t("list.code")}: {polo.codigo || "-"}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          {t("list.taxId")}: {polo.cnpj || "-"}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          {t("list.address")}:{" "}
                          {formatarEndereco(polo) || "-"}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          {t("list.responsible")}:{" "}
                          {polo.responsavelNome || "-"}
                        </p>

                        {polo.responsavelEmail && (
                          <p className="text-sm !text-slate-700 dark:!text-slate-300">
                            {t("list.email")}:{" "}
                            {polo.responsavelEmail}
                          </p>
                        )}

                        {polo.responsavelTelefone && (
                          <p className="text-sm !text-slate-700 dark:!text-slate-300">
                            {t("list.phone")}:{" "}
                            {polo.responsavelTelefone}
                          </p>
                        )}

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          {t("list.description")}:{" "}
                          {polo.descricao || "-"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(polo)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {t("actions.edit")}
                          </button>

                          {!unidadeContratante &&
                            polo.statusComercial !== "ENCERRADO" && (
                              <>
                                {(polo.statusComercial === "ATIVO" ||
                                  (!polo.statusComercial && polo.ativo)) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirModalStatusPolo(
                                          polo,
                                          "SUSPENDER"
                                        )
                                      }
                                      className="rounded-lg border border-amber-500 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                                    >
                                      {t("actions.deactivate")}
                                    </button>
                                  )}

                                {polo.statusComercial === "SUSPENSO" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirModalStatusPolo(
                                        polo,
                                        "REATIVAR"
                                      )
                                    }
                                    className="rounded-lg border border-emerald-500 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                                  >
                                    {t("actions.reactivate")}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirModalStatusPolo(
                                      polo,
                                      "ENCERRAR"
                                    )
                                  }
                                  className="rounded-lg border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                                >
                                  {t("actions.closePole")}
                                </button>
                              </>
                            )}

                          {podeCriarAcesso && (
                            <button
                              type="button"
                              onClick={() => {
                                setErroProvisionamento("");

                                setPermitirNovoPoloGerenciarPolos(false);

                                setPoloParaProvisionar(polo);
                              }}
                              disabled={provisionandoId === polo.id}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {provisionandoId === polo.id
                                ? t("actions.creatingAccess")
                                : t("actions.createInstitutionalAccess")}
                            </button>
                          )}

                          {polo.instituicaoGeradaId && (
                            <>
                              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                                {t("badges.independentInstitution")}
                              </span>

                              {contextoGestaoPolos
                                ?.ehInstituicaoContratante && (
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-bold ${polo.podeCriarGerenciarPolos
                                        ? "border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
                                        : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                      }`}
                                  >
                                    {polo.podeCriarGerenciarPolos
                                      ? t("badges.canCreatePoles")
                                      : t("badges.cannotCreatePoles")}
                                  </span>
                                )}

                              <button
                                type="button"
                                onClick={() => {
                                  setErroRedefinicaoSenha("");
                                  setPoloParaRedefinirSenha(polo);
                                }}
                                disabled={redefinindoSenhaId === polo.id}
                                className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-blue-300 dark:hover:bg-blue-950/30"
                              >
                                {redefinindoSenhaId === polo.id
                                  ? t("actions.generatingPassword")
                                  : t("actions.generateTemporaryPassword")}
                              </button>

                              {contextoGestaoPolos
                                ?.ehInstituicaoContratante &&
                                polo.statusComercial !==
                                "ENCERRADO" && (
                                  <>
                                    {polo.podeCriarGerenciarPolos ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          abrirModalPermissaoPolos(
                                            polo,
                                            false
                                          )
                                        }
                                        className="rounded-lg border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                                      >
                                        {t("actions.removePolePermission")}
                                      </button>
                                    ) : polo.ativo &&
                                      polo.statusComercial ===
                                      "ATIVO" ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          abrirModalPermissaoPolos(
                                            polo,
                                            true
                                          )
                                        }
                                        className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
                                      >
                                        {t("actions.allowOtherPoles")}
                                      </button>
                                    ) : null}
                                  </>
                                )}

                            </>
                          )}

                          {unidadeContratante && (
                            <span className="rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                              {t("badges.contractingUnit")}
                            </span>
                          )}

                          {!unidadeContratante &&
                            !polo.instituicaoGeradaId &&
                            !possuiResponsavel && (
                              <span className="text-xs text-amber-700 dark:text-amber-300">
                                {t("list.responsibleRequired")}
                              </span>
                            )}

                          {mensagemStatus && (
                            <span className="text-xs text-amber-700 dark:text-amber-300">
                              {mensagemStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold shadow-sm ${classesStatusPolo(
                          polo
                        )}`}
                      >
                        {nomeStatusPoloTraduzido(polo)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminPolosPage, ["admin"]);