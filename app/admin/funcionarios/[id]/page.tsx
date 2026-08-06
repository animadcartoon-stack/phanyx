"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";

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

type Beneficio = {
  id: number;
  nome: string;
  tipo: string;
  valorPadrao?: any;
  percentual?: any;
  descontaFolha: boolean;
};

type Vinculo = {
  id: number;
  valor?: any;
  percentual?: any;
  descontaFolha: boolean;
  ativo: boolean;
  beneficio: Beneficio;
};

type RegistroPonto = {
  id: number;
  data: string;
  horasExtras?: string | number | null;
  horasAtraso?: string | number | null;
};

type PoloLotacao = {
  id: number;
  nome: string;
  codigo?: string | null;
  tipoUnidade?: string | null;
  ativo?: boolean;
  statusComercial?: string | null;
};

function moeda(v: any) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(v: any) {
  return Number(v || 0);
}

function formatarHoras(v: number) {
  const sinal = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sinal}${Math.abs(v).toFixed(2)}h`;
}

function formatarDataHora(valor: any) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString("pt-BR");
}

function formatarDataSemFuso(valor: any) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

function obterDadosRemuneracao(valor: any) {
  if (!valor) return {};

  if (typeof valor === "string") {
    try {
      return JSON.parse(valor);
    } catch {
      return {};
    }
  }

  return valor;
}

function traduzirTipoRemuneracao(tipo: any) {
  switch (String(tipo || "").toUpperCase()) {
    case "MENSAL":
      return "Salário mensal";
    case "HORA_AULA":
      return "Hora-aula";
    case "HORA_TRABALHADA":
      return "Hora trabalhada";
    case "POR_AULA":
      return "Valor por aula";
    case "POR_TURMA":
      return "Valor por turma";
    case "POR_DISCIPLINA":
      return "Valor por disciplina";
    case "MISTO":
      return "Remuneração mista";
    case "SEM_REMUNERACAO":
      return "Sem remuneração";
    default:
      return tipo || "Não informada";
  }
}

function traduzirOrigemHistorico(origem: any) {
  switch (String(origem || "").toUpperCase()) {
    case "FUNCIONARIOS_RH_CADASTRO":
      return "Contratação inicial";
    case "FUNCIONARIOS_RH_EDICAO":
      return "Alteração pela ficha do funcionário";
    case "FUNCIONARIOS_RH_PROFESSOR":
      return "Alteração do professor pelo RH";
    case "PROFESSORES_RH":
      return "Alteração pela ficha do professor";
    default:
      return origem || "Alteração remuneratória";
  }
}

function ResumoRemuneracao({
  dados,
}: {
  dados: any;
}) {
  const valores = obterDadosRemuneracao(dados);

  const itens = [
    {
      label: "Modalidade",
      valor: traduzirTipoRemuneracao(
        valores.tipoRemuneracao
      ),
    },
    {
      label: "Salário mensal",
      valor:
        valores.salarioBase !== null &&
          valores.salarioBase !== undefined
          ? moeda(valores.salarioBase)
          : null,
    },
    {
      label: "Hora-aula",
      valor:
        valores.valorHoraAula !== null &&
          valores.valorHoraAula !== undefined
          ? moeda(valores.valorHoraAula)
          : null,
    },
    {
      label: "Hora trabalhada",
      valor:
        valores.valorHoraTrabalhada !== null &&
          valores.valorHoraTrabalhada !== undefined
          ? moeda(valores.valorHoraTrabalhada)
          : null,
    },
    {
      label: "Valor por aula",
      valor:
        valores.valorPorAula !== null &&
          valores.valorPorAula !== undefined
          ? moeda(valores.valorPorAula)
          : null,
    },
    {
      label: "Valor por turma",
      valor:
        valores.valorPorTurma !== null &&
          valores.valorPorTurma !== undefined
          ? moeda(valores.valorPorTurma)
          : null,
    },
    {
      label: "Valor por disciplina",
      valor:
        valores.valorPorDisciplina !== null &&
          valores.valorPorDisciplina !== undefined
          ? moeda(valores.valorPorDisciplina)
          : null,
    },
    {
      label: "Duração da hora-aula",
      valor:
        valores.duracaoHoraAulaMinutos !== null &&
          valores.duracaoHoraAulaMinutos !== undefined
          ? `${valores.duracaoHoraAulaMinutos} minutos`
          : null,
    },
    {
      label: "Carga semanal",
      valor:
        valores.cargaHorariaSemanal !== null &&
          valores.cargaHorariaSemanal !== undefined
          ? `${valores.cargaHorariaSemanal}h`
          : null,
    },
    {
      label: "Carga mensal",
      valor:
        valores.cargaHorariaMensal !== null &&
          valores.cargaHorariaMensal !== undefined
          ? `${valores.cargaHorariaMensal}h`
          : null,
    },
  ].filter((item) => item.valor !== null);

  return (
    <div className="space-y-1 text-sm">
      {itens.map((item) => (
        <p key={item.label}>
          <span className="font-semibold">
            {item.label}:
          </span>{" "}
          {item.valor}
        </p>
      ))}
    </div>
  );
}

function FuncionarioFichaPage() {
  const params = useParams();
  const funcionarioId = Number(params.id);

  const [funcionario, setFuncionario] = useState<any>(null);

  const [polos, setPolos] =
    useState<PoloLotacao[]>([]);

  const [
    modalLotacaoAberto,
    setModalLotacaoAberto,
  ] = useState(false);

  const [
    poloNovoId,
    setPoloNovoId,
  ] = useState("");

  const [
    vigenciaLotacao,
    setVigenciaLotacao,
  ] = useState("");

  const [
    motivoLotacao,
    setMotivoLotacao,
  ] = useState("");

  const [
    observacoesLotacao,
    setObservacoesLotacao,
  ] = useState("");

  const [
    salvandoLotacao,
    setSalvandoLotacao,
  ] = useState(false);

  const [documentosFuncionario, setDocumentosFuncionario] = useState<any[]>([]);
  const [enviandoDocumento, setEnviandoDocumento] = useState(false);

  const [novoDocumento, setNovoDocumento] = useState({
    tipo: "RG",
    titulo: "RG",
    arquivo: null as File | null,
    url: "",
  });

  const [linksPortfolio, setLinksPortfolio] = useState([
    { tipo: "LinkedIn", url: "" },
  ]);

  const [editandoTrabalhista, setEditandoTrabalhista] = useState(false);

  const [editandoGeral, setEditandoGeral] = useState(false);

  const [formGeral, setFormGeral] = useState({
    nome: "",
    cpf: "",
    rg: "",
    telefone: "",
    cargo: "",
    codigoFuncionario: "",
    email: "",
    role: "SECRETARIA",
    statusFuncionario: "",
    fotoPerfil: "",
  });

  const [
    criarAcessoSistema,
    setCriarAcessoSistema,
  ] = useState(false);

  const [formTrabalhista, setFormTrabalhista] = useState({
    dataAdmissao: "",
    dataDesligamento: "",

    tipoRemuneracao:
      "" as TipoRemuneracaoFuncionario,

    salarioBase: "",
    salario: "",

    valorHoraAula: "",
    valorHoraTrabalhada: "",
    valorPorAula: "",
    valorPorTurma: "",
    valorPorDisciplina: "",

    duracaoHoraAulaMinutos: "50",

    cargaHorariaSemanal: "",
    cargaHorariaMensal: "",

    observacoesRemuneracao: "",

    tipoContrato: "",
    jornadaTrabalho: "",

    codigoPonto: "",
    pisPasep: "",

    banco: "",
    agencia: "",
    conta: "",
    pix: "",
  });

  const [
    assinaturaRemuneracaoOriginal,
    setAssinaturaRemuneracaoOriginal,
  ] = useState("");

  const [
    motivoAlteracaoRemuneracao,
    setMotivoAlteracaoRemuneracao,
  ] = useState("");

  const [
    vigenciaInicioRemuneracao,
    setVigenciaInicioRemuneracao,
  ] = useState("");

  function criarAssinaturaRemuneracaoFuncionario(
    dados: typeof formTrabalhista
  ) {
    return JSON.stringify({
      tipoRemuneracao: dados.tipoRemuneracao,
      salarioBase: dados.salarioBase,
      valorHoraAula: dados.valorHoraAula,
      valorHoraTrabalhada: dados.valorHoraTrabalhada,
      valorPorAula: dados.valorPorAula,
      valorPorTurma: dados.valorPorTurma,
      valorPorDisciplina: dados.valorPorDisciplina,
      duracaoHoraAulaMinutos:
        dados.duracaoHoraAulaMinutos,
      cargaHorariaSemanal:
        dados.cargaHorariaSemanal,
      cargaHorariaMensal:
        dados.cargaHorariaMensal,
    });
  }

  function obterDataHoraLocalAtual() {
    const agora = new Date();

    const compensado = new Date(
      agora.getTime() -
      agora.getTimezoneOffset() * 60 * 1000
    );

    return compensado.toISOString().slice(0, 16);
  }

  const houveAlteracaoRemuneracao =
    assinaturaRemuneracaoOriginal !== "" &&
    criarAssinaturaRemuneracaoFuncionario(
      formTrabalhista
    ) !== assinaturaRemuneracaoOriginal;

  const [beneficiosDisponiveis, setBeneficiosDisponiveis] = useState<Beneficio[]>([]);
  const [beneficiosVinculados, setBeneficiosVinculados] = useState<Vinculo[]>([]);

  const [pontosFuncionario, setPontosFuncionario] = useState<RegistroPonto[]>([]);

  const [beneficioId, setBeneficioId] = useState("");
  const [valor, setValor] = useState("");
  const [percentual, setPercentual] = useState("");
  const [descontaFolha, setDescontaFolha] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFotoPerfil, setEnviandoFotoPerfil] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [buscaBanco, setBuscaBanco] = useState("");

  const BANCOS_BRASIL = [
    { codigo: "001", nome: "Banco do Brasil" },
    { codigo: "033", nome: "Santander" },
    { codigo: "104", nome: "Caixa Econômica Federal" },
    { codigo: "237", nome: "Bradesco" },
    { codigo: "341", nome: "Itaú" },
    { codigo: "745", nome: "Citibank" },
    { codigo: "399", nome: "HSBC" },
    { codigo: "041", nome: "Banrisul" },
    { codigo: "748", nome: "Sicredi" },
    { codigo: "756", nome: "Sicoob" },
    { codigo: "422", nome: "Safra" },
    { codigo: "655", nome: "Votorantim" },
    { codigo: "633", nome: "Rendimento" },
    { codigo: "707", nome: "Daycoval" },
    { codigo: "121", nome: "Agibank" },
    { codigo: "077", nome: "Banco Inter" },
    { codigo: "212", nome: "Banco Original" },
    { codigo: "218", nome: "BS2" },
    { codigo: "290", nome: "PagBank" },
    { codigo: "336", nome: "C6 Bank" },
    { codigo: "260", nome: "Nubank" },
    { codigo: "323", nome: "Mercado Pago" },
    { codigo: "380", nome: "PicPay Bank" },
    { codigo: "197", nome: "Stone" },
    { codigo: "274", nome: "Gerencianet / Efí" },
    { codigo: "403", nome: "Cora" },
    { codigo: "461", nome: "Asaas Money" },
    { codigo: "085", nome: "Ailos" },
    { codigo: "097", nome: "Credisis" },
    { codigo: "136", nome: "Unicred" },
    { codigo: "364", nome: "Gerencianet" },
    { codigo: "637", nome: "Sofisa Direto" },
    { codigo: "654", nome: "Renner" },
    { codigo: "746", nome: "Modal" },
    { codigo: "735", nome: "Neon" },
  ];

  async function carregarPolos() {
    try {
      const res = await fetch(
        "/api/admin/polos",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        console.error(
          "Erro ao carregar polos:",
          data?.error || res.statusText
        );

        setPolos([]);
        return;
      }

      const polosRecebidos =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.polos)
            ? data.polos
            : [];

      const polosValidos: PoloLotacao[] =
        polosRecebidos
          .map((polo: any) => ({
            id: Number(polo?.id),

            nome: String(
              polo?.nome || ""
            ).trim(),

            codigo:
              polo?.codigo
                ? String(polo.codigo)
                : null,

            tipoUnidade:
              polo?.tipoUnidade
                ? String(polo.tipoUnidade)
                : null,

            ativo:
              polo?.ativo === true,

            statusComercial:
              polo?.statusComercial
                ? String(
                  polo.statusComercial
                )
                : null,
          }))
          .filter(
            (polo: PoloLotacao) =>
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

  async function carregarFuncionario() {
    try {
      const res = await fetch(`/api/funcionario/${funcionarioId}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar funcionário.");
      }

      console.log("FUNCIONARIO RECEBIDO:", data.funcionario);

      setFuncionario(data.funcionario);
      setFormGeral({
        nome: data.funcionario.nome || "",
        cpf: data.funcionario.cpf || "",
        rg: data.funcionario.rg || "",
        telefone: data.funcionario.telefone || "",
        cargo: data.funcionario.cargo || "",
        codigoFuncionario:
          data.funcionario.codigoFuncionario || "",
        email:
          data.funcionario.user?.email || "",
        role:
          data.funcionario.user?.role ||
          "SECRETARIA",
        statusFuncionario:
          data.funcionario.statusFuncionario ||
          "ATIVO",
        fotoPerfil:
          data.funcionario.fotoPerfil || "",
      });

      setCriarAcessoSistema(false);
      preencherFormTrabalhista(data.funcionario);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar funcionário.");
    }
  }

  function dataInput(v: any) {
    if (!v) return "";
    return new Date(v).toISOString().slice(0, 10);
  }

  function preencherFormTrabalhista(f: any) {
    const dadosTrabalhistasCarregados = {
      dataAdmissao: dataInput(f.dataAdmissao),
      dataDesligamento: dataInput(f.dataDesligamento),

      tipoRemuneracao:
        (f.tipoRemuneracao as TipoRemuneracaoFuncionario) ||
        (f.salarioBase !== null &&
          f.salarioBase !== undefined
          ? "MENSAL"
          : "SEM_REMUNERACAO"),

      salarioBase:
        f.salarioBase !== null &&
          f.salarioBase !== undefined
          ? String(f.salarioBase)
          : "",

      salario:
        f.salario !== null &&
          f.salario !== undefined
          ? String(f.salario)
          : "",

      valorHoraAula:
        f.valorHoraAula !== null &&
          f.valorHoraAula !== undefined
          ? String(f.valorHoraAula)
          : "",

      valorHoraTrabalhada:
        f.valorHoraTrabalhada !== null &&
          f.valorHoraTrabalhada !== undefined
          ? String(f.valorHoraTrabalhada)
          : "",

      valorPorAula:
        f.valorPorAula !== null &&
          f.valorPorAula !== undefined
          ? String(f.valorPorAula)
          : "",

      valorPorTurma:
        f.valorPorTurma !== null &&
          f.valorPorTurma !== undefined
          ? String(f.valorPorTurma)
          : "",

      valorPorDisciplina:
        f.valorPorDisciplina !== null &&
          f.valorPorDisciplina !== undefined
          ? String(f.valorPorDisciplina)
          : "",

      duracaoHoraAulaMinutos:
        f.duracaoHoraAulaMinutos !== null &&
          f.duracaoHoraAulaMinutos !== undefined
          ? String(f.duracaoHoraAulaMinutos)
          : "50",

      cargaHorariaSemanal:
        f.cargaHorariaSemanal !== null &&
          f.cargaHorariaSemanal !== undefined
          ? String(f.cargaHorariaSemanal)
          : "",

      cargaHorariaMensal:
        f.cargaHorariaMensal !== null &&
          f.cargaHorariaMensal !== undefined
          ? String(f.cargaHorariaMensal)
          : "",

      observacoesRemuneracao:
        f.observacoesRemuneracao || "",

      tipoContrato: f.tipoContrato || "",
      jornadaTrabalho: f.jornadaTrabalho || "",

      codigoPonto: f.codigoPonto || "",
      pisPasep: f.pisPasep || "",

      banco: f.banco || "",
      agencia: f.agencia || "",
      conta: f.conta || "",
      pix: f.pix || "",
    };

    setFormTrabalhista(
      dadosTrabalhistasCarregados
    );

    setAssinaturaRemuneracaoOriginal(
      criarAssinaturaRemuneracaoFuncionario(
        dadosTrabalhistasCarregados
      )
    );

    setMotivoAlteracaoRemuneracao("");

    setVigenciaInicioRemuneracao(
      obterDataHoraLocalAtual()
    );
  }

  async function carregarBeneficios() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch(`/api/admin/funcionarios/${funcionarioId}/beneficios`, {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar benefícios.");
      }

      setBeneficiosDisponiveis(data.beneficiosDisponiveis || []);
      setBeneficiosVinculados(data.beneficiosVinculados || []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar benefícios.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarBancoHorasFuncionario() {
    try {
      const res = await fetch("/api/admin/rh/ponto", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) return;

      const todos = Array.isArray(data) ? data : [];

      const filtrados = todos.filter(
        (p: any) => Number(p.funcionario?.id) === funcionarioId
      );

      setPontosFuncionario(filtrados);
    } catch {
      setPontosFuncionario([]);
    }
  }

  async function enviarFotoOficialFuncionario(arquivo: File | null) {
    if (!arquivo) return;

    const formatosPermitidos = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
      setErro("Formato inválido. Envie uma foto em JPG, JPEG, PNG ou WEBP.");
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro("Foto muito grande. Envie uma foto com no máximo 2 MB.");
      return;
    }

    try {
      setEnviandoFotoPerfil(true);
      setErro("");
      setSucesso("");

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

      setFormGeral((p) => ({
        ...p,
        fotoPerfil: url,
      }));

      setSucesso("Foto oficial do funcionário enviada. Clique em Salvar para gravar.");
    } catch (e: any) {
      setErro(e.message || "Erro ao enviar foto oficial do funcionário.");
    } finally {
      setEnviandoFotoPerfil(false);
    }
  }

  async function carregarDocumentosFuncionario() {
    try {
      const res = await fetch(`/api/admin/funcionarios/${funcionarioId}/documentos`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) {
        setDocumentosFuncionario(Array.isArray(data) ? data : []);
      }
    } catch {
      setDocumentosFuncionario([]);
    }
  }

  async function enviarDocumentoFuncionario(e: React.FormEvent) {
    e.preventDefault();

    if (!novoDocumento.arquivo) {
      setErro("Selecione um arquivo antes de enviar.");
      return;
    }

    try {
      setEnviandoDocumento(true);

      const formData = new FormData();
      formData.append("tipo", novoDocumento.tipo);
      formData.append("titulo", novoDocumento.titulo);
      if (novoDocumento.arquivo) {
        formData.append("arquivo", novoDocumento.arquivo);
      }

      if (novoDocumento.url.trim()) {
        formData.append("url", novoDocumento.url.trim());
      }

      const res = await fetch(`/api/admin/funcionarios/${funcionarioId}/documentos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar documento.");
      }

      setSucesso("Documento enviado com sucesso.");
      setNovoDocumento({ tipo: "RG", titulo: "RG", arquivo: null, url: "" });
      await carregarDocumentosFuncionario();
    } catch (e: any) {
      setErro(e.message || "Erro ao enviar documento.");
    } finally {
      setEnviandoDocumento(false);
    }
  }

  function abrirModalLotacao() {
    setPoloNovoId("");
    setVigenciaLotacao(
      obterDataHoraLocalAtual()
    );
    setMotivoLotacao("");
    setObservacoesLotacao("");
    setErro("");
    setModalLotacaoAberto(true);
  }

  function fecharModalLotacao() {
    if (salvandoLotacao) {
      return;
    }

    setModalLotacaoAberto(false);
    setPoloNovoId("");
    setVigenciaLotacao("");
    setMotivoLotacao("");
    setObservacoesLotacao("");
  }

  async function salvarLotacaoFuncionario(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!poloNovoId) {
      setErro(
        "Selecione o novo polo de lotação."
      );
      return;
    }

    if (!vigenciaLotacao) {
      setErro(
        "Informe a data de vigência da lotação."
      );
      return;
    }

    const possuiLotacaoAtual =
      Boolean(funcionario?.poloId) ||
      Boolean(funcionario?.polo?.id);

    if (
      possuiLotacaoAtual &&
      !motivoLotacao.trim()
    ) {
      setErro(
        "Informe o motivo da transferência."
      );
      return;
    }

    try {
      setSalvandoLotacao(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/admin/funcionarios/${funcionarioId}/transferir-polo`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            poloId: Number(poloNovoId),

            vigenciaEm:
              vigenciaLotacao,

            motivo:
              motivoLotacao.trim(),

            observacoes:
              observacoesLotacao.trim(),
          }),
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível atualizar a lotação."
        );
      }

      setSucesso(
        data?.message ||
        "Lotação atualizada com sucesso."
      );

      fecharModalLotacao();

      await carregarFuncionario();
    } catch (error: any) {
      setErro(
        error?.message ||
        "Erro ao atualizar a lotação."
      );
    } finally {
      setSalvandoLotacao(false);
    }
  }

  useEffect(() => {
    if (!funcionarioId) return;

    carregarFuncionario();
    carregarPolos();
    carregarBeneficios();
    carregarBancoHorasFuncionario();
    carregarDocumentosFuncionario();
  }, [funcionarioId]);

  async function vincularBeneficio(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch(`/api/admin/funcionarios/${funcionarioId}/beneficios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          beneficioId,
          valor,
          percentual,
          descontaFolha,
          ativo: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao vincular benefício.");
      }

      setSucesso("Benefício vinculado ao funcionário.");
      setBeneficioId("");
      setValor("");
      setPercentual("");
      setDescontaFolha(true);

      await carregarBeneficios();
    } catch (e: any) {
      setErro(e.message || "Erro ao vincular benefício.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarDadosGerais(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const possuiAcessoAtual =
      Boolean(funcionario?.user);

    const vaiCriarAcesso =
      !possuiAcessoAtual &&
      criarAcessoSistema;

    if (!formGeral.nome.trim()) {
      setErro(
        "Informe o nome do funcionário."
      );
      return;
    }

    if (
      (possuiAcessoAtual ||
        vaiCriarAcesso) &&
      !formGeral.email.trim()
    ) {
      setErro(
        "Informe o email de acesso do funcionário."
      );
      return;
    }

    if (
      (possuiAcessoAtual ||
        vaiCriarAcesso) &&
      !formGeral.role
    ) {
      setErro(
        "Selecione o perfil de acesso do funcionário."
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/funcionario/${funcionarioId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            nome:
              formGeral.nome.trim(),

            cpf:
              formGeral.cpf,

            rg:
              formGeral.rg,

            telefone:
              formGeral.telefone,

            cargo:
              formGeral.cargo,

            codigoFuncionario:
              formGeral.codigoFuncionario,

            statusFuncionario:
              formGeral.statusFuncionario,

            fotoPerfil:
              formGeral.fotoPerfil,

            criarAcessoSistema:
              vaiCriarAcesso,

            email:
              possuiAcessoAtual ||
                vaiCriarAcesso
                ? formGeral.email
                  .trim()
                  .toLowerCase()
                : "",

            role:
              possuiAcessoAtual ||
                vaiCriarAcesso
                ? formGeral.role
                : "",
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
          "Erro ao salvar."
        );
      }

      setSucesso(
        data.message ||
        (data.acessoCriado
          ? "Acesso ao sistema criado com sucesso."
          : "Dados gerais atualizados.")
      );

      if (data.avisoEmail) {
        setErro(data.avisoEmail);
      }

      setCriarAcessoSistema(false);
      setEditandoGeral(false);

      await carregarFuncionario();
    } catch (e: any) {
      setErro(
        e.message ||
        "Erro ao salvar."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvarDadosTrabalhistas(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const tipoRemuneracao =
      formTrabalhista.tipoRemuneracao;

    const possuiValor = (valor: string) =>
      String(valor || "").trim() !== "";

    if (!tipoRemuneracao) {
      setErro(
        "Selecione a modalidade de remuneração do funcionário."
      );
      return;
    }

    if (
      tipoRemuneracao === "MENSAL" &&
      !possuiValor(formTrabalhista.salarioBase)
    ) {
      setErro(
        "Informe o salário mensal do funcionário."
      );
      return;
    }

    if (
      tipoRemuneracao === "HORA_AULA" &&
      !possuiValor(formTrabalhista.valorHoraAula)
    ) {
      setErro("Informe o valor da hora-aula.");
      return;
    }

    if (
      tipoRemuneracao === "HORA_TRABALHADA" &&
      !possuiValor(
        formTrabalhista.valorHoraTrabalhada
      )
    ) {
      setErro(
        "Informe o valor da hora trabalhada."
      );
      return;
    }

    if (
      tipoRemuneracao === "POR_AULA" &&
      !possuiValor(formTrabalhista.valorPorAula)
    ) {
      setErro("Informe o valor por aula.");
      return;
    }

    if (
      tipoRemuneracao === "POR_TURMA" &&
      !possuiValor(formTrabalhista.valorPorTurma)
    ) {
      setErro("Informe o valor por turma.");
      return;
    }

    if (
      tipoRemuneracao === "POR_DISCIPLINA" &&
      !possuiValor(
        formTrabalhista.valorPorDisciplina
      )
    ) {
      setErro("Informe o valor por disciplina.");
      return;
    }

    if (tipoRemuneracao === "MISTO") {
      const possuiAlgumValor =
        possuiValor(formTrabalhista.salarioBase) ||
        possuiValor(formTrabalhista.valorHoraAula) ||
        possuiValor(
          formTrabalhista.valorHoraTrabalhada
        ) ||
        possuiValor(formTrabalhista.valorPorAula) ||
        possuiValor(formTrabalhista.valorPorTurma) ||
        possuiValor(
          formTrabalhista.valorPorDisciplina
        );

      if (!possuiAlgumValor) {
        setErro(
          "Na remuneração mista, informe pelo menos um valor."
        );
        return;
      }
    }

    if (
      houveAlteracaoRemuneracao &&
      !motivoAlteracaoRemuneracao.trim()
    ) {
      setErro(
        "Informe o motivo da alteração da remuneração."
      );
      return;
    }

    if (
      houveAlteracaoRemuneracao &&
      !vigenciaInicioRemuneracao
    ) {
      setErro(
        "Informe a data e a hora em que a nova remuneração começa a valer."
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/funcionario/${funcionarioId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...funcionario,

            email:
              funcionario?.user?.email,

            role:
              funcionario?.user?.role,

            ...formTrabalhista,

            motivoAlteracaoRemuneracao:
              houveAlteracaoRemuneracao
                ? motivoAlteracaoRemuneracao.trim()
                : null,

            vigenciaInicioRemuneracao:
              houveAlteracaoRemuneracao &&
                vigenciaInicioRemuneracao
                ? new Date(
                  vigenciaInicioRemuneracao
                ).toISOString()
                : null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
          "Erro ao salvar dados trabalhistas."
        );
      }

      setSucesso(
        houveAlteracaoRemuneracao
          ? "Dados trabalhistas e alteração remuneratória registrados com sucesso."
          : "Dados trabalhistas atualizados com sucesso."
      );

      setEditandoTrabalhista(false);

      setMotivoAlteracaoRemuneracao("");
      setVigenciaInicioRemuneracao("");

      await carregarFuncionario();
    } catch (e: any) {
      setErro(
        e.message ||
        "Erro ao salvar dados trabalhistas."
      );
    } finally {
      setSalvando(false);
    }
  }

  const resumoBancoHoras = pontosFuncionario.reduce(
    (acc, p) => {
      const credito = numero(p.horasExtras);
      const debito = numero(p.horasAtraso);

      acc.creditos += credito;
      acc.debitos += debito;
      acc.saldo += credito - debito;
      acc.registros += 1;

      if (!acc.ultimaData || new Date(p.data) > new Date(acc.ultimaData)) {
        acc.ultimaData = p.data;
      }

      return acc;
    },
    {
      creditos: 0,
      debitos: 0,
      saldo: 0,
      registros: 0,
      ultimaData: "",
    }
  );

  return (
    <main
      className="
phanyx-ficha-funcionario-page
min-h-screen
bg-slate-50 dark:bg-slate-950
text-slate-900 dark:text-slate-100
p-6
"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Link href="/admin/funcionarios" className="text-sm text-blue-300 hover:text-blue-200">
            ← Voltar para funcionários
          </Link>

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold">Ficha do Funcionário</h1>

          {funcionario && (
            <form
              onSubmit={salvarDadosGerais}
              className="mt-6 rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">👤 Dados Gerais</h2>

                {!editandoGeral ? (
                  <button
                    type="button"
                    onClick={() => setEditandoGeral(true)}
                    className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/10"
                  >
                    Editar dados gerais
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={salvando}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                      {salvando ? "Salvando..." : "Salvar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormGeral({
                          nome:
                            funcionario.nome || "",
                          cpf:
                            funcionario.cpf || "",
                          rg:
                            funcionario.rg || "",
                          telefone:
                            funcionario.telefone || "",
                          cargo:
                            funcionario.cargo || "",
                          codigoFuncionario:
                            funcionario.codigoFuncionario || "",
                          email:
                            funcionario.user?.email || "",
                          role:
                            funcionario.user?.role ||
                            "SECRETARIA",
                          statusFuncionario:
                            funcionario.statusFuncionario ||
                            "ATIVO",
                          fotoPerfil:
                            funcionario.fotoPerfil || "",
                        });

                        setCriarAcessoSistema(false);
                        setEditandoGeral(false);
                      }}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {!editandoGeral ? (
                <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                  <div className="md:col-span-3 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                      {funcionario.fotoPerfil ? (
                        <img
                          src={funcionario.fotoPerfil}
                          alt={funcionario.nome || "Foto oficial do funcionário"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-black text-slate-400">
                          {funcionario.nome?.charAt(0)?.toUpperCase() || "F"}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        Foto oficial do funcionário
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Foto usada em crachás, identificação e documentos oficiais.
                      </p>
                    </div>
                  </div>
                  <div><p className="text-slate-400">Nome</p><p>{funcionario.nome || "-"}</p></div>
                  <div><p className="text-slate-400">CPF</p><p>{funcionario.cpf || "-"}</p></div>
                  <div><p className="text-slate-400">RG</p><p>{funcionario.rg || "-"}</p></div>
                  <div><p className="text-slate-400">Telefone</p><p>{funcionario.telefone || "-"}</p></div>
                  <div>
                    <p className="text-slate-400">
                      Cargo
                    </p>

                    <p>
                      {funcionario.cargo || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Departamento
                    </p>

                    <p>
                      {funcionario.departamento?.nome || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Polo de lotação
                    </p>

                    <p
                      className={
                        funcionario.polo
                          ? "font-semibold text-slate-900 dark:text-white"
                          : "font-semibold text-amber-700 dark:text-amber-300"
                      }
                    >
                      {funcionario.polo?.nome ||
                        "Lotação ainda não definida"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Código
                    </p>

                    <p>
                      {funcionario.codigoFuncionario || "-"}
                    </p>
                  </div>
                  <div><p className="text-slate-400">Status</p><p>{funcionario.statusFuncionario || "-"}</p></div>
                  <div className="md:col-span-3">
                    {funcionario.user ? (
                      <div
                        className="
        flex
        flex-col
        gap-3
        rounded-2xl
        border
        border-slate-200
        bg-slate-50
        p-4
        dark:border-slate-700
        dark:bg-slate-950
        md:flex-row
        md:items-center
        md:justify-between
      "
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            Acesso ao sistema
                          </p>

                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Email: {funcionario.user.email}
                          </p>

                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Perfil:{" "}
                            {funcionario.user.role ===
                              "ADMIN"
                              ? "Administrador"
                              : "Funcionário"}
                          </p>

                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Situação:{" "}
                            {funcionario.user.ativo ===
                              false
                              ? "Bloqueado"
                              : "Ativo"}
                          </p>
                        </div>

                        <span
                          className="
          inline-flex
          w-fit
          rounded-full
          border
          border-emerald-300
          bg-emerald-50
          px-3
          py-1
          text-xs
          font-bold
          text-emerald-700
          dark:border-emerald-800
          dark:bg-emerald-950/40
          dark:text-emerald-200
        "
                        >
                          Possui acesso
                        </span>
                      </div>
                    ) : (
                      <div
                        className="
        flex
        flex-col
        gap-4
        rounded-2xl
        border
        border-slate-300
        bg-slate-50
        p-4
        dark:border-slate-700
        dark:bg-slate-950
        md:flex-row
        md:items-center
        md:justify-between
      "
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            Sem acesso ao sistema
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Este funcionário está cadastrado
                            somente no RH. Nenhum login ou
                            senha foi criado.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCriarAcessoSistema(true);
                            setEditandoGeral(true);
                          }}
                          className="
          rounded-xl
          bg-blue-600
          px-4
          py-2
          text-sm
          font-bold
          text-white
          transition
          hover:bg-blue-500
        "
                        >
                          Criar acesso ao sistema
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="phanyx-foto-oficial-card md:col-span-3">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        {formGeral.fotoPerfil ? (
                          <img
                            src={formGeral.fotoPerfil}
                            alt={formGeral.nome || "Foto oficial do funcionário"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-black text-slate-400">
                            {formGeral.nome?.charAt(0)?.toUpperCase() || "F"}
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

                          {formGeral.fotoPerfil && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormGeral((p) => ({
                                  ...p,
                                  fotoPerfil: "",
                                }))
                              }
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              Remover foto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!funcionario.user && (
                    <div
                      className="
      md:col-span-3
      rounded-2xl
      border
      border-slate-300
      bg-slate-50
      p-4
      dark:border-slate-700
      dark:bg-slate-950
    "
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={
                            criarAcessoSistema
                          }
                          onChange={(e) => {
                            setCriarAcessoSistema(
                              e.target.checked
                            );
                          }}
                          className="mt-1 h-5 w-5 rounded border-slate-400"
                        />

                        <span>
                          <span className="block font-bold text-slate-900 dark:text-white">
                            Criar acesso ao sistema
                          </span>

                          <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                            O PHANYX criará um usuário,
                            uma senha temporária e enviará
                            as credenciais por email. O
                            funcionário deverá trocar a
                            senha no primeiro acesso.
                          </span>
                        </span>
                      </label>
                    </div>
                  )}

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome</span>
                    <input
                      value={formGeral.nome}
                      onChange={(e) => setFormGeral((p) => ({ ...p, nome: e.target.value }))}
                      className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">CPF</span>
                    <input
                      value={formGeral.cpf}
                      onChange={(e) => setFormGeral((p) => ({ ...p, cpf: e.target.value }))}
                      className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">RG</span>
                    <input
                      value={formGeral.rg}
                      onChange={(e) => setFormGeral((p) => ({ ...p, rg: e.target.value }))}
                      className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telefone</span>
                    <input
                      value={formGeral.telefone}
                      onChange={(e) => setFormGeral((p) => ({ ...p, telefone: e.target.value }))}
                      className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cargo</span>
                    <input
                      value={formGeral.cargo}
                      onChange={(e) => setFormGeral((p) => ({ ...p, cargo: e.target.value }))}
                      className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Código</span>
                    <input
                      value={formGeral.codigoFuncionario}
                      onChange={(e) =>
                        setFormGeral((p) => ({ ...p, codigoFuncionario: e.target.value }))
                      }
                      className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
                    />
                  </label>

                  {(funcionario.user ||
                    criarAcessoSistema) && (
                      <>
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Email de acesso
                          </span>

                          <input
                            type="email"
                            value={formGeral.email}
                            onChange={(e) =>
                              setFormGeral((p) => ({
                                ...p,
                                email:
                                  e.target.value,
                              }))
                            }
                            placeholder="funcionario@email.com"
                            required
                            className="
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          text-slate-900
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-white
        "
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Perfil de acesso
                          </span>

                          <select
                            value={formGeral.role}
                            onChange={(e) =>
                              setFormGeral((p) => ({
                                ...p,
                                role:
                                  e.target.value,
                              }))
                            }
                            required
                            className="
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          text-slate-900
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-white
        "
                          >
                            <option value="SECRETARIA">
                              Funcionário
                            </option>

                            <option value="ADMIN">
                              Administrador
                            </option>
                          </select>
                        </label>
                      </>
                    )}

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</span>
                    <select
                      value={formGeral.statusFuncionario}
                      onChange={(e) =>
                        setFormGeral((p) => ({ ...p, statusFuncionario: e.target.value }))
                      }
                      className="
  w-full rounded-xl
  border border-slate-300 dark:border-slate-700
  bg-white dark:bg-slate-950
  px-3 py-2 text-sm
  text-slate-900 dark:text-white
  outline-none
  focus:border-blue-500
"
                    >
                      <option value="ATIVO">Ativo</option>
                      <option value="DEMITIDO">Demitido</option>
                      <option value="AFASTADO">Afastado</option>
                      <option value="FERIAS">Férias</option>
                      <option value="READMITIDO">Readmitido</option>
                    </select>
                  </label>
                </div>
              )}
            </form>
          )}

          {funcionario && (
            <section
              className="
      mt-6
      rounded-3xl
      border
      border-slate-200
      bg-white
      p-5
      shadow-sm
      dark:border-slate-700
      dark:bg-slate-900
    "
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    📍 Lotação do funcionário
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Unidade em que o funcionário
                    está atualmente lotado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={abrirModalLotacao}
                  className="
          inline-flex
          items-center
          justify-center
          rounded-xl
          bg-blue-600
          px-4
          py-2
          text-sm
          font-bold
          text-white
          transition
          hover:bg-blue-500
        "
                >
                  {funcionario.polo
                    ? "Transferir de polo"
                    : "Definir lotação"}
                </button>
              </div>

              <div
                className="
        mt-5
        rounded-2xl
        border
        border-slate-200
        bg-slate-50
        p-4
        dark:border-slate-700
        dark:bg-slate-950
      "
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Polo atual
                </p>

                <p
                  className={
                    funcionario.polo
                      ? "mt-1 text-lg font-bold text-slate-900 dark:text-white"
                      : "mt-1 text-lg font-bold text-amber-700 dark:text-amber-300"
                  }
                >
                  {funcionario.polo?.nome ||
                    "Lotação ainda não definida"}
                </p>

                {funcionario.polo?.codigo && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Código:{" "}
                    {funcionario.polo.codigo}
                  </p>
                )}

                {funcionario.professor && (
                  <p className="mt-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Este funcionário também possui
                    cadastro de professor. A lotação
                    será sincronizada nos dois
                    cadastros.
                  </p>
                )}
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Histórico de lotações
                </h3>

                {!Array.isArray(
                  funcionario.historicosLotacaoRH
                ) ||
                  funcionario.historicosLotacaoRH
                    .length === 0 ? (
                  <div
                    className="
            mt-3
            rounded-2xl
            border
            border-dashed
            border-slate-300
            p-4
            text-sm
            text-slate-600
            dark:border-slate-700
            dark:text-slate-300
          "
                  >
                    Nenhuma movimentação de lotação
                    foi registrada ainda.
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {funcionario
                      .historicosLotacaoRH
                      .map((historico: any) => (
                        <div
                          key={historico.id}
                          className="
                  rounded-2xl
                  border
                  border-slate-200
                  p-4
                  dark:border-slate-700
                "
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className="
                      rounded-full
                      border
                      border-blue-200
                      bg-blue-50
                      px-3
                      py-1
                      text-xs
                      font-bold
                      text-blue-700
                      dark:border-blue-800
                      dark:bg-blue-950/40
                      dark:text-blue-200
                    "
                            >
                              {historico.tipo ===
                                "TRANSFERENCIA"
                                ? "Transferência"
                                : historico.tipo ===
                                  "CORRECAO"
                                  ? "Correção"
                                  : "Lotação inicial"}
                            </span>

                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Vigência:{" "}
                              {formatarDataHora(
                                historico.vigenciaEm
                              )}
                            </span>
                          </div>

                          <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                            {historico
                              .poloAnteriorNomeSnapshot ||
                              "Sem polo anterior"}
                            {" → "}
                            {historico
                              .poloNovoNomeSnapshot ||
                              historico.poloNovo?.nome ||
                              "-"}
                          </p>

                          {historico.motivo && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              <strong>Motivo:</strong>{" "}
                              {historico.motivo}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Registrado por:{" "}
                            {historico
                              .realizadoPorNomeSnapshot ||
                              historico.realizadoPor
                                ?.nome ||
                              "-"}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {modalLotacaoAberto && (
            <div
              className="
      fixed
      inset-0
      z-[1000]
      flex
      items-center
      justify-center
      bg-black/60
      p-4
      backdrop-blur-sm
    "
            >
              <form
                onSubmit={
                  salvarLotacaoFuncionario
                }
                className="
        max-h-[90vh]
        w-full
        max-w-xl
        overflow-y-auto
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-2xl
        dark:border-slate-700
        dark:bg-slate-900
      "
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {funcionario?.polo
                        ? "Transferir funcionário"
                        : "Definir lotação"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Funcionário:{" "}
                      <strong>
                        {funcionario?.nome}
                      </strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fecharModalLotacao}
                    disabled={salvandoLotacao}
                    className="
            rounded-lg
            px-3
            py-1
            text-xl
            font-bold
            text-slate-500
            hover:bg-slate-100
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
                    aria-label="Fechar"
                  >
                    ×
                  </button>
                </div>

                {funcionario?.polo && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Lotação atual
                    </p>

                    <p className="mt-1 font-bold text-slate-900 dark:text-white">
                      {funcionario.polo.nome}
                    </p>
                  </div>
                )}

                <div className="mt-5 space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Novo polo
                    <span className="ml-1 text-red-600">
                      *
                    </span>
                  </label>

                  <select
                    value={poloNovoId}
                    onChange={(e) =>
                      setPoloNovoId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  >
                    <option value="">
                      Selecione o polo
                    </option>

                    {polos.map((polo) => {
                      const disponivel =
                        polo.ativo === true &&
                        polo.statusComercial ===
                        "ATIVO";

                      const poloAtual =
                        Number(
                          funcionario?.poloId ||
                          funcionario?.polo?.id
                        ) === polo.id;

                      return (
                        <option
                          key={polo.id}
                          value={polo.id}
                          disabled={
                            !disponivel ||
                            poloAtual
                          }
                        >
                          {polo.nome}
                          {polo.codigo
                            ? ` — ${polo.codigo}`
                            : ""}
                          {poloAtual
                            ? " — Lotação atual"
                            : !disponivel
                              ? " — Inativo"
                              : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="mt-4 space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Data de vigência
                    <span className="ml-1 text-red-600">
                      *
                    </span>
                  </label>

                  <input
                    type="datetime-local"
                    value={vigenciaLotacao}
                    onChange={(e) =>
                      setVigenciaLotacao(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />
                </div>

                <div className="mt-4 space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Motivo da transferência
                    {funcionario?.polo && (
                      <span className="ml-1 text-red-600">
                        *
                      </span>
                    )}
                  </label>

                  <textarea
                    value={motivoLotacao}
                    onChange={(e) =>
                      setMotivoLotacao(
                        e.target.value
                      )
                    }
                    className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={
                      funcionario?.polo
                        ? "Informe o motivo da transferência."
                        : "Opcional para a definição inicial."
                    }
                    required={
                      Boolean(funcionario?.polo)
                    }
                  />
                </div>

                <div className="mt-4 space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Observações
                  </label>

                  <textarea
                    value={observacoesLotacao}
                    onChange={(e) =>
                      setObservacoesLotacao(
                        e.target.value
                      )
                    }
                    className="min-h-[80px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Informações adicionais, quando houver."
                  />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={fecharModalLotacao}
                    disabled={salvandoLotacao}
                    className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvandoLotacao}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {salvandoLotacao
                      ? "Salvando..."
                      : funcionario?.polo
                        ? "Confirmar transferência"
                        : "Definir lotação"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="mt-2 text-sm text-slate-400">
            Área central do Departamento Pessoal. Primeiro módulo ativo: benefícios vinculados ao funcionário.
          </p>
        </div>

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

        {funcionario && (
          <form
            onSubmit={salvarDadosTrabalhistas}
            className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">💼 Dados Trabalhistas</h2>

              {!editandoTrabalhista ? (
                <button
                  type="button"
                  onClick={() => setEditandoTrabalhista(true)}
                  className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/10"
                >
                  Editar dados trabalhistas
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      preencherFormTrabalhista(funcionario);
                      setEditandoTrabalhista(false);
                    }}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {!editandoTrabalhista ? (
              <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
                <div><p className="text-slate-400">Data de Admissão</p><p>{funcionario.dataAdmissao ? new Date(funcionario.dataAdmissao).toLocaleDateString("pt-BR") : "-"}</p></div>
                <div><p className="text-slate-400">Data de Desligamento</p><p>{funcionario.dataDesligamento ? new Date(funcionario.dataDesligamento).toLocaleDateString("pt-BR") : "-"}</p></div>
                <div><p className="text-slate-400">Salário Base</p><p>{funcionario.salarioBase ? moeda(funcionario.salarioBase) : "-"}</p></div>
                <div><p className="text-slate-400">Salário Atual</p><p>{funcionario.salario ? moeda(funcionario.salario) : "-"}</p></div>
                <div><p className="text-slate-400">Tipo de Contrato</p><p>{funcionario.tipoContrato || "-"}</p></div>
                <div><p className="text-slate-400">Jornada</p><p>{funcionario.jornadaTrabalho || "-"}</p></div>
                <div><p className="text-slate-400">Carga Horária Mensal</p><p>{funcionario.cargaHorariaMensal ? `${funcionario.cargaHorariaMensal}h` : "-"}</p></div>
                <div><p className="text-slate-400">Código do Ponto</p><p>{funcionario.codigoPonto || "-"}</p></div>
                <div><p className="text-slate-400">PIS / PASEP</p><p>{funcionario.pisPasep || "-"}</p></div>
                <div><p className="text-slate-400">Banco</p><p>{funcionario.banco || "-"}</p></div>
                <div><p className="text-slate-400">Agência</p><p>{funcionario.agencia || "-"}</p></div>
                <div><p className="text-slate-400">Conta</p><p>{funcionario.conta || "-"}</p></div>
                <div className="md:col-span-2"><p className="text-slate-400">PIX</p><p>{funcionario.pix || "-"}</p></div>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                {[
                  ["dataAdmissao", "Data de Admissão", "date"],
                  ["dataDesligamento", "Data de Desligamento", "date"],
                  ["tipoContrato", "Tipo de Contrato", "text"],
                  ["jornadaTrabalho", "Jornada", "text"],
                  ["cargaHorariaSemanal", "Carga Horária Semanal", "number"],
                  ["cargaHorariaMensal", "Carga Horária Mensal", "number"],
                  ["codigoPonto", "Código do Ponto", "text"],
                  ["pisPasep", "PIS / PASEP", "text"],
                ].map(([campo, label, tipo]) => (
                  <label key={campo} className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                    <input
                      type={tipo}
                      value={(formTrabalhista as any)[campo]}
                      onChange={(e) =>
                        setFormTrabalhista((p) => ({
                          ...p,
                          [campo]: e.target.value,
                        }))
                      }
                      className="
    w-full rounded-xl
    border border-slate-300 dark:border-slate-700
    bg-white dark:bg-slate-950
    px-3 py-2 text-sm
    text-slate-900 dark:text-white
    outline-none
    focus:border-blue-500
  "
                    />
                  </label>
                ))}

                <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    💰 Remuneração
                  </h3>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Selecione como o funcionário é remunerado e informe os valores correspondentes.
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Modalidade de remuneração
                      </span>

                      <select
                        value={formTrabalhista.tipoRemuneracao}
                        onChange={(e) =>
                          setFormTrabalhista((p) => ({
                            ...p,
                            tipoRemuneracao:
                              e.target.value as TipoRemuneracaoFuncionario,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                    </label>

                    {(formTrabalhista.tipoRemuneracao === "MENSAL" ||
                      formTrabalhista.tipoRemuneracao === "MISTO") && (
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Salário mensal
                          </span>

                          <input
                            value={formTrabalhista.salarioBase}
                            onChange={(e) =>
                              setFormTrabalhista((p) => ({
                                ...p,
                                salarioBase: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                            inputMode="decimal"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </label>
                      )}

                    {(formTrabalhista.tipoRemuneracao === "HORA_AULA" ||
                      formTrabalhista.tipoRemuneracao === "MISTO") && (
                        <>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Valor da hora-aula
                            </span>

                            <input
                              value={formTrabalhista.valorHoraAula}
                              onChange={(e) =>
                                setFormTrabalhista((p) => ({
                                  ...p,
                                  valorHoraAula: e.target.value,
                                }))
                              }
                              placeholder="0,00"
                              inputMode="decimal"
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                          </label>

                          <label className="space-y-1">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Duração da hora-aula
                            </span>

                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                value={formTrabalhista.duracaoHoraAulaMinutos}
                                onChange={(e) =>
                                  setFormTrabalhista((p) => ({
                                    ...p,
                                    duracaoHoraAulaMinutos: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-20 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                              />

                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                minutos
                              </span>
                            </div>
                          </label>
                        </>
                      )}

                    {(formTrabalhista.tipoRemuneracao === "HORA_TRABALHADA" ||
                      formTrabalhista.tipoRemuneracao === "MISTO") && (
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Valor da hora trabalhada
                          </span>

                          <input
                            value={formTrabalhista.valorHoraTrabalhada}
                            onChange={(e) =>
                              setFormTrabalhista((p) => ({
                                ...p,
                                valorHoraTrabalhada: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                            inputMode="decimal"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </label>
                      )}

                    {(formTrabalhista.tipoRemuneracao === "POR_AULA" ||
                      formTrabalhista.tipoRemuneracao === "MISTO") && (
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Valor por aula
                          </span>

                          <input
                            value={formTrabalhista.valorPorAula}
                            onChange={(e) =>
                              setFormTrabalhista((p) => ({
                                ...p,
                                valorPorAula: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                            inputMode="decimal"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </label>
                      )}

                    {(formTrabalhista.tipoRemuneracao === "POR_TURMA" ||
                      formTrabalhista.tipoRemuneracao === "MISTO") && (
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Valor por turma
                          </span>

                          <input
                            value={formTrabalhista.valorPorTurma}
                            onChange={(e) =>
                              setFormTrabalhista((p) => ({
                                ...p,
                                valorPorTurma: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                            inputMode="decimal"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </label>
                      )}

                    {(formTrabalhista.tipoRemuneracao === "POR_DISCIPLINA" ||
                      formTrabalhista.tipoRemuneracao === "MISTO") && (
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Valor por disciplina
                          </span>

                          <input
                            value={formTrabalhista.valorPorDisciplina}
                            onChange={(e) =>
                              setFormTrabalhista((p) => ({
                                ...p,
                                valorPorDisciplina: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                            inputMode="decimal"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </label>
                      )}

                    <label className="space-y-1 md:col-span-3">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Observações da remuneração
                      </span>

                      <textarea
                        value={formTrabalhista.observacoesRemuneracao}
                        onChange={(e) =>
                          setFormTrabalhista((p) => ({
                            ...p,
                            observacoesRemuneracao: e.target.value,
                          }))
                        }
                        className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="Acordos, adicionais ou regras da remuneração."
                      />
                    </label>
                  </div>
                </div>

                {houveAlteracaoRemuneracao && (
                  <div className="md:col-span-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
                    <h3 className="font-bold text-amber-950 dark:text-amber-100">
                      🕒 Registro da alteração remuneratória
                    </h3>

                    <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
                      A remuneração foi alterada. Informe quando a nova condição começa a valer e o motivo da mudança.
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-amber-950 dark:text-amber-100">
                          Início da vigência
                        </span>

                        <input
                          type="datetime-local"
                          value={vigenciaInicioRemuneracao}
                          onChange={(e) =>
                            setVigenciaInicioRemuneracao(e.target.value)
                          }
                          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-amber-700 dark:bg-slate-950 dark:text-white"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-amber-950 dark:text-amber-100">
                          Motivo da alteração
                        </span>

                        <textarea
                          value={motivoAlteracaoRemuneracao}
                          onChange={(e) =>
                            setMotivoAlteracaoRemuneracao(e.target.value)
                          }
                          className="min-h-[100px] w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-amber-700 dark:bg-slate-950 dark:text-white"
                          placeholder="Ex.: reajuste salarial aprovado pela direção."
                        />
                      </label>
                    </div>

                    <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">
                      A data e a hora do salvamento e o usuário responsável serão registrados automaticamente.
                    </p>
                  </div>
                )}

                <label className="relative space-y-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300"></span>

                  <input
                    value={buscaBanco || formTrabalhista.banco}
                    onChange={(e) => {
                      setBuscaBanco(e.target.value);
                      setFormTrabalhista((p) => ({ ...p, banco: "" }));
                    }}
                    placeholder="Digite nome ou código do banco"
                    className="
    w-full rounded-xl
    border border-slate-300 dark:border-slate-700
    bg-white dark:bg-slate-950
    px-3 py-2 text-sm
    text-slate-900 dark:text-white
    outline-none
    focus:border-blue-500
  "
                  />

                  {buscaBanco && (
                    <div className="
absolute z-50 mt-2 max-h-64 w-full overflow-y-auto
rounded-2xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
shadow-xl
">
                      {BANCOS_BRASIL.filter((banco) => {
                        const termo = buscaBanco.toLowerCase();
                        return (
                          banco.nome.toLowerCase().includes(termo) ||
                          banco.codigo.includes(termo)
                        );
                      }).map((banco) => (
                        <button
                          key={banco.codigo}
                          type="button"
                          onClick={() => {
                            const valorBanco = `${banco.codigo} - ${banco.nome}`;
                            setFormTrabalhista((p) => ({ ...p, banco: valorBanco }));
                            setBuscaBanco("");
                          }}
                          className="
block w-full px-4 py-3 text-left text-sm
text-slate-900 dark:text-white
hover:bg-blue-100 dark:hover:bg-blue-600
"
                        >
                          {banco.codigo} - {banco.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </label>

                {[
                  ["agencia", "Agência", "text"],
                  ["conta", "Conta", "text"],
                  ["pix", "PIX", "text"],
                ].map(([campo, label, tipo]) => (
                  <label key={campo} className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {label}
                    </span>

                    <input
                      type={tipo}
                      value={(formTrabalhista as any)[campo]}
                      onChange={(e) =>
                        setFormTrabalhista((p) => ({
                          ...p,
                          [campo]: e.target.value,
                        }))
                      }
                      className="
    w-full rounded-xl
    border border-slate-300 dark:border-slate-700
    bg-white dark:bg-slate-950
    px-3 py-2 text-sm
    text-slate-900 dark:text-white
  "
                    />

                  </label>
                ))}

              </div>
            )}
          </form>
        )}

        {funcionario && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/80">
            <div>
              <h2 className="text-lg font-bold">
                🕒 Histórico da remuneração
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Registro auditável das contratações e alterações
                remuneratórias deste funcionário.
              </p>
            </div>

            {!Array.isArray(
              funcionario.historicosRemuneracaoRH
            ) ||
              funcionario.historicosRemuneracaoRH.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                Nenhum histórico remuneratório registrado.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {funcionario.historicosRemuneracaoRH.map(
                  (historico: any) => (
                    <article
                      key={historico.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-700 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {traduzirOrigemHistorico(
                              historico.origem
                            )}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            Registrado em{" "}
                            {formatarDataHora(
                              historico.alteradoEm
                            )}
                          </p>
                        </div>

                        <div className="text-sm md:text-right">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {
                              historico.alteradoPorNomeSnapshot
                            }
                          </p>

                          <p className="text-slate-600 dark:text-slate-400">
                            {historico.alteradoPorRoleSnapshot ||
                              "Perfil não informado"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-100">
                          <h4 className="mb-3 font-bold">
                            Condição anterior
                          </h4>

                          <ResumoRemuneracao
                            dados={historico.dadosAnteriores}
                          />
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100">
                          <h4 className="mb-3 font-bold">
                            Nova condição
                          </h4>

                          <ResumoRemuneracao
                            dados={historico.dadosNovos}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                          <p className="font-semibold">
                            Início da vigência
                          </p>

                          <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {historico.origem ===
                              "FUNCIONARIOS_RH_CADASTRO"
                              ? `${formatarDataSemFuso(
                                historico.vigenciaInicio
                              )} — data de admissão`
                              : formatarDataHora(
                                historico.vigenciaInicio
                              )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                          <p className="font-semibold">
                            Data e hora do registro
                          </p>

                          <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {formatarDataHora(
                              historico.alteradoEm
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                        <p className="font-semibold">
                          Motivo
                        </p>

                        <p className="mt-1 whitespace-pre-wrap">
                          {historico.motivo ||
                            "Motivo não informado."}
                        </p>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {funcionario && (
          <section className="phanyx-documentos-funcionario rounded-3xl border p-5">
            <h2 className="text-lg font-bold">📎 Documentos e Portfólio</h2>

            <p className="mt-2 text-sm text-slate-400">
              Documentos profissionais, currículo e links de portfólio.
            </p>

            <form onSubmit={enviarDocumentoFuncionario} className="mt-5 grid gap-4 md:grid-cols-3">
              <select
                value={novoDocumento.tipo}
                onChange={(e) => {
                  const tipo = e.target.value;
                  setNovoDocumento((p) => ({ ...p, tipo, titulo: tipo }));
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                <option value="RG">RG</option>
                <option value="CPF">CPF</option>
                <option value="CNH">CNH</option>
                <option value="COMPROVANTE_RESIDENCIA">Comprovante de residência</option>
                <option value="CURRICULO">Currículo</option>
                <option value="PORTFOLIO">Portfólio</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="BEHANCE">Behance</option>
                <option value="ARTSTATION">ArtStation</option>
                <option value="SITE">Site</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="VIMEO">Vimeo</option>
                <option value="INSTAGRAM">Instagram Profissional</option>
                <option value="GITHUB">GitHub</option>
                <option value="CERTIFICADOS">Certificados</option>
              </select>

              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.psd,.ai,.eps,.svg,.blend,.fbx,.obj,.glb,.gltf,.ma,.mb,.max,.zip,.rar"
                onChange={(e) =>
                  setNovoDocumento((p) => ({
                    ...p,
                    arquivo: e.target.files?.[0] || null,
                  }))
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />

              <div className="md:col-span-3 space-y-3">
                <p className="text-sm font-semibold text-slate-100">
                  Links profissionais e portfólio online
                </p>

                {linksPortfolio.map((link, index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                    <select
                      value={link.tipo}
                      onChange={(e) =>
                        setLinksPortfolio((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, tipo: e.target.value } : item
                          )
                        )
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Behance">Behance</option>
                      <option value="ArtStation">ArtStation</option>
                      <option value="Site">Site pessoal</option>
                      <option value="Vimeo">Vimeo</option>
                      <option value="YouTube">YouTube</option>
                      <option value="GitHub">GitHub</option>
                      <option value="Instagram">Instagram profissional</option>
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
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setLinksPortfolio((prev) =>
                          prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
                        )
                      }
                      className="rounded-xl border border-red-500/40 px-3 py-2 text-sm font-bold text-red-300"
                    >
                      Remover
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setLinksPortfolio((prev) => [...prev, { tipo: "LinkedIn", url: "" }])
                  }
                  className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-bold text-blue-300"
                >
                  + Adicionar link
                </button>
              </div>

              <button
                type="submit"
                disabled={enviandoDocumento}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {enviandoDocumento ? "Enviando..." : "Enviar documento"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Documentos enviados
              </h3>

              {documentosFuncionario.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Nenhum documento enviado ainda.
                </p>
              ) : (
                documentosFuncionario.map((doc) => (
                  <div
                    key={doc.id}
                    className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          rounded-xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-sm
          dark:border-slate-700
          dark:bg-slate-950
        "
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {doc.titulo || "Documento"}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span>Tipo: {doc.tipo || "-"}</span>

                        <span>
                          {doc.criadoEm
                            ? `Enviado em: ${new Date(doc.criadoEm).toLocaleDateString("pt-BR")}`
                            : "Data não informada"}
                        </span>

                        <span>
                          {doc.arquivoUrl?.startsWith("http") ? "Arquivo/link disponível" : "Sem arquivo"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {doc.arquivoUrl && (
                        <a
                          href={doc.arquivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="
                rounded-lg
                border
                border-blue-300
                bg-blue-50
                px-3
                py-1.5
                text-sm
                font-bold
                text-blue-700
                hover:bg-blue-100
                dark:border-blue-700
                dark:bg-blue-950/30
                dark:text-blue-300
              "
                        >
                          Abrir documento
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {funcionario && (
          <section className="phanyx-rh-banco">
            <div className="phanyx-rh-banco-topo">
              <h2 className="phanyx-rh-banco-titulo">📊 Banco de Horas</h2>

              <Link href="/admin/rh/banco-horas" className="phanyx-rh-banco-link">
                Ver banco geral
              </Link>
            </div>

            <div className="phanyx-rh-banco-grid">
              <div className="phanyx-rh-banco-card credito">
                <p>Créditos</p>
                <strong>{formatarHoras(resumoBancoHoras.creditos)}</strong>
              </div>

              <div className="phanyx-rh-banco-card debito">
                <p>Débitos</p>
                <strong>{formatarHoras(-resumoBancoHoras.debitos)}</strong>
              </div>

              <div className="phanyx-rh-banco-card saldo">
                <p>Saldo Atual</p>
                <strong>
                  {formatarHoras(resumoBancoHoras.saldo)}
                </strong>
              </div>

              <div className="phanyx-rh-banco-card registro">
                <p>Registros</p>
                <strong>{resumoBancoHoras.registros}</strong>
              </div>
            </div>

            <div className="phanyx-rh-banco-ultimo">
              Último ponto:{" "}
              <strong>
                {resumoBancoHoras.ultimaData
                  ? new Date(resumoBancoHoras.ultimaData).toLocaleDateString("pt-BR")
                  : "-"}
              </strong>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5">
          <h2 className="text-lg font-bold">🎁 Benefícios</h2>

          <form onSubmit={vincularBeneficio} className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Benefício</span>
              <select
                value={beneficioId}
                onChange={(e) => setBeneficioId(e.target.value)}
                required
                className="
    w-full rounded-xl
    border border-slate-300 dark:border-slate-700
    bg-white dark:bg-slate-950
    px-3 py-2 text-sm
    text-slate-900 dark:text-white
  "
              >
                <option value="">Selecione</option>
                {beneficiosDisponiveis.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Valor (R$)</span>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex.: 120,00"
                className="
  w-full rounded-xl
  border border-slate-300 dark:border-slate-700
  bg-white dark:bg-slate-950
  px-3 py-2 text-sm
  text-slate-900 dark:text-white
"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Percentual (%)</span>
              <input
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                placeholder="Ex.: 6"
                className="
  w-full rounded-xl
  border border-slate-300 dark:border-slate-700
  bg-white dark:bg-slate-950
  px-3 py-2 text-sm
  text-slate-900 dark:text-white
"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-4">
              <input
                type="checkbox"
                checked={descontaFolha}
                onChange={(e) => setDescontaFolha(e.target.checked)}
              />
              Desconta na folha
            </label>

            <div className="md:col-span-4">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {salvando ? "Vinculando..." : "Vincular benefício"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-bold">Benefícios vinculados</h2>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-400">Carregando...</div>
          ) : beneficiosVinculados.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">
              Nenhum benefício vinculado a este funcionário.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Benefício</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Percentual</th>
                    <th className="p-3">Folha</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiosVinculados.map((v) => (
                    <tr key={v.id} className="border-t border-slate-800">
                      <td className="p-3 font-semibold">{v.beneficio?.nome}</td>
                      <td className="p-3 text-slate-300">
                        {v.beneficio?.tipo?.replaceAll("_", " ")}
                      </td>
                      <td className="p-3 text-slate-300">
                        {v.valor ? moeda(v.valor) : "-"}
                      </td>
                      <td className="p-3 text-slate-300">
                        {v.percentual ? `${v.percentual}%` : "-"}
                      </td>
                      <td className="p-3">
                        {v.descontaFolha ? "Desconta" : "Não desconta"}
                      </td>
                      <td className="p-3">
                        {v.ativo ? "Ativo" : "Inativo"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default withAuth(FuncionarioFichaPage, ["admin"]);