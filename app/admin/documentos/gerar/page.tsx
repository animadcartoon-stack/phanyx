"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";

type TipoCampoManual =
  | "texto"
  | "textarea"
  | "moeda"
  | "data"
  | "select";

type CampoManual = {
  tag: string;
  label: string;
  tipo: TipoCampoManual;
  placeholder?: string;
  opcoes?: string[];
};

type Template = {
  id: number;
  nome: string;
  tipo: string;
  contexto?: string | null;
  conteudo?: string;
  ativo?: boolean;
  exigeAssinatura?: boolean;
  formatoImpressao?: string;
  tags?: string[];
  tagsAutomaticas?: string[];
  tagsManuais?: string[];
  camposManuais?: CampoManual[];
};

type Aluno = {
  id: number;
  nome: string;
};

type FuncionarioDocumento = {
  id: number;
  nome: string;
  cargo?: string | null;
  setor?: string | null;
  salario?: number | null;
  salarioBase?: number | null;
  codigoFuncionario?: string | null;
  dataAdmissao?: string | null;
  statusFuncionario?: string | null;
};

type ProfessorDocumento = {
  id: number;
  nome: string;
  statusProfessor?: string | null;

  funcionarioId?: number | null;

  funcionario?: {
    id: number;
    nome?: string | null;
    cargo?: string | null;
    ativo?: boolean | null;
  } | null;
};

type HoleriteDocumento = {
  id: number;
  funcionarioId: number;
  competenciaMes: number;
  competenciaAno: number;
  status?: string | null;
  arquivado?: boolean | null;
  cancelado?: boolean | null;
};

const TAGS_HOLERITE_DOCUMENTO = new Set([
  "competenciaMes",
  "competenciaAno",
  "competenciaHolerite",
  "eventosHolerite",
  "totalVencimentos",
  "totalDescontos",
  "valorLiquido",
  "baseInss",
  "baseFgts",
  "fgtsMes",
  "baseIrrf",
]);

const CHAVES_TIPO_DOCUMENTO: Record<string, string> = {
  CONTRATO: "types.contract",
  DECLARACAO: "types.declaration",
  RECIBO: "types.receipt",
  COMPROVANTE: "types.proof",
  TRANCAMENTO: "types.withdrawal",
  COMPARECIMENTO: "types.attendance",
  HISTORICO: "types.transcript",
  HOLERITE: "types.payslip",
  DOCUMENTO_RH: "types.hrDocument",
  CONTRATO_TRABALHO: "types.employmentContract",
  CONTRATO_EXPERIENCIA: "types.probationContract",
  TERMO_LGPD_RH: "types.hrPrivacyTerm",
  TERMO_EQUIPAMENTOS: "types.equipmentTerm",
  ADMISSAO: "types.admission",
  DEMISSAO: "types.dismissal",
  PEDIDO_DEMISSAO: "types.resignation",
  AVISO_PREVIO: "types.notice",
  TRCT: "types.terminationTerm",
  FERIAS: "types.vacation",
  AVISO_FERIAS: "types.vacationNotice",
  RECIBO_FERIAS: "types.vacationReceipt",
  ADVERTENCIA: "types.warning",
  SUSPENSAO: "types.suspension",
  AFASTAMENTO_MEDICO: "types.medicalLeave",
  AFASTAMENTO_MATERNIDADE: "types.maternityLeave",
  AFASTAMENTO_PERICIA: "types.medicalAssessmentLeave",
  RETORNO_TRABALHO: "types.returnToWork",
  ASO: "types.occupationalHealthCertificate",
  ASO_ADMISSIONAL: "types.occupationalHealthAdmission",
  ASO_PERIODICO: "types.occupationalHealthPeriodic",
  ASO_RETORNO: "types.occupationalHealthReturn",
  ASO_MUDANCA_FUNCAO: "types.occupationalHealthRoleChange",
  ASO_DEMISSIONAL: "types.occupationalHealthDismissal",
  OUTRO: "types.other",
};

const CHAVES_STATUS_DOCUMENTO: Record<string, string> = {
  RASCUNHO: "statuses.draft",
  GERADO: "statuses.generated",
  ASSINADO: "statuses.signed",
  CANCELADO: "statuses.cancelled",
  ABERTO: "statuses.opened",
};

const CHAVES_CAMPOS_MANUAIS: Record<
  string,
  {
    label: string;
    placeholder?: string;
  }
> = {
  descricaoDocumento: {
    label: "generate.manualFields.documentDescription.label",
    placeholder: "generate.manualFields.documentDescription.placeholder",
  },
  finalidadeDocumento: {
    label: "generate.manualFields.documentPurpose.label",
    placeholder: "generate.manualFields.documentPurpose.placeholder",
  },
  destinatarioDocumento: {
    label: "generate.manualFields.documentRecipient.label",
    placeholder: "generate.manualFields.documentRecipient.placeholder",
  },
  assuntoDocumento: {
    label: "generate.manualFields.documentSubject.label",
    placeholder: "generate.manualFields.documentSubject.placeholder",
  },
  observacoesDocumento: {
    label: "generate.manualFields.documentNotes.label",
    placeholder: "generate.manualFields.documentNotes.placeholder",
  },
  periodoReferencia: {
    label: "generate.manualFields.referencePeriod.label",
    placeholder: "generate.manualFields.referencePeriod.placeholder",
  },
  competencia: {
    label: "generate.manualFields.competence.label",
    placeholder: "generate.manualFields.competence.placeholder",
  },
  valorDocumento: {
    label: "generate.manualFields.documentValue.label",
    placeholder: "generate.manualFields.documentValue.placeholder",
  },
  valorRecebido: {
    label: "generate.manualFields.receivedValue.label",
    placeholder: "generate.manualFields.receivedValue.placeholder",
  },
  valor: {
    label: "generate.manualFields.value.label",
    placeholder: "generate.manualFields.value.placeholder",
  },
  nomePagador: {
    label: "generate.manualFields.payerName.label",
    placeholder: "generate.manualFields.payerName.placeholder",
  },
  documentoPagador: {
    label: "generate.manualFields.payerDocument.label",
    placeholder: "generate.manualFields.payerDocument.placeholder",
  },
  formaPagamento: {
    label: "generate.manualFields.paymentMethod.label",
  },
  dataPagamento: {
    label: "generate.manualFields.paymentDate.label",
  },
  referenciaPagamento: {
    label: "generate.manualFields.paymentReference.label",
    placeholder: "generate.manualFields.paymentReference.placeholder",
  },
  nomePrestador: {
    label: "generate.manualFields.providerName.label",
    placeholder: "generate.manualFields.providerName.placeholder",
  },
  documentoPrestador: {
    label: "generate.manualFields.providerDocument.label",
    placeholder: "generate.manualFields.providerDocument.placeholder",
  },
  descricaoServico: {
    label: "generate.manualFields.serviceDescription.label",
    placeholder: "generate.manualFields.serviceDescription.placeholder",
  },
};

const CHAVES_OPCOES_CAMPOS_MANUAIS: Record<string, string> = {
  PIX: "generate.manualOptions.pix",
  Dinheiro: "generate.manualOptions.cash",
  "Cartão de crédito": "generate.manualOptions.creditCard",
  "Cartão de débito": "generate.manualOptions.debitCard",
  "Transferência bancária": "generate.manualOptions.bankTransfer",
  Boleto: "generate.manualOptions.bankSlip",
  Cheque: "generate.manualOptions.check",
  Outro: "generate.manualOptions.other",
};

const CHAVES_ERROS_API: Record<string, string> = {
  "Templates com tags de holerite precisam usar contexto de funcionário, professor ou RH.":
    "generate.errors.payslipTemplateRequiresHrContext",
  "Selecione a competência do holerite antes de gerar este documento.":
    "generate.errors.selectPayslip",
  "O holerite selecionado não existe, está cancelado/arquivado ou não pertence ao funcionário escolhido.":
    "generate.errors.payslipUnavailable",
};

type Matricula = {
  id: number;
  aluno?: {
    id?: number | null;
    nome?: string | null;
  } | null;
};

type FormatoImpressao =
  | "A4_INTEIRA"
  | "DUAS_VIAS_A4";

function extrairLista<T>(
  data: any,
  chave: string
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[chave])) {
    return data[chave];
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizarTipo(
  valor?: string | null
) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function converterValorMonetario(
  valor?: string
) {
  const texto = String(valor || "")
    .trim();

  if (!texto) {
    return null;
  }

  let normalizado = texto;

  if (
    normalizado.includes(",") &&
    normalizado.includes(".")
  ) {
    normalizado = normalizado
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (
    normalizado.includes(",")
  ) {
    normalizado =
      normalizado.replace(",", ".");
  }

  const numero =
    Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : null;
}

export default function GerarDocumentoPage() {
  const t = useTranslations("AdminDocuments");
  const locale = useLocale();

  const searchParams =
    useSearchParams();

  function labelTipoDocumento(
    tipo?: string | null
  ) {
    const chave =
      CHAVES_TIPO_DOCUMENTO[
        String(tipo || "").toUpperCase()
      ];

    return chave
      ? t(chave)
      : tipo || "-";
  }

  function labelStatusDocumento(
    status?: string | null
  ) {
    const chave =
      CHAVES_STATUS_DOCUMENTO[
        String(status || "").toUpperCase()
      ];

    return chave
      ? t(chave)
      : status || "-";
  }

  function labelCampoManual(
    campo: CampoManual
  ) {
    const chave =
      CHAVES_CAMPOS_MANUAIS[
        campo.tag
      ]?.label;

    if (chave) {
      return t(chave);
    }

    return locale === "pt-BR"
      ? campo.label
      : campo.tag;
  }

  function placeholderCampoManual(
    campo: CampoManual
  ) {
    const chave =
      CHAVES_CAMPOS_MANUAIS[
        campo.tag
      ]?.placeholder;

    if (chave) {
      return t(chave);
    }

    return t(
      "generate.manualFields.genericPlaceholder",
      {
        tag: campo.tag,
      }
    );
  }

  function labelOpcaoCampoManual(
    opcao: string
  ) {
    const chave =
      CHAVES_OPCOES_CAMPOS_MANUAIS[
        opcao
      ];

    return chave
      ? t(chave)
      : opcao;
  }

  function mensagemErroApi(
    mensagem: unknown,
    fallbackKey:
      | "generate.errors.loadPayslips"
      | "generate.errors.generate"
  ) {
    const texto =
      typeof mensagem === "string"
        ? mensagem.trim()
        : "";

    const chave =
      CHAVES_ERROS_API[
        texto
      ];

    if (chave) {
      return t(chave);
    }

    if (
      texto &&
      locale === "pt-BR"
    ) {
      return texto;
    }

    return t(fallbackKey);
  }

  const [templates, setTemplates] =
    useState<Template[]>([]);

  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [matriculas, setMatriculas] =
    useState<Matricula[]>([]);

  const [
    funcionarios,
    setFuncionarios,
  ] = useState<FuncionarioDocumento[]>([]);

  const [
    professores,
    setProfessores,
  ] = useState<ProfessorDocumento[]>([]);

  const [
    holerites,
    setHolerites,
  ] = useState<HoleriteDocumento[]>([]);

  const [
    holeriteId,
    setHoleriteId,
  ] = useState("");

  const [
    carregandoHolerites,
    setCarregandoHolerites,
  ] = useState(false);

  const [
    pessoaRh,
    setPessoaRh,
  ] = useState("");

  const [templateId, setTemplateId] =
    useState("");

  const [alunoId, setAlunoId] =
    useState("");

  const [matriculaId, setMatriculaId] =
    useState("");

  const [titulo, setTitulo] =
    useState("");

  const [
    dadosPreenchimento,
    setDadosPreenchimento,
  ] = useState<
    Record<string, string>
  >({});

  const [
    formatoImpressao,
    setFormatoImpressao,
  ] = useState<FormatoImpressao>(
    "A4_INTEIRA"
  );

  const [loading, setLoading] =
    useState(false);

  const [resultado, setResultado] =
    useState<any>(null);

  const [erro, setErro] =
    useState("");

  const templateSelecionado =
    templates.find(
      (item) =>
        item.id ===
        Number(templateId)
    ) || null;

  const tipoSelecionado =
    normalizarTipo(
      templateSelecionado?.tipo
    );

  const contextoSelecionado =
    normalizarTipo(
      templateSelecionado?.contexto
    );

  const ehContratoAcademico =
    tipoSelecionado === "contrato";

  const ehDocumentoFuncionario =
    contextoSelecionado ===
    "funcionario" ||
    contextoSelecionado ===
    "professor" ||
    contextoSelecionado ===
    "rh";

  const usaTagsHolerite =
    Array.isArray(
      templateSelecionado?.tags
    ) &&
    templateSelecionado!.tags!.some(
      (tag) =>
        TAGS_HOLERITE_DOCUMENTO.has(tag)
    );

  const funcionarioIdSelecionado =
    (() => {
      if (!pessoaRh) return null;

      const [tipo, idTexto] =
        pessoaRh.split(":");

      const id = Number(idTexto);

      if (!Number.isInteger(id) || id <= 0) {
        return null;
      }

      if (tipo === "FUNCIONARIO") {
        return id;
      }

      if (tipo === "PROFESSOR") {
        const professor =
          professores.find(
            (item) => item.id === id
          );

        const funcionarioId =
          Number(
            professor?.funcionario?.id
          );

        return Number.isInteger(funcionarioId) &&
          funcionarioId > 0
          ? funcionarioId
          : null;
      }

      return null;
    })();

  const camposManuais =
    Array.isArray(
      templateSelecionado
        ?.camposManuais
    )
      ? templateSelecionado
        ?.camposManuais || []
      : [];

  useEffect(() => {
    void carregarDados();
  }, []);

  useEffect(() => {
    const matriculaIdUrl =
      searchParams.get(
        "matriculaId"
      );

    const id =
      Number(matriculaIdUrl);

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      setMatriculaId(
        String(id)
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (!templateSelecionado) {
      setDadosPreenchimento({});
      setFormatoImpressao(
        "A4_INTEIRA"
      );

      return;
    }

    const dadosIniciais:
      Record<string, string> = {};

    for (
      const campo of
      templateSelecionado
        .camposManuais || []
    ) {
      dadosIniciais[
        campo.tag
      ] = "";
    }

    setDadosPreenchimento(
      dadosIniciais
    );

    setFormatoImpressao(
      templateSelecionado
        .formatoImpressao ===
        "DUAS_VIAS_A4"
        ? "DUAS_VIAS_A4"
        : "A4_INTEIRA"
    );

    setTitulo("");
    setResultado(null);
    setErro("");
  }, [templateSelecionado?.id]);

  useEffect(() => {
    if (!matriculaId) {
      return;
    }

    const matricula =
      matriculas.find(
        (item) =>
          item.id ===
          Number(matriculaId)
      );

    const alunoDaMatricula =
      Number(
        matricula?.aluno?.id
      );

    if (
      Number.isInteger(
        alunoDaMatricula
      ) &&
      alunoDaMatricula > 0
    ) {
      setAlunoId(
        String(
          alunoDaMatricula
        )
      );
    }
  }, [
    matriculaId,
    matriculas,
  ]);

  useEffect(() => {
    if (ehDocumentoFuncionario) {
      setAlunoId("");
      setMatriculaId("");
    } else {
      setPessoaRh("");
    }
  }, [
    templateSelecionado?.id,
    ehDocumentoFuncionario,
  ]);

  useEffect(() => {
    setHoleriteId("");
    setHolerites([]);

    if (
      !usaTagsHolerite ||
      !funcionarioIdSelecionado
    ) {
      return;
    }

    let ativo = true;

    async function carregarHoleritesDoFuncionario() {
      try {
        setCarregandoHolerites(true);

        const res = await fetch(
          `/api/admin/rh/holerites?funcionarioId=${funcionarioIdSelecionado}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            mensagemErroApi(
              data?.error,
              "generate.errors.loadPayslips"
            )
          );
        }

        if (!ativo) return;

        setHolerites(
          extrairLista<HoleriteDocumento>(
            data,
            "holerites"
          ).filter(
            (item) =>
              !item.arquivado &&
              !item.cancelado &&
              !["ARQUIVADO", "CANCELADO"].includes(
                String(item.status || "").toUpperCase()
              )
          )
        );
      } catch (error) {
        console.error(
          "Erro ao carregar holerites do funcionário",
          error
        );

        if (ativo) {
          setHolerites([]);
        }
      } finally {
        if (ativo) {
          setCarregandoHolerites(false);
        }
      }
    }

    void carregarHoleritesDoFuncionario();

    return () => {
      ativo = false;
    };
  }, [
    usaTagsHolerite,
    funcionarioIdSelecionado,
  ]);

  async function carregarDados() {
    try {
      const [
        tRes,
        aRes,
        mRes,
        fRes,
        pRes,
      ] = await Promise.all([
        fetch(
          "/api/admin/documentos/templates?somenteAtivos=1",
          {
            credentials: "include",
            cache: "no-store",
          }
        ),

        fetch("/api/aluno", {
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/matricula", {
          credentials: "include",
          cache: "no-store",
        }),

        fetch(
          "/api/admin/funcionarios",
          {
            credentials: "include",
            cache: "no-store",
          }
        ),

        fetch("/api/professor", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const tData =
        await tRes
          .json()
          .catch(() => null);

      const aData =
        await aRes
          .json()
          .catch(() => null);

      const mData =
        await mRes
          .json()
          .catch(() => null);

      const fData =
        await fRes
          .json()
          .catch(() => null);

      const pData =
        await pRes
          .json()
          .catch(() => null);

      setTemplates(
        extrairLista<Template>(
          tData,
          "templates"
        )
      );

      setAlunos(
        extrairLista<Aluno>(
          aData,
          "alunos"
        )
      );

      setMatriculas(
        extrairLista<Matricula>(
          mData,
          "matriculas"
        )
      );

      setFuncionarios(
        extrairLista<FuncionarioDocumento>(
          fData,
          "funcionarios"
        )
      );

      setProfessores(
        extrairLista<ProfessorDocumento>(
          pData,
          "professores"
        )
      );
    } catch (error) {
      console.error(
        "Erro ao carregar dados",
        error
      );

      setTemplates([]);
      setAlunos([]);
      setMatriculas([]);
      setFuncionarios([]);
      setProfessores([]);

      setErro(
        t("generate.errors.loadData")
      );
    }
  }
  function atualizarCampoManual(
    tag: string,
    valor: string
  ) {
    setDadosPreenchimento(
      (anterior) => ({
        ...anterior,
        [tag]: valor,
      })
    );
  }

  function obterValorFinanceiro() {
    const tagsFinanceiras = [
      "valorDocumento",
      "valorRecebido",
      "valor",
    ];

    for (
      const tag of
      tagsFinanceiras
    ) {
      const valor =
        converterValorMonetario(
          dadosPreenchimento[
          tag
          ]
        );

      if (
        valor !== null
      ) {
        return valor;
      }
    }

    return null;
  }

  async function gerarDocumento() {
    try {
      setLoading(true);
      setErro("");
      setResultado(null);

      if (!templateId) {
        setErro(
          t("generate.errors.selectTemplate")
        );
        return;
      }

      /*
       * CONTRATO ACADÊMICO
       * Continua usando o módulo oficial
       * de contratos/matrícula.
       */
      if (ehContratoAcademico) {
        if (!matriculaId) {
          setErro(
            t("generate.errors.selectEnrollmentForContract")
          );
          return;
        }

        const matriculaNumero =
          Number(matriculaId);

        if (
          !Number.isInteger(
            matriculaNumero
          ) ||
          matriculaNumero <= 0
        ) {
          setErro(
            t("generate.errors.invalidEnrollment")
          );
          return;
        }

        window.open(
          `/api/admin/contratos/pdf?matriculaId=${matriculaNumero}`,
          "_blank",
          "noopener,noreferrer"
        );

        setResultado({
          titulo:
            templateSelecionado?.nome ||
            t("generate.defaultContractTitle"),

          status: "ABERTO",

          conteudo:
            t("generate.contractOpenedMessage"),
        });

        return;
      }

      /*
       * DOCUMENTOS GERADOS PELOS TEMPLATES
       * Inclui RH, recibos, declarações etc.
       */
      let funcionarioIdEnvio:
        number | null = null;

      let professorIdEnvio:
        number | null = null;

      if (ehDocumentoFuncionario) {
        if (!pessoaRh) {
          setErro(
            t("generate.errors.selectPerson")
          );
          return;
        }

        const [
          tipoPessoa,
          idPessoaTexto,
        ] = pessoaRh.split(":");

        const idPessoa =
          Number(idPessoaTexto);

        if (
          !Number.isInteger(idPessoa) ||
          idPessoa <= 0
        ) {
          setErro(
            t("generate.errors.invalidPerson")
          );
          return;
        }

        if (
          tipoPessoa ===
          "FUNCIONARIO"
        ) {
          funcionarioIdEnvio =
            idPessoa;
        } else if (
          tipoPessoa ===
          "PROFESSOR"
        ) {
          professorIdEnvio =
            idPessoa;
        } else {
          setErro(
            t("generate.errors.invalidPersonType")
          );
          return;
        }
      }

      if (
        usaTagsHolerite &&
        !holeriteId
      ) {
        setErro(
          t("generate.errors.selectPayslip")
        );
        return;
      }

      const quantidadeVias =
        formatoImpressao ===
          "DUAS_VIAS_A4"
          ? 2
          : 1;

      const res = await fetch(
        "/api/admin/documentos/gerar",
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            locale,
            templateId:
              Number(templateId),

            funcionarioId:
              funcionarioIdEnvio,

            professorId:
              professorIdEnvio,

            holeriteId:
              usaTagsHolerite &&
              holeriteId
                ? Number(holeriteId)
                : null,

            alunoId:
              !ehDocumentoFuncionario &&
                alunoId
                ? Number(alunoId)
                : null,

            matriculaId:
              !ehDocumentoFuncionario &&
                matriculaId
                ? Number(matriculaId)
                : null,

            titulo,

            valor:
              obterValorFinanceiro(),

            dadosPreenchimento,

            formatoImpressao,

            quantidadeVias,
          }),
        }
      );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        setErro(
          mensagemErroApi(
            data?.error,
            "generate.errors.generate"
          )
        );

        return;
      }

      setResultado(data);
    } catch (error) {
      console.error(error);

      setErro(
        t("generate.errors.generate")
      );
    } finally {
      setLoading(false);
    }
  }

  function renderizarCampoManual(
    campo: CampoManual
  ) {
    const valor =
      dadosPreenchimento[
      campo.tag
      ] || "";

    if (
      campo.tipo === "textarea"
    ) {
      return (
        <textarea
          className="phanyx-doc-input min-h-32 resize-y"
          value={valor}
          onChange={(evento) =>
            atualizarCampoManual(
              campo.tag,
              evento.target.value
            )
          }
          placeholder={
            placeholderCampoManual(
              campo
            )
          }
          rows={5}
        />
      );
    }

    if (
      campo.tipo === "select"
    ) {
      return (
        <select
          className="phanyx-doc-input"
          value={valor}
          onChange={(evento) =>
            atualizarCampoManual(
              campo.tag,
              evento.target.value
            )
          }
        >
          <option value="">
            {t("generate.select")}
          </option>

          {(campo.opcoes || []).map(
            (opcao) => (
              <option
                key={opcao}
                value={opcao}
              >
                {labelOpcaoCampoManual(
                  opcao
                )}
              </option>
            )
          )}
        </select>
      );
    }

    if (
      campo.tipo === "data"
    ) {
      return (
        <input
          type="date"
          className="phanyx-doc-input"
          value={valor}
          onChange={(evento) =>
            atualizarCampoManual(
              campo.tag,
              evento.target.value
            )
          }
        />
      );
    }

    if (
      campo.tipo === "moeda"
    ) {
      return (
        <input
          type="text"
          inputMode="decimal"
          className="phanyx-doc-input"
          value={valor}
          onChange={(evento) =>
            atualizarCampoManual(
              campo.tag,
              evento.target.value
            )
          }
          placeholder={
            placeholderCampoManual(
              campo
            )
          }
        />
      );
    }

    return (
      <input
        type="text"
        className="phanyx-doc-input"
        value={valor}
        onChange={(evento) =>
          atualizarCampoManual(
            campo.tag,
            evento.target.value
          )
        }
        placeholder={
          placeholderCampoManual(
            campo
          )
        }
      />
    );
  }

  return (
    <div className="phanyx-docs-page space-y-6">
      <div>
        <h1 className="phanyx-doc-title text-2xl font-bold">
          {t("generate.title")}
        </h1>

        <p className="phanyx-doc-muted mt-1 text-sm">
          {t("generate.description")}
        </p>
      </div>

      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo={t("generate.toastErrorTitle")}
          mensagem={erro}
          onClose={() =>
            setErro("")
          }
        />
      )}

      <div className="phanyx-doc-card space-y-5 p-6">
        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            {t("generate.template.label")}
          </label>

          <select
            className="phanyx-doc-input"
            value={templateId}
            onChange={(evento) =>
              setTemplateId(
                evento.target.value
              )
            }
          >
            <option value="">
              {t("generate.select")}
            </option>

            {templates.map(
              (template) => (
                <option
                  key={
                    template.id
                  }
                  value={
                    template.id
                  }
                >
                  {template.nome} (
                  {labelTipoDocumento(
                    template.tipo
                  )})
                </option>
              )
            )}
          </select>
        </div>

        {templateSelecionado && (
          <div className="phanyx-doc-preview rounded-2xl p-4 text-sm">
            <p className="font-bold">
              {
                templateSelecionado.nome
              }
            </p>

            <p className="phanyx-doc-muted mt-1">
              {t("generate.template.type")}:{" "}
              {labelTipoDocumento(
                templateSelecionado.tipo
              )}
              {templateSelecionado
                .contexto
                ? ` • ${t("generate.template.context")}: ${templateSelecionado.contexto}`
                : ""}
            </p>
          </div>
        )}

        {ehDocumentoFuncionario ? (
          <div>
            <label className="phanyx-doc-label mb-2 block text-sm">
              {t("generate.person.label")}
            </label>

            <select
              className="phanyx-doc-input"
              value={pessoaRh}
              onChange={(evento) =>
                setPessoaRh(
                  evento.target.value
                )
              }
            >
              <option value="">
                {t("generate.person.select")}
              </option>

              {funcionarios.length > 0 && (
                <optgroup label={t("generate.person.employeesGroup")}>
                  {funcionarios.map(
                    (funcionario) => (
                      <option
                        key={`funcionario-${funcionario.id}`}
                        value={`FUNCIONARIO:${funcionario.id}`}
                      >
                        {funcionario.nome}
                        {funcionario.cargo
                          ? ` — ${funcionario.cargo}`
                          : ""}
                      </option>
                    )
                  )}
                </optgroup>
              )}

              {professores.some(
                (professor) =>
                  !professor.funcionario?.id
              ) && (
                  <optgroup label={t("generate.person.professorsWithoutHrGroup")}>
                    {professores
                      .filter(
                        (professor) =>
                          !professor.funcionario
                            ?.id
                      )
                      .map(
                        (professor) => (
                          <option
                            key={`professor-${professor.id}`}
                            value={`PROFESSOR:${professor.id}`}
                            disabled
                          >
                            {professor.nome}
                            {` — ${t("generate.person.withoutHrSuffix")}`}
                          </option>
                        )
                      )}
                  </optgroup>
                )}
            </select>

            {usaTagsHolerite && (
              <div className="mt-4">
                <label className="phanyx-doc-label mb-2 block text-sm">
                  {t("generate.payslip.label")}
                </label>

                <select
                  className="phanyx-doc-input"
                  value={holeriteId}
                  onChange={(evento) =>
                    setHoleriteId(
                      evento.target.value
                    )
                  }
                  disabled={
                    !funcionarioIdSelecionado ||
                    carregandoHolerites
                  }
                >
                  <option value="">
                    {carregandoHolerites
                      ? t("generate.payslip.loading")
                      : !funcionarioIdSelecionado
                        ? t("generate.payslip.selectEmployeeFirst")
                        : holerites.length === 0
                          ? t("generate.payslip.noneAvailable")
                          : t("generate.payslip.selectCompetence")}
                  </option>

                  {holerites.map(
                    (holerite) => (
                      <option
                        key={holerite.id}
                        value={holerite.id}
                      >
                        {String(
                          holerite.competenciaMes
                        ).padStart(2, "0")}
                        /{holerite.competenciaAno}
                        {holerite.status
                          ? ` — ${holerite.status}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                <p className="phanyx-doc-muted mt-2 text-xs">
                  {t("generate.payslip.help")}
                </p>
              </div>
            )}

            <p className="phanyx-doc-muted mt-2 text-xs">
              {t("generate.person.help")}
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="phanyx-doc-label mb-2 block text-sm">
                {t("generate.student.label")}
              </label>

              <select
                className="phanyx-doc-input"
                value={alunoId}
                onChange={(evento) => {
                  setAlunoId(
                    evento.target.value
                  );

                  if (
                    evento.target.value ===
                    ""
                  ) {
                    setMatriculaId("");
                  }
                }}
              >
                <option value="">
                  {t("generate.student.noneSelected")}
                </option>

                {alunos.map(
                  (aluno) => (
                    <option
                      key={aluno.id}
                      value={aluno.id}
                    >
                      {aluno.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="phanyx-doc-label mb-2 block text-sm">
                {t("generate.enrollment.label")}
                {ehContratoAcademico
                  ? t("generate.enrollment.requiredSuffix")
                  : t("generate.enrollment.optionalSuffix")}
              </label>

              <select
                className="phanyx-doc-input"
                value={matriculaId}
                onChange={(evento) =>
                  setMatriculaId(
                    evento.target.value
                  )
                }
              >
                <option value="">
                  {ehContratoAcademico
                    ? t("generate.enrollment.select")
                    : t("generate.enrollment.none")}
                </option>

                {matriculas.map(
                  (matricula) => (
                    <option
                      key={matricula.id}
                      value={matricula.id}
                    >
                      #{matricula.id} -{" "}
                      {matricula.aluno?.nome ||
                        t("generate.enrollment.unnamedStudent")}
                    </option>
                  )
                )}
              </select>
            </div>
          </>
        )}

        {!ehContratoAcademico &&
          camposManuais.length >
          0 && (
            <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div>
                <h2 className="phanyx-doc-section-title text-base font-bold">
                  {t("generate.manual.title")}
                </h2>

                <p className="phanyx-doc-muted mt-1 text-sm">
                  {t("generate.manual.description")}
                </p>
              </div>

              {camposManuais.map(
                (campo) => (
                  <div
                    key={
                      campo.tag
                    }
                  >
                    <label className="phanyx-doc-label mb-2 block text-sm">
                      {labelCampoManual(
                        campo
                      )}
                    </label>

                    {renderizarCampoManual(
                      campo
                    )}
                  </div>
                )
              )}
            </div>
          )}

        {!ehContratoAcademico &&
          templateSelecionado &&
          camposManuais.length ===
          0 && (
            <div className="phanyx-doc-preview rounded-2xl p-4 text-sm">
              {t("generate.manual.noFields")}
            </div>
          )}

        {!ehContratoAcademico && (
          <div>
            <label className="phanyx-doc-label mb-2 block text-sm">
              {t("generate.titleComplement.label")}
            </label>

            <input
              type="text"
              className="phanyx-doc-input"
              value={titulo}
              onChange={(evento) =>
                setTitulo(
                  evento.target.value
                )
              }
              placeholder={t("generate.titleComplement.placeholder")}
            />
          </div>
        )}

        {!ehContratoAcademico && (
          <div className="space-y-3">
            <div>
              <h2 className="phanyx-doc-section-title text-base font-bold">
                {t("generate.print.title")}
              </h2>

              <p className="phanyx-doc-muted mt-1 text-sm">
                {t("generate.print.description")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="phanyx-doc-preview flex cursor-pointer items-start gap-3 rounded-2xl p-4">
                <input
                  type="radio"
                  name="formatoImpressao"
                  value="A4_INTEIRA"
                  checked={
                    formatoImpressao ===
                    "A4_INTEIRA"
                  }
                  onChange={() =>
                    setFormatoImpressao(
                      "A4_INTEIRA"
                    )
                  }
                  className="mt-1"
                />

                <span>
                  <strong className="block">
                    {t("generate.print.oneCopy.title")}
                  </strong>

                  <span className="phanyx-doc-muted mt-1 block text-sm">
                    {t("generate.print.oneCopy.description")}
                  </span>
                </span>
              </label>

              <label className="phanyx-doc-preview flex cursor-pointer items-start gap-3 rounded-2xl p-4">
                <input
                  type="radio"
                  name="formatoImpressao"
                  value="DUAS_VIAS_A4"
                  checked={
                    formatoImpressao ===
                    "DUAS_VIAS_A4"
                  }
                  onChange={() =>
                    setFormatoImpressao(
                      "DUAS_VIAS_A4"
                    )
                  }
                  className="mt-1"
                />

                <span>
                  <strong className="block">
                    {t("generate.print.twoCopies.title")}
                  </strong>

                  <span className="phanyx-doc-muted mt-1 block text-sm">
                    {t("generate.print.twoCopies.description")}
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={
              gerarDocumento
            }
            disabled={
              loading
            }
            className="phanyx-doc-primary-action disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? t("generate.actions.generating")
              : ehContratoAcademico
                ? t("generate.actions.openOfficialContract")
                : t("generate.actions.generate")}
          </button>
        </div>
      </div>

      {resultado && (
        <div className="phanyx-doc-card space-y-4 p-6">
          <h2 className="phanyx-doc-section-title text-xl font-bold">
            {t("generate.result.title")}
          </h2>

          <p className="phanyx-doc-value">
            <b>{t("generate.result.id")}:</b>{" "}
            {resultado.id ||
              resultado
                .documento?.id ||
              "-"}
          </p>

          <p className="phanyx-doc-value">
            <b>{t("generate.result.documentTitle")}:</b>{" "}
            {resultado.titulo ||
              resultado
                .documento
                ?.titulo ||
              "-"}
          </p>

          <p className="phanyx-doc-value">
            <b>{t("generate.result.status")}:</b>{" "}
            {labelStatusDocumento(
              resultado.status ||
                resultado
                  .documento
                  ?.status
            )}
          </p>

          <div className="phanyx-doc-preview whitespace-pre-wrap p-4 text-sm leading-7">
            {resultado.conteudo ||
              resultado
                .documento
                ?.conteudo ||
              t("generate.result.noPreview")}
          </div>

          {(resultado.id ||
            resultado.documento
              ?.id) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="phanyx-doc-primary-action"
                  onClick={() => {
                    const documentoId =
                      resultado.id ||
                      resultado
                        .documento
                        ?.id;

                    window.open(
                      `/api/admin/documentos/pdf/${documentoId}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                >
                  {t("generate.result.openPdf")}
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}