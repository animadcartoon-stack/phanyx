import { headers } from "next/headers";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

type ValidacaoResponse = {
  valido?: boolean;
  codigo?: string;
  statusValidacao?: string;
  mensagem?: string;
  error?: string;
  bloqueado?: boolean;
  risco?: number;

  documento?: {
    id: number;
    titulo: string;
    tipo: string;
    status: string;
    criadoEm?: string;
    atualizadoEm?: string;
    exigeAssinatura?: boolean;

    aluno?: {
      id: number;
      nome: string;
      nomeSocial?: string | null;
      matricula?: string | null;
      cpf?: string | null;
    } | null;

    matricula?: {
      id: number;
      semestre?: number | null;
      status?: string | null;

      curso?: {
        id: number;
        nome: string;
      } | null;
    } | null;

    template?: {
      id: number;
      nome: string;
    } | null;

    instituicao?: {
      id: number;
      nome?: string | null;
      nomeFantasia?: string | null;
      cnpj?: string | null;
    } | null;
  };
};

function formatarData(
  data: string | undefined,
  locale: string,
  indisponivel: string,
) {
  if (!data) {
    return indisponivel;
  }

  const valor =
    new Date(data);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return indisponivel;
  }

  return valor.toLocaleString(
    locale
  );
}

async function buscarValidacao(
  codigo: string
): Promise<ValidacaoResponse> {
  const h = headers();

  const host =
    h.get("host") ||
    "localhost:3000";

  const proto =
    host.includes("localhost")
      ? "http"
      : "https";

  const url =
    `${proto}://${host}` +
    `/api/validar-documento?codigo=${encodeURIComponent(
      codigo
    )}`;

  const res =
    await fetch(
      url,
      {
        cache: "no-store",
      }
    );

  return res.json();
}

export default async function ValidarDocumentoPage({
  searchParams,
}: {
  searchParams: {
    codigo?: string;
  };
}) {
  const t =
    await getTranslations(
      "PublicDocumentValidation"
    );

  const locale =
    await getLocale();

  const codigo =
    (
      searchParams?.codigo ||
      ""
    ).trim();

  if (!codigo) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t("eyebrow")}
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            {t("missingCodeTitle")}
          </h1>

          <p className="mt-4 text-slate-600">
            {t(
              "missingCodeDescription"
            )}
          </p>
        </div>
      </div>
    );
  }

  const data =
    await buscarValidacao(
      codigo
    );

  const doc =
    data.documento;

  const nomeExibicao =
    doc?.aluno?.nomeSocial
      ?.trim() ||
    doc?.aluno?.nome ||
    t("notAvailable");

  const nomeInstituicao =
    doc?.instituicao?.nome ||
    t("institutionFallback");

  const tipos: Record<
    string,
    string
  > = {
    CONTRATO:
      t("documentTypes.CONTRATO"),

    DECLARACAO:
      t(
        "documentTypes.DECLARACAO"
      ),

    RECIBO:
      t("documentTypes.RECIBO"),

    COMPROVANTE:
      t(
        "documentTypes.COMPROVANTE"
      ),

    TRANCAMENTO:
      t(
        "documentTypes.TRANCAMENTO"
      ),

    COMPARECIMENTO:
      t(
        "documentTypes.COMPARECIMENTO"
      ),

    HISTORICO:
      t(
        "documentTypes.HISTORICO"
      ),
  };

  const tipoDocumento =
    tipos[
      String(
        doc?.tipo || ""
      ).toUpperCase()
    ] ||
    doc?.tipo ||
    t("notAvailable");

  let mensagemInvalida =
    t(
      "invalid.genericMessage"
    );

  if (
    data.statusValidacao ===
    "INVALIDADO"
  ) {
    mensagemInvalida =
      t(
        "invalid.invalidatedMessage"
      );
  } else if (
    data.statusValidacao ===
    "NAO_ENCONTRADO"
  ) {
    mensagemInvalida =
      t(
        "invalid.notFoundMessage"
      );
  } else if (
    data.bloqueado
  ) {
    mensagemInvalida =
      t(
        "invalid.suspiciousBlocked"
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t(
                  "validationCenter"
                )}
              </p>

              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                {t(
                  "authenticityTitle"
                )}
              </h1>

              <p className="mt-4 max-w-2xl text-slate-600">
                {t(
                  "authenticityDescription"
                )}
              </p>
            </div>

            {data.valido ? (
              <div className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {"\u2714"}{" "}
                {t("badges.valid")}
              </div>
            ) : data.statusValidacao ===
              "INVALIDADO" ? (
              <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                {"\u26A0"}{" "}
                {t(
                  "badges.invalidated"
                )}
              </div>
            ) : (
              <div className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                {"\u2716"}{" "}
                {t(
                  "badges.notFound"
                )}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t(
                "consultedCode"
              )}
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {codigo}
            </p>
          </div>
        </div>

        {!data.valido ? (
          <div
            className={
              "rounded-3xl border bg-white p-8 shadow-sm " +
              (
                data.statusValidacao ===
                "INVALIDADO"
                  ? "border-amber-200"
                  : "border-red-200"
              )
            }
          >
            <h2 className="text-2xl font-bold text-slate-900">
              {data.statusValidacao ===
              "INVALIDADO"
                ? t(
                    "invalid.invalidatedTitle"
                  )
                : t(
                    "invalid.notFoundTitle"
                  )}
            </h2>

            <p className="mt-4 text-slate-600">
              {mensagemInvalida}
            </p>

            {doc ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p>
                  <strong>
                    {t(
                      "fields.title"
                    )}:
                  </strong>{" "}
                  {doc.titulo ||
                    t(
                      "notAvailable"
                    )}
                </p>

                <p className="mt-2">
                  <strong>
                    {t(
                      "fields.status"
                    )}:
                  </strong>{" "}
                  {doc.status ||
                    t(
                      "notAvailable"
                    )}
                </p>

                <p className="mt-2">
                  <strong>
                    {t(
                      "fields.institution"
                    )}:
                  </strong>{" "}
                  {nomeInstituicao}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {data.valido && doc ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  {t(
                    "sections.documentData"
                  )}
                </h2>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong>
                      {t(
                        "fields.title"
                      )}:
                    </strong>{" "}
                    {doc.titulo}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.type"
                      )}:
                    </strong>{" "}
                    {tipoDocumento}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.status"
                      )}:
                    </strong>{" "}
                    {doc.status ||
                      t(
                        "notAvailable"
                      )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.issuedAt"
                      )}:
                    </strong>{" "}
                    {formatarData(
                      doc.criadoEm,
                      locale,
                      t(
                        "notAvailable"
                      )
                    )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.updatedAt"
                      )}:
                    </strong>{" "}
                    {formatarData(
                      doc.atualizadoEm,
                      locale,
                      t(
                        "notAvailable"
                      )
                    )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.template"
                      )}:
                    </strong>{" "}
                    {doc.template
                      ?.nome ||
                      t(
                        "notAvailable"
                      )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.requiresSignature"
                      )}:
                    </strong>{" "}
                    {doc.exigeAssinatura
                      ? t("yes")
                      : t("no")}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  {t(
                    "sections.linkedData"
                  )}
                </h2>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong>
                      {t(
                        "fields.student"
                      )}:
                    </strong>{" "}
                    {nomeExibicao}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.enrollment"
                      )}:
                    </strong>{" "}
                    {doc.aluno
                      ?.matricula ||
                      t(
                        "notAvailable"
                      )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.cpf"
                      )}:
                    </strong>{" "}
                    {doc.aluno?.cpf ||
                      t(
                        "notAvailable"
                      )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.course"
                      )}:
                    </strong>{" "}
                    {doc.matricula
                      ?.curso?.nome ||
                      t(
                        "notAvailable"
                      )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.semester"
                      )}:
                    </strong>{" "}
                    {doc.matricula
                      ?.semestre ??
                      t(
                        "notAvailable"
                      )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.enrollmentStatus"
                      )}:
                    </strong>{" "}
                    {doc.matricula
                      ?.status ||
                      t(
                        "notAvailable"
                      )}
                  </p>

                  <p>
                    <strong>
                      {t(
                        "fields.institution"
                      )}:
                    </strong>{" "}
                    {nomeInstituicao}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                {t(
                  "sections.result"
                )}
              </h2>

              <p className="mt-4 text-slate-700">
                {t(
                  "resultValid"
                )}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
