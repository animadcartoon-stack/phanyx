"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import withAuth from "@/components/auth/withAuth";

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
        "Informe os 8 números do CEP."
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
      setMensagemCep("Buscando endereço...");
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
          "Não foi possível localizar o CEP."
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
          "Endereço localizado e preenchido automaticamente."
        );
        setMensagemCepTipo("sucesso");

        requestAnimationFrame(() => {
          numeroInputRef.current?.focus();
        });
      } else {
        setMensagemCep(
          "CEP localizado, mas sem um logradouro específico. Preencha o endereço manualmente."
        );
        setMensagemCepTipo("aviso");
      }
    } catch (error: unknown) {
      setMensagemCep(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar o CEP."
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
          data?.error || "Erro ao carregar polos"
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
          : "Erro ao carregar polos."
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
          data?.error || "Erro ao criar polo"
        );
      }

      limparFormulario();
      setBusca("");
      await carregarPolos();

      setFeedback(
        data?.aviso || "Polo criado com sucesso."
      );

      setFeedbackTipo(
        data?.aviso ? "aviso" : "sucesso"
      );
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Erro ao criar polo."
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
          data?.error || "Erro ao atualizar polo"
        );
      }

      setEditandoId(null);
      setBusca("");
      await carregarPolos();

      setFeedback("Polo atualizado com sucesso.");
      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar polo."
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
          "Erro ao criar a instituição e o acesso."
        );
      }

      if (
        !data?.instituicao?.id ||
        !data?.instituicao?.nome ||
        !data?.credenciaisTemporarias?.login ||
        !data?.credenciaisTemporarias?.senha
      ) {
        throw new Error(
          "A instituição foi criada, mas as credenciais retornadas são inválidas."
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
        "Instituição independente e acesso criados com sucesso."
      );
      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao criar o acesso institucional.";

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
      `Acesso institucional PHANYX`,
      ``,
      `Instituição: ${credenciaisAcesso.instituicaoNome}`,
      `Login: ${credenciaisAcesso.login}`,
      `Senha temporária: ${credenciaisAcesso.senha}`,
      ``,
      `Por segurança, troque esta senha no primeiro acesso.`,
      `A senha anterior não funciona mais para novos acessos.`,
      `Caso o PHANYX esteja aberto em outro dispositivo ou navegador, saia dessas sessões manualmente.`,
      ``,
      `Não compartilhe estas credenciais com outras pessoas.`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      setCredenciaisCopiadas(true);
    } catch {
      setFeedback(
        "Não foi possível copiar automaticamente. Selecione e copie as credenciais manualmente."
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
          "Erro ao gerar uma nova senha temporária."
        );
      }

      if (
        !data?.instituicao?.id ||
        !data?.instituicao?.nome ||
        !data?.credenciaisTemporarias?.login ||
        !data?.credenciaisTemporarias?.senha
      ) {
        throw new Error(
          "A senha foi redefinida, mas as novas credenciais não foram retornadas corretamente."
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
        titulo: "Nova senha temporária criada",
        orientacao:
          "A senha anterior deixou de funcionar para novos acessos. Guarde ou envie estas credenciais ao administrador da unidade e oriente-o a sair do PHANYX em todos os dispositivos onde já estiver conectado.",
      });

      setCredenciaisCopiadas(false);

      setFeedback(
        "Nova senha temporária criada com sucesso."
      );
      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      setErroRedefinicaoSenha(
        error instanceof Error
          ? error.message
          : "Erro ao gerar uma nova senha temporária."
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
        "Informe um motivo com pelo menos 5 caracteres."
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
          "Não foi possível alterar o status do polo."
        );
      }

      setPoloParaAlterarStatus(null);
      setAcaoStatusPolo(null);
      setMotivoStatusPolo("");
      setBusca("");

      await carregarPolos();

      setFeedback(
        dados?.mensagem ||
        "Status do polo alterado com sucesso."
      );
      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      setErroStatusPolo(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o status do polo."
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
        "Informe um motivo com pelo menos 5 caracteres."
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
          "Não foi possível alterar esta autorização."
        );
      }

      setPoloParaAlterarPermissao(null);
      setHabilitarGestaoOutrosPolos(false);
      setMotivoPermissaoPolos("");
      setErroPermissaoPolos("");

      await carregarPolos();

      setFeedback(
        dados?.mensagem ||
        "Autorização atualizada com sucesso."
      );

      setFeedbackTipo("sucesso");
    } catch (error: unknown) {
      setErroPermissaoPolos(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar esta autorização."
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
                ? "Permitir gestão de outros polos"
                : "Retirar permissão de gestão"}
            </h2>

            <p className="mt-3 text-sm leading-6">
              Unidade:{" "}
              <strong>
                {poloParaAlterarPermissao.nome}
              </strong>
            </p>

            <div className="phanyx-polos-alerta-provisionamento mt-4 rounded-xl border p-4">
              {habilitarGestaoOutrosPolos ? (
                <>
                  <p className="text-sm font-bold">
                    Esta unidade poderá:
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    Cadastrar polos, criar novos
                    IDs institucionais e gerenciar
                    as unidades cadastradas por
                    ela.
                  </p>

                  <p className="mt-3 text-sm leading-6">
                    Os limites, alunos ativos e
                    unidades excedentes continuarão
                    sendo contabilizados na
                    assinatura da instituição
                    contratante.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold">
                    A unidade perderá a permissão
                    para criar e gerenciar outros
                    polos.
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    Os polos e IDs já criados não
                    serão apagados. A instituição
                    contratante continuará com
                    autoridade sobre toda a rede.
                  </p>
                </>
              )}
            </div>

            <div className="mt-5">
              <label
                htmlFor="motivo-permissao-polos"
                className="mb-2 block text-sm font-semibold"
              >
                Motivo da alteração
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
                    ? "Ex.: Unidade regional autorizada a expandir a rede."
                    : "Ex.: Autorização retirada por decisão da instituição contratante."
                }
                className={`${inputClass} min-h-[100px] resize-y`}
                autoFocus
              />

              <p className="mt-1 text-xs">
                Informe pelo menos 5 caracteres.
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
                Voltar
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
                  ? "Salvando..."
                  : habilitarGestaoOutrosPolos
                    ? "Confirmar autorização"
                    : "Confirmar retirada"}
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
                ? "Inativar polo"
                : acaoStatusPolo === "REATIVAR"
                  ? "Reativar polo"
                  : "Encerrar polo"}
            </h2>

            <p className="mt-3 text-sm leading-6">
              Você está alterando o polo{" "}
              <strong>{poloParaAlterarStatus.nome}</strong>.
            </p>

            <div className="phanyx-polos-alerta-provisionamento mt-4 rounded-xl border p-4">
              {acaoStatusPolo === "SUSPENDER" && (
                <p className="text-sm leading-6">
                  O polo ficará temporariamente inativo. A
                  instituição independente e os novos acessos
                  serão bloqueados, mas o polo poderá ser
                  reativado posteriormente.
                </p>
              )}

              {acaoStatusPolo === "REATIVAR" && (
                <p className="text-sm leading-6">
                  O polo voltará a ficar ativo e o acesso da
                  instituição independente será liberado
                  novamente.
                </p>
              )}

              {acaoStatusPolo === "ENCERRAR" && (
                <p className="text-sm leading-6">
                  O encerramento é definitivo nesta tela. O
                  acesso será bloqueado e os dados permanecerão
                  guardados apenas para histórico e auditoria.
                </p>
              )}
            </div>

            {acaoStatusPolo !== "REATIVAR" && (
              <div className="mt-5">
                <label
                  htmlFor="motivo-status-polo"
                  className="mb-2 block text-sm font-semibold"
                >
                  Motivo
                </label>

                <textarea
                  id="motivo-status-polo"
                  value={motivoStatusPolo}
                  onChange={(e) =>
                    setMotivoStatusPolo(e.target.value)
                  }
                  placeholder={
                    acaoStatusPolo === "ENCERRAR"
                      ? "Ex.: Polo criado somente para teste de suporte."
                      : "Ex.: Unidade temporariamente sem funcionamento."
                  }
                  className={`${inputClass} min-h-[100px] resize-y`}
                  autoFocus
                />

                <p className="mt-1 text-xs">
                  Informe pelo menos 5 caracteres.
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
                Voltar
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
                  ? "Processando..."
                  : acaoStatusPolo === "SUSPENDER"
                    ? "Confirmar inativação"
                    : acaoStatusPolo === "REATIVAR"
                      ? "Confirmar reativação"
                      : "Confirmar encerramento"}
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
                  Não foi possível criar o acesso
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
                    O que fazer?
                  </p>

                  <p className="phanyx-polos-modal-erro-ajuda-texto mt-2 text-sm leading-6">
                    O e-mail do responsável já está vinculado a outro
                    usuário do PHANYX. Edite o polo e informe um e-mail
                    ainda não cadastrado para o primeiro administrador
                    desta unidade.
                  </p>

                  {poloParaProvisionar?.responsavelEmail && (
                    <div className="phanyx-polos-modal-erro-email mt-3 rounded-lg border px-3 py-2">
                      <p className="text-xs font-semibold uppercase">
                        E-mail informado
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
                Voltar
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
                Editar responsável
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
              Criar instituição independente
            </h2>

            <p className="mt-3 text-sm">
              O polo{" "}
              <strong>{poloParaProvisionar.nome}</strong>{" "}
              receberá um novo ID institucional, usuários próprios e
              dados independentes.
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
                    Atenção
                  </p>

                  <p className="phanyx-polos-alerta-texto mt-1 text-sm leading-6">
                    O plano e a cobrança continuarão vinculados à instituição
                    contratante. O responsável receberá login e senha temporária
                    para administrar esta unidade.
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
                      Permitir que esta unidade crie e
                      gerencie outros polos
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                      Quando habilitado, os
                      administradores desta unidade
                      poderão cadastrar polos e criar
                      novos IDs institucionais dentro da
                      mesma rede. Os limites e a cobrança
                      continuarão centralizados na
                      instituição contratante.
                    </p>
                  </div>
                </label>
              )}

            {contextoGestaoPolos
              ?.permissaoDelegada &&
              !contextoGestaoPolos
                .ehInstituicaoContratante && (
                <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Esta unidade possui autorização para
                  criar polos, mas não pode transferir
                  essa autorização para as novas
                  unidades. Somente a instituição
                  contratante pode conceder essa
                  permissão.
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
                Cancelar
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
                  ? "Criando instituição..."
                  : "Criar instituição e acesso"}
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
              Gerar nova senha temporária
            </h2>

            <p className="mt-3 text-sm leading-6">
              Será criada uma nova senha para o administrador da
              unidade{" "}
              <strong>{poloParaRedefinirSenha.nome}</strong>.
            </p>

            <div className="phanyx-polos-alerta-provisionamento mt-4 rounded-xl border p-4 shadow-sm">
              <p className="phanyx-polos-alerta-titulo text-sm font-bold">
                Atenção
              </p>

              <p className="phanyx-polos-alerta-texto mt-1 text-sm leading-6">
                A senha atual deixará de funcionar para novos acessos.
                O login continuará sendo o mesmo, e o administrador
                deverá trocar a nova senha temporária no próximo acesso.
              </p>

              <p className="phanyx-polos-alerta-texto mt-3 text-sm leading-6">
                <strong>Importante:</strong> caso o usuário já esteja com
                o PHANYX aberto em outro computador, celular ou navegador,
                essa sessão poderá continuar ativa até ser encerrada ou
                expirar. Oriente o usuário a sair do sistema em todos os
                dispositivos.
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
                Cancelar
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
                  ? "Gerando nova senha..."
                  : "Confirmar nova senha"}
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
                "Acesso institucional criado"}
            </h2>

            <p className="mt-2 text-sm">
              {credenciaisAcesso.orientacao ||
                "Guarde ou envie estas credenciais ao responsável da unidade. A senha temporária será exibida somente nesta tela."}
            </p>

            <div className="mt-5 space-y-3">
              <div className="phanyx-polos-input rounded-xl border p-3">
                <p className="text-xs font-semibold uppercase">
                  Instituição
                </p>

                <p className="mt-1 font-bold">
                  {credenciaisAcesso.instituicaoNome}
                </p>
              </div>

              <div className="phanyx-polos-input rounded-xl border p-3">
                <p className="text-xs font-semibold uppercase">
                  Login
                </p>

                <p className="mt-1 break-all font-mono font-bold">
                  {credenciaisAcesso.login}
                </p>
              </div>

              <div className="phanyx-polos-input rounded-xl border p-3">
                <p className="text-xs font-semibold uppercase">
                  Senha temporária
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
                      Gestão de outros polos
                    </p>

                    <p className="mt-1 font-bold">
                      {credenciaisAcesso
                        .podeCriarGerenciarPolos
                        ? "Habilitada pela instituição contratante"
                        : "Não habilitada"}
                    </p>
                  </div>
                )}

            </div>

            {credenciaisAcesso.precisaTrocarSenha && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                O responsável deverá trocar esta senha no primeiro
                acesso.
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={copiarCredenciais}
                className="rounded-xl border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
              >
                {credenciaisCopiadas
                  ? "Credenciais copiadas"
                  : "Copiar credenciais"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCredenciaisAcesso(null);
                  setCredenciaisCopiadas(false);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Fechar e apagar da tela
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
          🏢 Polos
        </h1>

        <p className="phanyx-polos-subtitulo mt-1">
          Cadastre as sedes, campi, polos, filiais ou unidades da instituição.
        </p>
      </div>

      <div className="phanyx-polos-aviso rounded-2xl border p-4 text-sm font-semibold">
        Cada endereço ou unidade operacional real deve ser cadastrado separadamente.
        Um único polo não deve representar várias unidades físicas da instituição.
      </div>

      <form
        onSubmit={criarPolo}
        className="phanyx-polos-card space-y-6 rounded-2xl border p-6 shadow-sm"
      >
        <div>
          <h2 className="font-semibold !text-slate-950 dark:!text-slate-100">
            Novo polo
          </h2>

          <p className="mt-1 text-sm !text-slate-700 dark:!text-slate-300">
            O polo será cadastrado como ativo. Ao criar o acesso
            institucional, o sistema verificará se a unidade está
            incluída no contrato ou se haverá cobrança adicional.
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
            {TIPOS_UNIDADE.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nome da unidade"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder="Código interno"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="CNPJ da unidade, quando houver"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Endereço da unidade
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={9}
                placeholder="CEP"
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
                  Buscando endereço...
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
              placeholder="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className={inputClass}
              required
            />

            <input
              ref={numeroInputRef}
              type="text"
              placeholder="Número"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className={inputClass}
            />

            <input
              type="text"
              placeholder="Complemento"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className={inputClass}
            />

            <input
              type="text"
              placeholder="Bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className={inputClass}
            />

            <input
              type="text"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className={inputClass}
              required
            />

            <input
              type="text"
              placeholder="Estado — ex.: SC"
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
              Responsável pela unidade
            </h3>

            <p className="mt-1 text-sm !text-slate-700 dark:!text-slate-300">
              Após cadastrar o polo, será possível criar o acesso
              institucional do responsável.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Nome do responsável"
              value={responsavelNome}
              onChange={(e) =>
                setResponsavelNome(e.target.value)
              }
              className={inputClass}
            />

            <input
              type="email"
              placeholder="E-mail do responsável"
              value={responsavelEmail}
              onChange={(e) =>
                setResponsavelEmail(e.target.value)
              }
              className={inputClass}
            />

            <input
              type="text"
              placeholder="Telefone do responsável"
              value={responsavelTelefone}
              onChange={(e) =>
                setResponsavelTelefone(e.target.value)
              }
              className={inputClass}
            />

            <input
              type="text"
              placeholder="Cargo do responsável"
              value={responsavelCargo}
              onChange={(e) =>
                setResponsavelCargo(e.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>

        <textarea
          placeholder="Descrição ou observações"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={`${inputClass} min-h-[100px] resize-y`}
        />

        <button
          type="submit"
          disabled={criando}
          className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {criando ? "Criando..." : "Criar polo"}
        </button>
      </form>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold !text-slate-950 dark:!text-slate-100">
            Lista de polos
          </h2>

          <input
            type="search"
            name="filtro-interno-polos"
            autoComplete="off"
            spellCheck={false}
            aria-label="Buscar polos"
            placeholder="Buscar por nome, cidade, responsável..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`${inputClass} md:w-[420px]`}
          />
        </div>

        {carregando ? (
          <div className="phanyx-polos-card rounded-2xl border p-4 text-sm">
            Carregando polos...
          </div>
        ) : polosFiltrados.length === 0 ? (
          <div className="phanyx-polos-card rounded-2xl border p-4 text-sm">
            Nenhum polo encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {polosFiltrados.map((polo) => {
              const mensagemStatus =
                mensagemStatusPolo(polo);

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
                          {TIPOS_UNIDADE.map((tipo) => (
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
                          placeholder="Nome da unidade"
                        />

                        <input
                          value={editCodigo}
                          onChange={(e) =>
                            setEditCodigo(e.target.value)
                          }
                          className={inputClass}
                          placeholder="Código interno"
                        />

                        <input
                          value={editCnpj}
                          onChange={(e) =>
                            setEditCnpj(e.target.value)
                          }
                          className={inputClass}
                          placeholder="CNPJ"
                        />

                        <input
                          value={editCep}
                          onChange={(e) =>
                            setEditCep(e.target.value)
                          }
                          className={inputClass}
                          placeholder="CEP"
                        />

                        <input
                          value={editEndereco}
                          onChange={(e) =>
                            setEditEndereco(e.target.value)
                          }
                          className={inputClass}
                          placeholder="Endereço"
                        />

                        <input
                          value={editNumero}
                          onChange={(e) =>
                            setEditNumero(e.target.value)
                          }
                          className={inputClass}
                          placeholder="Número"
                        />

                        <input
                          value={editComplemento}
                          onChange={(e) =>
                            setEditComplemento(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="Complemento"
                        />

                        <input
                          value={editBairro}
                          onChange={(e) =>
                            setEditBairro(e.target.value)
                          }
                          className={inputClass}
                          placeholder="Bairro"
                        />

                        <input
                          value={editCidade}
                          onChange={(e) =>
                            setEditCidade(e.target.value)
                          }
                          className={inputClass}
                          placeholder="Cidade"
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
                          placeholder="Estado"
                        />

                        <input
                          value={editResponsavelNome}
                          onChange={(e) =>
                            setEditResponsavelNome(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="Nome do responsável"
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
                          placeholder="E-mail do responsável"
                        />

                        <input
                          value={editResponsavelTelefone}
                          onChange={(e) =>
                            setEditResponsavelTelefone(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="Telefone do responsável"
                        />

                        <input
                          value={editResponsavelCargo}
                          onChange={(e) =>
                            setEditResponsavelCargo(
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="Cargo do responsável"
                        />

                        <textarea
                          value={editDescricao}
                          onChange={(e) =>
                            setEditDescricao(e.target.value)
                          }
                          className={`${inputClass} min-h-[90px] resize-y md:col-span-2`}
                          placeholder="Descrição"
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
                            ? "Salvando..."
                            : "Salvar"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditandoId(null)
                          }
                          disabled={salvandoEdicao}
                          className="rounded-xl bg-slate-500 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancelar
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
                          Tipo:{" "}
                          {nomeTipoUnidade(
                            polo.tipoUnidade
                          )}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          Código: {polo.codigo || "-"}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          CNPJ: {polo.cnpj || "-"}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          Endereço:{" "}
                          {formatarEndereco(polo) || "-"}
                        </p>

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          Responsável:{" "}
                          {polo.responsavelNome || "-"}
                        </p>

                        {polo.responsavelEmail && (
                          <p className="text-sm !text-slate-700 dark:!text-slate-300">
                            E-mail:{" "}
                            {polo.responsavelEmail}
                          </p>
                        )}

                        {polo.responsavelTelefone && (
                          <p className="text-sm !text-slate-700 dark:!text-slate-300">
                            Telefone:{" "}
                            {polo.responsavelTelefone}
                          </p>
                        )}

                        <p className="text-sm !text-slate-700 dark:!text-slate-300">
                          Descrição:{" "}
                          {polo.descricao || "-"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(polo)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Editar dados
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
                                      Inativar polo
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
                                    Reativar polo
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
                                  Encerrar polo
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
                                ? "Criando acesso..."
                                : "Criar acesso institucional"}
                            </button>
                          )}

                          {polo.instituicaoGeradaId && (
                            <>
                              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                                Instituição independente criada
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
                                      ? "Pode criar outros polos"
                                      : "Não pode criar outros polos"}
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
                                  ? "Gerando nova senha..."
                                  : "Gerar nova senha temporária"}
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
                                        Retirar permissão de criar polos
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
                                        Permitir criar outros polos
                                      </button>
                                    ) : null}
                                  </>
                                )}

                            </>
                          )}

                          {unidadeContratante && (
                            <span className="rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                              Unidade contratante
                            </span>
                          )}

                          {!unidadeContratante &&
                            !polo.instituicaoGeradaId &&
                            !possuiResponsavel && (
                              <span className="text-xs text-amber-700 dark:text-amber-300">
                                Preencha o nome e o e-mail do responsável para criar o acesso.
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
                        {nomeStatusPolo(polo)}
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