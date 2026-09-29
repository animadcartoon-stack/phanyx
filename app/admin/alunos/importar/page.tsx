"use client";

import {
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import withAuth from "@/components/auth/withAuth";

const CAMPOS = [
  { chave: "nome", label: "fields.name", obrigatorio: true },
  { chave: "nomeSocial", label: "fields.preferredName" },
  { chave: "email", label: "fields.email", obrigatorio: true },
  { chave: "dataNascimento", label: "fields.birthDate", obrigatorio: true },
  { chave: "genero", label: "fields.gender" },
  { chave: "cpf", label: "fields.cpf" },
  { chave: "rg", label: "fields.rg" },
  { chave: "telefone", label: "fields.phone" },
  { chave: "paisTelefone", label: "fields.phoneCountry" },
  { chave: "nacionalidade", label: "fields.nationality" },
  { chave: "paisNascimento", label: "fields.birthCountry" },
  { chave: "paisResidencia", label: "fields.residenceCountry" },
  { chave: "tipoDocumento", label: "fields.documentType" },
  { chave: "numeroDocumento", label: "fields.documentNumber" },
  { chave: "cep", label: "fields.postalCode" },
  { chave: "endereco", label: "fields.address" },
  { chave: "numero", label: "fields.number" },
  { chave: "complemento", label: "fields.complement" },
  { chave: "bairro", label: "fields.district" },
  { chave: "cidade", label: "fields.city" },
  { chave: "estado", label: "fields.state" },
  { chave: "nomeResponsavel", label: "fields.responsibleName" },
  { chave: "cpfResponsavel", label: "fields.responsibleCpf" },
  { chave: "tipoDocumentoResponsavel", label: "fields.responsibleDocumentType" },
  { chave: "numeroDocumentoResponsavel", label: "fields.responsibleDocumentNumber" },
  { chave: "telefoneResponsavel", label: "fields.responsiblePhone" },
  { chave: "paisTelefoneResponsavel", label: "fields.responsiblePhoneCountry" },
  { chave: "emailResponsavel", label: "fields.responsibleEmail" },
  { chave: "parentescoResponsavel", label: "fields.responsibleRelationship" },
  { chave: "poloId", label: "fields.campusId" },
  { chave: "possuiNecessidadeEspecial", label: "fields.specialNeeds" },
  { chave: "descricaoNecessidadeEspecial", label: "fields.specialNeedsDescription" },
  { chave: "observacoesAcessibilidade", label: "fields.accessibilityNotes" },
] as const;

type CampoChave =
  (typeof CAMPOS)[number]["chave"];

type LinhaDados =
  Partial<Record<CampoChave, string>>;

type LinhaPreview = {
  linha: number;
  dados: LinhaDados;
  dataNascimentoInformada: boolean;
  erros: string[];
  avisos: string[];
};

function normalizarCabecalho(
  valor: unknown
) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/\*/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function textoCelula(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(valor).trim();
}

function dataIsoValida(
  valor: string
) {
  const match =
    valor.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) return false;

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);

  const data =
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia
      )
    );

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function formatarIso(
  ano: number,
  mes: number,
  dia: number
) {
  return [
    String(ano).padStart(4, "0"),
    String(mes).padStart(2, "0"),
    String(dia).padStart(2, "0"),
  ].join("-");
}

function calcularIdade(
  iso: string
) {
  if (!dataIsoValida(iso)) {
    return null;
  }

  const [
    ano,
    mes,
    dia,
  ] = iso
    .split("-")
    .map(Number);

  const hoje = new Date();

  let idade =
    hoje.getFullYear() - ano;

  const aindaNaoFezAniversario =
    hoje.getMonth() + 1 < mes ||
    (
      hoje.getMonth() + 1 === mes &&
      hoje.getDate() < dia
    );

  if (aindaNaoFezAniversario) {
    idade--;
  }

  return idade;
}

function emailValido(
  valor: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    valor
  );
}

function booleanoImportacao(
  valor: string
):
  | "true"
  | "false"
  | ""
  | null {
  const normalizado =
    valor
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .trim()
      .toLowerCase();

  if (!normalizado) return "";

  if (
    [
      "sim",
      "yes",
      "si",
      "oui",
      "true",
      "1",
    ].includes(normalizado)
  ) {
    return "true";
  }

  if (
    [
      "nao",
      "no",
      "non",
      "false",
      "0",
    ].includes(normalizado)
  ) {
    return "false";
  }

  return null;
}

function AdminImportarAlunosPage() {
  const router = useRouter();

  const t =
    useTranslations(
      "AdminStudentsImport"
    );

  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const previewRef =
    useRef<HTMLElement | null>(
      null
    );

  const [
    gerandoModelo,
    setGerandoModelo,
  ] = useState(false);

  const [
    processando,
    setProcessando,
  ] = useState(false);

  const [
    arquivoNome,
    setArquivoNome,
  ] = useState("");

  const [
    erroArquivo,
    setErroArquivo,
  ] = useState("");

  const [
    linhas,
    setLinhas,
  ] = useState<LinhaPreview[]>([]);

  const total =
    linhas.length;

  const invalidas =
    linhas.filter(
      (linha) =>
        linha.erros.length > 0
    ).length;

  const validas =
    total - invalidas;

  const comAvisos =
    linhas.filter(
      (linha) =>
        linha.avisos.length > 0
    ).length;

  function limparArquivo() {
    setArquivoNome("");
    setErroArquivo("");
    setLinhas([]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function baixarModelo() {
    try {
      setGerandoModelo(true);
      setErroArquivo("");

      const XLSX =
        await import("xlsx");

      const chaves =
        CAMPOS.map(
          (campo) =>
            campo.chave
        );

      const labels =
        CAMPOS.map(
          (campo) => {
            const texto =
              t(
                campo.label as any
              );

            return (
              "obrigatorio" in campo &&
              campo.obrigatorio
            )
              ? `${texto} *`
              : texto;
          }
        );

      const planilha =
        XLSX.utils.aoa_to_sheet([
          chaves,
          labels,
        ]);

      planilha["!rows"] = [
        {
          hidden: true,
        },
        {
          hpt: 24,
        },
      ];

      planilha["!cols"] =
        labels.map(
          (label) => ({
            wch: Math.max(
              16,
              Math.min(
                32,
                label.length + 4
              )
            ),
          })
        );

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        planilha,
        t("template.sheetName")
      );

      XLSX.writeFile(
        workbook,
        `${t("template.fileName")}.xlsx`
      );
    } catch (error) {
      console.error(error);

      setErroArquivo(
        t("errors.readError")
      );
    } finally {
      setGerandoModelo(false);
    }
  }

  async function normalizarData(
    valor: unknown,
    XLSX: any
  ) {
    if (
      typeof valor === "number" &&
      Number.isFinite(valor)
    ) {
      const partes =
        XLSX.SSF.parse_date_code(
          valor
        );

      if (partes) {
        const iso =
          formatarIso(
            partes.y,
            partes.m,
            partes.d
          );

        return dataIsoValida(iso)
          ? iso
          : "";
      }
    }

    const texto =
      textoCelula(valor);

    if (!texto) return "";

    if (
      /^\d{4}-\d{1,2}-\d{1,2}$/.test(
        texto
      )
    ) {
      const [
        ano,
        mes,
        dia,
      ] = texto
        .split("-")
        .map(Number);

      const iso =
        formatarIso(
          ano,
          mes,
          dia
        );

      return dataIsoValida(iso)
        ? iso
        : "";
    }

    const local =
      texto.match(
        /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/
      );

    if (local) {
      const iso =
        formatarIso(
          Number(local[3]),
          Number(local[2]),
          Number(local[1])
        );

      return dataIsoValida(iso)
        ? iso
        : "";
    }

    return "";
  }

  async function processarArquivo(
    arquivo: File
  ) {
    try {
      setProcessando(true);
      setErroArquivo("");
      setLinhas([]);
      setArquivoNome(
        arquivo.name
      );

      const extensao =
        arquivo.name
          .split(".")
          .pop()
          ?.toLowerCase() || "";

      if (
        ![
          "xlsx",
          "xls",
          "csv",
        ].includes(extensao)
      ) {
        throw new Error(
          t(
            "errors.invalidExtension"
          )
        );
      }

      if (
        arquivo.size >
        5 * 1024 * 1024
      ) {
        throw new Error(
          t(
            "errors.fileTooLarge"
          )
        );
      }

      const XLSX =
        await import("xlsx");

      const buffer =
        await arquivo.arrayBuffer();

      const workbook =
        XLSX.read(
          buffer,
          {
            type: "array",
            cellDates: false,
          }
        );

      const primeiraAba =
        workbook.SheetNames[0];

      if (!primeiraAba) {
        throw new Error(
          t(
            "errors.emptyWorkbook"
          )
        );
      }

      const sheet =
        workbook.Sheets[
          primeiraAba
        ];

      const matriz =
        XLSX.utils.sheet_to_json(
          sheet,
          {
            header: 1,
            defval: "",
            raw: true,
          }
        ) as unknown[][];

      if (
        !matriz.length
      ) {
        throw new Error(
          t(
            "errors.emptyWorkbook"
          )
        );
      }

      const aliases =
        new Map<
          string,
          CampoChave
        >();

      for (
        const campo
        of CAMPOS
      ) {
        aliases.set(
          normalizarCabecalho(
            campo.chave
          ),
          campo.chave
        );

        aliases.set(
          normalizarCabecalho(
            t(
              campo.label as any
            )
          ),
          campo.chave
        );
      }

      function mapearCabecalho(
        row: unknown[]
      ) {
        return row.map(
          (valor) =>
            aliases.get(
              normalizarCabecalho(
                valor
              )
            ) || null
        );
      }

      const cabecalho =
        mapearCabecalho(
          matriz[0] || []
        );

      const obrigatorios:
        CampoChave[] = [
          "nome",
          "email",
          "dataNascimento",
        ];

      const possuiObrigatorios =
        obrigatorios.every(
          (campo) =>
            cabecalho.includes(
              campo
            )
        );

      if (
        !possuiObrigatorios
      ) {
        throw new Error(
          t(
            "errors.missingColumns"
          )
        );
      }

      let primeiraLinhaDados = 1;

      if (
        extensao !== "csv" &&
        matriz[1]
      ) {
        const segundaLinha =
          mapearCabecalho(
            matriz[1]
          );

        const ehLinhaDeLabels =
          obrigatorios.every(
            (campo) =>
              segundaLinha.includes(
                campo
              )
          );

        if (
          ehLinhaDeLabels
        ) {
          primeiraLinhaDados = 2;
        }
      }

      const preliminares:
        LinhaPreview[] = [];

      for (
        let i =
          primeiraLinhaDados;
        i < matriz.length;
        i++
      ) {
        const row =
          matriz[i] || [];

        const dados:
          LinhaDados = {};

        let dataNascimentoInformada =
          false;

        for (
          let coluna = 0;
          coluna <
          cabecalho.length;
          coluna++
        ) {
          const chave =
            cabecalho[coluna];

          if (!chave) {
            continue;
          }

          const bruto =
            row[coluna];

          if (
            chave ===
            "dataNascimento"
          ) {
            dataNascimentoInformada =
              textoCelula(
                bruto
              ) !== "";

            dados[chave] =
              await normalizarData(
                bruto,
                XLSX
              );
          } else {
            dados[chave] =
              textoCelula(
                bruto
              );
          }
        }

        const temConteudo =
          Object.values(
            dados
          ).some(
            (valor) =>
              String(
                valor || ""
              ).trim()
          );

        if (!temConteudo) {
          continue;
        }

        preliminares.push({
          linha: i + 1,
          dados,
          dataNascimentoInformada,
          erros: [],
          avisos: [],
        });
      }

      if (
        preliminares.length >
        1000
      ) {
        throw new Error(
          t(
            "errors.tooManyRows"
          )
        );
      }

      const emails =
        new Map<
          string,
          number
        >();

      const cpfs =
        new Map<
          string,
          number
        >();

      for (
        const item
        of preliminares
      ) {
        const email =
          String(
            item.dados.email ||
            ""
          )
            .trim()
            .toLowerCase();

        if (email) {
          emails.set(
            email,
            (
              emails.get(email) ||
              0
            ) + 1
          );
        }

        const cpf =
          String(
            item.dados.cpf ||
            ""
          )
            .replace(
              /\D/g,
              ""
            );

        if (cpf) {
          cpfs.set(
            cpf,
            (
              cpfs.get(cpf) ||
              0
            ) + 1
          );
        }
      }

      for (
        const item
        of preliminares
      ) {
        const {
          dados,
          erros,
          avisos,
        } = item;

        const nome =
          String(
            dados.nome || ""
          ).trim();

        const email =
          String(
            dados.email || ""
          )
            .trim()
            .toLowerCase();

        const nascimento =
          String(
            dados.dataNascimento ||
            ""
          ).trim();

        if (!nome) {
          erros.push(
            t(
              "validation.nameRequired"
            )
          );
        }

        if (!email) {
          erros.push(
            t(
              "validation.emailRequired"
            )
          );
        } else if (
          !emailValido(email)
        ) {
          erros.push(
            t(
              "validation.emailInvalid"
            )
          );
        }

        if (!nascimento) {
          erros.push(
            item.dataNascimentoInformada
              ? t(
                  "validation.birthDateInvalid"
                )
              : t(
                  "validation.birthDateRequired"
                )
          );
        } else if (
          !dataIsoValida(
            nascimento
          )
        ) {
          erros.push(
            t(
              "validation.birthDateInvalid"
            )
          );
        } else {
          const idade =
            calcularIdade(
              nascimento
            );

          if (
            idade === null ||
            idade < 0 ||
            idade > 120
          ) {
            erros.push(
              t(
                "validation.birthDateRange"
              )
            );
          }

          if (
            idade !== null &&
            idade >= 0 &&
            idade < 18
          ) {
            const responsavelCompleto =
              Boolean(
                String(
                  dados.nomeResponsavel ||
                  ""
                ).trim()
              ) &&
              Boolean(
                String(
                  dados.telefoneResponsavel ||
                  ""
                ).trim()
              ) &&
              Boolean(
                String(
                  dados.emailResponsavel ||
                  ""
                ).trim()
              ) &&
              Boolean(
                String(
                  dados.parentescoResponsavel ||
                  ""
                ).trim()
              );

            if (
              !responsavelCompleto
            ) {
              avisos.push(
                t(
                  "validation.minorResponsibleIncomplete"
                )
              );
            }
          }
        }

        if (
          email &&
          (
            emails.get(email) ||
            0
          ) > 1
        ) {
          erros.push(
            t(
              "validation.duplicateEmail"
            )
          );
        }

        const cpf =
          String(
            dados.cpf || ""
          )
            .replace(
              /\D/g,
              ""
            );

        if (
          cpf &&
          (
            cpfs.get(cpf) ||
            0
          ) > 1
        ) {
          erros.push(
            t(
              "validation.duplicateCpf"
            )
          );
        }

        const polo =
          String(
            dados.poloId || ""
          ).trim();

        if (
          polo &&
          (
            !Number.isInteger(
              Number(polo)
            ) ||
            Number(polo) <= 0
          )
        ) {
          erros.push(
            t(
              "validation.campusInvalid"
            )
          );
        }

        const especial =
          String(
            dados.possuiNecessidadeEspecial ||
            ""
          );

        if (especial) {
          const convertido =
            booleanoImportacao(
              especial
            );

          if (
            convertido === null
          ) {
            erros.push(
              t(
                "validation.specialNeedsInvalid"
              )
            );
          } else {
            dados.possuiNecessidadeEspecial =
              convertido;
          }
        }

        const camposPais = [
          "paisTelefone",
          "paisNascimento",
          "paisResidencia",
          "paisTelefoneResponsavel",
        ] as const;

        for (
          const campoPais
          of camposPais
        ) {
          const valorPais =
            String(
              dados[campoPais] ||
              ""
            ).trim();

          if (!valorPais) {
            continue;
          }

          const normalizado =
            valorPais.toUpperCase();

          if (
            !/^[A-Z]{2}$/.test(
              normalizado
            )
          ) {
            erros.push(
              `${t(
                "validation.countryCodeInvalid"
              )}: ${valorPais}`
            );

            continue;
          }

          dados[campoPais] =
            normalizado;
        }

        dados.email =
          email;
      }

      setLinhas(
        preliminares
      );

      window.setTimeout(
        () => {
          previewRef.current
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
        },
        150
      );
    } catch (error) {
      console.error(error);

      setLinhas([]);

      setErroArquivo(
        error instanceof Error
          ? error.message
          : t(
              "errors.readError"
            )
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="phanyx-admin-alunos-page min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {t("title")}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t("description")}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/alunos"
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("back")}
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("introTitle")}
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("introDescription")}
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <h3 className="font-bold text-blue-900 dark:text-blue-100">
                {t("step1Title")}
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800/80 dark:text-blue-200/80">
                {t("step1Description")}
              </p>

              <button
                type="button"
                disabled={gerandoModelo}
                onClick={() =>
                  void baixarModelo()
                }
                className="mt-4 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {gerandoModelo
                  ? t(
                      "template.generating"
                    )
                  : t(
                      "template.download"
                    )}
              </button>
            </article>

            <article className="rounded-3xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
              <h3 className="font-bold text-violet-900 dark:text-violet-100">
                {t("step2Title")}
              </h3>

              <p className="mt-2 text-sm leading-6 text-violet-800/80 dark:text-violet-200/80">
                {t("step2Description")}
              </p>

              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(event) => {
                  const arquivo =
                    event.target
                      .files?.[0];

                  if (arquivo) {
                    void processarArquivo(
                      arquivo
                    );
                  }

                  event.currentTarget.value =
                    "";
                }}
              />

              <button
                type="button"
                disabled={processando}
                onClick={() =>
                  inputRef.current?.click()
                }
                className="mt-4 rounded-2xl !bg-violet-700 px-4 py-2 text-sm font-bold !text-white transition hover:!bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando
                  ? t(
                      "template.processing"
                    )
                  : t(
                      "template.select"
                    )}
              </button>

              {arquivoNome && (
                <p className="mt-3 break-all text-xs font-semibold text-violet-900 dark:text-violet-100">
                  {arquivoNome}
                </p>
              )}
            </article>

            <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <h3 className="font-bold text-emerald-900 dark:text-emerald-100">
                {t("step3Title")}
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800/80 dark:text-emerald-200/80">
                {t("step3Description")}
              </p>

              {total > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {t("preview.total")}: {total}
                  </span>

                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                    {t("preview.valid")}: {validas}
                  </span>

                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                    {t("preview.invalid")}: {invalidas}
                  </span>
                </div>
              )}
            </article>
          </div>

          {erroArquivo && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {erroArquivo}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            {t("preview.noDatabase")}
          </div>
        </section>

        {arquivoNome &&
          !erroArquivo && (
            <section
              ref={previewRef}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t(
                      "preview.title"
                    )}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {t(
                      "preview.description"
                    )}
                  </p>

                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t(
                      "preview.selectedFile"
                    )}:{" "}
                    {arquivoNome}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    limparArquivo
                  }
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t(
                    "preview.clear"
                  )}
                </button>
              </div>

              {total === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  {t(
                    "preview.empty"
                  )}
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t(
                          "preview.total"
                        )}
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {total}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                        {t(
                          "preview.valid"
                        )}
                      </p>
                      <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-100">
                        {validas}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-200">
                        {t(
                          "preview.invalid"
                        )}
                      </p>
                      <p className="mt-1 text-2xl font-black text-red-800 dark:text-red-100">
                        {invalidas}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                        {t(
                          "preview.warnings"
                        )}
                      </p>
                      <p className="mt-1 text-2xl font-black text-amber-800 dark:text-amber-100">
                        {comAvisos}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">
                            {t(
                              "preview.line"
                            )}
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            {t(
                              "preview.student"
                            )}
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            {t(
                              "preview.email"
                            )}
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            {t(
                              "preview.birthDate"
                            )}
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            {t(
                              "preview.status"
                            )}
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {linhas
                          .slice(
                            0,
                            200
                          )
                          .map(
                            (
                              item
                            ) => (
                              <tr
                                key={
                                  item.linha
                                }
                                className="align-top"
                              >
                                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500">
                                  {
                                    item.linha
                                  }
                                </td>

                                <td className="px-4 py-3 font-semibold">
                                  {item
                                    .dados
                                    .nome ||
                                    "—"}
                                </td>

                                <td className="px-4 py-3">
                                  {item
                                    .dados
                                    .email ||
                                    "—"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3">
                                  {item
                                    .dados
                                    .dataNascimento ||
                                    "—"}
                                </td>

                                <td className="min-w-[260px] px-4 py-3">
                                  {item
                                    .erros
                                    .length ===
                                  0 ? (
                                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                                      {t(
                                        "preview.ready"
                                      )}
                                    </span>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-200">
                                        {t(
                                          "preview.needsCorrection"
                                        )}
                                      </span>

                                      {item.erros.map(
                                        (
                                          erro,
                                          indice
                                        ) => (
                                          <p
                                            key={
                                              indice
                                            }
                                            className="text-xs font-medium text-red-700 dark:text-red-300"
                                          >
                                            {
                                              erro
                                            }
                                          </p>
                                        )
                                      )}
                                    </div>
                                  )}

                                  {item.avisos.map(
                                    (
                                      aviso,
                                      indice
                                    ) => (
                                      <p
                                        key={
                                          `aviso-${indice}`
                                        }
                                        className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                                      >
                                        {t(
                                          "preview.warning"
                                        )}
                                        :{" "}
                                        {
                                          aviso
                                        }
                                      </p>
                                    )
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                      </tbody>
                    </table>
                  </div>

                  {total > 200 && (
                    <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t(
                        "preview.showing",
                        {
                          count:
                            200,
                        }
                      )}
                    </p>
                  )}
                </>
              )}
            </section>
          )}
      </div>
    </div>
  );
}

export default withAuth(
  AdminImportarAlunosPage,
  ["admin"]
);