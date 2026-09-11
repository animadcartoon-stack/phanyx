"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";
import BuscaBanco from "@/components/rh/BuscaBanco";
import CampoTelefoneInternacional from "@/components/internacionalizacao/CampoTelefoneInternacional";
import { useLocale, useTranslations } from "next-intl";
import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";

type OpcaoDocumentoInternacional = readonly [string, string];

const PAIS_POR_LOCALE: Record<string, CountryCode> = {
  "pt-BR": "BR",
  "pt-PT": "PT",
  "en-US": "US",
  "es-ES": "ES",
  "fr-FR": "FR",
};

function paisInicial(locale: string): CountryCode {
  return PAIS_POR_LOCALE[locale] || "BR";
}

function codigoPaisValido(valor: unknown): valor is CountryCode {
  return (
    typeof valor === "string" &&
    getCountries().includes(
      valor.toUpperCase() as CountryCode
    )
  );
}

function bandeiraPais(codigo: CountryCode) {
  return codigo
    .toUpperCase()
    .replace(
      /./g,
      (letra) =>
        String.fromCodePoint(
          127397 + letra.charCodeAt(0)
        )
    );
}

function tipoDocumentoPadrao(pais: CountryCode) {
  switch (pais) {
    case "BR": return "CIN";
    case "PT": return "CARTAO_CIDADAO";
    case "US": return "STATE_ID";
    case "ES": return "DNI";
    case "FR": return "CNI";
    default: return "NATIONAL_ID";
  }
}

function tipoDocumentoFiscalPadrao(pais: CountryCode) {
  switch (pais) {
    case "BR": return "CPF";
    case "PT": return "NIF";
    case "US": return "SSN";
    case "ES": return "NIF";
    case "FR": return "NUMERO_FISCAL";
    default: return "TAX_ID";
  }
}

function tipoPrevidenciaPadrao(pais: CountryCode) {
  switch (pais) {
    case "BR": return "PIS_PASEP_NIT";
    case "PT": return "NISS";
    case "FR": return "SECURITE_SOCIALE";
    case "ES": return "NUSS_NAF";
    case "US": return "SSN";
    case "GB": return "NATIONAL_INSURANCE_NUMBER";
    default: return "SOCIAL_SECURITY_ID";
  }
}

function moedaPadraoPais(pais: CountryCode) {
  if (pais === "BR") return "BRL";
  if (pais === "US") return "USD";
  if (pais === "GB") return "GBP";
  if (pais === "CA") return "CAD";
  if (pais === "AU") return "AUD";
  if (pais === "CH") return "CHF";
  if (pais === "JP") return "JPY";

  const paisesEuro = new Set<CountryCode>([
    "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR",
    "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT",
    "NL", "PT", "SI", "SK",
  ]);

  return paisesEuro.has(pais) ? "EUR" : "";
}

function paisUsaIban(pais: CountryCode) {
  const paises = new Set<CountryCode>([
    "AD", "AT", "BE", "BG", "CH", "CY", "CZ", "DE",
    "DK", "EE", "ES", "FI", "FR", "GB", "GI", "GR",
    "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU",
    "LV", "MC", "MT", "NL", "NO", "PL", "PT", "RO",
    "SE", "SI", "SK", "SM", "VA",
  ]);
  return paises.has(pais);
}

function formatarCodigoPostal(valor: string, pais: CountryCode) {
  if (pais === "BR") {
    const n = valor.replace(/\D/g, "").slice(0, 8);
    return n.replace(/^(\d{5})(\d)/, "$1-$2");
  }
  if (pais === "PT") {
    const n = valor.replace(/\D/g, "").slice(0, 7);
    return n.replace(/^(\d{4})(\d)/, "$1-$2");
  }
  if (pais === "US") {
    const n = valor.replace(/\D/g, "").slice(0, 9);
    return n.replace(/^(\d{5})(\d)/, "$1-$2");
  }
  return valor.slice(0, 20);
}

type ContaBancariaForm = {
  paisCodigo: CountryCode;
  moeda: string;
  bancoNome: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  tipoChavePix: string;
  chavePix: string;
  iban: string;
  bicSwift: string;
  routingNumber: string;
  sortCode: string;
  titularNome: string;
  titularDocumento: string;
};

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

type DepartamentoOption = {
  id: number;
  nome: string;
};

type CargoOption = {
  id: number;
  nome: string;
  ativo: boolean;
  departamentoId: number;
  quantidadeFuncionarios?: number;
};

function formatarMoeda(
  valor: any,
  locale: string,
  currency: string
) {
  const numero = Number(valor || 0);
  const moeda = /^[A-Z]{3}$/.test(currency)
    ? currency
    : "BRL";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: moeda,
  }).format(numero);
}

function numero(v: any) {
  return Number(v || 0);
}

function formatarHoras(v: number) {
  const sinal = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sinal}${Math.abs(v).toFixed(2)}h`;
}

function formatarDataHora(
  valor: any,
  locale: string
) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString(locale);
}

function formatarDataSemFuso(
  valor: any,
  locale: string
) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleDateString(locale, {
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

function traduzirTipoRemuneracao(
  tipo: any,
  t: any
) {
  switch (String(tipo || "").toUpperCase()) {
    case "MENSAL":
      return t("detail.remuneration.types.monthly");
    case "HORA_AULA":
      return t("detail.remuneration.types.classHour");
    case "HORA_TRABALHADA":
      return t("detail.remuneration.types.workedHour");
    case "POR_AULA":
      return t("detail.remuneration.types.perClass");
    case "POR_TURMA":
      return t("detail.remuneration.types.perClassGroup");
    case "POR_DISCIPLINA":
      return t("detail.remuneration.types.perSubject");
    case "MISTO":
      return t("detail.remuneration.types.mixed");
    case "SEM_REMUNERACAO":
      return t("detail.remuneration.types.none");
    default:
      return tipo || t("detail.common.notInformed");
  }
}

function traduzirOrigemHistorico(
  origem: any,
  t: any
) {
  switch (String(origem || "").toUpperCase()) {
    case "FUNCIONARIOS_RH_CADASTRO":
      return t("detail.history.origins.initialHire");
    case "FUNCIONARIOS_RH_EDICAO":
      return t("detail.history.origins.employeeRecord");
    case "FUNCIONARIOS_RH_PROFESSOR":
      return t("detail.history.origins.teacherByHr");
    case "PROFESSORES_RH":
      return t("detail.history.origins.teacherRecord");
    default:
      return origem || t("detail.history.origins.remunerationChange");
  }
}

function ResumoRemuneracao({
  dados,
  t,
  locale,
  currency,
}: {
  dados: any;
  t: any;
  locale: string;
  currency: string;
}) {
  const valores = obterDadosRemuneracao(dados);

  const itens = [
    {
      label: t("detail.remuneration.modality"),
      valor: traduzirTipoRemuneracao(
        valores.tipoRemuneracao,
        t
      ),
    },
    {
      label: t("detail.remuneration.monthlySalary"),
      valor:
        valores.salarioBase !== null &&
          valores.salarioBase !== undefined
          ? formatarMoeda(valores.salarioBase, locale, currency)
          : null,
    },
    {
      label: t("detail.remuneration.classHourValue"),
      valor:
        valores.valorHoraAula !== null &&
          valores.valorHoraAula !== undefined
          ? formatarMoeda(valores.valorHoraAula, locale, currency)
          : null,
    },
    {
      label: t("detail.remuneration.workedHourValue"),
      valor:
        valores.valorHoraTrabalhada !== null &&
          valores.valorHoraTrabalhada !== undefined
          ? formatarMoeda(valores.valorHoraTrabalhada, locale, currency)
          : null,
    },
    {
      label: t("detail.remuneration.perClassValue"),
      valor:
        valores.valorPorAula !== null &&
          valores.valorPorAula !== undefined
          ? formatarMoeda(valores.valorPorAula, locale, currency)
          : null,
    },
    {
      label: t("detail.remuneration.perClassGroupValue"),
      valor:
        valores.valorPorTurma !== null &&
          valores.valorPorTurma !== undefined
          ? formatarMoeda(valores.valorPorTurma, locale, currency)
          : null,
    },
    {
      label: t("detail.remuneration.perSubjectValue"),
      valor:
        valores.valorPorDisciplina !== null &&
          valores.valorPorDisciplina !== undefined
          ? formatarMoeda(valores.valorPorDisciplina, locale, currency)
          : null,
    },
    {
      label: t("detail.remuneration.classHourDuration"),
      valor:
        valores.duracaoHoraAulaMinutos !== null &&
          valores.duracaoHoraAulaMinutos !== undefined
          ? t("detail.remuneration.minutesValue", {
              value: valores.duracaoHoraAulaMinutos,
            })
          : null,
    },
    {
      label: t("detail.remuneration.weeklyLoad"),
      valor:
        valores.cargaHorariaSemanal !== null &&
          valores.cargaHorariaSemanal !== undefined
          ? `${valores.cargaHorariaSemanal}h`
          : null,
    },
    {
      label: t("detail.remuneration.monthlyLoad"),
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
  const t = useTranslations("AdminFuncionarios");
  const locale = useLocale();
  const paisPadrao = paisInicial(locale);

  const paisesDisponiveis = useMemo(() => {
    const nomes = new Intl.DisplayNames(
      [locale],
      { type: "region" }
    );

    return getCountries()
      .map((codigo) => ({
        codigo,
        nome: nomes.of(codigo) || codigo,
      }))
      .sort((a, b) =>
        a.nome.localeCompare(b.nome, locale)
      );
  }, [locale]);

  function nomePais(codigo?: string | null) {
    if (!codigoPaisValido(codigo)) {
      return codigo || "-";
    }
    return paisesDisponiveis.find(
      (item) => item.codigo === codigo.toUpperCase()
    )?.nome || codigo.toUpperCase();
  }

  function rotuloTipoDocumento(tipo?: string | null) {
    switch (String(tipo || "").toUpperCase()) {
      case "CIN": return "CIN";
      case "RG": return "RG";
      case "CNH": return t("international.documentTypes.driverLicense");
      case "CARTAO_CIDADAO": return t("international.documentTypes.citizenCard");
      case "STATE_ID": return t("international.documentTypes.stateId");
      case "PERMANENT_RESIDENT_CARD": return t("international.documentTypes.permanentResidentCard");
      case "DNI": return "DNI";
      case "NIE": return "NIE";
      case "TIE": return "TIE";
      case "CNI": return "CNI";
      case "PASSAPORTE":
      case "PASSPORT": return t("international.documentTypes.passport");
      case "TITULO_RESIDENCIA":
      case "RESIDENCE_PERMIT": return t("international.documentTypes.residencePermit");
      case "NATIONAL_ID": return t("international.documentTypes.nationalId");
      default: return tipo || t("international.documentTypes.nationalId");
    }
  }

  function rotuloTipoDocumentoFiscal(tipo?: string | null) {
    switch (String(tipo || "").toUpperCase()) {
      case "CPF": return "CPF";
      case "NIF": return "NIF";
      case "SSN": return "SSN";
      case "ITIN": return "ITIN";
      case "NUMERO_FISCAL": return t("international.fiscalTypes.taxNumber");
      case "TAX_ID": return t("international.fiscalTypes.taxId");
      default: return tipo || t("international.fiscalTypes.taxId");
    }
  }

  function opcoesDocumentoIdentidade(pais: CountryCode): readonly OpcaoDocumentoInternacional[] {
    switch (pais) {
      case "BR": return [["CIN","CIN"],["RG","RG"],["CNH",t("international.documentTypes.driverLicense")],["PASSAPORTE",t("international.documentTypes.passport")]] as const;
      case "PT": return [["CARTAO_CIDADAO",t("international.documentTypes.citizenCard")],["PASSAPORTE",t("international.documentTypes.passport")],["TITULO_RESIDENCIA",t("international.documentTypes.residencePermit")],["CNH",t("international.documentTypes.driverLicense")]] as const;
      case "US": return [["STATE_ID",t("international.documentTypes.stateId")],["CNH",t("international.documentTypes.driverLicense")],["PASSAPORTE",t("international.documentTypes.passport")],["PERMANENT_RESIDENT_CARD",t("international.documentTypes.permanentResidentCard")]] as const;
      case "ES": return [["DNI","DNI"],["NIE","NIE"],["TIE","TIE"],["PASSAPORTE",t("international.documentTypes.passport")],["CNH",t("international.documentTypes.driverLicense")]] as const;
      case "FR": return [["CNI","CNI"],["PASSAPORTE",t("international.documentTypes.passport")],["TITULO_RESIDENCIA",t("international.documentTypes.residencePermit")],["CNH",t("international.documentTypes.driverLicense")]] as const;
      default: return [["NATIONAL_ID",t("international.documentTypes.nationalId")],["PASSAPORTE",t("international.documentTypes.passport")],["RESIDENCE_PERMIT",t("international.documentTypes.residencePermit")],["CNH",t("international.documentTypes.driverLicense")]] as const;
    }
  }

  function opcoesDocumentoFiscal(pais: CountryCode): readonly OpcaoDocumentoInternacional[] {
    switch (pais) {
      case "BR": return [["CPF","CPF"]] as const;
      case "PT": return [["NIF","NIF"]] as const;
      case "US": return [["SSN","SSN"],["ITIN","ITIN"],["TAX_ID",t("international.fiscalTypes.taxId")]] as const;
      case "ES": return [["NIF","NIF"],["NIE","NIE"]] as const;
      case "FR": return [["NUMERO_FISCAL",t("international.fiscalTypes.taxNumber")]] as const;
      default: return [["TAX_ID",t("international.fiscalTypes.taxId")]] as const;
    }
  }

  function rotulosEndereco(pais: CountryCode) {
    return {
      codigoPostal: pais === "BR" ? t("international.address.postalBR") : pais === "PT" ? t("international.address.postalPT") : pais === "US" ? t("international.address.postalUS") : pais === "FR" ? t("international.address.postalFR") : pais === "ES" ? t("international.address.postalES") : t("international.address.postalGeneric"),
      endereco: t("international.address.streetAddress"),
      numero: pais === "US" ? t("international.address.numberUS") : t("international.address.number"),
      complemento: pais === "US" ? t("international.address.complementUS") : t("international.address.complement"),
      bairro: pais === "PT" ? t("international.address.districtPT") : pais === "US" ? t("international.address.districtUS") : t("international.address.district"),
      cidade: pais === "PT" ? t("international.address.cityPT") : t("international.address.city"),
      estado: pais === "BR" ? t("international.address.regionBR") : pais === "PT" ? t("international.address.regionPT") : pais === "US" ? t("international.address.regionUS") : pais === "ES" ? t("international.address.regionES") : pais === "FR" ? t("international.address.regionFR") : t("international.address.regionGeneric"),
    };
  }

  function rotuloPrevidencia(pais: CountryCode) {
    switch (pais) {
      case "BR": return t("socialSecurity.types.br");
      case "PT": return t("socialSecurity.types.pt");
      case "FR": return t("socialSecurity.types.fr");
      case "ES": return t("socialSecurity.types.es");
      case "US": return t("socialSecurity.types.us");
      case "GB": return t("socialSecurity.types.gb");
      default: return t("socialSecurity.types.generic");
    }
  }

  function rotuloStatusFuncionario(status?: string | null) {
    switch (String(status || "").toUpperCase()) {
      case "ATIVO": return t("detail.status.active");
      case "DEMITIDO": return t("detail.status.dismissed");
      case "AFASTADO": return t("detail.status.leave");
      case "FERIAS": return t("detail.status.vacation");
      case "READMITIDO": return t("detail.status.rehired");
      default: return status || "-";
    }
  }

  const [funcionario, setFuncionario] = useState<any>(null);

  const [polos, setPolos] =
    useState<PoloLotacao[]>([]);

  const [
    departamentos,
    setDepartamentos,
  ] = useState<DepartamentoOption[]>([]);

  const [
    cargosDepartamento,
    setCargosDepartamento,
  ] = useState<CargoOption[]>([]);

  const [
    carregandoCargos,
    setCarregandoCargos,
  ] = useState(false);

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
    paisResidencia: paisPadrao as CountryCode,
    nacionalidade: "",
    paisTelefone: paisPadrao as CountryCode,
    telefone: "",
    tipoDocumento: tipoDocumentoPadrao(paisPadrao),
    numeroDocumento: "",
    tipoDocumentoFiscal: tipoDocumentoFiscalPadrao(paisPadrao),
    numeroDocumentoFiscal: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    cargo: "",
    cargoId: "",
    departamentoId: "",
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
    paisIdentificacaoPrevidenciaria:
      paisPadrao as CountryCode,
    tipoIdentificacaoPrevidenciaria:
      tipoPrevidenciaPadrao(paisPadrao),
    numeroIdentificacaoPrevidenciaria: "",
  });

  const [contaBancaria, setContaBancaria] =
    useState<ContaBancariaForm>({
      paisCodigo: paisPadrao,
      moeda: moedaPadraoPais(paisPadrao),
      bancoNome: "",
      agencia: "",
      conta: "",
      tipoConta: "",
      tipoChavePix: "",
      chavePix: "",
      iban: "",
      bicSwift: "",
      routingNumber: "",
      sortCode: "",
      titularNome: "",
      titularDocumento: "",
    });

  const [editandoBanco, setEditandoBanco] = useState(false);
  const [salvandoBanco, setSalvandoBanco] = useState(false);

  const paisFuncionarioAtual: CountryCode =
    codigoPaisValido(funcionario?.paisResidencia)
      ? (String(funcionario.paisResidencia).toUpperCase() as CountryCode)
      : funcionario?.cpf || funcionario?.rg
        ? "BR"
        : paisPadrao;

  const moedaFuncionario =
    (contaBancaria.moeda ||
      moedaPadraoPais(paisFuncionarioAtual) ||
      "BRL").toUpperCase();

  const formatarMoedaAtual = (valor: any) =>
    formatarMoeda(valor, locale, moedaFuncionario);

  const formatarDataHoraAtual = (valor: any) =>
    formatarDataHora(valor, locale);

  const formatarDataSemFusoAtual = (valor: any) =>
    formatarDataSemFuso(valor, locale);

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

  const inputFotoRef =
    useRef<HTMLInputElement | null>(null);

  const [erroFoto, setErroFoto] = useState<{
    titulo: string;
    mensagem: string;
  } | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

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

  async function carregarDepartamentos() {
    try {
      const res = await fetch(
        "/api/departamento",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        console.error(
          "Erro ao carregar departamentos:",
          data?.error || res.statusText
        );

        setDepartamentos([]);
        return;
      }

      const lista =
        Array.isArray(data)
          ? data
          : [];

      setDepartamentos(
        lista
          .map((departamento: any) => ({
            id: Number(
              departamento?.id
            ),

            nome: String(
              departamento?.nome || ""
            ).trim(),
          }))
          .filter(
            (
              departamento:
                DepartamentoOption
            ) =>
              Number.isInteger(
                departamento.id
              ) &&
              departamento.id > 0 &&
              departamento.nome.length > 0
          )
      );
    } catch (error) {
      console.error(
        "Erro ao carregar departamentos:",
        error
      );

      setDepartamentos([]);
    }
  }

  async function carregarCargosDoDepartamento(
    departamentoIdValue: string,
    cargoIdAtual = "",
    cargoNomeAtual = ""
  ) {
    if (!departamentoIdValue) {
      setCargosDepartamento([]);
      return;
    }

    try {
      setCarregandoCargos(true);

      const res = await fetch(
        `/api/departamento/${departamentoIdValue}/cargos`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("detail.messages.loadPositionsError")
        );
      }

      const recebidos = Array.isArray(data)
        ? data
        : Array.isArray(data?.cargos)
          ? data.cargos
          : [];

      const lista: CargoOption[] =
        recebidos
          .map((item: any) => ({
            id: Number(item?.id),

            nome: String(
              item?.nome || ""
            ).trim(),

            ativo:
              item?.ativo !== false,

            departamentoId: Number(
              item?.departamentoId ||
              departamentoIdValue
            ),

            quantidadeFuncionarios:
              Number(
                item?.quantidadeFuncionarios ??
                item?._count?.funcionarios ??
                0
              ),
          }))
          .filter(
            (item: CargoOption) =>
              Number.isInteger(item.id) &&
              item.id > 0 &&
              item.nome &&
              (
                item.ativo ||
                String(item.id) ===
                String(cargoIdAtual)
              )
          );

      setCargosDepartamento(lista);

      if (cargoIdAtual) {
        const encontradoPorId =
          lista.find(
            (item) =>
              String(item.id) ===
              String(cargoIdAtual)
          );

        if (encontradoPorId) {
          setFormGeral((anterior) => ({
            ...anterior,
            cargoId:
              String(encontradoPorId.id),
            cargo:
              encontradoPorId.nome,
          }));

          return;
        }
      }

      if (cargoNomeAtual.trim()) {
        const nomeNormalizado =
          cargoNomeAtual
            .trim()
            .toLocaleLowerCase(
              "pt-BR"
            );

        const encontradoPorNome =
          lista.find(
            (item) =>
              item.nome
                .trim()
                .toLocaleLowerCase(
                  "pt-BR"
                ) ===
              nomeNormalizado
          );

        if (encontradoPorNome) {
          setFormGeral((anterior) => ({
            ...anterior,
            cargoId:
              String(encontradoPorNome.id),
            cargo:
              encontradoPorNome.nome,
          }));

          return;
        }
      }
    } catch (error) {
      console.error(
        "Erro ao carregar cargos:",
        error
      );

      setCargosDepartamento([]);
    } finally {
      setCarregandoCargos(false);
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
        throw new Error(data.error || t("detail.messages.loadEmployeeError"));
      }

      console.log("FUNCIONARIO RECEBIDO:", data.funcionario);

      setFuncionario(data.funcionario);

      const departamentoAtualId =
        data.funcionario.departamento?.id
          ? String(
            data.funcionario.departamento.id
          )
          : data.funcionario.departamentoId
            ? String(
              data.funcionario.departamentoId
            )
            : "";

      const cargoAtualId =
        data.funcionario.cargoId
          ? String(
            data.funcionario.cargoId
          )
          : "";

      const paisResidenciaAtual =
        codigoPaisValido(
          data.funcionario.paisResidencia
        )
          ? (String(
              data.funcionario.paisResidencia
            ).toUpperCase() as CountryCode)
          : data.funcionario.cpf || data.funcionario.rg
            ? "BR"
            : paisPadrao;

      const paisTelefoneAtual =
        codigoPaisValido(
          data.funcionario.paisTelefone
        )
          ? (String(
              data.funcionario.paisTelefone
            ).toUpperCase() as CountryCode)
          : paisResidenciaAtual;

      setFormGeral({
        nome: data.funcionario.nome || "",
        paisResidencia: paisResidenciaAtual,
        nacionalidade: data.funcionario.nacionalidade || "",
        paisTelefone: paisTelefoneAtual,
        telefone: data.funcionario.telefone || "",
        tipoDocumento:
          data.funcionario.tipoDocumento ||
          (data.funcionario.rg
            ? "RG"
            : tipoDocumentoPadrao(paisResidenciaAtual)),
        numeroDocumento:
          data.funcionario.numeroDocumento ||
          data.funcionario.rg ||
          "",
        tipoDocumentoFiscal:
          data.funcionario.tipoDocumentoFiscal ||
          (data.funcionario.cpf
            ? "CPF"
            : tipoDocumentoFiscalPadrao(paisResidenciaAtual)),
        numeroDocumentoFiscal:
          data.funcionario.numeroDocumentoFiscal ||
          data.funcionario.cpf ||
          "",
        endereco: data.funcionario.endereco || "",
        numero: data.funcionario.numero || "",
        complemento: data.funcionario.complemento || "",
        bairro: data.funcionario.bairro || "",
        cidade: data.funcionario.cidade || "",
        estado: data.funcionario.estado || "",
        cep: data.funcionario.cep || "",

        cargo:
          data.funcionario.cargo || "",

        cargoId:
          cargoAtualId,

        departamentoId:
          departamentoAtualId,

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

      if (departamentoAtualId) {
        await carregarCargosDoDepartamento(
          departamentoAtualId,
          cargoAtualId,
          data.funcionario.cargo || ""
        );
      } else {
        setCargosDepartamento([]);
      }

      setCriarAcessoSistema(false);
      preencherFormTrabalhista(data.funcionario);
    } catch (e: any) {
      setErro(e.message || t("detail.messages.loadEmployeeError"));
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
      paisIdentificacaoPrevidenciaria:
        codigoPaisValido(
          f.paisIdentificacaoPrevidenciaria
        )
          ? (String(
              f.paisIdentificacaoPrevidenciaria
            ).toUpperCase() as CountryCode)
          : codigoPaisValido(f.paisResidencia)
            ? (String(f.paisResidencia).toUpperCase() as CountryCode)
            : f.cpf || f.rg
              ? "BR"
              : paisPadrao,
      tipoIdentificacaoPrevidenciaria:
        f.tipoIdentificacaoPrevidenciaria ||
        tipoPrevidenciaPadrao(
          codigoPaisValido(f.paisIdentificacaoPrevidenciaria)
            ? (String(f.paisIdentificacaoPrevidenciaria).toUpperCase() as CountryCode)
            : codigoPaisValido(f.paisResidencia)
              ? (String(f.paisResidencia).toUpperCase() as CountryCode)
              : f.cpf || f.rg
                ? "BR"
                : paisPadrao
        ),
      numeroIdentificacaoPrevidenciaria:
        f.numeroIdentificacaoPrevidenciaria ||
        f.pisPasep ||
        "",
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

  async function carregarContaBancariaFuncionario() {
    try {
      const res = await fetch(
        `/api/admin/funcionarios/${funcionarioId}/conta-bancaria`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) return;

      const conta = data?.conta;
      const paisFallback =
        codigoPaisValido(funcionario?.paisResidencia)
          ? (String(funcionario.paisResidencia).toUpperCase() as CountryCode)
          : funcionario?.cpf || funcionario?.rg
            ? "BR"
            : paisPadrao;

      if (!conta) {
        setContaBancaria({
          paisCodigo: paisFallback,
          moeda: moedaPadraoPais(paisFallback),
          bancoNome: "",
          agencia: "",
          conta: "",
          tipoConta: "",
          tipoChavePix: "",
          chavePix: "",
          iban: "",
          bicSwift: "",
          routingNumber: "",
          sortCode: "",
          titularNome: funcionario?.nome || "",
          titularDocumento:
            funcionario?.numeroDocumentoFiscal ||
            funcionario?.cpf ||
            "",
        });
        return;
      }

      const paisConta =
        codigoPaisValido(conta.paisCodigo)
          ? (String(conta.paisCodigo).toUpperCase() as CountryCode)
          : paisFallback;

      setContaBancaria({
        paisCodigo: paisConta,
        moeda: conta.moeda || moedaPadraoPais(paisConta),
        bancoNome: conta.bancoNome || "",
        agencia: conta.agencia || "",
        conta: conta.conta || "",
        tipoConta: conta.tipoConta || "",
        tipoChavePix: conta.tipoChavePix || "",
        chavePix: conta.chavePix || "",
        iban: conta.iban || "",
        bicSwift: conta.bicSwift || "",
        routingNumber: conta.routingNumber || "",
        sortCode: conta.sortCode || "",
        titularNome: conta.titularNome || funcionario?.nome || "",
        titularDocumento:
          conta.titularDocumento ||
          funcionario?.numeroDocumentoFiscal ||
          funcionario?.cpf ||
          "",
      });
    } catch {
      // A ficha continua disponível mesmo se a conta bancária falhar.
    }
  }

  async function salvarContaBancariaFuncionario(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setSalvandoBanco(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/admin/funcionarios/${funcionarioId}/conta-bancaria`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...contaBancaria,
            bancoNome: contaBancaria.bancoNome,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || t("bank.errors.save")
        );
      }

      setSucesso(t("bank.saved"));
      setEditandoBanco(false);
      await carregarContaBancariaFuncionario();
      await carregarFuncionario();
    } catch (e: any) {
      setErro(
        e?.message || t("bank.errors.save")
      );
    } finally {
      setSalvandoBanco(false);
    }
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
        throw new Error(data.error || t("detail.messages.loadBenefitsError"));
      }

      setBeneficiosDisponiveis(data.beneficiosDisponiveis || []);
      setBeneficiosVinculados(data.beneficiosVinculados || []);
    } catch (e: any) {
      setErro(e.message || t("detail.messages.loadBenefitsError"));
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

  async function enviarFotoOficialFuncionario(
    arquivo: File | null
  ) {
    if (!arquivo) return;

    setErro("");
    setErroFoto(null);

    const formatosPermitidos = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    const extensao =
      arquivo.name
        .split(".")
        .pop()
        ?.toUpperCase() || "desconhecido";

    if (!formatosPermitidos.includes(arquivo.type)) {
      setErroFoto({
        titulo: t("detail.photo.invalidFormatTitle"),
        mensagem: t("detail.photo.invalidFormatMessage", { format: extensao }),
      });

      return;
    }

    const limiteBytes = 2 * 1024 * 1024;

    if (arquivo.size > limiteBytes) {
      const tamanhoMb = (
        arquivo.size /
        (1024 * 1024)
      )
        .toFixed(2)
        .replace(".", ",");

      setErroFoto({
        titulo: t("detail.photo.tooLargeTitle"),
        mensagem: t("detail.photo.tooLargeMessage", { size: tamanhoMb }),
      });

      return;
    }

    try {
      setEnviandoFotoPerfil(true);
      setSucesso("");

      const formData = new FormData();
      formData.append("file", arquivo);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("detail.photo.uploadFailedStatus", { status: res.status })
        );
      }

      const url =
        data?.url ||
        data?.fileUrl ||
        data?.arquivoUrl ||
        data?.publicUrl;

      if (!url) {
        throw new Error(
          t("detail.photo.noUrl")
        );
      }

      setFormGeral((anterior) => ({
        ...anterior,
        fotoPerfil: url,
      }));

      setSucesso(
        t("detail.photo.uploaded")
      );
    } catch (e: any) {
      const motivo =
        e?.message ||
        t("detail.photo.serverReceiveError");

      setErroFoto({
        titulo: t("detail.photo.uploadErrorTitle"),
        mensagem: `${motivo} ${t("detail.photo.uploadErrorHelp")}`,
      });
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
      setErro(t("detail.messages.selectFile"));
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
        throw new Error(data.error || t("detail.messages.documentUploadError"));
      }

      setSucesso(t("detail.messages.documentUploaded"));
      setNovoDocumento({ tipo: "RG", titulo: "RG", arquivo: null, url: "" });
      await carregarDocumentosFuncionario();
    } catch (e: any) {
      setErro(e.message || t("detail.messages.documentUploadError"));
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
        t("detail.messages.selectNewUnit")
      );
      return;
    }

    if (!vigenciaLotacao) {
      setErro(
        t("detail.messages.assignmentDateRequired")
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
        t("detail.messages.transferReasonRequired")
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
          t("detail.messages.assignmentUpdateError")
        );
      }

      setSucesso(
        data?.message ||
        t("detail.messages.assignmentUpdated")
      );

      fecharModalLotacao();

      await carregarFuncionario();
    } catch (error: any) {
      setErro(
        error?.message ||
        t("detail.messages.assignmentUpdateError")
      );
    } finally {
      setSalvandoLotacao(false);
    }
  }

  useEffect(() => {
    if (!funcionarioId) return;

    carregarFuncionario();
    carregarPolos();
    carregarDepartamentos();
    carregarBeneficios();
    carregarBancoHorasFuncionario();
    carregarDocumentosFuncionario();
    carregarContaBancariaFuncionario();
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
        throw new Error(data.error || t("detail.messages.linkBenefitError"));
      }

      setSucesso(t("detail.messages.benefitLinked"));
      setBeneficioId("");
      setValor("");
      setPercentual("");
      setDescontaFolha(true);

      await carregarBeneficios();
    } catch (e: any) {
      setErro(e.message || t("detail.messages.linkBenefitError"));
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
        t("detail.messages.nameRequired")
      );
      return;
    }

    if (
      (possuiAcessoAtual ||
        vaiCriarAcesso) &&
      !formGeral.email.trim()
    ) {
      setErro(
        t("detail.messages.emailRequired")
      );
      return;
    }

    if (
      (possuiAcessoAtual ||
        vaiCriarAcesso) &&
      !formGeral.role
    ) {
      setErro(
        t("detail.messages.roleRequired")
      );
      return;
    }

    if (
      formGeral.departamentoId &&
      cargosDepartamento.length > 0 &&
      !formGeral.cargoId
    ) {
      setErro(
        t("detail.messages.positionRequired")
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

            paisResidencia:
              formGeral.paisResidencia,
            nacionalidade:
              formGeral.nacionalidade,
            paisTelefone:
              formGeral.paisTelefone,
            telefone:
              formGeral.telefone,
            tipoDocumento:
              formGeral.tipoDocumento,
            numeroDocumento:
              formGeral.numeroDocumento,
            tipoDocumentoFiscal:
              formGeral.tipoDocumentoFiscal,
            numeroDocumentoFiscal:
              formGeral.numeroDocumentoFiscal,
            endereco:
              formGeral.endereco,
            numero:
              formGeral.numero,
            complemento:
              formGeral.complemento,
            bairro:
              formGeral.bairro,
            cidade:
              formGeral.cidade,
            estado:
              formGeral.estado,
            cep:
              formGeral.cep,

            cargo:
              formGeral.cargo,

            cargoId:
              formGeral.cargoId
                ? Number(
                  formGeral.cargoId
                )
                : null,

            departamentoId:
              formGeral.departamentoId
                ? Number(
                  formGeral.departamentoId
                )
                : null,

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
          t("detail.messages.saveError")
        );
      }

      setSucesso(
        data.message ||
        (data.acessoCriado
          ? t("detail.messages.accessCreated")
          : t("detail.messages.generalUpdated"))
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
        t("detail.messages.saveError")
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
        t("detail.messages.remunerationTypeRequired")
      );
      return;
    }

    if (
      tipoRemuneracao === "MENSAL" &&
      !possuiValor(formTrabalhista.salarioBase)
    ) {
      setErro(
        t("detail.messages.monthlySalaryRequired")
      );
      return;
    }

    if (
      tipoRemuneracao === "HORA_AULA" &&
      !possuiValor(formTrabalhista.valorHoraAula)
    ) {
      setErro(t("detail.messages.classHourRequired"));
      return;
    }

    if (
      tipoRemuneracao === "HORA_TRABALHADA" &&
      !possuiValor(
        formTrabalhista.valorHoraTrabalhada
      )
    ) {
      setErro(
        t("detail.messages.workedHourRequired")
      );
      return;
    }

    if (
      tipoRemuneracao === "POR_AULA" &&
      !possuiValor(formTrabalhista.valorPorAula)
    ) {
      setErro(t("detail.messages.perClassRequired"));
      return;
    }

    if (
      tipoRemuneracao === "POR_TURMA" &&
      !possuiValor(formTrabalhista.valorPorTurma)
    ) {
      setErro(t("detail.messages.perClassGroupRequired"));
      return;
    }

    if (
      tipoRemuneracao === "POR_DISCIPLINA" &&
      !possuiValor(
        formTrabalhista.valorPorDisciplina
      )
    ) {
      setErro(t("detail.messages.perSubjectRequired"));
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
          t("detail.messages.mixedValueRequired")
        );
        return;
      }
    }

    if (
      houveAlteracaoRemuneracao &&
      !motivoAlteracaoRemuneracao.trim()
    ) {
      setErro(
        t("detail.messages.remunerationReasonRequired")
      );
      return;
    }

    if (
      houveAlteracaoRemuneracao &&
      !vigenciaInicioRemuneracao
    ) {
      setErro(
        t("detail.messages.remunerationDateRequired")
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
          t("detail.messages.workSaveError")
        );
      }

      setSucesso(
        houveAlteracaoRemuneracao
          ? t("detail.messages.workAndRemunerationUpdated")
          : t("detail.messages.workUpdated")
      );

      setEditandoTrabalhista(false);

      setMotivoAlteracaoRemuneracao("");
      setVigenciaInicioRemuneracao("");

      await carregarFuncionario();
    } catch (e: any) {
      setErro(
        e.message ||
        t("detail.messages.workSaveError")
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
            ← {t("detail.navigation.back")}
          </Link>

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold">{t("detail.title")}</h1>

          {funcionario && (
            <form
              onSubmit={salvarDadosGerais}
              className="mt-6 rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">👤 {t("international.personalTitle")}</h2>

                {!editandoGeral ? (
                  <button
                    type="button"
                    onClick={() => setEditandoGeral(true)}
                    className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/10"
                  >
                    {t("detail.actions.editGeneral")}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={salvando}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                      {salvando ? t("buttons.saving") : t("buttons.save")}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormGeral({
                          nome:
                            funcionario.nome || "",
                          paisResidencia:
                            codigoPaisValido(funcionario.paisResidencia)
                              ? (String(funcionario.paisResidencia).toUpperCase() as CountryCode)
                              : funcionario.cpf || funcionario.rg
                                ? "BR"
                                : paisPadrao,
                          nacionalidade:
                            funcionario.nacionalidade || "",
                          paisTelefone:
                            codigoPaisValido(funcionario.paisTelefone)
                              ? (String(funcionario.paisTelefone).toUpperCase() as CountryCode)
                              : codigoPaisValido(funcionario.paisResidencia)
                                ? (String(funcionario.paisResidencia).toUpperCase() as CountryCode)
                                : funcionario.cpf || funcionario.rg
                                  ? "BR"
                                  : paisPadrao,
                          telefone:
                            funcionario.telefone || "",
                          tipoDocumento:
                            funcionario.tipoDocumento ||
                            (funcionario.rg ? "RG" : tipoDocumentoPadrao(
                              codigoPaisValido(funcionario.paisResidencia)
                                ? (String(funcionario.paisResidencia).toUpperCase() as CountryCode)
                                : funcionario.cpf || funcionario.rg
                                  ? "BR"
                                  : paisPadrao
                            )),
                          numeroDocumento:
                            funcionario.numeroDocumento || funcionario.rg || "",
                          tipoDocumentoFiscal:
                            funcionario.tipoDocumentoFiscal ||
                            (funcionario.cpf ? "CPF" : tipoDocumentoFiscalPadrao(
                              codigoPaisValido(funcionario.paisResidencia)
                                ? (String(funcionario.paisResidencia).toUpperCase() as CountryCode)
                                : funcionario.cpf || funcionario.rg
                                  ? "BR"
                                  : paisPadrao
                            )),
                          numeroDocumentoFiscal:
                            funcionario.numeroDocumentoFiscal || funcionario.cpf || "",
                          endereco: funcionario.endereco || "",
                          numero: funcionario.numero || "",
                          complemento: funcionario.complemento || "",
                          bairro: funcionario.bairro || "",
                          cidade: funcionario.cidade || "",
                          estado: funcionario.estado || "",
                          cep: funcionario.cep || "",
                          cargo:
                            funcionario.cargo || "",

                          cargoId:
                            funcionario.cargoId
                              ? String(
                                funcionario.cargoId
                              )
                              : "",

                          departamentoId:
                            funcionario.departamento?.id
                              ? String(
                                funcionario.departamento.id
                              )
                              : funcionario.departamentoId
                                ? String(
                                  funcionario.departamentoId
                                )
                                : "",

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

                        const departamentoOriginalId =
                          funcionario.departamento?.id
                            ? String(
                              funcionario.departamento.id
                            )
                            : funcionario.departamentoId
                              ? String(
                                funcionario.departamentoId
                              )
                              : "";

                        if (departamentoOriginalId) {
                          void carregarCargosDoDepartamento(
                            departamentoOriginalId,
                            funcionario.cargoId
                              ? String(
                                funcionario.cargoId
                              )
                              : "",
                            funcionario.cargo || ""
                          );
                        } else {
                          setCargosDepartamento([]);
                        }

                        setCriarAcessoSistema(false);
                        setEditandoGeral(false);
                      }}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
                    >
                      {t("buttons.cancel")}
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
                          alt={funcionario.nome || t("detail.photo.alt")}
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
                        {t("detail.photo.title")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t("detail.photo.description")}
                      </p>
                    </div>
                  </div>
                  <div><p className="text-slate-400">{t("fields.name")}</p><p>{funcionario.nome || "-"}</p></div>
                  <div><p className="text-slate-400">{t("international.countryOfResidence")}</p><p>{nomePais(funcionario.paisResidencia || (funcionario.cpf || funcionario.rg ? "BR" : null))}</p></div>
                  <div><p className="text-slate-400">{t("international.nationality")}</p><p>{funcionario.nacionalidade || "-"}</p></div>
                  <div><p className="text-slate-400">{rotuloTipoDocumentoFiscal(funcionario.tipoDocumentoFiscal || (funcionario.cpf ? "CPF" : null))}</p><p>{funcionario.numeroDocumentoFiscal || funcionario.cpf || "-"}</p></div>
                  <div><p className="text-slate-400">{rotuloTipoDocumento(funcionario.tipoDocumento || (funcionario.rg ? "RG" : null))}</p><p>{funcionario.numeroDocumento || funcionario.rg || "-"}</p></div>
                  <div><p className="text-slate-400">{t("fields.phone")}</p><p>{funcionario.telefone || "-"}</p></div>
                  {(funcionario.endereco || funcionario.cidade || funcionario.cep) && (
                    <div className="md:col-span-3">
                      <p className="text-slate-400">{t("international.address.title")}</p>
                      <p>
                        {[
                          funcionario.endereco,
                          funcionario.numero,
                          funcionario.complemento,
                          funcionario.bairro,
                          funcionario.cidade,
                          funcionario.estado,
                          funcionario.cep,
                        ].filter(Boolean).join(", ") || "-"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400">
                      {t("detail.fields.position")}
                    </p>

                    <p>
                      {funcionario.cargo || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      {t("detail.fields.department")}
                    </p>

                    <p>
                      {funcionario.departamento?.nome || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      {t("detail.fields.locationUnit")}
                    </p>

                    <p
                      className={
                        funcionario.polo
                          ? "font-semibold text-slate-900 dark:text-white"
                          : "font-semibold text-amber-700 dark:text-amber-300"
                      }
                    >
                      {funcionario.polo?.nome ||
                        t("detail.assignment.notDefined")}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      {t("detail.fields.code")}
                    </p>

                    <p>
                      {funcionario.codigoFuncionario || "-"}
                    </p>
                  </div>
                  <div><p className="text-slate-400">{t("detail.fields.status")}</p><p>{rotuloStatusFuncionario(funcionario.statusFuncionario)}</p></div>
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
                            {t("detail.access.title")}
                          </p>

                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {t("detail.access.email")}: {funcionario.user.email}
                          </p>

                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {t("detail.access.role")}: {" "}
                            {funcionario.user.role ===
                              "ADMIN"
                              ? t("detail.access.roles.admin")
                              : t("detail.access.roles.employee")}
                          </p>

                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {t("detail.access.status")}: {" "}
                            {funcionario.user.ativo ===
                              false
                              ? t("detail.status.blocked")
                              : t("detail.status.active")}
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
                          {t("detail.access.hasAccess")}
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
                            {t("detail.access.noAccess")}
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {t("detail.access.noAccessDescription")}
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
                          {t("detail.access.create")}
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
                            alt={formGeral.nome || t("detail.photo.alt")}
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
                          {t("detail.photo.title")}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {t("detail.photo.editDescription")}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                            {enviandoFotoPerfil ? t("detail.actions.uploading") : t("detail.actions.uploadPhoto")}
                            <input
                              ref={inputFotoRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              disabled={enviandoFotoPerfil}
                              onChange={(e) => {
                                const arquivo =
                                  e.currentTarget.files?.[0] || null;

                                e.currentTarget.value = "";

                                void enviarFotoOficialFuncionario(
                                  arquivo
                                );
                              }}
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
                              {t("detail.actions.removePhoto")}
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
                            {t("detail.access.create")}
                          </span>

                          <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {t("detail.access.createDescription")}
                          </span>
                        </span>
                      </label>
                    </div>
                  )}

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("fields.name")}</span>
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
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("international.countryOfResidence")}</span>
                     <select
                       value={formGeral.paisResidencia}
                       onChange={(e) => {
                         const novoPais = e.target.value as CountryCode;
                         setFormGeral((p) => ({
                           ...p,
                           paisResidencia: novoPais,
                           cep: formatarCodigoPostal(p.cep, novoPais),
                           paisTelefone: p.telefone.trim() ? p.paisTelefone : novoPais,
                           tipoDocumento: tipoDocumentoPadrao(novoPais),
                           numeroDocumento: "",
                           tipoDocumentoFiscal: tipoDocumentoFiscalPadrao(novoPais),
                           numeroDocumentoFiscal: "",
                         }));
                       }}
                       className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                     >
                       {paisesDisponiveis.map((pais) => (
                         <option key={pais.codigo} value={pais.codigo}>
                           {bandeiraPais(pais.codigo)} {pais.nome}
                         </option>
                       ))}
                     </select>
                   </label>

                   <label className="space-y-1">
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("international.nationality")}</span>
                     <input
                       value={formGeral.nacionalidade}
                       onChange={(e) => setFormGeral((p) => ({ ...p, nacionalidade: e.target.value }))}
                       className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                     />
                   </label>

                   <label className="space-y-1">
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("fields.phone")}</span>
                     <CampoTelefoneInternacional
                       value={formGeral.telefone}
                       pais={formGeral.paisTelefone}
                       onChange={(valor, pais) =>
                         setFormGeral((p) => ({ ...p, telefone: valor, paisTelefone: pais }))
                       }
                       placeholder={t("international.phonePlaceholder")}
                     />
                   </label>

                   <label className="space-y-1">
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("international.identityType")}</span>
                     <select
                       value={formGeral.tipoDocumento}
                       onChange={(e) => setFormGeral((p) => ({ ...p, tipoDocumento: e.target.value }))}
                       className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                     >
                       {opcoesDocumentoIdentidade(formGeral.paisResidencia).map(([valor, rotulo]) => (
                         <option key={valor} value={valor}>{rotulo}</option>
                       ))}
                     </select>
                   </label>

                   <label className="space-y-1">
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("international.identityNumber")}</span>
                     <input
                       value={formGeral.numeroDocumento}
                       onChange={(e) => setFormGeral((p) => ({ ...p, numeroDocumento: e.target.value }))}
                       className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                     />
                   </label>

                   <label className="space-y-1">
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("international.fiscalType")}</span>
                     <select
                       value={formGeral.tipoDocumentoFiscal}
                       onChange={(e) => setFormGeral((p) => ({ ...p, tipoDocumentoFiscal: e.target.value }))}
                       className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                     >
                       {opcoesDocumentoFiscal(formGeral.paisResidencia).map(([valor, rotulo]) => (
                         <option key={valor} value={valor}>{rotulo}</option>
                       ))}
                     </select>
                   </label>

                   <label className="space-y-1">
                     <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("international.fiscalNumber")}</span>
                     <input
                       value={formGeral.numeroDocumentoFiscal}
                       onChange={(e) => setFormGeral((p) => ({ ...p, numeroDocumentoFiscal: e.target.value }))}
                       className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                     />
                   </label>

                   <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                     <h3 className="font-bold text-slate-900 dark:text-white">📍 {t("international.address.title")}</h3>
                     <div className="mt-4 grid gap-4 md:grid-cols-3">
                       {(() => {
                         const r = rotulosEndereco(formGeral.paisResidencia);
                         return (
                           <>
                             <label className="space-y-1"><span className="text-xs font-semibold">{r.codigoPostal}</span><input value={formGeral.cep} onChange={(e) => setFormGeral((p) => ({ ...p, cep: formatarCodigoPostal(e.target.value, p.paisResidencia) }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                             <label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold">{r.endereco}</span><input value={formGeral.endereco} onChange={(e) => setFormGeral((p) => ({ ...p, endereco: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                             <label className="space-y-1"><span className="text-xs font-semibold">{r.numero}</span><input value={formGeral.numero} onChange={(e) => setFormGeral((p) => ({ ...p, numero: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                             <label className="space-y-1"><span className="text-xs font-semibold">{r.complemento}</span><input value={formGeral.complemento} onChange={(e) => setFormGeral((p) => ({ ...p, complemento: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                             <label className="space-y-1"><span className="text-xs font-semibold">{r.bairro}</span><input value={formGeral.bairro} onChange={(e) => setFormGeral((p) => ({ ...p, bairro: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                             <label className="space-y-1"><span className="text-xs font-semibold">{r.cidade}</span><input value={formGeral.cidade} onChange={(e) => setFormGeral((p) => ({ ...p, cidade: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                             <label className="space-y-1"><span className="text-xs font-semibold">{r.estado}</span><input value={formGeral.estado} onChange={(e) => setFormGeral((p) => ({ ...p, estado: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                           </>
                         );
                       })()}
                     </div>
                   </div>

<label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("detail.fields.department")}
                    </span>

                    <select
                      value={
                        formGeral.departamentoId
                      }
                      onChange={(e) => {
                        const novoDepartamentoId =
                          e.target.value;

                        setFormGeral((anterior) => ({
                          ...anterior,
                          departamentoId:
                            novoDepartamentoId,
                          cargoId: "",
                          cargo: "",
                        }));

                        setCargosDepartamento([]);

                        if (novoDepartamentoId) {
                          void carregarCargosDoDepartamento(
                            novoDepartamentoId
                          );
                        }
                      }}
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
                      <option value="">
                        {t("detail.fields.noDepartment")}
                      </option>

                      {departamentos.map(
                        (departamento) => (
                          <option
                            key={departamento.id}
                            value={String(
                              departamento.id
                            )}
                          >
                            {departamento.nome}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("detail.fields.position")}
                    </span>

                    <select
                      value={formGeral.cargoId}
                      disabled={
                        !formGeral.departamentoId ||
                        carregandoCargos
                      }
                      onChange={(e) => {
                        const novoCargoId =
                          e.target.value;

                        const cargoSelecionado =
                          cargosDepartamento.find(
                            (item) =>
                              String(item.id) ===
                              novoCargoId
                          );

                        setFormGeral(
                          (anterior) => ({
                            ...anterior,
                            cargoId:
                              novoCargoId,
                            cargo:
                              cargoSelecionado?.nome ||
                              "",
                          })
                        );
                      }}
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
      disabled:cursor-not-allowed
      disabled:bg-slate-100
      disabled:text-slate-500
      dark:border-slate-700
      dark:bg-slate-950
      dark:text-white
      dark:disabled:bg-slate-800
      dark:disabled:text-slate-400
    "
                    >
                      <option value="">
                        {carregandoCargos
                          ? t("detail.fields.loadingPositions")
                          : !formGeral.departamentoId
                            ? t("detail.fields.selectDepartmentFirst")
                            : cargosDepartamento.length === 0
                              ? t("detail.fields.noActivePositions")
                              : t("detail.fields.selectPosition")}
                      </option>

                      {cargosDepartamento.map(
                        (cargo) => (
                          <option
                            key={cargo.id}
                            value={String(cargo.id)}
                          >
                            {cargo.nome}
                            {!cargo.ativo
                              ? ` — ${t("detail.status.inactive")}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("detail.fields.code")}</span>
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
                            {t("detail.access.email")}
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
                            {t("detail.access.role")}
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
                              {t("detail.access.roles.employee")}
                            </option>

                            <option value="ADMIN">
                              {t("detail.access.roles.admin")}
                            </option>
                          </select>
                        </label>
                      </>
                    )}

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("detail.fields.status")}</span>
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
                      <option value="ATIVO">{t("detail.status.active")}</option>
                      <option value="DEMITIDO">{t("detail.status.dismissed")}</option>
                      <option value="AFASTADO">{t("detail.status.leave")}</option>
                      <option value="FERIAS">{t("detail.status.vacation")}</option>
                      <option value="READMITIDO">{t("detail.status.rehired")}</option>
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
                    📍 {t("detail.assignment.title")}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t("detail.assignment.description")}
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
                    ? t("detail.assignment.transferUnit")
                    : t("detail.assignment.define")}
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
                  {t("detail.assignment.currentUnit")}
                </p>

                <p
                  className={
                    funcionario.polo
                      ? "mt-1 text-lg font-bold text-slate-900 dark:text-white"
                      : "mt-1 text-lg font-bold text-amber-700 dark:text-amber-300"
                  }
                >
                  {funcionario.polo?.nome ||
                    t("detail.assignment.notDefined")}
                </p>

                {funcionario.polo?.codigo && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t("detail.fields.code")}: {" "}
                    {funcionario.polo.codigo}
                  </p>
                )}

                {funcionario.professor && (
                  <p className="mt-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {t("detail.assignment.teacherSync")}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {t("detail.assignment.history")}
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
                    {t("detail.assignment.emptyHistory")}
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
                                ? t("detail.assignment.types.transfer")
                                : historico.tipo ===
                                  "CORRECAO"
                                  ? t("detail.assignment.types.correction")
                                  : t("detail.assignment.types.initial")}
                            </span>

                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {t("detail.assignment.effectiveAt")}: {" "}
                              {formatarDataHora(
                                historico.vigenciaEm,
                                locale
                              )}
                            </span>
                          </div>

                          <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                            {historico
                              .poloAnteriorNomeSnapshot ||
                              t("detail.assignment.noPreviousUnit")}
                            {" → "}
                            {historico
                              .poloNovoNomeSnapshot ||
                              historico.poloNovo?.nome ||
                              "-"}
                          </p>

                          {historico.motivo && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              <strong>{t("detail.fields.reason")}:</strong>{" "}
                              {historico.motivo}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {t("detail.assignment.registeredBy")}: {" "}
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
                        ? t("detail.assignment.transferEmployee")
                        : t("detail.assignment.define")}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {t("detail.fields.employee")}: {" "}
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
                    aria-label={t("buttons.close")}
                  >
                    ×
                  </button>
                </div>

                {funcionario?.polo && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {t("detail.assignment.currentUnit")}
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
                      {t("detail.assignment.selectUnit")}
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
                            ? ` — ${t("detail.assignment.currentUnit")}`
                            : !disponivel
                              ? ` — ${t("detail.status.inactive")}`
                              : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="mt-4 space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {t("detail.assignment.effectiveDate")}
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
                    {t("detail.assignment.transferReason")}
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
                        ? t("detail.messages.transferReasonRequired")
                        : t("detail.assignment.initialReasonPlaceholder")
                    }
                    required={
                      Boolean(funcionario?.polo)
                    }
                  />
                </div>

                <div className="mt-4 space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {t("detail.fields.notes")}
                  </label>

                  <textarea
                    value={observacoesLotacao}
                    onChange={(e) =>
                      setObservacoesLotacao(
                        e.target.value
                      )
                    }
                    className="min-h-[80px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t("detail.assignment.notesPlaceholder")}
                  />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={fecharModalLotacao}
                    disabled={salvandoLotacao}
                    className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t("buttons.cancel")}
                  </button>

                  <button
                    type="submit"
                    disabled={salvandoLotacao}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {salvandoLotacao
                      ? "Salvando..."
                      : funcionario?.polo
                        ? t("detail.assignment.confirmTransfer")
                        : t("detail.assignment.define")}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="mt-2 text-sm text-slate-400">
            {t("detail.assignment.footer")}
          </p>
        </div>

        {erroFoto && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-erro-foto"
          >
            <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-950">
                🖼️
              </div>

              <h2
                id="titulo-erro-foto"
                className="mt-4 text-xl font-bold text-slate-950 dark:text-white"
              >
                {erroFoto.titulo}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                {erroFoto.mensagem}
              </p>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setErroFoto(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {t("buttons.close")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErroFoto(null);

                    window.setTimeout(() => {
                      inputFotoRef.current?.click();
                    }, 0);
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
                >
                  {t("detail.actions.chooseAnotherPhoto")}
                </button>
              </div>
            </div>
          </div>
        )}

        {erro && (
          <PhanyxToast
            tipo="erro"
            titulo={t("detail.toast.errorTitle")}
            mensagem={erro}
            onClose={() => setErro("")}
          />
        )}

        {sucesso && (
          <PhanyxToast
            tipo="sucesso"
            titulo={t("detail.toast.successTitle")}
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
              <h2 className="text-lg font-bold">💼 {t("detail.work.title")}</h2>

              {!editandoTrabalhista ? (
                <button
                  type="button"
                  onClick={() => setEditandoTrabalhista(true)}
                  className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/10"
                >
                  {t("detail.work.edit")}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {salvando ? t("buttons.saving") : t("buttons.save")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      preencherFormTrabalhista(funcionario);
                      setEditandoTrabalhista(false);
                    }}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
                  >
                    {t("buttons.cancel")}
                  </button>
                </div>
              )}
            </div>

            {!editandoTrabalhista ? (
              <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
                <div><p className="text-slate-400">{t("detail.work.hireDate")}</p><p>{funcionario.dataAdmissao ? formatarDataSemFusoAtual(funcionario.dataAdmissao) : "-"}</p></div>
                <div><p className="text-slate-400">{t("detail.work.terminationDate")}</p><p>{funcionario.dataDesligamento ? formatarDataSemFusoAtual(funcionario.dataDesligamento) : "-"}</p></div>
                <div><p className="text-slate-400">{t("detail.work.baseSalary")}</p><p>{funcionario.salarioBase ? formatarMoedaAtual(funcionario.salarioBase) : "-"}</p></div>
                <div><p className="text-slate-400">{t("detail.work.currentSalary")}</p><p>{funcionario.salario ? formatarMoedaAtual(funcionario.salario) : "-"}</p></div>
                <div><p className="text-slate-400">{t("detail.work.contractType")}</p><p>{funcionario.tipoContrato || "-"}</p></div>
                <div><p className="text-slate-400">{t("detail.work.workSchedule")}</p><p>{funcionario.jornadaTrabalho || "-"}</p></div>
                <div><p className="text-slate-400">{t("detail.remuneration.monthlyLoad")}</p><p>{funcionario.cargaHorariaMensal ? `${funcionario.cargaHorariaMensal}h` : "-"}</p></div>
                <div><p className="text-slate-400">{t("detail.work.timeClockCode")}</p><p>{funcionario.codigoPonto || "-"}</p></div>
                <div>
                  <p className="text-slate-400">
                    {rotuloPrevidencia(
                      codigoPaisValido(funcionario.paisIdentificacaoPrevidenciaria)
                        ? (String(funcionario.paisIdentificacaoPrevidenciaria).toUpperCase() as CountryCode)
                        : codigoPaisValido(funcionario.paisResidencia)
                          ? (String(funcionario.paisResidencia).toUpperCase() as CountryCode)
                          : funcionario.cpf || funcionario.rg
                            ? "BR"
                            : paisPadrao
                    )}
                  </p>
                  <p>{funcionario.numeroIdentificacaoPrevidenciaria || funcionario.pisPasep || "-"}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                {[
                  ["dataAdmissao", t("detail.work.hireDate"), "date"],
                  ["dataDesligamento", t("detail.work.terminationDate"), "date"],
                  ["tipoContrato", t("detail.work.contractType"), "text"],
                  ["jornadaTrabalho", t("detail.work.workSchedule"), "text"],
                  ["cargaHorariaSemanal", t("detail.remuneration.weeklyLoad"), "number"],
                  ["cargaHorariaMensal", t("detail.remuneration.monthlyLoad"), "number"],
                  ["codigoPonto", t("detail.work.timeClockCode"), "text"],
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

                                 <label className="space-y-1">
                   <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                     {t("socialSecurity.country")}
                   </span>
                   <select
                     value={formTrabalhista.paisIdentificacaoPrevidenciaria}
                     onChange={(e) => {
                       const pais = e.target.value as CountryCode;
                       setFormTrabalhista((p) => ({
                         ...p,
                         paisIdentificacaoPrevidenciaria: pais,
                         tipoIdentificacaoPrevidenciaria: tipoPrevidenciaPadrao(pais),
                       }));
                     }}
                     className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                   >
                     {paisesDisponiveis.map((pais) => (
                       <option key={pais.codigo} value={pais.codigo}>
                         {bandeiraPais(pais.codigo)} {pais.nome}
                       </option>
                     ))}
                   </select>
                 </label>

                 <label className="space-y-1 md:col-span-2">
                   <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                     {rotuloPrevidencia(formTrabalhista.paisIdentificacaoPrevidenciaria)}
                   </span>
                   <input
                     value={formTrabalhista.numeroIdentificacaoPrevidenciaria}
                     onChange={(e) => setFormTrabalhista((p) => ({ ...p, numeroIdentificacaoPrevidenciaria: e.target.value }))}
                     className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                   />
                 </label>

<div className="md:col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    💰 {t("detail.remuneration.title")}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t("detail.remuneration.description")}
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("detail.remuneration.modality")}
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
                        <option value="">{t("common.select")}</option>
                        <option value="MENSAL">{t("detail.remuneration.types.monthly")}</option>
                        <option value="HORA_AULA">{t("detail.remuneration.types.classHour")}</option>
                        <option value="HORA_TRABALHADA">
                          {t("detail.remuneration.types.workedHour")}
                        </option>
                        <option value="POR_AULA">{t("detail.remuneration.types.perClass")}</option>
                        <option value="POR_TURMA">{t("detail.remuneration.types.perClassGroup")}</option>
                        <option value="POR_DISCIPLINA">
                          {t("detail.remuneration.types.perSubject")}
                        </option>
                        <option value="MISTO">{t("detail.remuneration.types.mixed")}</option>
                        <option value="SEM_REMUNERACAO">
                          {t("detail.remuneration.types.none")}
                        </option>
                      </select>
                    </label>

                    {(formTrabalhista.tipoRemuneracao === "MENSAL" ||
                      formTrabalhista.tipoRemuneracao === "MISTO") && (
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t("detail.remuneration.monthlySalary")}
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
                              {t("detail.remuneration.classHourValue")}
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
                              {t("detail.remuneration.classHourDuration")}
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
                                {t("detail.remuneration.minutes")}
                              </span>
                            </div>
                          </label>
                        </>
                      )}

                    {(formTrabalhista.tipoRemuneracao === "HORA_TRABALHADA" ||
                      formTrabalhista.tipoRemuneracao === "MISTO") && (
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t("detail.remuneration.workedHourValue")}
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
                            {t("detail.remuneration.perClassValue")}
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
                            {t("detail.remuneration.perClassGroupValue")}
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
                            {t("detail.remuneration.types.perSubject")}
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
                        {t("detail.remuneration.notes")}
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
                        placeholder={t("detail.remuneration.notesPlaceholder")}
                      />
                    </label>
                  </div>
                </div>

                {houveAlteracaoRemuneracao && (
                  <div className="md:col-span-4 rounded-2xl border border-amber-400/50 bg-amber-500/10 p-5">
                    <h3 className="font-bold">
                      🕒 {t("detail.remuneration.changeRecord")}
                    </h3>

                    <p className="mt-2 text-sm">
                      {t("detail.remuneration.changeDescription")}
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold">
                          {t("detail.history.effectiveStart")}
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
                        <span className="text-xs font-semibold">
                          {t("detail.remuneration.changeReason")}
                        </span>

                        <textarea
                          value={motivoAlteracaoRemuneracao}
                          onChange={(e) =>
                            setMotivoAlteracaoRemuneracao(e.target.value)
                          }
                          className="min-h-[100px] w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-amber-700 dark:bg-slate-950 dark:text-white"
                          placeholder={t("detail.remuneration.changeReasonPlaceholder")}
                        />
                      </label>
                    </div>

                    <p className="mt-3 text-xs opacity-80">
                      {t("detail.remuneration.auditNote")}
                    </p>
                  </div>
                )}


              </div>
            )}
          </form>
        )}

        {funcionario && (
          <form
            onSubmit={salvarContaBancariaFuncionario}
            className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/80"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">🏦 {t("bank.title")}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("bank.description")}</p>
              </div>

              {!editandoBanco ? (
                <button type="button" onClick={() => setEditandoBanco(true)} className="rounded-xl border border-blue-300 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40">
                  {t("bank.edit")}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button type="submit" disabled={salvandoBanco} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60">
                    {salvandoBanco ? t("buttons.saving") : t("bank.save")}
                  </button>
                  <button type="button" onClick={() => { setEditandoBanco(false); void carregarContaBancariaFuncionario(); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    {t("buttons.cancelEditing")}
                  </button>
                </div>
              )}
            </div>

            {!editandoBanco ? (
              <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
                <div><p className="text-slate-400">{t("bank.country")}</p><p>{nomePais(contaBancaria.paisCodigo)}</p></div>
                <div><p className="text-slate-400">{t("bank.currency")}</p><p>{contaBancaria.moeda || "-"}</p></div>
                <div><p className="text-slate-400">{t("bank.bankName")}</p><p>{contaBancaria.bancoNome || "-"}</p></div>
                {contaBancaria.paisCodigo === "BR" && (<><div><p className="text-slate-400">{t("fields.branch")}</p><p>{contaBancaria.agencia || "-"}</p></div><div><p className="text-slate-400">{t("fields.account")}</p><p>{contaBancaria.conta || "-"}</p></div><div><p className="text-slate-400">{t("bank.pixKey")}</p><p>{contaBancaria.chavePix || "-"}</p></div></>)}
                {contaBancaria.paisCodigo === "US" && (<><div><p className="text-slate-400">{t("bank.routingNumber")}</p><p>{contaBancaria.routingNumber || "-"}</p></div><div><p className="text-slate-400">{t("bank.accountNumber")}</p><p>{contaBancaria.conta || "-"}</p></div></>)}
                {contaBancaria.paisCodigo === "GB" && (<><div><p className="text-slate-400">{t("bank.sortCode")}</p><p>{contaBancaria.sortCode || "-"}</p></div><div><p className="text-slate-400">{t("bank.accountNumber")}</p><p>{contaBancaria.conta || "-"}</p></div></>)}
                {paisUsaIban(contaBancaria.paisCodigo) && contaBancaria.paisCodigo !== "GB" && (<><div><p className="text-slate-400">{t("bank.iban")}</p><p>{contaBancaria.iban || "-"}</p></div><div><p className="text-slate-400">{t("bank.bicSwift")}</p><p>{contaBancaria.bicSwift || "-"}</p></div></>)}
                {!paisUsaIban(contaBancaria.paisCodigo) && contaBancaria.paisCodigo !== "BR" && contaBancaria.paisCodigo !== "US" && (<><div><p className="text-slate-400">{t("bank.accountNumber")}</p><p>{contaBancaria.conta || "-"}</p></div><div><p className="text-slate-400">{t("bank.bicSwift")}</p><p>{contaBancaria.bicSwift || "-"}</p></div></>)}
                <div><p className="text-slate-400">{t("bank.holderName")}</p><p>{contaBancaria.titularNome || "-"}</p></div>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className="space-y-1"><span className="text-xs font-semibold">{t("bank.country")}</span><select value={contaBancaria.paisCodigo} onChange={(e) => { const pais=e.target.value as CountryCode; setContaBancaria((p)=>({...p,paisCodigo:pais,moeda:moedaPadraoPais(pais)})); }} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">{paisesDisponiveis.map((pais)=><option key={pais.codigo} value={pais.codigo}>{bandeiraPais(pais.codigo)} {pais.nome}</option>)}</select></label>
                <label className="space-y-1"><span className="text-xs font-semibold">{t("bank.currency")}</span><input value={contaBancaria.moeda} onChange={(e)=>setContaBancaria((p)=>({...p,moeda:e.target.value.toUpperCase().replace(/[^A-Z]/g,"").slice(0,3)}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                <label className="space-y-1"><span className="text-xs font-semibold">{t("bank.accountType")}</span><select value={contaBancaria.tipoConta} onChange={(e)=>setContaBancaria((p)=>({...p,tipoConta:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">{t("common.select")}</option><option value="CORRENTE">{t("bank.accountTypes.checking")}</option><option value="POUPANCA">{t("bank.accountTypes.savings")}</option><option value="SALARIO">{t("bank.accountTypes.payroll")}</option><option value="PAGAMENTO">{t("bank.accountTypes.payment")}</option><option value="OUTRA">{t("bank.accountTypes.other")}</option></select></label>
                <label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold">{t("bank.bankName")}</span>{contaBancaria.paisCodigo === "BR" ? <BuscaBanco value={contaBancaria.bancoNome} onChange={(valor)=>setContaBancaria((p)=>({...p,bancoNome:valor}))} placeholder={t("placeholders.bankSearch")} ariaLabel={t("placeholders.bankAria")} /> : <input value={contaBancaria.bancoNome} onChange={(e)=>setContaBancaria((p)=>({...p,bancoNome:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />}</label>
                {contaBancaria.paisCodigo === "BR" && (<><label className="space-y-1"><span className="text-xs font-semibold">{t("fields.branch")}</span><input value={contaBancaria.agencia} onChange={(e)=>setContaBancaria((p)=>({...p,agencia:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="space-y-1"><span className="text-xs font-semibold">{t("fields.account")}</span><input value={contaBancaria.conta} onChange={(e)=>setContaBancaria((p)=>({...p,conta:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="space-y-1"><span className="text-xs font-semibold">{t("bank.pixKeyType")}</span><select value={contaBancaria.tipoChavePix} onChange={(e)=>setContaBancaria((p)=>({...p,tipoChavePix:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">{t("common.select")}</option><option value="CPF">CPF</option><option value="CNPJ">CNPJ</option><option value="EMAIL">E-mail</option><option value="TELEFONE">{t("fields.phone")}</option><option value="ALEATORIA">{t("bank.pixTypes.random")}</option></select></label><label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold">{t("bank.pixKey")}</span><input value={contaBancaria.chavePix} onChange={(e)=>setContaBancaria((p)=>({...p,chavePix:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label></>)}
                {contaBancaria.paisCodigo === "US" && (<><label className="space-y-1"><span className="text-xs font-semibold">{t("bank.routingNumber")}</span><input value={contaBancaria.routingNumber} onChange={(e)=>setContaBancaria((p)=>({...p,routingNumber:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="space-y-1"><span className="text-xs font-semibold">{t("bank.accountNumber")}</span><input value={contaBancaria.conta} onChange={(e)=>setContaBancaria((p)=>({...p,conta:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label></>)}
                {contaBancaria.paisCodigo === "GB" && (<><label className="space-y-1"><span className="text-xs font-semibold">{t("bank.sortCode")}</span><input value={contaBancaria.sortCode} onChange={(e)=>setContaBancaria((p)=>({...p,sortCode:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="space-y-1"><span className="text-xs font-semibold">{t("bank.accountNumber")}</span><input value={contaBancaria.conta} onChange={(e)=>setContaBancaria((p)=>({...p,conta:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label></>)}
                {paisUsaIban(contaBancaria.paisCodigo) && contaBancaria.paisCodigo !== "GB" && (<><label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold">{t("bank.iban")}</span><input value={contaBancaria.iban} onChange={(e)=>setContaBancaria((p)=>({...p,iban:e.target.value.toUpperCase()}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="space-y-1"><span className="text-xs font-semibold">{t("bank.bicSwift")}</span><input value={contaBancaria.bicSwift} onChange={(e)=>setContaBancaria((p)=>({...p,bicSwift:e.target.value.toUpperCase()}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label></>)}
                {!paisUsaIban(contaBancaria.paisCodigo) && contaBancaria.paisCodigo !== "BR" && contaBancaria.paisCodigo !== "US" && (<><label className="space-y-1"><span className="text-xs font-semibold">{t("bank.accountNumber")}</span><input value={contaBancaria.conta} onChange={(e)=>setContaBancaria((p)=>({...p,conta:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="space-y-1"><span className="text-xs font-semibold">{t("bank.bicSwift")}</span><input value={contaBancaria.bicSwift} onChange={(e)=>setContaBancaria((p)=>({...p,bicSwift:e.target.value.toUpperCase()}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label></>)}
                <label className="space-y-1"><span className="text-xs font-semibold">{t("bank.holderName")}</span><input value={contaBancaria.titularNome} onChange={(e)=>setContaBancaria((p)=>({...p,titularNome:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                <label className="space-y-1"><span className="text-xs font-semibold">{t("bank.holderDocument")}</span><input value={contaBancaria.titularDocumento} onChange={(e)=>setContaBancaria((p)=>({...p,titularDocumento:e.target.value}))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              </div>
            )}
          </form>
        )}

        {funcionario && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/80">
            <div>
              <h2 className="text-lg font-bold">
                🕒 {t("detail.history.title")}
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {t("detail.history.description")}
              </p>
            </div>

            {!Array.isArray(
              funcionario.historicosRemuneracaoRH
            ) ||
              funcionario.historicosRemuneracaoRH.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                {t("detail.history.empty")}
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
                            {traduzirOrigemHistorico(historico.origem, t)}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {t("detail.history.registeredAt")} {" "}
                            {formatarDataHoraAtual(historico.alteradoEm)}
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
                              t("detail.common.profileNotInformed")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-red-400/50 bg-red-500/10 p-4">
                          <h4 className="mb-3 font-bold">
                            {t("detail.history.previousCondition")}
                          </h4>

                          <ResumoRemuneracao dados={historico.dadosAnteriores} t={t} locale={locale} currency={moedaFuncionario} />
                        </div>

                        <div className="rounded-xl border border-emerald-400/50 bg-emerald-500/10 p-4">
                          <h4 className="mb-3 font-bold">
                            {t("detail.history.newCondition")}
                          </h4>

                          <ResumoRemuneracao dados={historico.dadosNovos} t={t} locale={locale} currency={moedaFuncionario} />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                          <p className="font-semibold">
                            {t("detail.history.effectiveStart")}
                          </p>

                          <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {historico.origem ===
                              "FUNCIONARIOS_RH_CADASTRO"
                              ? `${formatarDataSemFusoAtual(historico.vigenciaInicio)} — ${t("detail.history.hireDateSuffix")}`
                              : formatarDataHoraAtual(historico.vigenciaInicio)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                          <p className="font-semibold">
                            {t("detail.history.recordedDateTime")}
                          </p>

                          <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {formatarDataHoraAtual(historico.alteradoEm)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-400/50 bg-amber-500/10 p-4 text-sm">
                        <p className="font-semibold">
                          {t("detail.fields.reason")}
                        </p>

                        <p className="mt-1 whitespace-pre-wrap">
                          {historico.motivo ||
                            t("detail.common.reasonNotInformed")}
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
            <h2 className="text-lg font-bold">📎 {t("detail.documents.title")}</h2>

            <p className="mt-2 text-sm text-slate-400">
              {t("detail.documents.description")}
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
                <option value="COMPROVANTE_RESIDENCIA">{t("detail.documents.types.proofOfAddress")}</option>
                <option value="CURRICULO">{t("detail.documents.types.resume")}</option>
                <option value="PORTFOLIO">{t("detail.documents.types.portfolio")}</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="BEHANCE">Behance</option>
                <option value="ARTSTATION">ArtStation</option>
                <option value="SITE">{t("detail.documents.types.website")}</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="VIMEO">Vimeo</option>
                <option value="INSTAGRAM">{t("detail.documents.types.professionalInstagram")}</option>
                <option value="GITHUB">GitHub</option>
                <option value="CERTIFICADOS">{t("detail.documents.types.certificates")}</option>
              </select>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <span className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold dark:border-slate-600">
                  {t("detail.documents.chooseFile")}
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                  {novoDocumento.arquivo?.name || t("detail.documents.noFileSelected")}
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.psd,.ai,.eps,.svg,.blend,.fbx,.obj,.glb,.gltf,.ma,.mb,.max,.zip,.rar"
                  onChange={(e) =>
                    setNovoDocumento((p) => ({
                      ...p,
                      arquivo: e.target.files?.[0] || null,
                    }))
                  }
                  className="hidden"
                />
              </label>

              <div className="md:col-span-3 space-y-3">
                <p className="text-sm font-semibold text-slate-100">
                  {t("detail.documents.linksTitle")}
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
                      <option value="Site">{t("detail.documents.types.personalWebsite")}</option>
                      <option value="Vimeo">Vimeo</option>
                      <option value="YouTube">YouTube</option>
                      <option value="GitHub">GitHub</option>
                      <option value="Instagram">{t("detail.documents.types.professionalInstagram")}</option>
                      <option value="Outro">{t("detail.common.other")}</option>
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
                      {t("buttons.remove")}
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
                  + {t("detail.documents.addLink")}
                </button>
              </div>

              <button
                type="submit"
                disabled={enviandoDocumento}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {enviandoDocumento ? t("detail.actions.uploading") : t("detail.documents.upload")}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t("detail.documents.uploadedTitle")}
              </h3>

              {documentosFuncionario.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("detail.documents.empty")}
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
                        {doc.titulo || t("detail.documents.document")}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span>{t("detail.documents.type")}: {doc.tipo || "-"}</span>

                        <span>
                          {doc.criadoEm
                            ? `${t("detail.documents.uploadedAt")}: ${formatarDataSemFusoAtual(doc.criadoEm)}`
                            : t("detail.common.dateNotInformed")}
                        </span>

                        <span>
                          {doc.arquivoUrl?.startsWith("http") ? t("detail.documents.available") : t("detail.documents.noFile")}
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
                          {t("detail.documents.open")}
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
              <h2 className="phanyx-rh-banco-titulo">📊 {t("detail.timeBank.title")}</h2>

              <Link href="/admin/rh/banco-horas" className="phanyx-rh-banco-link">
                {t("detail.timeBank.viewAll")}
              </Link>
            </div>

            <div className="phanyx-rh-banco-grid">
              <div className="phanyx-rh-banco-card credito">
                <p>{t("detail.timeBank.credits")}</p>
                <strong>{formatarHoras(resumoBancoHoras.creditos)}</strong>
              </div>

              <div className="phanyx-rh-banco-card debito">
                <p>{t("detail.timeBank.debits")}</p>
                <strong>{formatarHoras(-resumoBancoHoras.debitos)}</strong>
              </div>

              <div className="phanyx-rh-banco-card saldo">
                <p>{t("detail.timeBank.currentBalance")}</p>
                <strong>
                  {formatarHoras(resumoBancoHoras.saldo)}
                </strong>
              </div>

              <div className="phanyx-rh-banco-card registro">
                <p>{t("detail.timeBank.records")}</p>
                <strong>{resumoBancoHoras.registros}</strong>
              </div>
            </div>

            <div className="phanyx-rh-banco-ultimo">
              {t("detail.timeBank.lastClock")}: {" "}
              <strong>
                {resumoBancoHoras.ultimaData
                  ? formatarDataSemFusoAtual(resumoBancoHoras.ultimaData)
                  : "-"}
              </strong>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5">
          <h2 className="text-lg font-bold">🎁 {t("detail.benefits.title")}</h2>

          <form onSubmit={vincularBeneficio} className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("detail.benefits.benefit")}</span>
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
                <option value="">{t("common.select")}</option>
                {beneficiosDisponiveis.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("detail.benefits.value", { currency: moedaFuncionario })}</span>
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
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("detail.benefits.percentage")}</span>
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
              {t("detail.benefits.deductPayroll")}
            </label>

            <div className="md:col-span-4">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {salvando ? t("detail.benefits.linking") : t("detail.benefits.link")}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-bold">{t("detail.benefits.linkedTitle")}</h2>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-400">{t("common.loading")}</div>
          ) : beneficiosVinculados.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">
              {t("detail.benefits.empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-3">{t("detail.benefits.benefit")}</th>
                    <th className="p-3">{t("detail.documents.type")}</th>
                    <th className="p-3">{t("detail.benefits.valueShort")}</th>
                    <th className="p-3">{t("detail.benefits.percentageShort")}</th>
                    <th className="p-3">{t("detail.benefits.payroll")}</th>
                    <th className="p-3">{t("detail.fields.status")}</th>
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
                        {v.valor ? formatarMoedaAtual(v.valor) : "-"}
                      </td>
                      <td className="p-3 text-slate-300">
                        {v.percentual ? `${v.percentual}%` : "-"}
                      </td>
                      <td className="p-3">
                        {v.descontaFolha ? t("detail.benefits.deducts") : t("detail.benefits.doesNotDeduct")}
                      </td>
                      <td className="p-3">
                        {v.ativo ? t("detail.status.active") : t("detail.status.inactive")}
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