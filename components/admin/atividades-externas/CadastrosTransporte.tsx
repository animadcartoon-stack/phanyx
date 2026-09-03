"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";

import CampoTelefoneInternacional from "@/components/internacionalizacao/CampoTelefoneInternacional";

type AbaCadastro =
  | "prestadores"
  | "veiculos"
  | "condutores";

type TipoPrestador =
  | "RODOVIARIO"
  | "AEREO"
  | "FERROVIARIO"
  | "MARITIMO"
  | "MOBILIDADE_AUTONOMA"
  | "MULTIMODAL"
  | "OUTRO";

type VerificacaoEstudantil =
  | "NAO_VERIFICADO"
  | "VERIFICADO"
  | "NAO_AUTORIZADO"
  | "NAO_APLICAVEL";

type Prestador = {
  id: number;
  nome: string;
  nomeFantasia?: string | null;
  tipo: TipoPrestador;

  pais?: string | null;
  regiao?: string | null;
  cidade?: string | null;

  telefone?: string | null;
  email?: string | null;

  ativo: boolean;
};

type TipoVeiculo =
  | "ONIBUS"
  | "MICRO_ONIBUS"
  | "VAN"
  | "AUTOMOVEL"
  | "SUV"
  | "MINIVAN"
  | "CAMINHAO_ADAPTADO"
  | "AERONAVE"
  | "TREM"
  | "METRO"
  | "BONDE"
  | "BARCO"
  | "FERRY"
  | "EMBARCACAO"
  | "BICICLETA"
  | "VEICULO_AUTONOMO"
  | "OUTRO";

type TipoConducao =
  | "HUMANA"
  | "ADAS"
  | "AUTOMATIZADA_SUPERVISIONADA"
  | "AUTONOMA"
  | "SUPERVISAO_REMOTA"
  | "MISTA"
  | "NAO_APLICAVEL";

type Veiculo = {
  id: number;

  prestadorTransporteId?:
  | number
  | null;

  nomeIdentificacao?:
  | string
  | null;

  tipo: TipoVeiculo;

  marca?: string | null;
  modelo?: string | null;
  ano?: number | null;

  placa?: string | null;

  paisRegistro?:
  | string
  | null;

  identificadorExterno?:
  | string
  | null;

  capacidadePassageiros?:
  | number
  | null;

  acessivelPcd: boolean;

  tipoConducao:
  TipoConducao;

  sistemaConducao?:
  | string
  | null;

  versaoSoftware?:
  | string
  | null;

  possuiRastreamento:
  boolean;

  possuiTelemetria:
  boolean;

  trackingProvider?:
  | string
  | null;

  externalVehicleId?:
  | string
  | null;

  autorizadoTransporteEstudantil:
  VerificacaoEstudantil;

  observacao?:
  | string
  | null;

  ativo: boolean;

  prestadorTransporte?: {
    id: number;
    nome: string;
    nomeFantasia?:
    | string
    | null;
  } | null;
};

type TipoCondutor =
  | "MOTORISTA"
  | "PILOTO"
  | "MAQUINISTA"
  | "COMANDANTE_EMBARCACAO"
  | "OPERADOR"
  | "OPERADOR_REMOTO"
  | "SUPERVISOR_AUTONOMO"
  | "OUTRO";

type Condutor = {
  id: number;

  prestadorTransporteId?:
    | number
    | null;

  nome: string;

  tipo: TipoCondutor;

  telefone?:
    | string
    | null;

  email?:
    | string
    | null;

  paisDocumento?:
    | string
    | null;

  tipoDocumento?:
    | string
    | null;

  numeroDocumento?:
    | string
    | null;

  numeroLicenca?:
    | string
    | null;

  categoriaLicenca?:
    | string
    | null;

  licencaValidaAte?:
    | string
    | null;

  autorizadoTransporteEstudantil:
    VerificacaoEstudantil;

  contatoEmergencia?:
    | string
    | null;

  telefoneEmergencia?:
    | string
    | null;

  observacao?:
    | string
    | null;

  ativo: boolean;

  prestadorTransporte?: {
    id: number;
    nome: string;

    nomeFantasia?:
      | string
      | null;
  } | null;
};

type FormularioPrestador = {
  nome: string;
  nomeFantasia: string;

  tipo: TipoPrestador;

  paisCodigo: CountryCode;
  pais: string;

  codigoPostal: string;

  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;

  cidade: string;
  regiao: string;

  telefone: string;
  paisTelefone: CountryCode;

  email: string;
  site: string;

  responsavelContato: string;

  telefoneResponsavelContato:
  string;

  paisTelefoneResponsavel:
  CountryCode;

  emailResponsavelContato:
  string;

  tipoDocumento: string;
  numeroDocumento: string;

  numeroLicenca: string;
  licencaValidaAte: string;

  numeroApolice: string;
  seguroValidoAte: string;

  verificacaoTransporteEstudantil:
  VerificacaoEstudantil;

  permiteSubcontratacao:
  boolean;

  observacao: string;
};

type FormularioVeiculo = {
  prestadorTransporteId:
  string;

  nomeIdentificacao:
  string;

  tipo: TipoVeiculo;

  marca: string;
  modelo: string;
  ano: string;

  placa: string;

  paisRegistro:
  CountryCode;

  identificadorExterno:
  string;

  capacidadePassageiros:
  string;

  acessivelPcd: boolean;

  tipoConducao:
  TipoConducao;

  sistemaConducao:
  string;

  versaoSoftware:
  string;

  possuiRastreamento:
  boolean;

  possuiTelemetria:
  boolean;

  trackingProvider:
  string;

  externalVehicleId:
  string;

  autorizadoTransporteEstudantil:
  VerificacaoEstudantil;

  observacao: string;
};

type FormularioCondutor = {
  prestadorTransporteId:
    string;

  nome: string;

  tipo: TipoCondutor;

  telefone: string;

  paisTelefone:
    CountryCode;

  email: string;

  paisDocumento:
    CountryCode;

  tipoDocumento: string;

  numeroDocumento:
    string;

  numeroLicenca:
    string;

  categoriaLicenca:
    string;

  licencaValidaAte:
    string;

  autorizadoTransporteEstudantil:
    VerificacaoEstudantil;

  contatoEmergencia:
    string;

  telefoneEmergencia:
    string;

  paisTelefoneEmergencia:
    CountryCode;

  observacao: string;
};

function criarFormularioVeiculoInicial(
  locale: string
): FormularioVeiculo {
  return {
    prestadorTransporteId:
      "",

    nomeIdentificacao:
      "",

    tipo: "ONIBUS",

    marca: "",
    modelo: "",
    ano: "",

    placa: "",

    paisRegistro:
      paisInicial(locale),

    identificadorExterno:
      "",

    capacidadePassageiros:
      "",

    acessivelPcd: false,

    tipoConducao:
      "HUMANA",

    sistemaConducao: "",
    versaoSoftware: "",

    possuiRastreamento:
      false,

    possuiTelemetria:
      false,

    trackingProvider: "",

    externalVehicleId: "",

    autorizadoTransporteEstudantil:
      "NAO_VERIFICADO",

    observacao: "",
  };
}

function criarFormularioCondutorInicial(
  locale: string
): FormularioCondutor {
  const codigo =
    paisInicial(locale);

  return {
    prestadorTransporteId:
      "",

    nome: "",

    tipo: "MOTORISTA",

    telefone: "",

    paisTelefone:
      codigo,

    email: "",

    paisDocumento:
      codigo,

    tipoDocumento: "",

    numeroDocumento: "",

    numeroLicenca: "",

    categoriaLicenca: "",

    licencaValidaAte: "",

    autorizadoTransporteEstudantil:
      "NAO_VERIFICADO",

    contatoEmergencia: "",

    telefoneEmergencia: "",

    paisTelefoneEmergencia:
      codigo,

    observacao: "",
  };
}

type OpcaoSelect = {
  value: string;
  label: string;
};

const TIPOS_PRESTADOR:
  TipoPrestador[] = [
    "RODOVIARIO",
    "AEREO",
    "FERROVIARIO",
    "MARITIMO",
    "MOBILIDADE_AUTONOMA",
    "MULTIMODAL",
    "OUTRO",
  ];

const VERIFICACOES:
  VerificacaoEstudantil[] = [
    "NAO_VERIFICADO",
    "VERIFICADO",
    "NAO_AUTORIZADO",
    "NAO_APLICAVEL",
  ];

const TIPOS_VEICULO:
  TipoVeiculo[] = [
    "ONIBUS",
    "MICRO_ONIBUS",
    "VAN",
    "AUTOMOVEL",
    "SUV",
    "MINIVAN",
    "CAMINHAO_ADAPTADO",
    "AERONAVE",
    "TREM",
    "METRO",
    "BONDE",
    "BARCO",
    "FERRY",
    "EMBARCACAO",
    "BICICLETA",
    "VEICULO_AUTONOMO",
    "OUTRO",
  ];

const TIPOS_CONDUCAO:
  TipoConducao[] = [
    "HUMANA",
    "ADAS",
    "AUTOMATIZADA_SUPERVISIONADA",
    "AUTONOMA",
    "SUPERVISAO_REMOTA",
    "MISTA",
    "NAO_APLICAVEL",
  ];

const PAIS_POR_LOCALE:
  Record<string, CountryCode> = {
  "pt-BR": "BR",
  "pt-PT": "PT",
  "en-US": "US",
  "es-ES": "ES",
  "fr-FR": "FR",
};

const TIPOS_CONDUTOR:
  TipoCondutor[] = [
  "MOTORISTA",
  "PILOTO",
  "MAQUINISTA",
  "COMANDANTE_EMBARCACAO",
  "OPERADOR",
  "OPERADOR_REMOTO",
  "SUPERVISOR_AUTONOMO",
  "OUTRO",
];

function paisInicial(
  locale: string
): CountryCode {
  return (
    PAIS_POR_LOCALE[
    locale
    ] ?? "BR"
  );
}

function nomeDoPais(
  codigo: CountryCode,
  locale: string
) {
  try {
    const nomes =
      new Intl.DisplayNames(
        [locale],
        {
          type: "region",
        }
      );

    return (
      nomes.of(codigo) ||
      codigo
    );
  } catch {
    return codigo;
  }
}

function criarFormularioPrestadorInicial(
  locale: string
): FormularioPrestador {
  const codigo =
    paisInicial(locale);

  return {
    nome: "",
    nomeFantasia: "",

    tipo: "RODOVIARIO",

    paisCodigo: codigo,
    pais: nomeDoPais(
      codigo,
      locale
    ),

    codigoPostal: "",

    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",

    cidade: "",
    regiao: "",

    telefone: "",
    paisTelefone: codigo,

    email: "",
    site: "",

    responsavelContato: "",

    telefoneResponsavelContato:
      "",

    paisTelefoneResponsavel:
      codigo,

    emailResponsavelContato:
      "",

    tipoDocumento: "",
    numeroDocumento: "",

    numeroLicenca: "",
    licencaValidaAte: "",

    numeroApolice: "",
    seguroValidoAte: "",

    verificacaoTransporteEstudantil:
      "NAO_VERIFICADO",

    permiteSubcontratacao:
      false,

    observacao: "",
  };
}

function formatarCodigoPostal(
  valor: string,
  pais: CountryCode
) {
  const limpo =
    valor
      .toUpperCase()
      .replace(
        /[^A-Z0-9 -]/g,
        ""
      );

  const digitos =
    limpo.replace(
      /\D/g,
      ""
    );

  if (pais === "BR") {
    return digitos
      .slice(0, 8)
      .replace(
        /^(\d{5})(\d)/,
        "$1-$2"
      );
  }

  if (pais === "PT") {
    return digitos
      .slice(0, 7)
      .replace(
        /^(\d{4})(\d)/,
        "$1-$2"
      );
  }

  if (pais === "US") {
    return digitos
      .slice(0, 9)
      .replace(
        /^(\d{5})(\d)/,
        "$1-$2"
      );
  }

  if (
    pais === "ES" ||
    pais === "FR"
  ) {
    return digitos.slice(
      0,
      5
    );
  }

  return limpo
    .replace(
      /\s+/g,
      " "
    )
    .slice(0, 16);
}

function SelectCadastro({
  value,
  onChange,
  options,
}: {
  value: string;

  onChange: (
    value: string
  ) => void;

  options: OpcaoSelect[];
}) {
  const [
    aberto,
    setAberto,
  ] = useState(false);

  const [
    termoBusca,
    setTermoBusca,
  ] = useState("");

  const ref =
    useRef<HTMLDivElement>(
      null
    );

  const timeoutBuscaRef =
    useRef<number | null>(
      null
    );

  function normalizarBusca(
    valor: string
  ) {
    return valor
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLocaleLowerCase();
  }

  function limparBuscaDepois() {
    if (
      timeoutBuscaRef.current !==
      null
    ) {
      window.clearTimeout(
        timeoutBuscaRef.current
      );
    }

    timeoutBuscaRef.current =
      window.setTimeout(
        () => {
          setTermoBusca("");
        },
        1200
      );
  }

  useEffect(() => {
    function fecharFora(
      event: MouseEvent
    ) {
      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
        setTermoBusca("");
      }
    }

    document.addEventListener(
      "mousedown",
      fecharFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharFora
      );

      if (
        timeoutBuscaRef.current !==
        null
      ) {
        window.clearTimeout(
          timeoutBuscaRef.current
        );
      }
    };
  }, []);

  const selecionada =
    options.find(
      (option) =>
        option.value === value
    );

  const termoNormalizado =
    normalizarBusca(
      termoBusca
    );

  const opcoesVisiveis =
    termoNormalizado
      ? options.filter(
          (option) => {
            const label =
              normalizarBusca(
                option.label
              );

            const valor =
              normalizarBusca(
                option.value
              );

            return (
              label.startsWith(
                termoNormalizado
              ) ||
              valor.startsWith(
                termoNormalizado
              )
            );
          }
        )
      : options;

  function tratarTecla(
    event:
      React.KeyboardEvent<HTMLDivElement>
  ) {
    if (!aberto) {
      return;
    }

    if (
      event.key === "Escape"
    ) {
      event.preventDefault();

      setAberto(false);
      setTermoBusca("");

      return;
    }

    if (
      event.key ===
      "Backspace"
    ) {
      event.preventDefault();

      setTermoBusca(
        (atual) =>
          atual.slice(
            0,
            -1
          )
      );

      limparBuscaDepois();

      return;
    }

    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    if (
      event.key.length !== 1
    ) {
      return;
    }

    event.preventDefault();

    setTermoBusca(
      (atual) =>
        `${atual}${event.key}`
    );

    limparBuscaDepois();
  }

  return (
    <div
      ref={ref}
      onKeyDown={
        tratarTecla
      }
      className="phanyx-transporte-select relative"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => {
          setAberto(
            (atual) => {
              const proximo =
                !atual;

              if (
                !proximo
              ) {
                setTermoBusca(
                  ""
                );
              }

              return proximo;
            }
          );
        }}
        className="phanyx-transporte-select-trigger flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="truncate">
          {
            selecionada?.label
          }
        </span>

        <span
          aria-hidden="true"
          className={[
            "shrink-0 text-[10px] transition-transform",
            aberto
              ? "rotate-180"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          ▼
        </span>
      </button>

      {aberto ? (
        <div
          role="listbox"
          className="phanyx-transporte-select-menu absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-72 overflow-y-auto rounded-xl border p-1.5 shadow-xl"
        >
          {termoBusca ? (
            <div className="mb-1 rounded-lg border px-3 py-2 text-xs font-bold opacity-70">
              🔎 {termoBusca}
            </div>
          ) : null}

          {opcoesVisiveis.map(
            (option) => {
              const ativo =
                option.value ===
                value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    ativo
                  }
                  onClick={() => {
                    onChange(
                      option.value
                    );

                    setAberto(
                      false
                    );

                    setTermoBusca(
                      ""
                    );
                  }}
                  className={[
                    "phanyx-transporte-select-option",
                    ativo
                      ? "is-selected"
                      : "",
                  ]
                    .filter(
                      Boolean
                    )
                    .join(" ")}
                >
                  <span>
                    {
                      option.label
                    }
                  </span>

                  {ativo ? (
                    <span>
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            }
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function CadastrosTransporte({
  onFechar,
  onCadastrosAlterados,
}: {
  onFechar: () => void;

  onCadastrosAlterados?: () =>
    | void
    | Promise<void>;
}) {

  const locale =
    useLocale();

  const t =
    useTranslations(
      "AdminExternalActivityTransport"
    );

  const [
    abaAtiva,
    setAbaAtiva,
  ] =
    useState<AbaCadastro>(
      "prestadores"
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] = useState(false);

  const [
    prestadores,
    setPrestadores,
  ] = useState<Prestador[]>([]);

  const [
    veiculos,
    setVeiculos,
  ] = useState<Veiculo[]>([]);

  const [
    condutores,
    setCondutores,
  ] = useState<Condutor[]>([]);

  const [
    formularioPrestadorAberto,
    setFormularioPrestadorAberto,
  ] = useState(false);

  const [
    salvandoPrestador,
    setSalvandoPrestador,
  ] = useState(false);

  const [
    formularioPrestador,
    setFormularioPrestador,
  ] =
    useState<FormularioPrestador>(
      () =>
        criarFormularioPrestadorInicial(
          locale
        )
    );

  const [
    formularioVeiculoAberto,
    setFormularioVeiculoAberto,
  ] = useState(false);

  const [
    salvandoVeiculo,
    setSalvandoVeiculo,
  ] = useState(false);

  const [
    formularioVeiculo,
    setFormularioVeiculo,
  ] =
    useState<FormularioVeiculo>(
      () =>
        criarFormularioVeiculoInicial(
          locale
        )
    );

    const [
  formularioCondutorAberto,
  setFormularioCondutorAberto,
] = useState(false);

const [
  salvandoCondutor,
  setSalvandoCondutor,
] = useState(false);

const [
  formularioCondutor,
  setFormularioCondutor,
] =
  useState<FormularioCondutor>(
    () =>
      criarFormularioCondutorInicial(
        locale
      )
  );

  const paises =
    useMemo(
      () =>
        getCountries()
          .map(
            (codigo) => ({
              value:
                codigo,

              label:
                nomeDoPais(
                  codigo,
                  locale
                ),
            })
          )
          .sort(
            (a, b) =>
              a.label.localeCompare(
                b.label,
                locale,
                {
                  sensitivity:
                    "base",
                }
              )
          ),
      [locale]
    );

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const [
        respostaPrestadores,
        respostaVeiculos,
        respostaCondutores,
      ] = await Promise.all([
        fetch(
          "/api/admin/transportes/prestadores",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/admin/transportes/veiculos",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/admin/transportes/condutores",
          {
            cache: "no-store",
          }
        ),
      ]);

      const [
        dadosPrestadores,
        dadosVeiculos,
        dadosCondutores,
      ] = await Promise.all([
        respostaPrestadores.json(),
        respostaVeiculos.json(),
        respostaCondutores.json(),
      ]);

      if (
        !respostaPrestadores.ok ||
        !dadosPrestadores?.ok
      ) {
        throw new Error(
          dadosPrestadores
            ?.error ||
          "ERRO_PRESTADORES"
        );
      }

      if (
        !respostaVeiculos.ok ||
        !dadosVeiculos?.ok
      ) {
        throw new Error(
          dadosVeiculos
            ?.error ||
          "ERRO_VEICULOS"
        );
      }

      if (
        !respostaCondutores.ok ||
        !dadosCondutores?.ok
      ) {
        throw new Error(
          dadosCondutores
            ?.error ||
          "ERRO_CONDUTORES"
        );
      }

      setPodeGerenciar(
        Boolean(
          dadosPrestadores
            .podeGerenciar &&
          dadosVeiculos
            .podeGerenciar &&
          dadosCondutores
            .podeGerenciar
        )
      );

      setPrestadores(
        dadosPrestadores
          .prestadores || []
      );

      setVeiculos(
        dadosVeiculos
          .veiculos || []
      );

      setCondutores(
        dadosCondutores
          .condutores || []
      );
    } catch (error) {
      console.error(
        "[CADASTROS_TRANSPORTE_CARREGAR]",
        error
      );

      setErro(
        t(
          "registrations.errors.load"
        )
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  function alterarPrestador<
    K extends keyof FormularioPrestador
  >(
    campo: K,
    valor: FormularioPrestador[K]
  ) {
    setFormularioPrestador(
      (atual) => ({
        ...atual,
        [campo]: valor,
      })
    );
  }

  function alterarVeiculo<
    K extends keyof FormularioVeiculo
  >(
    campo: K,
    valor: FormularioVeiculo[K]
  ) {
    setFormularioVeiculo(
      (atual) => ({
        ...atual,
        [campo]: valor,
      })
    );
  }

  function alterarCondutor<
  K extends keyof FormularioCondutor
>(
  campo: K,
  valor:
    FormularioCondutor[K]
) {
  setFormularioCondutor(
    (atual) => ({
      ...atual,
      [campo]: valor,
    })
  );
}

  async function salvarPrestador() {
    setErro("");
    setSucesso("");

    if (
      !formularioPrestador
        .nome
        .trim()
    ) {
      setErro(
        t(
          "registrations.errors.providerNameRequired"
        )
      );

      return;
    }

    setSalvandoPrestador(
      true
    );

    try {
      const resposta =
        await fetch(
          "/api/admin/transportes/prestadores",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nome:
                formularioPrestador
                  .nome,

              nomeFantasia:
                formularioPrestador
                  .nomeFantasia,

              tipo:
                formularioPrestador
                  .tipo,

              paisCodigo:
                formularioPrestador
                  .paisCodigo,

              pais:
                formularioPrestador
                  .pais,

              codigoPostal:
                formularioPrestador
                  .codigoPostal,

              endereco:
                formularioPrestador
                  .endereco,

              numero:
                formularioPrestador
                  .numero,

              complemento:
                formularioPrestador
                  .complemento,

              bairro:
                formularioPrestador
                  .bairro,

              regiao:
                formularioPrestador
                  .regiao,

              cidade:
                formularioPrestador
                  .cidade,

              telefone:
                formularioPrestador
                  .telefone,

              paisTelefone:
                formularioPrestador
                  .paisTelefone,

              email:
                formularioPrestador
                  .email,

              site:
                formularioPrestador
                  .site,

              responsavelContato:
                formularioPrestador
                  .responsavelContato,

              telefoneResponsavelContato:
                formularioPrestador
                  .telefoneResponsavelContato,

              paisTelefoneResponsavel:
                formularioPrestador
                  .paisTelefoneResponsavel,

              emailResponsavelContato:
                formularioPrestador
                  .emailResponsavelContato,

              tipoDocumento:
                formularioPrestador
                  .tipoDocumento,

              numeroDocumento:
                formularioPrestador
                  .numeroDocumento,

              numeroLicenca:
                formularioPrestador
                  .numeroLicenca,

              licencaValidaAte:
                formularioPrestador
                  .licencaValidaAte ||
                null,

              numeroApolice:
                formularioPrestador
                  .numeroApolice,

              seguroValidoAte:
                formularioPrestador
                  .seguroValidoAte ||
                null,

              verificacaoTransporteEstudantil:
                formularioPrestador
                  .verificacaoTransporteEstudantil,

              permiteSubcontratacao:
                formularioPrestador
                  .permiteSubcontratacao,

              observacao:
                formularioPrestador
                  .observacao,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        const codigo =
          String(
            dados?.error || ""
          );

        if (
          codigo ===
          "NOME_OBRIGATORIO"
        ) {
          throw new Error(
            "NOME_OBRIGATORIO"
          );
        }

        throw new Error(
          codigo ||
          "ERRO_SALVAR"
        );
      }

      setFormularioPrestador(
        criarFormularioPrestadorInicial(
          locale
        )
      );

      setFormularioPrestadorAberto(
        false
      );

      setSucesso(
        t(
          "registrations.success.providerCreated"
        )
      );

      await carregar();

      await onCadastrosAlterados?.();
    } catch (error) {
      console.error(
        "[CADASTROS_TRANSPORTE_PRESTADOR_POST]",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
        "NOME_OBRIGATORIO"
      ) {
        setErro(
          t(
            "registrations.errors.providerNameRequired"
          )
        );
      } else {
        setErro(
          t(
            "registrations.errors.saveProvider"
          )
        );
      }
    } finally {
      setSalvandoPrestador(
        false
      );
    }
  }

  async function salvarVeiculo() {
    setErro("");
    setSucesso("");

    setSalvandoVeiculo(
      true
    );

    try {
      const resposta =
        await fetch(
          "/api/admin/transportes/veiculos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              prestadorTransporteId:
                formularioVeiculo
                  .prestadorTransporteId ||
                null,

              nomeIdentificacao:
                formularioVeiculo
                  .nomeIdentificacao,

              tipo:
                formularioVeiculo
                  .tipo,

              marca:
                formularioVeiculo
                  .marca,

              modelo:
                formularioVeiculo
                  .modelo,

              ano:
                formularioVeiculo
                  .ano ||
                null,

              placa:
                formularioVeiculo
                  .placa,

              paisRegistro:
                formularioVeiculo
                  .paisRegistro,

              identificadorExterno:
                formularioVeiculo
                  .identificadorExterno,

              capacidadePassageiros:
                formularioVeiculo
                  .capacidadePassageiros ||
                null,

              acessivelPcd:
                formularioVeiculo
                  .acessivelPcd,

              tipoConducao:
                formularioVeiculo
                  .tipoConducao,

              sistemaConducao:
                formularioVeiculo
                  .sistemaConducao,

              versaoSoftware:
                formularioVeiculo
                  .versaoSoftware,

              possuiRastreamento:
                formularioVeiculo
                  .possuiRastreamento,

              possuiTelemetria:
                formularioVeiculo
                  .possuiTelemetria,

              trackingProvider:
                formularioVeiculo
                  .trackingProvider,

              externalVehicleId:
                formularioVeiculo
                  .externalVehicleId,

              autorizadoTransporteEstudantil:
                formularioVeiculo
                  .autorizadoTransporteEstudantil,

              observacao:
                formularioVeiculo
                  .observacao,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        throw new Error(
          String(
            dados?.error ||
            "ERRO_SALVAR_VEICULO"
          )
        );
      }

      setFormularioVeiculo(
        criarFormularioVeiculoInicial(
          locale
        )
      );

      setFormularioVeiculoAberto(
        false
      );

      setSucesso(
        t(
          "registrations.success.vehicleCreated"
        )
      );

      await carregar();

      await onCadastrosAlterados?.();
    } catch (error) {
      console.error(
        "[CADASTROS_TRANSPORTE_VEICULO_POST]",
        error
      );

      setErro(
        t(
          "registrations.errors.saveVehicle"
        )
      );
    } finally {
      setSalvandoVeiculo(
        false
      );
    }
  }

  return (
    <div className="phanyx-transporte-cadastros rounded-2xl border p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black">
            ⚙️{" "}
            {t(
              "registrations.title"
            )}
          </h3>

          <p className="mt-1 text-sm opacity-75">
            {t(
              "registrations.description"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="phanyx-transporte-secondary-button rounded-xl border px-4 py-2.5 text-sm font-extrabold"
        >
          {t(
            "registrations.close"
          )}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <BotaoAba
          ativo={
            abaAtiva ===
            "prestadores"
          }
          onClick={() => {
            setAbaAtiva(
              "prestadores"
            );

            setFormularioVeiculoAberto(
              false
            );

            setErro("");
            setSucesso("");
          }}
        >
          🏢{" "}
          {t(
            "registrations.tabs.providers"
          )}{" "}
          ({prestadores.length})
        </BotaoAba>

        <BotaoAba
          ativo={
            abaAtiva ===
            "veiculos"
          }
          onClick={() => {
            setAbaAtiva(
              "veiculos"
            );

            setFormularioPrestadorAberto(
              false
            );

            setErro("");
            setSucesso("");
          }}
        >
          🚐{" "}
          {t(
            "registrations.tabs.vehicles"
          )}{" "}
          ({veiculos.length})
        </BotaoAba>

        <BotaoAba
          ativo={
            abaAtiva ===
            "condutores"
          }
          onClick={() => {
            setAbaAtiva(
              "condutores"
            );

            setFormularioVeiculoAberto(
              false
            );

            setFormularioPrestadorAberto(
              false
            );

            setErro("");
            setSucesso("");
          }}
        >
          🧑‍✈️{" "}
          {t(
            "registrations.tabs.drivers"
          )}{" "}
          ({condutores.length})
        </BotaoAba>
      </div>

      {erro ? (
        <div className="phanyx-transporte-error mt-4 rounded-xl border p-3 text-sm font-semibold">
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div className="phanyx-transporte-success mt-4 rounded-xl border p-3 text-sm font-semibold">
          {sucesso}
        </div>
      ) : null}

      {carregando ? (
        <div className="phanyx-transporte-empty mt-4 rounded-xl border p-6 text-sm">
          {t(
            "registrations.loading"
          )}
        </div>
      ) : abaAtiva ===
        "prestadores" ? (
        <div className="mt-4 space-y-4">
          {podeGerenciar ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setErro("");
                  setSucesso("");

                  setFormularioPrestadorAberto(
                    (atual) =>
                      !atual
                  );
                }}
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-800"
              >
                {formularioPrestadorAberto
                  ? t(
                    "registrations.actions.cancel"
                  )
                  : t(
                    "registrations.actions.addProvider"
                  )}
              </button>
            </div>
          ) : null}

          {formularioPrestadorAberto ? (
            <div className="phanyx-transporte-form rounded-2xl border p-4 sm:p-5">
              <div>
                <h4 className="text-lg font-black">
                  {t(
                    "registrations.providerForm.title"
                  )}
                </h4>

                <p className="mt-1 text-sm opacity-75">
                  {t(
                    "registrations.providerForm.description"
                  )}
                </p>
              </div>

              <SecaoFormulario
                titulo={`🏢 ${t(
                  "registrations.providerForm.sections.identification"
                )}`}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.name"
                    )}
                    obrigatorio
                  >
                    <input
                      value={
                        formularioPrestador
                          .nome
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "nome",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.tradeName"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .nomeFantasia
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "nomeFantasia",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.type"
                    )}
                    obrigatorio
                  >
                    <SelectCadastro
                      value={
                        formularioPrestador
                          .tipo
                      }
                      onChange={(
                        valor
                      ) =>
                        alterarPrestador(
                          "tipo",
                          valor as TipoPrestador
                        )
                      }
                      options={TIPOS_PRESTADOR.map(
                        (tipo) => ({
                          value:
                            tipo,

                          label:
                            t(
                              `registrations.providerTypes.${tipo}`
                            ),
                        })
                      )}
                    />
                  </CampoCadastro>
                </div>
              </SecaoFormulario>

              <SecaoFormulario
                titulo={`📍 ${t(
                  "registrations.providerForm.sections.location"
                )}`}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.country"
                    )}
                  >
                    <SelectCadastro
                      value={
                        formularioPrestador
                          .paisCodigo
                      }
                      onChange={(
                        valor
                      ) => {
                        const codigo =
                          valor as CountryCode;

                        alterarPrestador(
                          "paisCodigo",
                          codigo
                        );

                        alterarPrestador(
                          "pais",
                          nomeDoPais(
                            codigo,
                            locale
                          )
                        );

                        alterarPrestador(
                          "codigoPostal",
                          formatarCodigoPostal(
                            formularioPrestador
                              .codigoPostal,
                            codigo
                          )
                        );
                      }}
                      options={paises}
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.postalCode"
                    )}
                  >
                    <input
                      autoComplete="postal-code"
                      value={
                        formularioPrestador
                          .codigoPostal
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "codigoPostal",
                          formatarCodigoPostal(
                            e.target.value,
                            formularioPrestador
                              .paisCodigo
                          )
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <div className="lg:col-span-2">
                    <CampoCadastro
                      label={t(
                        "registrations.providerForm.street"
                      )}
                    >
                      <input
                        autoComplete="street-address"
                        value={
                          formularioPrestador
                            .endereco
                        }
                        onChange={(e) =>
                          alterarPrestador(
                            "endereco",
                            e.target.value
                          )
                        }
                        className="phanyx-transporte-input"
                      />
                    </CampoCadastro>
                  </div>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.number"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .numero
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "numero",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.complement"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .complemento
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "complemento",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.district"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .bairro
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "bairro",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.city"
                    )}
                  >
                    <input
                      autoComplete="address-level2"
                      value={
                        formularioPrestador
                          .cidade
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "cidade",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.region"
                    )}
                  >
                    <input
                      autoComplete="address-level1"
                      value={
                        formularioPrestador
                          .regiao
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "regiao",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>
                </div>
              </SecaoFormulario>

              <SecaoFormulario
                titulo={`☎️ ${t(
                  "registrations.providerForm.sections.contact"
                )}`}
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.phone"
                    )}
                  >
                    <CampoTelefoneInternacional
                      id="prestador-transporte-telefone"
                      value={
                        formularioPrestador
                          .telefone
                      }
                      pais={
                        formularioPrestador
                          .paisTelefone
                      }
                      onChange={(
                        valor,
                        pais
                      ) =>
                        setFormularioPrestador(
                          (atual) => ({
                            ...atual,
                            telefone:
                              valor,
                            paisTelefone:
                              pais,
                          })
                        )
                      }
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.email"
                    )}
                  >
                    <input
                      type="email"
                      value={
                        formularioPrestador
                          .email
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "email",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.site"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .site
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "site",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.contactPerson"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .responsavelContato
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "responsavelContato",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.contactPhone"
                    )}
                  >
                    <CampoTelefoneInternacional
                      id="prestador-transporte-telefone-responsavel"
                      value={
                        formularioPrestador
                          .telefoneResponsavelContato
                      }
                      pais={
                        formularioPrestador
                          .paisTelefoneResponsavel
                      }
                      onChange={(
                        valor,
                        pais
                      ) =>
                        setFormularioPrestador(
                          (atual) => ({
                            ...atual,

                            telefoneResponsavelContato:
                              valor,

                            paisTelefoneResponsavel:
                              pais,
                          })
                        )
                      }
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.contactEmail"
                    )}
                  >
                    <input
                      type="email"
                      value={
                        formularioPrestador
                          .emailResponsavelContato
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "emailResponsavelContato",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>
                </div>
              </SecaoFormulario>

              <SecaoFormulario
                titulo={`📋 ${t(
                  "registrations.providerForm.sections.compliance"
                )}`}
              >
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.documentType"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .tipoDocumento
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "tipoDocumento",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.documentNumber"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .numeroDocumento
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "numeroDocumento",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.studentVerification"
                    )}
                  >
                    <SelectCadastro
                      value={
                        formularioPrestador
                          .verificacaoTransporteEstudantil
                      }
                      onChange={(
                        valor
                      ) =>
                        alterarPrestador(
                          "verificacaoTransporteEstudantil",
                          valor as VerificacaoEstudantil
                        )
                      }
                      options={VERIFICACOES.map(
                        (
                          status
                        ) => ({
                          value:
                            status,

                          label:
                            t(
                              `registrations.studentVerification.${status}`
                            ),
                        })
                      )}
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.licenseNumber"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .numeroLicenca
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "numeroLicenca",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.licenseExpiry"
                    )}
                  >
                    <input
                      type="date"
                      value={
                        formularioPrestador
                          .licencaValidaAte
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "licencaValidaAte",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <div />

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.policyNumber"
                    )}
                  >
                    <input
                      value={
                        formularioPrestador
                          .numeroApolice
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "numeroApolice",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.providerForm.insuranceExpiry"
                    )}
                  >
                    <input
                      type="date"
                      value={
                        formularioPrestador
                          .seguroValidoAte
                      }
                      onChange={(e) =>
                        alterarPrestador(
                          "seguroValidoAte",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>
                </div>

                <label className="phanyx-transporte-local mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={
                      formularioPrestador
                        .permiteSubcontratacao
                    }
                    onChange={(e) =>
                      alterarPrestador(
                        "permiteSubcontratacao",
                        e.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <div>
                    <div className="text-sm font-extrabold">
                      {t(
                        "registrations.providerForm.allowsSubcontracting"
                      )}
                    </div>

                    <div className="mt-0.5 text-xs opacity-70">
                      {t(
                        "registrations.providerForm.allowsSubcontractingHelp"
                      )}
                    </div>
                  </div>
                </label>
              </SecaoFormulario>

              <div className="mt-4">
                <CampoCadastro
                  label={t(
                    "registrations.providerForm.notes"
                  )}
                >
                  <textarea
                    rows={3}
                    value={
                      formularioPrestador
                        .observacao
                    }
                    onChange={(e) =>
                      alterarPrestador(
                        "observacao",
                        e.target.value
                      )
                    }
                    className="phanyx-transporte-input min-h-[96px] resize-y"
                  />
                </CampoCadastro>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={
                    salvandoPrestador
                  }
                  onClick={() =>
                    void salvarPrestador()
                  }
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvandoPrestador
                    ? t(
                      "registrations.actions.saving"
                    )
                    : t(
                      "registrations.actions.saveProvider"
                    )}
                </button>
              </div>
            </div>
          ) : null}

          <ListaPrestadores
            itens={prestadores}
            vazio={t(
              "registrations.empty.providers"
            )}
            traduzirTipo={(
              tipo
            ) =>
              t(
                `registrations.providerTypes.${tipo}`
              )
            }
          />
        </div>
      ) : abaAtiva ===
        "veiculos" ? (
        <div className="mt-4 space-y-4">
          {podeGerenciar ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setErro("");
                  setSucesso("");

                  setFormularioVeiculoAberto(
                    (atual) =>
                      !atual
                  );
                }}
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-800"
              >
                {formularioVeiculoAberto
                  ? t(
                    "registrations.actions.cancel"
                  )
                  : t(
                    "registrations.actions.addVehicle"
                  )}
              </button>
            </div>
          ) : null}

          {formularioVeiculoAberto ? (
            <div className="phanyx-transporte-form rounded-2xl border p-4 sm:p-5">
              <div>
                <h4 className="text-lg font-black">
                  {t(
                    "registrations.vehicleForm.title"
                  )}
                </h4>

                <p className="mt-1 text-sm opacity-75">
                  {t(
                    "registrations.vehicleForm.description"
                  )}
                </p>
              </div>

              <SecaoFormulario
                titulo={`🚐 ${t(
                  "registrations.vehicleForm.sections.identification"
                )}`}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.provider"
                    )}
                  >
                    <SelectCadastro
                      value={
                        formularioVeiculo
                          .prestadorTransporteId
                      }
                      onChange={(
                        valor
                      ) =>
                        alterarVeiculo(
                          "prestadorTransporteId",
                          valor
                        )
                      }
                      options={[
                        {
                          value: "",
                          label: t(
                            "registrations.vehicleForm.noProvider"
                          ),
                        },
                        ...prestadores
                          .filter(
                            (prestador) =>
                              prestador.ativo
                          )
                          .map(
                            (
                              prestador
                            ) => ({
                              value:
                                String(
                                  prestador.id
                                ),

                              label:
                                prestador
                                  .nomeFantasia ||
                                prestador.nome,
                            })
                          ),
                      ]}
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.name"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .nomeIdentificacao
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "nomeIdentificacao",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.type"
                    )}
                    obrigatorio
                  >
                    <SelectCadastro
                      value={
                        formularioVeiculo
                          .tipo
                      }
                      onChange={(
                        valor
                      ) =>
                        alterarVeiculo(
                          "tipo",
                          valor as TipoVeiculo
                        )
                      }
                      options={TIPOS_VEICULO.map(
                        (tipo) => ({
                          value: tipo,

                          label: t(
                            `registrations.vehicleTypes.${tipo}`
                          ),
                        })
                      )}
                    />
                  </CampoCadastro>
                </div>
              </SecaoFormulario>

              <SecaoFormulario
                titulo={`🌍 ${t(
                  "registrations.vehicleForm.sections.registration"
                )}`}
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.registrationCountry"
                    )}
                  >
                    <SelectCadastro
                      value={
                        formularioVeiculo
                          .paisRegistro
                      }
                      onChange={(
                        valor
                      ) =>
                        alterarVeiculo(
                          "paisRegistro",
                          valor as CountryCode
                        )
                      }
                      options={paises}
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.plate"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .placa
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "placa",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.externalIdentifier"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .identificadorExterno
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "identificadorExterno",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>
                </div>
              </SecaoFormulario>

              <SecaoFormulario
                titulo={`🚌 ${t(
                  "registrations.vehicleForm.sections.vehicle"
                )}`}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.brand"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .marca
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "marca",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.model"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .modelo
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "modelo",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.year"
                    )}
                  >
                    <input
                      type="number"
                      min="1800"
                      max="2200"
                      value={
                        formularioVeiculo
                          .ano
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "ano",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.capacity"
                    )}
                  >
                    <input
                      type="number"
                      min="0"
                      value={
                        formularioVeiculo
                          .capacidadePassageiros
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "capacidadePassageiros",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>
                </div>

                <label className="phanyx-transporte-local mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={
                      formularioVeiculo
                        .acessivelPcd
                    }
                    onChange={(e) =>
                      alterarVeiculo(
                        "acessivelPcd",
                        e.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <div>
                    <div className="text-sm font-extrabold">
                      {t(
                        "registrations.vehicleForm.accessible"
                      )}
                    </div>

                    <div className="mt-0.5 text-xs opacity-70">
                      {t(
                        "registrations.vehicleForm.accessibleHelp"
                      )}
                    </div>
                  </div>
                </label>

                <div className="mt-4">
                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.studentVerification"
                    )}
                  >
                    <SelectCadastro
                      value={
                        formularioVeiculo
                          .autorizadoTransporteEstudantil
                      }
                      onChange={(
                        valor
                      ) =>
                        alterarVeiculo(
                          "autorizadoTransporteEstudantil",
                          valor as VerificacaoEstudantil
                        )
                      }
                      options={VERIFICACOES.map(
                        (
                          status
                        ) => ({
                          value:
                            status,

                          label:
                            t(
                              `registrations.studentVerification.${status}`
                            ),
                        })
                      )}
                    />
                  </CampoCadastro>
                </div>
              </SecaoFormulario>

              <SecaoFormulario
                titulo={`⚙️ ${t(
                  "registrations.vehicleForm.sections.technology"
                )}`}
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.drivingType"
                    )}
                  >
                    <SelectCadastro
                      value={
                        formularioVeiculo
                          .tipoConducao
                      }
                      onChange={(
                        valor
                      ) =>
                        alterarVeiculo(
                          "tipoConducao",
                          valor as TipoConducao
                        )
                      }
                      options={TIPOS_CONDUCAO.map(
                        (
                          tipo
                        ) => ({
                          value:
                            tipo,

                          label:
                            t(
                              `registrations.drivingTypes.${tipo}`
                            ),
                        })
                      )}
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.drivingSystem"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .sistemaConducao
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "sistemaConducao",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.softwareVersion"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .versaoSoftware
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "versaoSoftware",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="phanyx-transporte-local flex cursor-pointer items-start gap-3 rounded-xl border p-3">
                    <input
                      type="checkbox"
                      checked={
                        formularioVeiculo
                          .possuiRastreamento
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "possuiRastreamento",
                          e.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 accent-blue-600"
                    />

                    <div className="text-sm font-extrabold">
                      {t(
                        "registrations.vehicleForm.tracking"
                      )}
                    </div>
                  </label>

                  <label className="phanyx-transporte-local flex cursor-pointer items-start gap-3 rounded-xl border p-3">
                    <input
                      type="checkbox"
                      checked={
                        formularioVeiculo
                          .possuiTelemetria
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "possuiTelemetria",
                          e.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 accent-blue-600"
                    />

                    <div className="text-sm font-extrabold">
                      {t(
                        "registrations.vehicleForm.telemetry"
                      )}
                    </div>
                  </label>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.trackingProvider"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .trackingProvider
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "trackingProvider",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>

                  <CampoCadastro
                    label={t(
                      "registrations.vehicleForm.externalVehicleId"
                    )}
                  >
                    <input
                      value={
                        formularioVeiculo
                          .externalVehicleId
                      }
                      onChange={(e) =>
                        alterarVeiculo(
                          "externalVehicleId",
                          e.target.value
                        )
                      }
                      className="phanyx-transporte-input"
                    />
                  </CampoCadastro>
                </div>
              </SecaoFormulario>

              <div className="mt-4">
                <CampoCadastro
                  label={t(
                    "registrations.vehicleForm.notes"
                  )}
                >
                  <textarea
                    rows={3}
                    value={
                      formularioVeiculo
                        .observacao
                    }
                    onChange={(e) =>
                      alterarVeiculo(
                        "observacao",
                        e.target.value
                      )
                    }
                    className="phanyx-transporte-input min-h-[96px] resize-y"
                  />
                </CampoCadastro>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={
                    salvandoVeiculo
                  }
                  onClick={() =>
                    void salvarVeiculo()
                  }
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvandoVeiculo
                    ? t(
                      "registrations.actions.saving"
                    )
                    : t(
                      "registrations.actions.saveVehicle"
                    )}
                </button>
              </div>
            </div>
          ) : null}

          <ListaVeiculos
            itens={veiculos}
            vazio={t(
              "registrations.empty.vehicles"
            )}
            traduzirTipo={(
              tipo
            ) =>
              t(
                `registrations.vehicleTypes.${tipo}`
              )
            }
            traduzirConducao={(
              tipo
            ) =>
              t(
                `registrations.drivingTypes.${tipo}`
              )
            }
          />
        </div>
      ) : (
        <ListaCondutores
          itens={condutores}
          vazio={t(
            "registrations.empty.drivers"
          )}
        />
      )}
    </div>
  );
}

function BotaoAba({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-2.5 text-sm font-extrabold transition",
        ativo
          ? "bg-blue-700 text-white"
          : "phanyx-transporte-tab",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CampoCadastro({
  label,
  obrigatorio = false,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black">
        {label}

        {obrigatorio ? (
          <span className="ml-1 text-red-500">
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function SecaoFormulario({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="phanyx-transporte-local mt-4 rounded-2xl border p-4">
      <h5 className="mb-4 text-sm font-black">
        {titulo}
      </h5>

      {children}
    </div>
  );
}

function ListaPrestadores({
  itens,
  vazio,
  traduzirTipo,
}: {
  itens: Prestador[];
  vazio: string;
  traduzirTipo: (
    tipo: TipoPrestador
  ) => string;
}) {
  if (!itens.length) {
    return (
      <EstadoVazio
        texto={vazio}
      />
    );
  }

  return (
    <div className="space-y-2">
      {itens.map(
        (item) => {
          const local = [
            item.cidade,
            item.regiao,
            item.pais,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <div
              key={item.id}
              className="phanyx-transporte-registration-item rounded-xl border p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-extrabold">
                    {item.nomeFantasia ||
                      item.nome}
                  </div>

                  {item.nomeFantasia ? (
                    <div className="mt-0.5 text-xs opacity-65">
                      {item.nome}
                    </div>
                  ) : null}
                </div>

                <span className="phanyx-transporte-chip rounded-full border px-2.5 py-1 text-xs font-bold">
                  {traduzirTipo(
                    item.tipo
                  )}
                </span>
              </div>

              {local ? (
                <div className="mt-2 text-xs opacity-70">
                  📍 {local}
                </div>
              ) : null}

              {item.telefone ||
                item.email ? (
                <div className="mt-1 text-xs opacity-70">
                  {[
                    item.telefone,
                    item.email,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
              ) : null}
            </div>
          );
        }
      )}
    </div>
  );
}

function ListaVeiculos({
  itens,
  vazio,
  traduzirTipo,
  traduzirConducao,
}: {
  itens: Veiculo[];
  vazio: string;

  traduzirTipo: (
    tipo: TipoVeiculo
  ) => string;

  traduzirConducao: (
    tipo: TipoConducao
  ) => string;
}) {
  if (!itens.length) {
    return (
      <EstadoVazio
        texto={vazio}
      />
    );
  }

  return (
    <div className="space-y-2">
      {itens.map(
        (item) => (
          <div
            key={item.id}
            className="phanyx-transporte-registration-item rounded-xl border p-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-extrabold">
                  {item.nomeIdentificacao ||
                    item.placa ||
                    traduzirTipo(
                      item.tipo
                    )}
                </div>

                {item.prestadorTransporte ? (
                  <div className="mt-0.5 text-xs opacity-65">
                    {
                      item
                        .prestadorTransporte
                        .nomeFantasia ||
                      item
                        .prestadorTransporte
                        .nome
                    }
                  </div>
                ) : null}
              </div>

              <span className="phanyx-transporte-chip rounded-full border px-2.5 py-1 text-xs font-bold">
                {traduzirTipo(
                  item.tipo
                )}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-75">
              {item.marca ||
                item.modelo ||
                item.ano ? (
                <span>
                  🚐{" "}
                  {[
                    item.marca,
                    item.modelo,
                    item.ano,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              ) : null}

              {item.placa ? (
                <span>
                  🪪{" "}
                  {item.paisRegistro
                    ? `${item.paisRegistro} • `
                    : ""}
                  {item.placa}
                </span>
              ) : null}

              {item.capacidadePassageiros !==
                null &&
                item.capacidadePassageiros !==
                undefined ? (
                <span>
                  👥{" "}
                  {
                    item.capacidadePassageiros
                  }
                </span>
              ) : null}

              <span>
                ⚙️{" "}
                {traduzirConducao(
                  item.tipoConducao
                )}
              </span>

              {item.acessivelPcd ? (
                <span>
                  ♿ PCD
                </span>
              ) : null}

              {item.possuiRastreamento ? (
                <span>
                  📍 GPS
                </span>
              ) : null}

              {item.possuiTelemetria ? (
                <span>
                  📡 Telemetria
                </span>
              ) : null}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function ListaCondutores({
  itens,
  vazio,
}: {
  itens: Condutor[];
  vazio: string;
}) {
  if (!itens.length) {
    return (
      <EstadoVazio
        texto={vazio}
      />
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {itens.map(
        (item) => (
          <div
            key={item.id}
            className="phanyx-transporte-registration-item rounded-xl border p-3"
          >
            <div className="font-extrabold">
              {item.nome}
            </div>

            <div className="mt-1 text-xs opacity-70">
              {item.tipo}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EstadoVazio({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="phanyx-transporte-empty rounded-xl border p-8 text-center">
      <div className="text-3xl">
        📭
      </div>

      <div className="mt-2 text-sm font-bold opacity-75">
        {texto}
      </div>
    </div>
  );
}