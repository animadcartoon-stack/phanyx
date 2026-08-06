"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import Link from "next/link";
import BuscaBanco from "@/components/rh/BuscaBanco";

interface Departamento {
  id: number;
  nome: string;
}

interface Polo {
  id: number;
  nome: string;
  codigo?: string | null;
  tipoUnidade?: string | null;
  ativo?: boolean;
  statusComercial?: string | null;
}

type TipoRemuneracaoFuncionario =
  | ""
  | "MENSAL"
  | "HORA_AULA"
  | "HORA_TRABALHADA"
  | "POR_AULA"
  | "POR_TURMA"
  | "POR_DISCIPLINA"
  | "MISTO"
  | "SEM_REMUNERACAO";

interface Funcionario {
  id: number;
  nome: string;
  cpf?: string | null;
  rg?: string | null;
  telefone?: string | null;
  cargo?: string | null;
  setor?: string | null;
  codigoFuncionario?: string | null;
  fotoPerfil?: string | null;
  statusFuncionario?: string;
  motivoStatus?: string;
  dataAdmissao?: string | null;
  dataDesligamento?: string | null;
  salario?: string | number | null;
  salarioBase?: string | number | null;
  tipoRemuneracao?: TipoRemuneracaoFuncionario | null;

  valorHoraAula?: string | number | null;
  valorHoraTrabalhada?: string | number | null;
  valorPorAula?: string | number | null;
  valorPorTurma?: string | number | null;
  valorPorDisciplina?: string | number | null;

  duracaoHoraAulaMinutos?: number | null;
  cargaHorariaSemanal?: string | number | null;

  observacoesRemuneracao?: string | null;

  tipoContrato?: string | null;
  jornadaTrabalho?: string | null;
  cargaHorariaMensal?: string | number | null;
  codigoPonto?: string | null;
  pisPasep?: string | null;
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  pix?: string | null;

  user?: {
    id?: number;
    email: string;
    role: string;
    ativo?: boolean;
  } | null;

  poloId?: number | null;

  polo?: {
    id: number;
    nome: string;
    codigo?: string | null;
    tipoUnidade?: string | null;
    ativo?: boolean;
  } | null;

  departamento?: {
    id: number;
    nome: string;
  } | null;
}

function formatarCpf(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function dataParaInput(valor?: string | Date | null) {
  if (!valor) return "";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "";

  return data.toISOString().slice(0, 10);
}

function traduzirRole(role?: string) {
  switch (String(role || "").toUpperCase()) {
    case "ADMIN":
      return "Administrador";
    case "SECRETARIA":
      return "Secretaria";
    case "COORDENADOR":
      return "Coordenação";
    case "FINANCEIRO":
      return "Financeiro";
    case "SUPORTE":
      return "Suporte";
    default:
      return role || "-";
  }
}

function AdminFuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [polos, setPolos] = useState<Polo[]>([]);
  const [busca, setBusca] = useState("");
  const [permissoesUsuario, setPermissoesUsuario] = useState<string[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const [
    criarAcessoSistema,
    setCriarAcessoSistema,
  ] = useState(true);

  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [codigoFuncionario, setCodigoFuncionario] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [enviandoFotoPerfil, setEnviandoFotoPerfil] = useState(false);
  const [statusFuncionario, setStatusFuncionario] = useState("ATIVO");
  const [motivoStatus, setMotivoStatus] = useState("");

  const [dataAdmissao, setDataAdmissao] = useState("");
  const [salarioBase, setSalarioBase] = useState("");

  const [
    tipoRemuneracao,
    setTipoRemuneracao,
  ] = useState<TipoRemuneracaoFuncionario>("");

  const [valorHoraAula, setValorHoraAula] = useState("");
  const [
    valorHoraTrabalhada,
    setValorHoraTrabalhada,
  ] = useState("");

  const [valorPorAula, setValorPorAula] = useState("");
  const [valorPorTurma, setValorPorTurma] = useState("");
  const [
    valorPorDisciplina,
    setValorPorDisciplina,
  ] = useState("");

  const [
    duracaoHoraAulaMinutos,
    setDuracaoHoraAulaMinutos,
  ] = useState("50");

  const [
    cargaHorariaSemanal,
    setCargaHorariaSemanal,
  ] = useState("");

  const [
    observacoesRemuneracao,
    setObservacoesRemuneracao,
  ] = useState("");

  const [tipoContrato, setTipoContrato] = useState("");
  const [jornadaTrabalho, setJornadaTrabalho] = useState("");
  const [cargaHorariaMensal, setCargaHorariaMensal] = useState("");
  const [codigoPonto, setCodigoPonto] = useState("");
  const [pisPasep, setPisPasep] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [pix, setPix] = useState("");

  const [documentosFuncionario, setDocumentosFuncionario] = useState<
    { tipo: string; titulo: string; arquivo: File | null }[]
  >([
    { tipo: "RG", titulo: "RG", arquivo: null },
    { tipo: "CPF", titulo: "CPF", arquivo: null },
    { tipo: "CNH", titulo: "CNH", arquivo: null },
    { tipo: "COMPROVANTE_RESIDENCIA", titulo: "Comprovante de residência", arquivo: null },
    { tipo: "CURRICULO", titulo: "Currículo", arquivo: null },
    { tipo: "PORTFOLIO", titulo: "Portfólio", arquivo: null },
    { tipo: "CERTIFICADOS", titulo: "Certificados", arquivo: null },
  ]);

  const [linksPortfolio, setLinksPortfolio] = useState([
    { tipo: "LinkedIn", url: "" },
  ]);

  const [departamentoId, setDepartamentoId] = useState("");
  const [poloId, setPoloId] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [confirmModalAberto, setConfirmModalAberto] = useState(false);

  const [confirmTitulo, setConfirmTitulo] = useState("");

  const [confirmMensagem, setConfirmMensagem] = useState("");

  const [confirmAcao, setConfirmAcao] = useState<(() => void) | null>(null);

  async function carregarFuncionarios() {
    const res = await fetch("/api/funcionario", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    setFuncionarios(Array.isArray(data) ? data : []);
  }

  async function carregarDepartamentos() {
    const res = await fetch("/api/departamento", {
      credentials: "include",
    });
    const data = await res.json();
    setDepartamentos(Array.isArray(data) ? data : []);
  }

  async function carregarPolos() {
    try {
      const res = await fetch("/api/admin/polos", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error(
          "Erro ao carregar polos:",
          data?.error || res.statusText
        );

        setPolos([]);
        return;
      }

      /*
       * A API atual retorna:
       * {
       *   polos: [...],
       *   gestao: {...}
       * }
       */
      const polosRecebidos = Array.isArray(data)
        ? data
        : Array.isArray(data?.polos)
          ? data.polos
          : [];

      const polosValidos: Polo[] = polosRecebidos
        .map((polo: any) => ({
          id: Number(polo?.id),
          nome: String(polo?.nome || "").trim(),
          codigo: polo?.codigo
            ? String(polo.codigo)
            : null,
          tipoUnidade: polo?.tipoUnidade
            ? String(polo.tipoUnidade)
            : null,
          ativo: polo?.ativo === true,
          statusComercial: polo?.statusComercial
            ? String(polo.statusComercial)
            : null,
        }))
        .filter(
          (polo: Polo) =>
            Number.isInteger(polo.id) &&
            polo.id > 0 &&
            polo.nome.length > 0
        );

      setPolos(polosValidos);
    } catch (error) {
      console.error(
        "Erro ao carregar polos:",
        error
      );

      setPolos([]);
    }
  }

  async function carregarPermissoesUsuario() {
    try {
      const res = await fetch("/api/admin/permissoes/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setPermissoesUsuario([]);
        return;
      }

      const data = await res.json();

      setPermissoesUsuario(
        Array.isArray(data?.permissoes) ? data.permissoes : []
      );
    } catch {
      setPermissoesUsuario([]);
    }
  }

  function podeGerenciarPermissoesIndividuais() {
    return (
      permissoesUsuario.includes("*") ||
      permissoesUsuario.includes("funcionarios.permissoes.gerenciar")
    );
  }

  const FORMATOS_FOTO_FUNCIONARIO_ACEITOS = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  const TAMANHO_MAXIMO_FOTO_FUNCIONARIO_MB = 2;
  const TAMANHO_MAXIMO_FOTO_FUNCIONARIO_BYTES =
    TAMANHO_MAXIMO_FOTO_FUNCIONARIO_MB * 1024 * 1024;

  function validarFotoOficialFuncionario(arquivo: File) {
    if (!FORMATOS_FOTO_FUNCIONARIO_ACEITOS.includes(arquivo.type)) {
      throw new Error(
        "Formato inválido. Envie uma foto em JPG, JPEG, PNG ou WEBP."
      );
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO_FUNCIONARIO_BYTES) {
      throw new Error(
        `Foto muito grande. Envie uma foto com no máximo ${TAMANHO_MAXIMO_FOTO_FUNCIONARIO_MB} MB.`
      );
    }
  }

  async function enviarFotoOficialFuncionario(arquivo: File | null) {
    if (!arquivo) return;

    try {
      validarFotoOficialFuncionario(arquivo);
      setEnviandoFotoPerfil(true);

      const formData = new FormData();
      formData.append("file", arquivo);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao enviar foto.");
      }

      const url =
        data?.url ||
        data?.fileUrl ||
        data?.arquivoUrl ||
        data?.publicUrl;

      if (!url) {
        throw new Error("Upload realizado, mas a URL da foto não retornou.");
      }

      setFotoPerfil(url);
      setSucesso("Foto oficial do funcionário enviada com sucesso.");
    } catch (error: any) {
      setErro(
        error?.message ||
        "Não foi possível enviar a foto. Verifique o formato e o tamanho do arquivo."
      );
    } finally {
      setEnviandoFotoPerfil(false);
    }
  }

  function preencherFormularioParaEdicao(f: Funcionario) {
    setEditandoId(f.id);
    setNome(f.nome || "");
    setCriarAcessoSistema(Boolean(f.user));
    setEmail(f.user?.email || "");
    setRole(String(f.user?.role || "").toUpperCase());
    setCpf(f.cpf || "");
    setRg(f.rg || "");
    setTelefone(f.telefone || "");
    setCargo(f.cargo || "");
    setCodigoFuncionario(f.codigoFuncionario || "");
    setFotoPerfil(f.fotoPerfil || "");
    setDepartamentoId(f.departamento?.id ? String(f.departamento.id) : "");
    setPoloId(
      f.polo?.id
        ? String(f.polo.id)
        : ""
    );
    setDataAdmissao(dataParaInput(f.dataAdmissao));
    setSalarioBase(f.salarioBase ? String(f.salarioBase).replace(".", ",") : "");
    setTipoRemuneracao(
      f.tipoRemuneracao ||
      (f.salarioBase ? "MENSAL" : "SEM_REMUNERACAO")
    );

    setValorHoraAula(
      f.valorHoraAula !== null &&
        f.valorHoraAula !== undefined
        ? String(f.valorHoraAula).replace(".", ",")
        : ""
    );

    setValorHoraTrabalhada(
      f.valorHoraTrabalhada !== null &&
        f.valorHoraTrabalhada !== undefined
        ? String(f.valorHoraTrabalhada).replace(".", ",")
        : ""
    );

    setValorPorAula(
      f.valorPorAula !== null &&
        f.valorPorAula !== undefined
        ? String(f.valorPorAula).replace(".", ",")
        : ""
    );

    setValorPorTurma(
      f.valorPorTurma !== null &&
        f.valorPorTurma !== undefined
        ? String(f.valorPorTurma).replace(".", ",")
        : ""
    );

    setValorPorDisciplina(
      f.valorPorDisciplina !== null &&
        f.valorPorDisciplina !== undefined
        ? String(f.valorPorDisciplina).replace(".", ",")
        : ""
    );

    setDuracaoHoraAulaMinutos(
      f.duracaoHoraAulaMinutos !== null &&
        f.duracaoHoraAulaMinutos !== undefined
        ? String(f.duracaoHoraAulaMinutos)
        : "50"
    );

    setCargaHorariaSemanal(
      f.cargaHorariaSemanal !== null &&
        f.cargaHorariaSemanal !== undefined
        ? String(f.cargaHorariaSemanal)
        : ""
    );

    setObservacoesRemuneracao(
      f.observacoesRemuneracao || ""
    );
    setTipoContrato(f.tipoContrato || "");
    setJornadaTrabalho(f.jornadaTrabalho || "");
    setCargaHorariaMensal(
      f.cargaHorariaMensal ? String(f.cargaHorariaMensal) : ""
    );
    setCodigoPonto(f.codigoPonto || "");
    setPisPasep(f.pisPasep || "");
    setBanco(f.banco || "");
    setAgencia(f.agencia || "");
    setConta(f.conta || "");
    setPix(f.pix || "");
    setStatusFuncionario(f.statusFuncionario || "ATIVO");
    setMotivoStatus(f.motivoStatus || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setCriarAcessoSistema(true);
    setEmail("");
    setRole("");
    setCpf("");
    setRg("");
    setTelefone("");
    setCargo("");
    setCodigoFuncionario("");
    setFotoPerfil("");
    setDepartamentoId("");
    setPoloId("");
    setDataAdmissao("");
    setSalarioBase("");
    setTipoRemuneracao("");
    setValorHoraAula("");
    setValorHoraTrabalhada("");
    setValorPorAula("");
    setValorPorTurma("");
    setValorPorDisciplina("");
    setDuracaoHoraAulaMinutos("50");
    setCargaHorariaSemanal("");
    setObservacoesRemuneracao("");
    setTipoContrato("");
    setJornadaTrabalho("");
    setCargaHorariaMensal("");
    setCodigoPonto("");
    setPisPasep("");
    setBanco("");
    setAgencia("");
    setConta("");
    setPix("");
    setStatusFuncionario("ATIVO");
    setMotivoStatus("");
  }

  function validarRemuneracaoFuncionario() {
    if (!tipoRemuneracao) {
      return "Selecione a modalidade de remuneração do funcionário.";
    }

    if (
      tipoRemuneracao === "MENSAL" &&
      !salarioBase.trim()
    ) {
      return "Informe o salário mensal do funcionário.";
    }

    if (
      tipoRemuneracao === "HORA_AULA" &&
      !valorHoraAula.trim()
    ) {
      return "Informe o valor da hora-aula.";
    }

    if (
      tipoRemuneracao === "HORA_TRABALHADA" &&
      !valorHoraTrabalhada.trim()
    ) {
      return "Informe o valor da hora trabalhada.";
    }

    if (
      tipoRemuneracao === "POR_AULA" &&
      !valorPorAula.trim()
    ) {
      return "Informe o valor por aula.";
    }

    if (
      tipoRemuneracao === "POR_TURMA" &&
      !valorPorTurma.trim()
    ) {
      return "Informe o valor por turma.";
    }

    if (
      tipoRemuneracao === "POR_DISCIPLINA" &&
      !valorPorDisciplina.trim()
    ) {
      return "Informe o valor por disciplina.";
    }

    if (tipoRemuneracao === "MISTO") {
      const possuiAlgumValor =
        Boolean(salarioBase.trim()) ||
        Boolean(valorHoraAula.trim()) ||
        Boolean(valorHoraTrabalhada.trim()) ||
        Boolean(valorPorAula.trim()) ||
        Boolean(valorPorTurma.trim()) ||
        Boolean(valorPorDisciplina.trim());

      if (!possuiAlgumValor) {
        return "Na remuneração mista, informe pelo menos um valor.";
      }
    }

    return "";
  }

  async function salvarEdicaoFuncionario(e: React.FormEvent) {
    e.preventDefault();

    if (!editandoId) {
      return;
    }

    if (!nome.trim()) {
      setErro("Informe o nome do funcionário antes de continuar.");
      return;
    }

    if (!email.trim()) {
      setErro("Informe o email do funcionário antes de continuar.");
      return;
    }

    if (!role) {
      setErro("Selecione o perfil de acesso do funcionário antes de continuar.");
      return;
    }

    try {
      setCarregando(true);

      const res = await fetch(`/api/funcionario/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          email,
          role,
          cpf,
          rg,
          telefone,
          cargo,
          codigoFuncionario,
          fotoPerfil,
          departamentoId: departamentoId || null,
          statusFuncionario,
          motivoStatus,
          dataAdmissao,
          salarioBase,
          tipoContrato,
          jornadaTrabalho,
          cargaHorariaMensal,
          codigoPonto,
          pisPasep,
          banco,
          agencia,
          conta,
          pix,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao criar funcionário.");
        return;
      }

      setSucesso("Funcionário atualizado com sucesso.");
      limparFormulario();
      await carregarFuncionarios();
    } finally {
      setCarregando(false);
    }
  }

  async function alterarAcessoFuncionario(
    id: number,
    acao: "bloquear" | "desbloquear",
    nome: string
  ) {
    const mensagem =
      acao === "bloquear"
        ? `Deseja bloquear o acesso de "${nome}"?`
        : `Deseja desbloquear o acesso de "${nome}"?`;

    setConfirmTitulo(
      acao === "bloquear"
        ? "Bloquear acesso"
        : "Desbloquear acesso"
    );

    setConfirmMensagem(mensagem);

    setConfirmAcao(() => async () => {
      try {
        const res = await fetch(`/api/funcionario/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ acao }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErro(
            data.error || "Erro ao alterar acesso do funcionário."
          );
          return;
        }

        setSucesso(
          data.message || "Acesso alterado com sucesso."
        );

        await carregarFuncionarios();
      } catch {
        setErro(
          "Erro de comunicação ao alterar acesso do funcionário."
        );
      } finally {
        setConfirmModalAberto(false);
      }
    });

    setConfirmModalAberto(true);
  }

  async function criarFuncionario(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      setErro("Informe o nome do funcionário.");
      return;
    }

    if (!poloId) {
      setErro(
        "Selecione o polo de lotação do funcionário."
      );
      return;
    }

    if (
      criarAcessoSistema &&
      !email.trim()
    ) {
      setErro(
        "Informe o email para criar o acesso do funcionário."
      );
      return;
    }

    if (
      criarAcessoSistema &&
      !role
    ) {
      setErro(
        "Selecione o perfil de acesso do funcionário."
      );
      return;
    }

    const erroRemuneracao =
      validarRemuneracaoFuncionario();

    if (erroRemuneracao) {
      setErro(erroRemuneracao);
      return;
    }

    try {
      setCarregando(true);

      const res = await fetch("/api/funcionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          criarAcessoSistema,
          email: criarAcessoSistema
            ? email
            : "",
          role: criarAcessoSistema
            ? role
            : "",
          cpf,
          rg,
          telefone,
          cargo,
          codigoFuncionario,
          fotoPerfil,
          departamentoId:
            departamentoId || null,

          poloId: Number(poloId),

          statusFuncionario,
          motivoStatus,
          dataAdmissao,
          tipoRemuneracao,
          salarioBase,

          valorHoraAula,
          valorHoraTrabalhada,
          valorPorAula,
          valorPorTurma,
          valorPorDisciplina,

          duracaoHoraAulaMinutos,
          cargaHorariaSemanal,
          observacoesRemuneracao,

          tipoContrato,
          jornadaTrabalho,
          cargaHorariaMensal,
          codigoPonto,
          pisPasep,
          banco,
          agencia,
          conta,
          pix,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao atualizar funcionário.");
        return;
      }

      const funcionarioIdCriado = Number(data?.id);

      if (funcionarioIdCriado) {
        // DOCUMENTOS
        for (const doc of documentosFuncionario) {
          if (!doc.arquivo) continue;

          const formData = new FormData();

          formData.append("titulo", doc.titulo);
          formData.append("tipo", doc.tipo);
          formData.append("arquivo", doc.arquivo);

          await fetch(
            `/api/admin/funcionarios/${funcionarioIdCriado}/documentos`,
            {
              method: "POST",
              credentials: "include",
              body: formData,
            }
          );
        }

        // LINKS DE PORTFÓLIO
        for (const link of linksPortfolio) {
          if (!link.url.trim()) continue;

          await fetch(
            `/api/admin/funcionarios/${funcionarioIdCriado}/documentos`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tipo: link.tipo.toUpperCase(),
                titulo: link.tipo,
                url: link.url,
              }),
            }
          );
        }
      }

      setNome("");
      setCriarAcessoSistema(true);
      setEmail("");
      setRole("");
      setCpf("");
      setRg("");
      setTelefone("");
      setCargo("");
      setCodigoFuncionario("");
      setFotoPerfil("");
      setDepartamentoId("");
      setPoloId("");
      setDataAdmissao("");
      setSalarioBase("");
      setTipoRemuneracao("");
      setValorHoraAula("");
      setValorHoraTrabalhada("");
      setValorPorAula("");
      setValorPorTurma("");
      setValorPorDisciplina("");
      setDuracaoHoraAulaMinutos("50");
      setCargaHorariaSemanal("");
      setObservacoesRemuneracao("");
      setTipoContrato("");
      setJornadaTrabalho("");
      setCargaHorariaMensal("");
      setCodigoPonto("");
      setPisPasep("");
      setBanco("");
      setAgencia("");
      setConta("");
      setPix("");
      setStatusFuncionario("ATIVO");
      setMotivoStatus("");

      await carregarFuncionarios();

      if (data?.avisoEmail) {
        setErro(data.avisoEmail);
        return;
      }

      setSucesso(
        data?.acessoSistema
          ? "Funcionário criado com sucesso e email de acesso enviado."
          : "Funcionário cadastrado no RH com sucesso, sem acesso ao sistema."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFuncionarios();
    carregarDepartamentos();
    carregarPolos();
    carregarPermissoesUsuario();
  }, []);

  const funcionariosFiltrados = useMemo(() => {
    const termoTexto = busca.trim().toLowerCase();
    const termoNumerico = busca.replace(/\D/g, "");

    if (!termoTexto) return funcionarios;

    return funcionarios.filter((funcionario) => {
      const nome = String(funcionario.nome || "").toLowerCase().trim();
      const email = String(funcionario.user?.email || "")
        .toLowerCase()
        .trim();
      const role = String(funcionario.user?.role || "").toLowerCase().trim();
      const cpf = String(funcionario.cpf || "").toLowerCase().trim();
      const rg = String(funcionario.rg || "").toLowerCase().trim();
      const telefone = String(funcionario.telefone || "").toLowerCase().trim();
      const cargo = String(funcionario.cargo || "").toLowerCase().trim();
      const codigoFuncionario = String(funcionario.codigoFuncionario || "")
        .toLowerCase()
        .trim();
      const departamento = String(funcionario.departamento?.nome || "")
        .toLowerCase()
        .trim();

      const polo = String(
        funcionario.polo?.nome || ""
      )
        .toLowerCase()
        .trim();

      const cpfNumerico = cpf.replace(/\D/g, "");
      const rgNumerico = rg.replace(/\D/g, "");
      const telefoneNumerico = telefone.replace(/\D/g, "");
      const codigoNumerico = codigoFuncionario.replace(/\D/g, "");

      return (
        nome.includes(termoTexto) ||
        email.includes(termoTexto) ||
        role.includes(termoTexto) ||
        cpf.includes(termoTexto) ||
        rg.includes(termoTexto) ||
        telefone.includes(termoTexto) ||
        cargo.includes(termoTexto) ||
        codigoFuncionario.includes(termoTexto) ||
        departamento.includes(termoTexto) ||
        polo.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (cpfNumerico.includes(termoNumerico) ||
            rgNumerico.includes(termoNumerico) ||
            telefoneNumerico.includes(termoNumerico) ||
            codigoNumerico.includes(termoNumerico)))
      );
    });
  }, [funcionarios, busca]);

  return (
    <div className="phanyx-admin-funcionarios-page space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">🧑‍💼 Funcionários</h1>

      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo="Não foi possível concluir"
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      {sucesso && (
        <PhanyxToast
          tipo="sucesso"
          titulo="Tudo certo"
          mensagem={sucesso}
          onClose={() => setSucesso("")}
        />
      )}

      <form
        onSubmit={editandoId ? salvarEdicaoFuncionario : criarFuncionario}
        className="
  rounded-lg
  border
  border-slate-200
  bg-white
  p-6
  space-y-4
  dark:border-slate-700
  dark:bg-slate-900
  "
      >
        <h2 className="font-semibold">
          {editandoId ? "Editar funcionário" : "Novo funcionário"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!editandoId && (
            <div className="md:col-span-2">
              <div
                className="
        rounded-2xl
        border
        border-slate-300
        bg-slate-50
        p-4
        dark:border-slate-700
        dark:bg-slate-800/70
      "
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={criarAcessoSistema}
                    onChange={(e) => {
                      const ativo = e.target.checked;

                      setCriarAcessoSistema(ativo);

                      if (!ativo) {
                        setEmail("");
                        setRole("");
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-400"
                  />

                  <span>
                    <span className="block font-bold text-slate-900 dark:text-white">
                      Criar acesso ao sistema para este funcionário
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Quando ativado, o PHANYX criará login, senha temporária e
                      enviará as credenciais por email. Desative para cadastrar
                      somente o vínculo trabalhista no RH.
                    </span>
                  </span>
                </label>

                {!criarAcessoSistema && (
                  <div
                    className="
            mt-4
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-sm
            text-slate-700
            dark:border-slate-600
            dark:bg-slate-900
            dark:text-slate-200
          "
                  >
                    Este funcionário poderá participar da folha, ponto, férias,
                    benefícios, holerites, documentos e demais rotinas do RH, mas
                    não receberá login nem senha.
                  </div>
                )}
              </div>
            </div>
          )}
          <input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          {criarAcessoSistema && (
            <>
              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg p-2"
                required
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Perfil de acesso ao sistema
                </label>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="
w-full
rounded-lg
border
border-slate-300
bg-white
p-2
text-slate-900
dark:border-slate-700
dark:bg-slate-900
dark:text-white
"
                  required
                >
                  <option value="" className="bg-slate-900 text-white">
                    Selecione o perfil
                  </option>

                  <option value="ADMIN" className="bg-slate-900 text-white">
                    Administrador
                  </option>

                  <option value="SECRETARIA" className="bg-slate-900 text-white">
                    Funcionário
                  </option>

                </select>
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Departamento
            </label>

            <select
              value={departamentoId}
              onChange={(e) => setDepartamentoId(e.target.value)}
              className="
w-full
rounded-lg
border
border-slate-300
bg-white
p-2
text-slate-900
dark:border-slate-700
dark:bg-slate-900
dark:text-white
"
            >
              <option
                value=""
                className="bg-slate-900 text-white"
              >
                Selecione um departamento
              </option>

              {departamentos.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                  className="bg-slate-900 text-white"
                >
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          {/* POLO DE LOTAÇÃO */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Polo de lotação
              {!editandoId && (
                <span className="ml-1 text-red-600">
                  *
                </span>
              )}
            </label>

            <select
              value={poloId}
              onChange={(e) =>
                setPoloId(e.target.value)
              }
              disabled={Boolean(editandoId)}
              required={!editandoId}
              className="
      w-full
      rounded-lg
      border
      border-slate-300
      bg-white
      p-2
      text-slate-900
      disabled:cursor-not-allowed
      disabled:bg-slate-100
      disabled:text-slate-600
      dark:border-slate-700
      dark:bg-slate-900
      dark:text-white
      dark:disabled:bg-slate-800
      dark:disabled:text-slate-300
    "
            >
              <option value="">
                Selecione o polo de lotação
              </option>

              {polos.map((polo) => {
                const disponivel =
                  polo.ativo === true &&
                  polo.statusComercial === "ATIVO";

                return (
                  <option
                    key={polo.id}
                    value={polo.id}
                    disabled={
                      !disponivel &&
                      Number(poloId) !== polo.id
                    }
                  >
                    {polo.nome}
                    {polo.codigo
                      ? ` — ${polo.codigo}`
                      : ""}
                    {!disponivel
                      ? " — Inativo"
                      : ""}
                  </option>
                );
              })}
            </select>

            {editandoId ? (
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                A lotação não pode ser alterada por
                esta edição comum. Para definir ou
                transferir o polo, abra a ficha do
                funcionário.
              </p>
            ) : (
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                Selecione a unidade em que o
                funcionário será inicialmente lotado.
              </p>
            )}

            {editandoId && (
              <Link
                href={`/admin/funcionarios/${editandoId}`}
                className="inline-flex text-xs font-bold text-blue-700 hover:underline dark:text-blue-300"
              >
                Abrir ficha e gerenciar lotação
              </Link>
            )}
          </div>

          <input
            placeholder="CPF"
            value={cpf}
            onChange={(e) =>
              setCpf(formatarCpf(e.target.value))
            }
            className="w-full border rounded-lg p-2"
            inputMode="numeric"
          />

          <input
            placeholder="RG"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            className="w-full border rounded-lg p-2"
            inputMode="numeric"
          />

          <input
            placeholder="Cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <input
            placeholder="Código do funcionário (opcional)"
            value={codigoFuncionario}
            onChange={(e) => setCodigoFuncionario(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
          <div className="phanyx-foto-oficial-card md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                {fotoPerfil ? (
                  <img
                    src={fotoPerfil}
                    alt={nome || "Foto oficial do funcionário"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-400">
                    {nome?.charAt(0)?.toUpperCase() || "F"}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Foto oficial do funcionário
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Esta é a foto institucional usada em crachás, identificação, documentos
                  e registros internos.
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">
                  Formatos aceitos: JPG, JPEG, PNG ou WEBP. Tamanho máximo: 2 MB.
                  Recomendado: foto quadrada, com rosto centralizado.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                    {enviandoFotoPerfil ? "Enviando..." : "Enviar foto"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      disabled={enviandoFotoPerfil}
                      onChange={(e) =>
                        enviarFotoOficialFuncionario(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>

                  {fotoPerfil && (
                    <button
                      type="button"
                      onClick={() => setFotoPerfil("")}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              💼 Dados trabalhistas, previdenciários e bancários
            </h3>

            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Informe os dados necessários para folha, ponto, holerites, banco de horas,
              rescisões e relatórios contábeis.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Data de admissão
              </label>
              <input
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Modalidade de remuneração
              </label>

              <select
                value={tipoRemuneracao}
                onChange={(e) =>
                  setTipoRemuneracao(
                    e.target.value as TipoRemuneracaoFuncionario
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                required
              >
                <option value="">Selecione</option>
                <option value="MENSAL">Salário mensal</option>
                <option value="HORA_AULA">Hora-aula</option>
                <option value="HORA_TRABALHADA">
                  Hora trabalhada
                </option>
                <option value="POR_AULA">Valor por aula</option>
                <option value="POR_TURMA">Valor por turma</option>
                <option value="POR_DISCIPLINA">
                  Valor por disciplina
                </option>
                <option value="MISTO">Remuneração mista</option>
                <option value="SEM_REMUNERACAO">
                  Sem remuneração
                </option>
              </select>
            </div>

            {(tipoRemuneracao === "MENSAL" ||
              tipoRemuneracao === "MISTO") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Salário mensal
                  </label>

                  <input
                    placeholder="0,00"
                    value={salarioBase}
                    onChange={(e) =>
                      setSalarioBase(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    inputMode="decimal"
                  />
                </div>
              )}

            {(tipoRemuneracao === "HORA_AULA" ||
              tipoRemuneracao === "MISTO") && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Valor da hora-aula
                    </label>

                    <input
                      placeholder="0,00"
                      value={valorHoraAula}
                      onChange={(e) =>
                        setValorHoraAula(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      inputMode="decimal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Duração da hora-aula
                    </label>

                    <div className="relative">
                      <input
                        value={duracaoHoraAulaMinutos}
                        onChange={(e) =>
                          setDuracaoHoraAulaMinutos(
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 pr-20 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        inputMode="numeric"
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                        minutos
                      </span>
                    </div>
                  </div>
                </>
              )}

            {(tipoRemuneracao === "HORA_TRABALHADA" ||
              tipoRemuneracao === "MISTO") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Valor da hora trabalhada
                  </label>

                  <input
                    placeholder="0,00"
                    value={valorHoraTrabalhada}
                    onChange={(e) =>
                      setValorHoraTrabalhada(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    inputMode="decimal"
                  />
                </div>
              )}

            {(tipoRemuneracao === "POR_AULA" ||
              tipoRemuneracao === "MISTO") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Valor por aula
                  </label>

                  <input
                    placeholder="0,00"
                    value={valorPorAula}
                    onChange={(e) =>
                      setValorPorAula(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    inputMode="decimal"
                  />
                </div>
              )}

            {(tipoRemuneracao === "POR_TURMA" ||
              tipoRemuneracao === "MISTO") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Valor por turma
                  </label>

                  <input
                    placeholder="0,00"
                    value={valorPorTurma}
                    onChange={(e) =>
                      setValorPorTurma(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    inputMode="decimal"
                  />
                </div>
              )}

            {(tipoRemuneracao === "POR_DISCIPLINA" ||
              tipoRemuneracao === "MISTO") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Valor por disciplina
                  </label>

                  <input
                    placeholder="0,00"
                    value={valorPorDisciplina}
                    onChange={(e) =>
                      setValorPorDisciplina(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    inputMode="decimal"
                  />
                </div>
              )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Tipo de contrato
              </label>
              <select
                value={tipoContrato}
                onChange={(e) => setTipoContrato(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Selecione</option>
                <option value="CLT">CLT</option>
                <option value="ESTAGIO">Estágio</option>
                <option value="APRENDIZ">Aprendiz</option>
                <option value="TEMPORARIO">Temporário</option>
                <option value="PJ">PJ</option>
                <option value="AUTONOMO">Autônomo</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Jornada de trabalho
              </label>
              <input
                placeholder="Ex.: 44h semanais / 220h mensais"
                value={jornadaTrabalho}
                onChange={(e) => setJornadaTrabalho(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Carga horária semanal
              </label>

              <input
                placeholder="Ex.: 44"
                value={cargaHorariaSemanal}
                onChange={(e) =>
                  setCargaHorariaSemanal(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                inputMode="decimal"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Carga horária mensal
              </label>
              <input
                placeholder="Ex.: 220"
                value={cargaHorariaMensal}
                onChange={(e) =>
                  setCargaHorariaMensal(e.target.value.replace(/\D/g, ""))
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Código do ponto
              </label>
              <input
                placeholder="Identificador usado no relógio/app"
                value={codigoPonto}
                onChange={(e) => setCodigoPonto(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                PIS/PASEP/NIT
              </label>
              <input
                placeholder="PIS/PASEP/NIT"
                value={pisPasep}
                onChange={(e) => setPisPasep(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="banco-funcionario"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Banco da conta salarial
              </label>

              <BuscaBanco
                id="banco-funcionario"
                value={banco}
                onChange={(valor) => setBanco(valor)}
                placeholder="Digite o código ou nome do banco"
                ariaLabel="Buscar banco da conta salarial do funcionário"
              />

              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                Pesquise pelo código ou nome. Exemplos: 001, 260, Nubank, Inter ou Itaú.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Agência
              </label>
              <input
                placeholder="Agência"
                value={agencia}
                onChange={(e) => setAgencia(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Conta
              </label>
              <input
                placeholder="Conta"
                value={conta}
                onChange={(e) => setConta(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Pix
              </label>
              <input
                placeholder="Chave Pix"
                value={pix}
                onChange={(e) => setPix(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Observações da remuneração
              </label>

              <textarea
                value={observacoesRemuneracao}
                onChange={(e) =>
                  setObservacoesRemuneracao(e.target.value)
                }
                className="min-h-[100px] w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Acordos, adicionais, regras de pagamento ou outras observações."
              />
            </div>

          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>

          <select
            value={statusFuncionario}
            onChange={(e) => setStatusFuncionario(e.target.value)}
            className="
w-full
rounded-lg
border
border-slate-300
bg-white
p-2
text-slate-900
dark:border-slate-700
dark:bg-slate-900
dark:text-white
"
          >
            <option value="ATIVO" className="bg-slate-900 text-white">
              Ativo
            </option>

            <option value="DEMITIDO" className="bg-slate-900 text-white">
              Demitido
            </option>

            <option value="AFASTADO" className="bg-slate-900 text-white">
              Afastado
            </option>

            <option value="ADVERTENCIA" className="bg-slate-900 text-white">
              Advertência
            </option>

            <option value="FERIAS" className="bg-slate-900 text-white">
              Férias
            </option>

            <option value="READMITIDO" className="bg-slate-900 text-white">
              Readmitido
            </option>
          </select>
        </div>

        <input
          placeholder="Motivo (opcional)"
          value={motivoStatus}
          onChange={(e) => setMotivoStatus(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 phanyx-documentos-funcionario">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              📁 Documentos e Portfólio
            </h3>

            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Envie documentos pessoais, currículo, certificados, portfólio e links profissionais.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {documentosFuncionario.map((doc, index) => (
              <div
                key={doc.tipo}
                className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {doc.titulo}
                </label>

                <input
                  id={`arquivo-${doc.tipo}`}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.psd,.ai,.eps,.svg,.blend,.fbx,.obj,.glb,.gltf,.ma,.mb,.max,.zip,.rar"
                  className="hidden"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0] || null;

                    setDocumentosFuncionario((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, arquivo } : item
                      )
                    );
                  }}
                />

                <label
                  htmlFor={`arquivo-${doc.tipo}`}
                  className="phanyx-upload-funcionario"
                >
                  <span>📎</span>
                  <span>Selecionar arquivo</span>
                </label>

                {doc.arquivo && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    {doc.arquivo.name}
                  </p>
                )}

                {doc.tipo === "PORTFOLIO" && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-slate-100 p-3 dark:border-blue-900/60 dark:bg-slate-800">
                    <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                      Links do portfólio
                    </h4>

                    <div className="space-y-3">
                      {linksPortfolio.map((link, index) => (
                        <div
                          key={index}
                          className="grid gap-2 md:grid-cols-[180px_1fr_auto] md:items-center"
                        >
                          <select
                            value={link.tipo}
                            onChange={(e) =>
                              setLinksPortfolio((prev) =>
                                prev.map((item, i) =>
                                  i === index ? { ...item, tipo: e.target.value } : item
                                )
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Behance">Behance</option>
                            <option value="ArtStation">ArtStation</option>
                            <option value="Instagram">Instagram</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Vimeo">Vimeo</option>
                            <option value="GitHub">GitHub</option>
                            <option value="Site">Site pessoal</option>
                            <option value="Outro">Outro</option>
                          </select>

                          <input
                            type="url"
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) =>
                              setLinksPortfolio((prev) =>
                                prev.map((item, i) =>
                                  i === index ? { ...item, url: e.target.value } : item
                                )
                              )
                            }
                            className="min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setLinksPortfolio((prev) =>
                                prev.length === 1
                                  ? prev
                                  : prev.filter((_, i) => i !== index)
                              )
                            }
                            className="
shrink-0
rounded-lg
border
border-red-300
bg-white
px-3
py-2
text-sm
font-semibold
text-red-600
dark:border-red-800
dark:bg-slate-900
dark:text-red-300
"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setLinksPortfolio((prev) => [
                          ...prev,
                          { tipo: "LinkedIn", url: "" },
                        ])
                      }
                      className="mt-3 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
                    >
                      + Adicionar link
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={carregando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            {carregando
              ? editandoId
                ? "Salvando..."
                : "Criando..."
              : editandoId
                ? "Salvar alterações"
                : "Criar funcionário"}
          </button>

          {editandoId ? (
            <button
              type="button"
              onClick={limparFormulario}
              className="px-4 py-2 border rounded-lg"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">Lista de funcionários</h2>

          <input
            type="text"
            placeholder="Buscar por nome, email, CPF, telefone, cargo, código, departamento ou polo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full md:w-[500px] border rounded-lg p-2"
          />
        </div>

        {funcionariosFiltrados.length === 0 ? (
          <div className="bg-white border rounded-lg p-5 text-sm text-gray-600">
            Nenhum funcionário encontrado para essa busca.
          </div>
        ) : (
          funcionariosFiltrados.map((f) => (
            <div key={f.id} className="
border
border-slate-200
bg-white
rounded-lg
p-5
space-y-3
dark:border-slate-700
dark:bg-slate-900
">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-slate-100 flex-shrink-0">
                  {f.fotoPerfil ? (
                    <img
                      src={f.fotoPerfil}
                      alt={f.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-700">
                      {f.nome?.charAt(0)?.toUpperCase() || "F"}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-medium">{f.nome}</p>
                  {f.user ? (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Email de acesso: {f.user.email}
                      </p>

                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Perfil de acesso: {traduzirRole(f.user.role)}
                      </p>

                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Acesso:{" "}
                        {f.user.ativo === false
                          ? "Bloqueado"
                          : "Ativo"}
                      </p>
                    </>
                  ) : (
                    <div
                      className="
      mt-2
      inline-flex
      rounded-full
      border
      border-slate-300
      bg-slate-100
      px-3
      py-1
      text-xs
      font-bold
      text-slate-700
      dark:border-slate-600
      dark:bg-slate-800
      dark:text-slate-200
    "
                    >
                      Sem acesso ao sistema
                    </div>
                  )}

                  <p className="text-sm text-gray-600">
                    Status: {f.statusFuncionario || "ATIVO"}
                  </p>

                  {f.motivoStatus && (
                    <p className="text-sm text-gray-600">
                      Motivo: {f.motivoStatus}
                    </p>
                  )}

                  <p className="text-sm text-gray-600">
                    CPF: {f.cpf || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    RG: {f.rg || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Telefone: {f.telefone || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Cargo: {f.cargo || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Código: {f.codigoFuncionario || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Departamento: {f.departamento?.nome || "-"}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    Polo de lotação:{" "}
                    <span className="font-semibold">
                      {f.polo?.nome || "Não definido"}
                    </span>
                  </p>

                  {!f.polo && (
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      Este funcionário antigo ainda precisa
                      ter sua lotação definida.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/funcionarios/${f.id}`}
                  className="phanyx-funcionario-editar-btn inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-bold transition"
                >
                  Editar
                </Link>

                {f.user &&
                  podeGerenciarPermissoesIndividuais() && (
                    <Link
                      href={`/admin/funcionarios/${f.id}/permissoes`}
                      className="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
                    >
                      🔐 Permissões individuais
                    </Link>
                  )}

                {f.user && (
                  <>
                    <button
                      type="button"
                      onClick={() => alterarAcessoFuncionario(f.id, "bloquear", f.nome)}
                      className="rounded-lg border border-yellow-500 px-3 py-1.5 text-sm font-medium text-yellow-700 transition hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-950"
                    >
                      Bloquear acesso
                    </button>

                    <button
                      type="button"
                      onClick={() => alterarAcessoFuncionario(f.id, "desbloquear", f.nome)}
                      className="rounded-lg border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950"
                    >
                      Desbloquear acesso
                    </button>
                  </>
                )}

              </div>
            </div>
          ))
        )}
      </div>
      <PhanyxConfirmModal
        aberto={confirmModalAberto}
        titulo={confirmTitulo}
        mensagem={confirmMensagem}
        textoConfirmar="Confirmar"
        textoCancelar="Cancelar"
        onCancelar={() => {
          setConfirmModalAberto(false);
          setConfirmAcao(null);
        }}
        onConfirmar={() => {
          if (confirmAcao) {
            confirmAcao();
          }
        }}
      />
    </div>
  );
}

export default withAuth(AdminFuncionariosPage, ["admin"]);