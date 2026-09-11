"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import Link from "next/link";
import BuscaBanco from "@/components/rh/BuscaBanco";
import { useLocale, useTranslations } from "next-intl";
import {
  getCountries,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import CampoTelefoneInternacional from "@/components/internacionalizacao/CampoTelefoneInternacional";

interface Departamento {
  id: number;
  nome: string;
}

interface CargoOption {
  id: number;
  nome: string;
  ativo: boolean;
  departamentoId: number;
  quantidadeFuncionarios?: number;
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

  paisTelefone?: string | null;
  nacionalidade?: string | null;
  paisResidencia?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  tipoDocumentoFiscal?: string | null;
  numeroDocumentoFiscal?: string | null;

  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;

  cargo?: string | null;
  cargoId?: number | null;
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
  paisIdentificacaoPrevidenciaria?: string | null;
  tipoIdentificacaoPrevidenciaria?: string | null;
  numeroIdentificacaoPrevidenciaria?: string | null;

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

type OpcaoDocumentoInternacional = readonly [string, string];

const PAIS_POR_LOCALE: Record<string, CountryCode> = {
  "pt-BR": "BR",
  "pt-PT": "PT",
  "en-US": "US",
  "es-ES": "ES",
  "fr-FR": "FR",
};

function paisInicial(
  locale: string
): CountryCode {
  return PAIS_POR_LOCALE[locale] || "BR";
}

function codigoPaisValido(
  valor: unknown
): valor is CountryCode {
  return (
    typeof valor === "string" &&
    getCountries().includes(
      valor.toUpperCase() as CountryCode
    )
  );
}

function bandeiraPais(
  codigo: CountryCode
) {
  return codigo
    .toUpperCase()
    .replace(
      /./g,
      (letra) =>
        String.fromCodePoint(
          127397 +
            letra.charCodeAt(0)
        )
    );
}

function tipoDocumentoPadrao(
  pais: CountryCode
) {
  switch (pais) {
    case "BR":
      return "CIN";
    case "PT":
      return "CARTAO_CIDADAO";
    case "US":
      return "STATE_ID";
    case "ES":
      return "DNI";
    case "FR":
      return "CNI";
    default:
      return "NATIONAL_ID";
  }
}

function tipoDocumentoFiscalPadrao(
  pais: CountryCode
) {
  switch (pais) {
    case "BR":
      return "CPF";
    case "PT":
      return "NIF";
    case "US":
      return "SSN";
    case "ES":
      return "NIF";
    case "FR":
      return "NUMERO_FISCAL";
    default:
      return "TAX_ID";
  }
}

function tipoPrevidenciaPadrao(
  pais: CountryCode
) {
  switch (pais) {
    case "BR":
      return "PIS_PASEP_NIT";
    case "PT":
      return "NISS";
    case "FR":
      return "SECURITE_SOCIALE";
    case "ES":
      return "NUSS_NAF";
    case "US":
      return "SSN";
    case "GB":
      return "NATIONAL_INSURANCE_NUMBER";
    default:
      return "SOCIAL_SECURITY_ID";
  }
}

function moedaPadraoPais(
  pais: CountryCode
) {
  if (pais === "BR") return "BRL";
  if (pais === "US") return "USD";
  if (pais === "GB") return "GBP";
  if (pais === "CA") return "CAD";
  if (pais === "AU") return "AUD";
  if (pais === "CH") return "CHF";
  if (pais === "JP") return "JPY";

  const paisesEuro = new Set<CountryCode>([
    "AT", "BE", "CY", "DE", "EE", "ES",
    "FI", "FR", "GR", "HR", "IE", "IT",
    "LT", "LU", "LV", "MT", "NL", "PT",
    "SI", "SK",
  ]);

  return paisesEuro.has(pais)
    ? "EUR"
    : "";
}

function paisUsaIban(
  pais: CountryCode
) {
  const paisesIban = new Set<CountryCode>([
    "AD", "AT", "BE", "BG", "CH", "CY",
    "CZ", "DE", "DK", "EE", "ES", "FI",
    "FR", "GB", "GI", "GR", "HR", "HU",
    "IE", "IS", "IT", "LI", "LT", "LU",
    "LV", "MC", "MT", "NL", "NO", "PL",
    "PT", "RO", "SE", "SI", "SK", "SM",
    "VA",
  ]);

  return paisesIban.has(pais);
}

function formatarCodigoPostal(
  valor: string,
  pais: CountryCode
) {
  if (pais === "BR") {
    const numeros = valor
      .replace(/\D/g, "")
      .slice(0, 8);

    return numeros.replace(
      /^(\d{5})(\d)/,
      "$1-$2"
    );
  }

  if (pais === "PT") {
    const numeros = valor
      .replace(/\D/g, "")
      .slice(0, 7);

    return numeros.replace(
      /^(\d{4})(\d)/,
      "$1-$2"
    );
  }

  if (pais === "US") {
    const numeros = valor
      .replace(/\D/g, "")
      .slice(0, 9);

    return numeros.replace(
      /^(\d{5})(\d)/,
      "$1-$2"
    );
  }

  if (
    pais === "ES" ||
    pais === "FR"
  ) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 5);
  }

  return valor
    .toUpperCase()
    .slice(0, 20);
}

function formatarTelefoneExibicao(
  valor?: string | null
) {
  const texto =
    String(valor || "").trim();

  if (!texto) {
    return "-";
  }

  try {
    const telefone =
      parsePhoneNumberFromString(
        texto
      );

    return telefone?.isValid()
      ? telefone.formatInternational()
      : texto;
  } catch {
    return texto;
  }
}

function dataParaInput(valor?: string | Date | null) {
  if (!valor) return "";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "";

  return data.toISOString().slice(0, 10);
}

function AdminFuncionariosPage() {
  const t = useTranslations("AdminFuncionarios");
  const locale = useLocale();

  const paisPadrao =
    paisInicial(locale);

  const paisesDisponiveis =
    useMemo(() => {
      const nomesPaises =
        new Intl.DisplayNames(
          [locale],
          { type: "region" }
        );

      return getCountries()
        .map((codigo) => ({
          codigo,
          nome:
            nomesPaises.of(codigo) ||
            codigo,
        }))
        .sort((a, b) =>
          a.nome.localeCompare(
            b.nome,
            locale
          )
        );
    }, [locale]);

  function nomePais(
    codigo?: string | null
  ) {
    if (
      !codigoPaisValido(
        codigo
      )
    ) {
      return codigo || "-";
    }

    return (
      paisesDisponiveis.find(
        (item) =>
          item.codigo ===
          codigo.toUpperCase()
      )?.nome ||
      codigo.toUpperCase()
    );
  }

  function rotuloPrevidencia(
    pais: CountryCode
  ) {
    switch (pais) {
      case "BR":
        return t("socialSecurity.types.br");
      case "PT":
        return t("socialSecurity.types.pt");
      case "FR":
        return t("socialSecurity.types.fr");
      case "ES":
        return t("socialSecurity.types.es");
      case "US":
        return t("socialSecurity.types.us");
      case "GB":
        return t("socialSecurity.types.gb");
      default:
        return t("socialSecurity.types.generic");
    }
  }

  function possuiDadosBancarios() {
    return Boolean(
      banco.trim() ||
      agencia.trim() ||
      conta.trim() ||
      pix.trim() ||
      iban.trim() ||
      bicSwift.trim() ||
      routingNumber.trim() ||
      sortCode.trim() ||
      titularConta.trim() ||
      titularDocumento.trim()
    );
  }

  async function salvarContaBancariaFuncionario(
    funcionarioId: number
  ) {
    if (!possuiDadosBancarios()) {
      return;
    }

    const res = await fetch(
      `/api/admin/funcionarios/${funcionarioId}/conta-bancaria`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paisCodigo: paisContaBancaria,
          moeda: moedaContaBancaria,
          bancoNome: banco,
          agencia,
          conta,
          tipoConta: tipoContaBancaria || null,
          tipoChavePix: tipoChavePix || null,
          chavePix: pix,
          iban,
          bicSwift,
          routingNumber,
          sortCode,
          titularNome: titularConta || nome,
          titularDocumento:
            titularDocumento ||
            numeroDocumentoFiscal,
          ativo: true,
        }),
      }
    );

    const data =
      await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        data?.error ||
        t("bank.errors.save")
      );
    }
  }

  async function carregarContaBancariaFuncionario(
    funcionarioId: number,
    paisFallback: CountryCode
  ) {
    try {
      const res = await fetch(
        `/api/admin/funcionarios/${funcionarioId}/conta-bancaria`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        return;
      }

      const contaBancaria = data?.conta;

      if (!contaBancaria) {
        setPaisContaBancaria(paisFallback);
        setMoedaContaBancaria(
          moedaPadraoPais(paisFallback)
        );
        return;
      }

      const paisConta =
        codigoPaisValido(
          contaBancaria.paisCodigo
        )
          ? (String(
              contaBancaria.paisCodigo
            ).toUpperCase() as CountryCode)
          : paisFallback;

      setPaisContaBancaria(paisConta);
      setMoedaContaBancaria(
        contaBancaria.moeda ||
        moedaPadraoPais(paisConta)
      );
      setBanco(
        contaBancaria.bancoNome || ""
      );
      setAgencia(
        contaBancaria.agencia || ""
      );
      setConta(
        contaBancaria.conta || ""
      );
      setTipoContaBancaria(
        contaBancaria.tipoConta || ""
      );
      setTipoChavePix(
        contaBancaria.tipoChavePix || ""
      );
      setPix(
        contaBancaria.chavePix || ""
      );
      setIban(
        contaBancaria.iban || ""
      );
      setBicSwift(
        contaBancaria.bicSwift || ""
      );
      setRoutingNumber(
        contaBancaria.routingNumber || ""
      );
      setSortCode(
        contaBancaria.sortCode || ""
      );
      setTitularConta(
        contaBancaria.titularNome || ""
      );
      setTitularDocumento(
        contaBancaria.titularDocumento || ""
      );
    } catch {
      // Mantém os valores legados já carregados no formulário.
    }
  }

  function rotuloTipoDocumento(
    tipo?: string | null
  ) {
    switch (
      String(tipo || "").toUpperCase()
    ) {
      case "CIN":
        return "CIN";
      case "RG":
        return "RG";
      case "CNH":
        return t(
          "international.documentTypes.driverLicense"
        );
      case "CARTAO_CIDADAO":
        return t(
          "international.documentTypes.citizenCard"
        );
      case "STATE_ID":
        return t(
          "international.documentTypes.stateId"
        );
      case "PERMANENT_RESIDENT_CARD":
        return t(
          "international.documentTypes.permanentResidentCard"
        );
      case "DNI":
        return "DNI";
      case "NIE":
        return "NIE";
      case "TIE":
        return "TIE";
      case "CNI":
        return "CNI";
      case "PASSAPORTE":
      case "PASSPORT":
        return t(
          "international.documentTypes.passport"
        );
      case "TITULO_RESIDENCIA":
      case "RESIDENCE_PERMIT":
        return t(
          "international.documentTypes.residencePermit"
        );
      case "NATIONAL_ID":
        return t(
          "international.documentTypes.nationalId"
        );
      default:
        return (
          tipo ||
          t(
            "international.documentTypes.nationalId"
          )
        );
    }
  }

  function rotuloTipoDocumentoFiscal(
    tipo?: string | null
  ) {
    switch (
      String(tipo || "").toUpperCase()
    ) {
      case "CPF":
        return "CPF";
      case "NIF":
        return "NIF";
      case "SSN":
        return "SSN";
      case "ITIN":
        return "ITIN";
      case "NUMERO_FISCAL":
        return t(
          "international.fiscalTypes.taxNumber"
        );
      case "TAX_ID":
        return t(
          "international.fiscalTypes.taxId"
        );
      default:
        return (
          tipo ||
          t(
            "international.fiscalTypes.taxId"
          )
        );
    }
  }

  function opcoesDocumentoIdentidade(
    pais: CountryCode
  ): readonly OpcaoDocumentoInternacional[] {
    switch (pais) {
      case "BR":
        return [
          ["CIN", "CIN"],
          ["RG", "RG"],
          [
            "CNH",
            t(
              "international.documentTypes.driverLicense"
            ),
          ],
          [
            "PASSAPORTE",
            t(
              "international.documentTypes.passport"
            ),
          ],
        ] as const;

      case "PT":
        return [
          [
            "CARTAO_CIDADAO",
            t(
              "international.documentTypes.citizenCard"
            ),
          ],
          [
            "PASSAPORTE",
            t(
              "international.documentTypes.passport"
            ),
          ],
          [
            "TITULO_RESIDENCIA",
            t(
              "international.documentTypes.residencePermit"
            ),
          ],
          [
            "CNH",
            t(
              "international.documentTypes.driverLicense"
            ),
          ],
        ] as const;

      case "US":
        return [
          [
            "STATE_ID",
            t(
              "international.documentTypes.stateId"
            ),
          ],
          [
            "CNH",
            t(
              "international.documentTypes.driverLicense"
            ),
          ],
          [
            "PASSAPORTE",
            t(
              "international.documentTypes.passport"
            ),
          ],
          [
            "PERMANENT_RESIDENT_CARD",
            t(
              "international.documentTypes.permanentResidentCard"
            ),
          ],
        ] as const;

      case "ES":
        return [
          ["DNI", "DNI"],
          ["NIE", "NIE"],
          ["TIE", "TIE"],
          [
            "PASSAPORTE",
            t(
              "international.documentTypes.passport"
            ),
          ],
          [
            "CNH",
            t(
              "international.documentTypes.driverLicense"
            ),
          ],
        ] as const;

      case "FR":
        return [
          ["CNI", "CNI"],
          [
            "PASSAPORTE",
            t(
              "international.documentTypes.passport"
            ),
          ],
          [
            "TITULO_RESIDENCIA",
            t(
              "international.documentTypes.residencePermit"
            ),
          ],
          [
            "CNH",
            t(
              "international.documentTypes.driverLicense"
            ),
          ],
        ] as const;

      default:
        return [
          [
            "NATIONAL_ID",
            t(
              "international.documentTypes.nationalId"
            ),
          ],
          [
            "PASSAPORTE",
            t(
              "international.documentTypes.passport"
            ),
          ],
          [
            "RESIDENCE_PERMIT",
            t(
              "international.documentTypes.residencePermit"
            ),
          ],
          [
            "CNH",
            t(
              "international.documentTypes.driverLicense"
            ),
          ],
        ] as const;
    }
  }

  function opcoesDocumentoFiscal(
    pais: CountryCode
  ): readonly OpcaoDocumentoInternacional[] {
    switch (pais) {
      case "BR":
        return [["CPF", "CPF"]] as const;

      case "PT":
        return [["NIF", "NIF"]] as const;

      case "US":
        return [
          ["SSN", "SSN"],
          ["ITIN", "ITIN"],
          [
            "TAX_ID",
            t(
              "international.fiscalTypes.taxId"
            ),
          ],
        ] as const;

      case "ES":
        return [
          ["NIF", "NIF"],
          ["NIE", "NIE"],
        ] as const;

      case "FR":
        return [
          [
            "NUMERO_FISCAL",
            t(
              "international.fiscalTypes.taxNumber"
            ),
          ],
        ] as const;

      default:
        return [
          [
            "TAX_ID",
            t(
              "international.fiscalTypes.taxId"
            ),
          ],
        ] as const;
    }
  }

  function rotulosEndereco(
    pais: CountryCode
  ) {
    return {
      codigoPostal:
        pais === "BR"
          ? t(
              "international.address.postalBR"
            )
          : pais === "PT"
            ? t(
                "international.address.postalPT"
              )
            : pais === "US"
              ? t(
                  "international.address.postalUS"
                )
              : pais === "FR"
                ? t(
                    "international.address.postalFR"
                  )
                : pais === "ES"
                  ? t(
                      "international.address.postalES"
                    )
                  : t(
                      "international.address.postalGeneric"
                    ),

      endereco:
        t(
          "international.address.streetAddress"
        ),

      numero:
        pais === "US"
          ? t(
              "international.address.numberUS"
            )
          : t(
              "international.address.number"
            ),

      complemento:
        pais === "US"
          ? t(
              "international.address.complementUS"
            )
          : t(
              "international.address.complement"
            ),

      bairro:
        pais === "PT"
          ? t(
              "international.address.districtPT"
            )
          : pais === "US"
            ? t(
                "international.address.districtUS"
              )
            : t(
                "international.address.district"
              ),

      cidade:
        pais === "PT"
          ? t(
              "international.address.cityPT"
            )
          : t(
              "international.address.city"
            ),

      estado:
        pais === "BR"
          ? t(
              "international.address.regionBR"
            )
          : pais === "PT"
            ? t(
                "international.address.regionPT"
              )
            : pais === "US"
              ? t(
                  "international.address.regionUS"
                )
              : pais === "ES"
                ? t(
                    "international.address.regionES"
                  )
                : pais === "FR"
                  ? t(
                      "international.address.regionFR"
                    )
                  : t(
                      "international.address.regionGeneric"
                    ),
    };
  }

  function mensagemErroApi(
    data: any,
    fallback: string
  ) {
    switch (
      String(
        data?.code || ""
      ).toUpperCase()
    ) {
      case "INVALID_COUNTRY":
        return t(
          "international.errors.invalidCountry"
        );
      case "INVALID_PHONE_COUNTRY":
        return t(
          "international.errors.invalidPhoneCountry"
        );
      case "INVALID_PHONE":
        return t(
          "international.errors.invalidPhone"
        );
      default:
        return (
          data?.error ||
          fallback
        );
    }
  }

  function traduzirRole(role?: string) {
    switch (String(role || "").toUpperCase()) {
      case "ADMIN":
        return t("roles.admin");
      case "SECRETARIA":
        return t("roles.secretariat");
      case "COORDENADOR":
        return t("roles.coordinator");
      case "FINANCEIRO":
        return t("roles.finance");
      case "SUPORTE":
        return t("roles.support");
      default:
        return role || "-";
    }
  }

  function traduzirStatusFuncionario(status?: string) {
    switch (String(status || "").toUpperCase()) {
      case "ATIVO":
        return t("status.active");
      case "DEMITIDO":
        return t("status.dismissed");
      case "AFASTADO":
        return t("status.onLeave");
      case "ADVERTENCIA":
        return t("status.warning");
      case "FERIAS":
        return t("status.vacation");
      case "READMITIDO":
        return t("status.rehired");
      default:
        return status || "-";
    }
  }
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

  const [
    paisResidencia,
    setPaisResidencia,
  ] = useState<CountryCode>(
    paisPadrao
  );

  const [
    paisTelefone,
    setPaisTelefone,
  ] = useState<CountryCode>(
    paisPadrao
  );

  const [
    nacionalidade,
    setNacionalidade,
  ] = useState("");

  const [
    tipoDocumento,
    setTipoDocumento,
  ] = useState(
    tipoDocumentoPadrao(
      paisPadrao
    )
  );

  const [
    numeroDocumento,
    setNumeroDocumento,
  ] = useState("");

  const [
    tipoDocumentoFiscal,
    setTipoDocumentoFiscal,
  ] = useState(
    tipoDocumentoFiscalPadrao(
      paisPadrao
    )
  );

  const [
    numeroDocumentoFiscal,
    setNumeroDocumentoFiscal,
  ] = useState("");

  const [
    telefone,
    setTelefone,
  ] = useState("");

  const [endereco, setEndereco] =
    useState("");
  const [numero, setNumero] =
    useState("");
  const [
    complemento,
    setComplemento,
  ] = useState("");
  const [bairro, setBairro] =
    useState("");
  const [cidade, setCidade] =
    useState("");
  const [estado, setEstado] =
    useState("");
  const [cep, setCep] =
    useState("");

  const [cargo, setCargo] = useState("");
  const [cargoId, setCargoId] = useState("");

  const [
    cargosDepartamento,
    setCargosDepartamento,
  ] = useState<CargoOption[]>([]);

  const [
    carregandoCargos,
    setCarregandoCargos,
  ] = useState(false);
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

  const [
    paisIdentificacaoPrevidenciaria,
    setPaisIdentificacaoPrevidenciaria,
  ] = useState<CountryCode>(paisPadrao);

  const [
    tipoIdentificacaoPrevidenciaria,
    setTipoIdentificacaoPrevidenciaria,
  ] = useState(
    tipoPrevidenciaPadrao(paisPadrao)
  );

  const [
    numeroIdentificacaoPrevidenciaria,
    setNumeroIdentificacaoPrevidenciaria,
  ] = useState("");

  const [
    paisContaBancaria,
    setPaisContaBancaria,
  ] = useState<CountryCode>(paisPadrao);

  const [
    moedaContaBancaria,
    setMoedaContaBancaria,
  ] = useState(
    moedaPadraoPais(paisPadrao)
  );

  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [tipoContaBancaria, setTipoContaBancaria] = useState("");
  const [tipoChavePix, setTipoChavePix] = useState("");
  const [pix, setPix] = useState("");
  const [iban, setIban] = useState("");
  const [bicSwift, setBicSwift] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [titularConta, setTitularConta] = useState("");
  const [titularDocumento, setTitularDocumento] = useState("");

  const [documentosFuncionario, setDocumentosFuncionario] = useState<
    { tipo: string; titulo: string; arquivo: File | null }[]
  >([
    {
      tipo: "DOCUMENTO_IDENTIDADE",
      titulo: t(
        "documents.identityDocument"
      ),
      arquivo: null,
    },
    {
      tipo: "DOCUMENTO_FISCAL",
      titulo: t(
        "documents.taxDocument"
      ),
      arquivo: null,
    },
    {
      tipo: "PASSAPORTE",
      titulo: t(
        "documents.passport"
      ),
      arquivo: null,
    },
    {
      tipo: "CARTEIRA_MOTORISTA",
      titulo: t(
        "documents.driverLicense"
      ),
      arquivo: null,
    },
    {
      tipo: "COMPROVANTE_RESIDENCIA",
      titulo: t(
        "documents.residenceProof"
      ),
      arquivo: null,
    },
    {
      tipo: "CURRICULO",
      titulo: t(
        "documents.resume"
      ),
      arquivo: null,
    },
    {
      tipo: "PORTFOLIO",
      titulo: t(
        "documents.portfolio"
      ),
      arquivo: null,
    },
    {
      tipo: "CERTIFICADOS",
      titulo: t(
        "documents.certificates"
      ),
      arquivo: null,
    },
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

  async function carregarCargosDoDepartamento(
    departamentoIdValue: string,
    cargoIdAtual = "",
    cargoNomeAtual = ""
  ) {
    if (!departamentoIdValue) {
      setCargosDepartamento([]);
      setCargoId("");
      setCargo("");
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

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("errors.loadJobs")
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
                item
                  ?.quantidadeFuncionarios ??
                item?._count
                  ?.funcionarios ??
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
                cargoIdAtual
              )
          );

      setCargosDepartamento(lista);

      if (cargoIdAtual) {
        const cargoEncontrado =
          lista.find(
            (item) =>
              String(item.id) ===
              String(cargoIdAtual)
          );

        if (cargoEncontrado) {
          setCargoId(
            String(cargoEncontrado.id)
          );
          setCargo(
            cargoEncontrado.nome
          );
          return;
        }
      }

      if (cargoNomeAtual.trim()) {
        const nomeNormalizado =
          cargoNomeAtual
            .trim()
            .toLocaleLowerCase(
              locale
            );

        const cargoPorNome =
          lista.find(
            (item) =>
              item.nome
                .trim()
                .toLocaleLowerCase(
                  locale
                ) ===
              nomeNormalizado
          );

        if (cargoPorNome) {
          setCargoId(
            String(cargoPorNome.id)
          );
          setCargo(
            cargoPorNome.nome
          );
          return;
        }
      }

      setCargoId("");
      setCargo(
        cargoNomeAtual.trim()
      );
    } catch (error) {
      console.error(
        "Erro ao carregar cargos:",
        error
      );

      setCargosDepartamento([]);
      setCargoId("");
    } finally {
      setCarregandoCargos(false);
    }
  }

  async function alterarDepartamentoFuncionario(
    novoDepartamentoId: string
  ) {
    setDepartamentoId(
      novoDepartamentoId
    );

    setCargoId("");
    setCargo("");
    setCargosDepartamento([]);

    if (!novoDepartamentoId) {
      return;
    }

    await carregarCargosDoDepartamento(
      novoDepartamentoId
    );
  }

  function alterarCargoFuncionario(
    novoCargoId: string
  ) {
    setCargoId(novoCargoId);

    const cargoSelecionado =
      cargosDepartamento.find(
        (item) =>
          String(item.id) ===
          novoCargoId
      );

    setCargo(
      cargoSelecionado?.nome || ""
    );
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
        t("errors.invalidPhotoFormat")
      );
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO_FUNCIONARIO_BYTES) {
      throw new Error(
        t("errors.photoTooLarge", { max: TAMANHO_MAXIMO_FOTO_FUNCIONARIO_MB })
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
        throw new Error(data?.error || t("errors.photoUpload"));
      }

      const url =
        data?.url ||
        data?.fileUrl ||
        data?.arquivoUrl ||
        data?.publicUrl;

      if (!url) {
        throw new Error(t("errors.photoUrlMissing"));
      }

      setFotoPerfil(url);
      setSucesso(t("messages.photoUploaded"));
    } catch (error: any) {
      setErro(
        error?.message ||
        t("errors.photoUploadCheck")
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

    const paisResidenciaAtual =
      codigoPaisValido(
        f.paisResidencia
      )
        ? (String(
            f.paisResidencia
          ).toUpperCase() as CountryCode)
        : f.cpf || f.rg
          ? "BR"
          : paisPadrao;

    const paisTelefoneAtual =
      codigoPaisValido(
        f.paisTelefone
      )
        ? (String(
            f.paisTelefone
          ).toUpperCase() as CountryCode)
        : paisResidenciaAtual;

    setPaisResidencia(
      paisResidenciaAtual
    );
    setPaisTelefone(
      paisTelefoneAtual
    );

    setNacionalidade(
      f.nacionalidade || ""
    );

    setTipoDocumento(
      f.tipoDocumento ||
      (f.rg
        ? "RG"
        : tipoDocumentoPadrao(
            paisResidenciaAtual
          ))
    );

    setNumeroDocumento(
      f.numeroDocumento ||
      f.rg ||
      ""
    );

    setTipoDocumentoFiscal(
      f.tipoDocumentoFiscal ||
      (f.cpf
        ? "CPF"
        : tipoDocumentoFiscalPadrao(
            paisResidenciaAtual
          ))
    );

    setNumeroDocumentoFiscal(
      f.numeroDocumentoFiscal ||
      f.cpf ||
      ""
    );

    setTelefone(
      f.telefone || ""
    );

    setEndereco(
      f.endereco || ""
    );
    setNumero(
      f.numero || ""
    );
    setComplemento(
      f.complemento || ""
    );
    setBairro(
      f.bairro || ""
    );
    setCidade(
      f.cidade || ""
    );
    setEstado(
      f.estado || ""
    );
    setCep(
      f.cep || ""
    );

    setCargo(f.cargo || "");

    setCargoId(
      f.cargoId
        ? String(f.cargoId)
        : ""
    );
    const departamentoAtualId =
      f.departamento?.id
        ? String(f.departamento.id)
        : "";

    setDepartamentoId(
      departamentoAtualId
    );

    if (departamentoAtualId) {
      void carregarCargosDoDepartamento(
        departamentoAtualId,
        f.cargoId
          ? String(f.cargoId)
          : "",
        f.cargo || ""
      );
    } else {
      setCargosDepartamento([]);
      setCargoId("");
    }
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

    const paisPrevidenciaAtual =
      codigoPaisValido(
        f.paisIdentificacaoPrevidenciaria
      )
        ? (String(
            f.paisIdentificacaoPrevidenciaria
          ).toUpperCase() as CountryCode)
        : paisResidenciaAtual;

    setPaisIdentificacaoPrevidenciaria(
      paisPrevidenciaAtual
    );
    setTipoIdentificacaoPrevidenciaria(
      f.tipoIdentificacaoPrevidenciaria ||
      tipoPrevidenciaPadrao(
        paisPrevidenciaAtual
      )
    );
    setNumeroIdentificacaoPrevidenciaria(
      f.numeroIdentificacaoPrevidenciaria ||
      f.pisPasep ||
      ""
    );

    setBanco(f.banco || "");
    setAgencia(f.agencia || "");
    setConta(f.conta || "");
    setPix(f.pix || "");
    setPaisContaBancaria(
      paisResidenciaAtual
    );
    setMoedaContaBancaria(
      moedaPadraoPais(
        paisResidenciaAtual
      )
    );
    setTipoContaBancaria("");
    setTipoChavePix(
      f.pix ? "ALEATORIA" : ""
    );
    setIban("");
    setBicSwift("");
    setRoutingNumber("");
    setSortCode("");
    setTitularConta(f.nome || "");
    setTitularDocumento(
      f.numeroDocumentoFiscal ||
      f.cpf ||
      ""
    );

    void carregarContaBancariaFuncionario(
      f.id,
      paisResidenciaAtual
    );

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

    setPaisResidencia(
      paisPadrao
    );
    setPaisTelefone(
      paisPadrao
    );
    setNacionalidade("");
    setTipoDocumento(
      tipoDocumentoPadrao(
        paisPadrao
      )
    );
    setNumeroDocumento("");
    setTipoDocumentoFiscal(
      tipoDocumentoFiscalPadrao(
        paisPadrao
      )
    );
    setNumeroDocumentoFiscal("");
    setTelefone("");

    setEndereco("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setCep("");

    setCargo("");
    setCargoId("");
    setCargosDepartamento([]);
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
    setPaisIdentificacaoPrevidenciaria(paisPadrao);
    setTipoIdentificacaoPrevidenciaria(
      tipoPrevidenciaPadrao(paisPadrao)
    );
    setNumeroIdentificacaoPrevidenciaria("");

    setPaisContaBancaria(paisPadrao);
    setMoedaContaBancaria(
      moedaPadraoPais(paisPadrao)
    );
    setBanco("");
    setAgencia("");
    setConta("");
    setTipoContaBancaria("");
    setTipoChavePix("");
    setPix("");
    setIban("");
    setBicSwift("");
    setRoutingNumber("");
    setSortCode("");
    setTitularConta("");
    setTitularDocumento("");
    setStatusFuncionario("ATIVO");
    setMotivoStatus("");
  }

  function alterarPaisResidencia(
    novoPaisValor: CountryCode
  ) {
    if (
      !codigoPaisValido(
        novoPaisValor
      )
    ) {
      return;
    }

    const novoPais =
      novoPaisValor.toUpperCase() as CountryCode;

    setPaisResidencia(
      novoPais
    );

    setCep((atual) =>
      formatarCodigoPostal(
        atual,
        novoPais
      )
    );

    if (!telefone.trim()) {
      setPaisTelefone(
        novoPais
      );
    }

    if (
      !numeroIdentificacaoPrevidenciaria.trim()
    ) {
      setPaisIdentificacaoPrevidenciaria(
        novoPais
      );
      setTipoIdentificacaoPrevidenciaria(
        tipoPrevidenciaPadrao(
          novoPais
        )
      );
    }

    if (!possuiDadosBancarios()) {
      setPaisContaBancaria(
        novoPais
      );
      setMoedaContaBancaria(
        moedaPadraoPais(
          novoPais
        )
      );
    }

    const tiposIdentidadeValidos =
      opcoesDocumentoIdentidade(
        novoPais
      ).map(
        ([valor]) =>
          String(valor)
      );

    if (
      !tiposIdentidadeValidos.includes(
        tipoDocumento
      )
    ) {
      setTipoDocumento(
        tipoDocumentoPadrao(
          novoPais
        )
      );
      setNumeroDocumento("");
    }

    const tiposFiscaisValidos =
      opcoesDocumentoFiscal(
        novoPais
      ).map(
        ([valor]) =>
          String(valor)
      );

    if (
      !tiposFiscaisValidos.includes(
        tipoDocumentoFiscal
      )
    ) {
      setTipoDocumentoFiscal(
        tipoDocumentoFiscalPadrao(
          novoPais
        )
      );
      setNumeroDocumentoFiscal("");
    }
  }

  function validarRemuneracaoFuncionario() {
    if (!tipoRemuneracao) {
      return t("errors.selectCompensationType");
    }

    if (
      tipoRemuneracao === "MENSAL" &&
      !salarioBase.trim()
    ) {
      return t("errors.monthlySalaryRequired");
    }

    if (
      tipoRemuneracao === "HORA_AULA" &&
      !valorHoraAula.trim()
    ) {
      return t("errors.classHourValueRequired");
    }

    if (
      tipoRemuneracao === "HORA_TRABALHADA" &&
      !valorHoraTrabalhada.trim()
    ) {
      return t("errors.workHourValueRequired");
    }

    if (
      tipoRemuneracao === "POR_AULA" &&
      !valorPorAula.trim()
    ) {
      return t("errors.perClassValueRequired");
    }

    if (
      tipoRemuneracao === "POR_TURMA" &&
      !valorPorTurma.trim()
    ) {
      return t("errors.perClassGroupValueRequired");
    }

    if (
      tipoRemuneracao === "POR_DISCIPLINA" &&
      !valorPorDisciplina.trim()
    ) {
      return t("errors.perSubjectValueRequired");
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
        return t("errors.mixedCompensationValueRequired");
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
      setErro(t("errors.employeeNameBeforeContinue"));
      return;
    }

    if (
      criarAcessoSistema &&
      !email.trim()
    ) {
      setErro(t("errors.employeeEmailBeforeContinue"));
      return;
    }

    if (
      criarAcessoSistema &&
      !role
    ) {
      setErro(t("errors.accessProfileBeforeContinue"));
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

          paisResidencia,
          nacionalidade,
          paisTelefone,
          telefone,

          tipoDocumento,
          numeroDocumento,
          tipoDocumentoFiscal,
          numeroDocumentoFiscal,

          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cep,

          cargo,
          cargoId:
            cargoId
              ? Number(cargoId)
              : null,
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
          paisIdentificacaoPrevidenciaria,
          tipoIdentificacaoPrevidenciaria,
          numeroIdentificacaoPrevidenciaria,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(
          mensagemErroApi(
            data,
            t("errors.updateEmployee")
          )
        );
        return;
      }

      await salvarContaBancariaFuncionario(
        editandoId
      );

      setSucesso(t("messages.employeeUpdated"));
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
        ? t("confirm.blockMessage", { name: nome })
        : t("confirm.unblockMessage", { name: nome });

    setConfirmTitulo(
      acao === "bloquear"
        ? t("confirm.blockTitle")
        : t("confirm.unblockTitle")
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
            data.error || t("errors.changeAccess")
          );
          return;
        }

        setSucesso(
          data.message || t("messages.accessChanged")
        );

        await carregarFuncionarios();
      } catch {
        setErro(
          t("errors.changeAccessCommunication")
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
      setErro(t("errors.employeeNameRequired"));
      return;
    }

    if (!poloId) {
      setErro(
        t("errors.campusRequired")
      );
      return;
    }

    if (
      criarAcessoSistema &&
      !email.trim()
    ) {
      setErro(
        t("errors.emailForAccessRequired")
      );
      return;
    }

    if (
      criarAcessoSistema &&
      !role
    ) {
      setErro(
        t("errors.accessProfileRequired")
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

          paisResidencia,
          nacionalidade,
          paisTelefone,
          telefone,

          tipoDocumento,
          numeroDocumento,
          tipoDocumentoFiscal,
          numeroDocumentoFiscal,

          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cep,

          cargo,
          cargoId:
            cargoId
              ? Number(cargoId)
              : null,
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
          paisIdentificacaoPrevidenciaria,
          tipoIdentificacaoPrevidenciaria,
          numeroIdentificacaoPrevidenciaria,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(
          mensagemErroApi(
            data,
            t("errors.createEmployee")
          )
        );
        return;
      }

      const funcionarioIdCriado = Number(data?.id);

      if (funcionarioIdCriado) {
        await salvarContaBancariaFuncionario(
          funcionarioIdCriado
        );

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

      setPaisResidencia(
        paisPadrao
      );
      setPaisTelefone(
        paisPadrao
      );
      setNacionalidade("");
      setTipoDocumento(
        tipoDocumentoPadrao(
          paisPadrao
        )
      );
      setNumeroDocumento("");
      setTipoDocumentoFiscal(
        tipoDocumentoFiscalPadrao(
          paisPadrao
        )
      );
      setNumeroDocumentoFiscal("");
      setTelefone("");

      setEndereco("");
      setNumero("");
      setComplemento("");
      setBairro("");
      setCidade("");
      setEstado("");
      setCep("");

      setCargo("");
      setCargoId("");
      setCargosDepartamento([]);
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
      setPaisIdentificacaoPrevidenciaria(paisPadrao);
      setTipoIdentificacaoPrevidenciaria(
        tipoPrevidenciaPadrao(paisPadrao)
      );
      setNumeroIdentificacaoPrevidenciaria("");

      setPaisContaBancaria(paisPadrao);
      setMoedaContaBancaria(
        moedaPadraoPais(paisPadrao)
      );
      setBanco("");
      setAgencia("");
      setConta("");
      setTipoContaBancaria("");
      setTipoChavePix("");
      setPix("");
      setIban("");
      setBicSwift("");
      setRoutingNumber("");
      setSortCode("");
      setTitularConta("");
      setTitularDocumento("");
      setStatusFuncionario("ATIVO");
      setMotivoStatus("");

      await carregarFuncionarios();

      if (data?.avisoEmail) {
        setErro(data.avisoEmail);
        return;
      }

      setSucesso(
        data?.acessoSistema
          ? t("messages.employeeCreatedWithAccess")
          : t("messages.employeeCreatedWithoutAccess")
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
    const termoTexto =
      busca.trim().toLowerCase();

    const termoNumerico =
      busca.replace(/\D/g, "");

    if (!termoTexto) {
      return funcionarios;
    }

    return funcionarios.filter(
      (funcionario) => {
        const camposTexto = [
          funcionario.nome,
          funcionario.user?.email,
          funcionario.user?.role,
          funcionario.numeroDocumentoFiscal,
          funcionario.cpf,
          funcionario.numeroDocumento,
          funcionario.rg,
          funcionario.telefone,
          funcionario.nacionalidade,
          funcionario.paisResidencia,
          funcionario.cargo,
          funcionario.codigoFuncionario,
          funcionario.departamento?.nome,
          funcionario.polo?.nome,
          funcionario.endereco,
          funcionario.bairro,
          funcionario.cidade,
          funcionario.estado,
          funcionario.cep,
        ].map((valor) =>
          String(valor || "")
            .toLowerCase()
            .trim()
        );

        if (
          camposTexto.some(
            (valor) =>
              valor.includes(
                termoTexto
              )
          )
        ) {
          return true;
        }

        if (!termoNumerico) {
          return false;
        }

        return camposTexto.some(
          (valor) =>
            valor
              .replace(/\D/g, "")
              .includes(
                termoNumerico
              )
        );
      }
    );
  }, [funcionarios, busca]);

  const enderecoUI =
    rotulosEndereco(
      paisResidencia
    );

  return (
    <div className="phanyx-admin-funcionarios-page space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">🧑‍💼 {t("title")}</h1>

      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo={t("toast.errorTitle")}
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      {sucesso && (
        <PhanyxToast
          tipo="sucesso"
          titulo={t("toast.successTitle")}
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
          {editandoId ? t("form.editTitle") : t("form.newTitle")}
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
                      {t("systemAccess.createTitle")}
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {t("systemAccess.createDescription")}
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
                    {t("systemAccess.noAccessDescription")}
                  </div>
                )}
              </div>
            </div>
          )}
          <input
            placeholder={t("fields.name")}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          {criarAcessoSistema && (
            <>
              <input
                placeholder={t("fields.email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg p-2"
                required
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  {t("fields.accessProfile")}
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
                    {t("fields.selectProfile")}
                  </option>

                  <option value="ADMIN" className="bg-slate-900 text-white">
                    {t("roles.admin")}
                  </option>

                  <option value="SECRETARIA" className="bg-slate-900 text-white">
                    {t("roles.employee")}
                  </option>

                </select>
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              {t("fields.department")}
            </label>

            <select
              value={departamentoId}
              onChange={(e) => {
                void alterarDepartamentoFuncionario(
                  e.target.value
                );
              }}
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
                {t("fields.selectDepartment")}
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.job")}
            </label>

            <select
              value={cargoId}
              onChange={(e) =>
                alterarCargoFuncionario(
                  e.target.value
                )
              }
              disabled={
                !departamentoId ||
                carregandoCargos
              }
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
      disabled:text-slate-500
      dark:border-slate-700
      dark:bg-slate-900
      dark:text-white
      dark:disabled:bg-slate-800
      dark:disabled:text-slate-400
    "
            >
              <option value="">
                {carregandoCargos
                  ? t("job.loading")
                  : !departamentoId
                    ? t("job.selectDepartmentFirst")
                    : cargosDepartamento.length === 0
                      ? t("job.noActiveJobs")
                      : t("job.selectJob")}
              </option>

              {cargosDepartamento.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nome}
                    {!item.ativo
                      ? ` — ${t("common.inactive")}`
                      : ""}
                  </option>
                )
              )}
            </select>

            {departamentoId &&
              !carregandoCargos &&
              cargosDepartamento.length ===
              0 && (
                <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                  {t("job.noJobsHelp")}
                </p>
              )}
          </div>

          {/* POLO DE LOTAÇÃO */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.campus")}
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
                {t("fields.selectCampus")}
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
                      ? ` — ${t("common.inactive")}`
                      : ""}
                  </option>
                );
              })}
            </select>

            {editandoId ? (
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                {t("campus.editHelp")}
              </p>
            ) : (
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                {t("campus.createHelp")}
              </p>
            )}

            {editandoId && (
              <Link
                href={`/admin/funcionarios/${editandoId}`}
                className="inline-flex text-xs font-bold text-blue-700 hover:underline dark:text-blue-300"
              >
                {t("campus.openRecord")}
              </Link>
            )}
          </div>

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                👤 {t("international.personalTitle")}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("international.personalDescription")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("international.countryOfResidence")}
                </label>

                <select
                  value={paisResidencia}
                  onChange={(e) =>
                    alterarPaisResidencia(
                      e.target.value as CountryCode
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  {paisesDisponiveis.map(
                    (pais) => (
                      <option
                        key={pais.codigo}
                        value={pais.codigo}
                      >
                        {bandeiraPais(
                          pais.codigo
                        )}{" "}
                        {pais.nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("international.nationality")}
                </label>

                <input
                  value={nacionalidade}
                  onChange={(e) =>
                    setNacionalidade(
                      e.target.value
                    )
                  }
                  placeholder={t(
                    "international.nationalityPlaceholder"
                  )}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("international.phone")}
                </label>

                <CampoTelefoneInternacional
                  value={telefone}
                  pais={paisTelefone}
                  onChange={(
                    valor,
                    novoPais
                  ) => {
                    setTelefone(valor);
                    setPaisTelefone(
                      novoPais
                    );
                  }}
                  placeholder={t(
                    "international.phonePlaceholder"
                  )}
                />

                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {t(
                    "international.phoneHelp"
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("fields.employeeCodeOptional")}
                </label>

                <input
                  value={codigoFuncionario}
                  onChange={(e) =>
                    setCodigoFuncionario(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t(
                    "international.identityType"
                  )}
                </label>

                <select
                  value={tipoDocumento}
                  onChange={(e) =>
                    setTipoDocumento(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  {tipoDocumento &&
                    !opcoesDocumentoIdentidade(
                      paisResidencia
                    ).some(
                      ([valor]) =>
                        String(valor) ===
                        tipoDocumento
                    ) && (
                      <option
                        value={tipoDocumento}
                      >
                        {rotuloTipoDocumento(
                          tipoDocumento
                        )}
                      </option>
                    )}

                  {opcoesDocumentoIdentidade(
                    paisResidencia
                  ).map(
                    ([valor, rotulo]) => (
                      <option
                        key={valor}
                        value={valor}
                      >
                        {rotulo}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t(
                    "international.identityNumber"
                  )}
                </label>

                <input
                  value={numeroDocumento}
                  onChange={(e) =>
                    setNumeroDocumento(
                      e.target.value
                    )
                  }
                  placeholder={t(
                    "international.identityNumberPlaceholder"
                  )}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t(
                    "international.fiscalType"
                  )}
                </label>

                <select
                  value={tipoDocumentoFiscal}
                  onChange={(e) =>
                    setTipoDocumentoFiscal(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  {tipoDocumentoFiscal &&
                    !opcoesDocumentoFiscal(
                      paisResidencia
                    ).some(
                      ([valor]) =>
                        String(valor) ===
                        tipoDocumentoFiscal
                    ) && (
                      <option
                        value={
                          tipoDocumentoFiscal
                        }
                      >
                        {rotuloTipoDocumentoFiscal(
                          tipoDocumentoFiscal
                        )}
                      </option>
                    )}

                  {opcoesDocumentoFiscal(
                    paisResidencia
                  ).map(
                    ([valor, rotulo]) => (
                      <option
                        key={valor}
                        value={valor}
                      >
                        {rotulo}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t(
                    "international.fiscalNumber"
                  )}
                </label>

                <input
                  value={numeroDocumentoFiscal}
                  onChange={(e) =>
                    setNumeroDocumentoFiscal(
                      e.target.value
                    )
                  }
                  placeholder={t(
                    "international.fiscalNumberPlaceholder"
                  )}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          <div className="phanyx-foto-oficial-card md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                {fotoPerfil ? (
                  <img
                    src={fotoPerfil}
                    alt={nome || t("photo.alt")}
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
                  {t("photo.title")}
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("photo.description")}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">
                  {t("photo.help")}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                    {enviandoFotoPerfil ? t("buttons.uploading") : t("buttons.uploadPhoto")}
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
                      {t("buttons.removePhoto")}
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
              📍 {t("international.address.title")}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("international.address.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {enderecoUI.codigoPostal}
              </label>

              <input
                value={cep}
                onChange={(e) =>
                  setCep(
                    formatarCodigoPostal(
                      e.target.value,
                      paisResidencia
                    )
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                autoComplete="postal-code"
                placeholder={enderecoUI.codigoPostal}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />

              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                {t(
                  "international.address.postalHelp"
                )}
              </p>
            </div>

            <div className="space-y-1 xl:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {enderecoUI.endereco}
              </label>

              <input
                value={endereco}
                onChange={(e) =>
                  setEndereco(
                    e.target.value
                  )
                }
                autoComplete="street-address"
                placeholder={enderecoUI.endereco}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {enderecoUI.numero}
              </label>

              <input
                value={numero}
                onChange={(e) =>
                  setNumero(
                    e.target.value
                  )
                }
                placeholder={enderecoUI.numero}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {enderecoUI.complemento}
              </label>

              <input
                value={complemento}
                onChange={(e) =>
                  setComplemento(
                    e.target.value
                  )
                }
                placeholder={enderecoUI.complemento}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {enderecoUI.bairro}
              </label>

              <input
                value={bairro}
                onChange={(e) =>
                  setBairro(
                    e.target.value
                  )
                }
                placeholder={enderecoUI.bairro}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {enderecoUI.cidade}
              </label>

              <input
                value={cidade}
                onChange={(e) =>
                  setCidade(
                    e.target.value
                  )
                }
                autoComplete="address-level2"
                placeholder={enderecoUI.cidade}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {enderecoUI.estado}
              </label>

              <input
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value
                  )
                }
                autoComplete="address-level1"
                placeholder={enderecoUI.estado}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              💼 {t("employment.title")}
            </h3>

            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("employment.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("employment.admissionDate")}
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
                {t("employment.compensationType")}
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
                <option value="">{t("common.select")}</option>
                <option value="MENSAL">{t("compensation.monthlySalary")}</option>
                <option value="HORA_AULA">{t("compensation.classHour")}</option>
                <option value="HORA_TRABALHADA">
                  {t("compensation.workHour")}
                </option>
                <option value="POR_AULA">{t("compensation.perClass")}</option>
                <option value="POR_TURMA">{t("compensation.perClassGroup")}</option>
                <option value="POR_DISCIPLINA">
                  {t("compensation.perSubject")}
                </option>
                <option value="MISTO">{t("compensation.mixed")}</option>
                <option value="SEM_REMUNERACAO">
                  {t("compensation.none")}
                </option>
              </select>
            </div>

            {(tipoRemuneracao === "MENSAL" ||
              tipoRemuneracao === "MISTO") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("compensation.monthlySalary")}
                  </label>

                  <input
                    placeholder={t("placeholders.amount")}
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
                      {t("employment.classHourValue")}
                    </label>

                    <input
                      placeholder={t("placeholders.amount")}
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
                      {t("employment.classHourDuration")}
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
                        {t("common.minutes")}
                      </span>
                    </div>
                  </div>
                </>
              )}

            {(tipoRemuneracao === "HORA_TRABALHADA" ||
              tipoRemuneracao === "MISTO") && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("employment.workHourValue")}
                  </label>

                  <input
                    placeholder={t("placeholders.amount")}
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
                    {t("compensation.perClass")}
                  </label>

                  <input
                    placeholder={t("placeholders.amount")}
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
                    {t("compensation.perClassGroup")}
                  </label>

                  <input
                    placeholder={t("placeholders.amount")}
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
                    {t("compensation.perSubject")}
                  </label>

                  <input
                    placeholder={t("placeholders.amount")}
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
                {t("employment.contractType")}
              </label>
              <select
                value={tipoContrato}
                onChange={(e) => setTipoContrato(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">{t("common.select")}</option>
                <option value="CLT">CLT</option>
                <option value="ESTAGIO">{t("contracts.internship")}</option>
                <option value="APRENDIZ">{t("contracts.apprentice")}</option>
                <option value="TEMPORARIO">{t("contracts.temporary")}</option>
                <option value="PJ">PJ</option>
                <option value="AUTONOMO">{t("contracts.selfEmployed")}</option>
                <option value="OUTRO">{t("common.other")}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("employment.workSchedule")}
              </label>
              <input
                placeholder={t("placeholders.workSchedule")}
                value={jornadaTrabalho}
                onChange={(e) => setJornadaTrabalho(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("employment.weeklyHours")}
              </label>

              <input
                placeholder={t("placeholders.weeklyHours")}
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
                {t("employment.monthlyHours")}
              </label>
              <input
                placeholder={t("placeholders.monthlyHours")}
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
                {t("employment.timeClockCode")}
              </label>
              <input
                placeholder={t("placeholders.timeClockCode")}
                value={codigoPonto}
                onChange={(e) => setCodigoPonto(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("socialSecurity.country")}
              </label>

              <select
                value={paisIdentificacaoPrevidenciaria}
                onChange={(e) => {
                  const novoPais =
                    e.target.value as CountryCode;

                  setPaisIdentificacaoPrevidenciaria(
                    novoPais
                  );
                  setTipoIdentificacaoPrevidenciaria(
                    tipoPrevidenciaPadrao(
                      novoPais
                    )
                  );
                }}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {paisesDisponiveis.map((pais) => (
                  <option
                    key={pais.codigo}
                    value={pais.codigo}
                  >
                    {bandeiraPais(pais.codigo)} {pais.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {rotuloPrevidencia(
                  paisIdentificacaoPrevidenciaria
                )}
              </label>

              <input
                value={numeroIdentificacaoPrevidenciaria}
                onChange={(e) =>
                  setNumeroIdentificacaoPrevidenciaria(
                    e.target.value
                  )
                }
                placeholder={rotuloPrevidencia(
                  paisIdentificacaoPrevidenciaria
                )}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("employment.compensationNotes")}
              </label>

              <textarea
                value={observacoesRemuneracao}
                onChange={(e) =>
                  setObservacoesRemuneracao(e.target.value)
                }
                className="min-h-[100px] w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder={t("placeholders.compensationNotes")}
              />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              🏦 {t("bank.title")}
            </h3>

            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("bank.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("bank.country")}
              </label>

              <select
                value={paisContaBancaria}
                onChange={(e) => {
                  const novoPais =
                    e.target.value as CountryCode;

                  setPaisContaBancaria(
                    novoPais
                  );
                  setMoedaContaBancaria(
                    moedaPadraoPais(
                      novoPais
                    )
                  );
                }}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {paisesDisponiveis.map((pais) => (
                  <option
                    key={pais.codigo}
                    value={pais.codigo}
                  >
                    {bandeiraPais(pais.codigo)} {pais.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("bank.currency")}
              </label>

              <input
                value={moedaContaBancaria}
                onChange={(e) =>
                  setMoedaContaBancaria(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, "")
                      .slice(0, 3)
                  )
                }
                placeholder="BRL / EUR / USD"
                maxLength={3}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("bank.accountType")}
              </label>

              <select
                value={tipoContaBancaria}
                onChange={(e) =>
                  setTipoContaBancaria(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">{t("common.select")}</option>
                <option value="CORRENTE">{t("bank.accountTypes.checking")}</option>
                <option value="POUPANCA">{t("bank.accountTypes.savings")}</option>
                <option value="SALARIO">{t("bank.accountTypes.payroll")}</option>
                <option value="PAGAMENTO">{t("bank.accountTypes.payment")}</option>
                <option value="OUTRA">{t("bank.accountTypes.other")}</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("bank.bankName")}
              </label>

              {paisContaBancaria === "BR" ? (
                <BuscaBanco
                  id="banco-funcionario"
                  value={banco}
                  onChange={(valor) => setBanco(valor)}
                  placeholder={t("placeholders.bankSearch")}
                  ariaLabel={t("placeholders.bankAria")}
                />
              ) : (
                <input
                  value={banco}
                  onChange={(e) =>
                    setBanco(e.target.value)
                  }
                  placeholder={t("bank.bankName")}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              )}
            </div>

            {paisContaBancaria === "BR" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("fields.branch")}
                  </label>
                  <input
                    value={agencia}
                    onChange={(e) =>
                      setAgencia(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("fields.account")}
                  </label>
                  <input
                    value={conta}
                    onChange={(e) =>
                      setConta(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("bank.pixKeyType")}
                  </label>
                  <select
                    value={tipoChavePix}
                    onChange={(e) =>
                      setTipoChavePix(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">{t("common.select")}</option>
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="TELEFONE">{t("fields.phone")}</option>
                    <option value="ALEATORIA">{t("bank.pixTypes.random")}</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("bank.pixKey")}
                  </label>
                  <input
                    value={pix}
                    onChange={(e) =>
                      setPix(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            {paisContaBancaria === "US" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("bank.routingNumber")}
                  </label>
                  <input
                    value={routingNumber}
                    onChange={(e) =>
                      setRoutingNumber(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("bank.accountNumber")}
                  </label>
                  <input
                    value={conta}
                    onChange={(e) =>
                      setConta(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            {paisContaBancaria === "GB" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("bank.sortCode")}
                  </label>
                  <input
                    value={sortCode}
                    onChange={(e) =>
                      setSortCode(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("bank.accountNumber")}
                  </label>
                  <input
                    value={conta}
                    onChange={(e) =>
                      setConta(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            {paisUsaIban(paisContaBancaria) &&
              paisContaBancaria !== "GB" && (
                <>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      IBAN
                    </label>
                    <input
                      value={iban}
                      onChange={(e) =>
                        setIban(e.target.value.toUpperCase())
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      BIC / SWIFT
                    </label>
                    <input
                      value={bicSwift}
                      onChange={(e) =>
                        setBicSwift(e.target.value.toUpperCase())
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

            {!paisUsaIban(paisContaBancaria) &&
              paisContaBancaria !== "BR" &&
              paisContaBancaria !== "US" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t("bank.accountNumber")}
                    </label>
                    <input
                      value={conta}
                      onChange={(e) =>
                        setConta(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      BIC / SWIFT
                    </label>
                    <input
                      value={bicSwift}
                      onChange={(e) =>
                        setBicSwift(e.target.value.toUpperCase())
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("bank.holderName")}
              </label>
              <input
                value={titularConta}
                onChange={(e) =>
                  setTitularConta(e.target.value)
                }
                placeholder={nome}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("bank.holderDocument")}
              </label>
              <input
                value={titularDocumento}
                onChange={(e) =>
                  setTitularDocumento(e.target.value)
                }
                placeholder={numeroDocumentoFiscal}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t("fields.status")}</label>

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
              {t("status.active")}
            </option>

            <option value="DEMITIDO" className="bg-slate-900 text-white">
              {t("status.dismissed")}
            </option>

            <option value="AFASTADO" className="bg-slate-900 text-white">
              {t("status.onLeave")}
            </option>

            <option value="ADVERTENCIA" className="bg-slate-900 text-white">
              {t("status.warning")}
            </option>

            <option value="FERIAS" className="bg-slate-900 text-white">
              {t("status.vacation")}
            </option>

            <option value="READMITIDO" className="bg-slate-900 text-white">
              {t("status.rehired")}
            </option>
          </select>
        </div>

        <input
          placeholder={t("fields.reasonOptional")}
          value={motivoStatus}
          onChange={(e) => setMotivoStatus(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 phanyx-documentos-funcionario">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              📁 {t("documents.title")}
            </h3>

            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("documents.description")}
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
                  <span>{t("buttons.selectFile")}</span>
                </label>

                {doc.arquivo && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    {doc.arquivo.name}
                  </p>
                )}

                {doc.tipo === "PORTFOLIO" && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-slate-100 p-3 dark:border-blue-900/60 dark:bg-slate-800">
                    <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t("documents.portfolioLinks")}
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
                            <option value="Site">{t("documents.personalWebsite")}</option>
                            <option value="Outro">{t("common.other")}</option>
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
                            {t("buttons.remove")}
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
                      + {t("buttons.addLink")}
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
                ? t("buttons.saving")
                : t("buttons.creating")
              : editandoId
                ? t("buttons.saveChanges")
                : t("buttons.createEmployee")}
          </button>

          {editandoId ? (
            <button
              type="button"
              onClick={limparFormulario}
              className="px-4 py-2 border rounded-lg"
            >
              {t("buttons.cancelEditing")}
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">{t("list.title")}</h2>

          <input
            type="text"
            placeholder={t("list.searchPlaceholder")}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full md:w-[500px] border rounded-lg p-2"
          />
        </div>

        {funcionariosFiltrados.length === 0 ? (
          <div className="bg-white border rounded-lg p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t("list.empty")}
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
                        {t("list.accessEmail")}: {f.user.email}
                      </p>

                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t("list.accessProfile")}: {traduzirRole(f.user.role)}
                      </p>

                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t("list.access")}:{" "}
                        {f.user.ativo === false
                          ? t("access.blocked")
                          : t("access.active")}
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
                      {t("access.noSystemAccess")}
                    </div>
                  )}

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("fields.status")}: {traduzirStatusFuncionario(f.statusFuncionario || "ATIVO")}
                  </p>

                  {f.motivoStatus && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {t("fields.reason")}: {f.motivoStatus}
                    </p>
                  )}

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {rotuloTipoDocumentoFiscal(
                      f.tipoDocumentoFiscal ||
                      (f.cpf ? "CPF" : "TAX_ID")
                    )}:{" "}
                    {f.numeroDocumentoFiscal ||
                      f.cpf ||
                      "-"}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {rotuloTipoDocumento(
                      f.tipoDocumento ||
                      (f.rg ? "RG" : "NATIONAL_ID")
                    )}:{" "}
                    {f.numeroDocumento ||
                      f.rg ||
                      "-"}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("fields.phone")}:{" "}
                    {formatarTelefoneExibicao(
                      f.telefone
                    )}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("international.countryOfResidence")}:{" "}
                    {nomePais(
                      f.paisResidencia ||
                      (f.cpf || f.rg
                        ? "BR"
                        : null)
                    )}
                  </p>

                  {f.nacionalidade && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {t("international.nationality")}:{" "}
                      {f.nacionalidade}
                    </p>
                  )}

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("fields.job")}: {f.cargo || "-"}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("fields.code")}: {f.codigoFuncionario || "-"}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("fields.department")}: {f.departamento?.nome || "-"}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("fields.campus")}:{" "}
                    <span className="font-semibold">
                      {f.polo?.nome || t("common.notDefined")}
                    </span>
                  </p>

                  {!f.polo && (
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      {t("campus.legacyEmployeeHelp")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/funcionarios/${f.id}`}
                  className="phanyx-funcionario-editar-btn inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-bold transition"
                >
                  {t("buttons.edit")}
                </Link>

                {f.user &&
                  podeGerenciarPermissoesIndividuais() && (
                    <Link
                      href={`/admin/funcionarios/${f.id}/permissoes`}
                      className="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
                    >
                      🔐 {t("buttons.individualPermissions")}
                    </Link>
                  )}

                {f.user && (
                  <>
                    <button
                      type="button"
                      onClick={() => alterarAcessoFuncionario(f.id, "bloquear", f.nome)}
                      className="rounded-lg border border-yellow-500 px-3 py-1.5 text-sm font-medium text-yellow-700 transition hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-950"
                    >
                      {t("buttons.blockAccess")}
                    </button>

                    <button
                      type="button"
                      onClick={() => alterarAcessoFuncionario(f.id, "desbloquear", f.nome)}
                      className="rounded-lg border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950"
                    >
                      {t("buttons.unblockAccess")}
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
        textoConfirmar={t("buttons.confirm")}
        textoCancelar={t("buttons.cancel")}
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