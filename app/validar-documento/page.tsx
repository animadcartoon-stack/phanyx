import { headers } from "next/headers";

type ValidacaoResponse = {
  valido?: boolean;
  codigo?: string;
  statusValidacao?: string;
  mensagem?: string;
  error?: string;
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

function formatarData(data?: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

function labelTipo(tipo?: string) {
  switch (tipo) {
    case "CONTRATO":
      return "Contrato";
    case "DECLARACAO":
      return "Declaração";
    case "RECIBO":
      return "Recibo";
    case "COMPROVANTE":
      return "Comprovante";
    case "TRANCAMENTO":
      return "Trancamento";
    case "COMPARECIMENTO":
      return "Comparecimento";
    case "HISTORICO":
      return "Histórico";
    default:
      return tipo || "-";
  }
}

async function buscarValidacao(codigo: string): Promise<ValidacaoResponse> {
  const h = headers();
  const host = h.get("host") || "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";

  const url = `${proto}://${host}/api/validar-documento?codigo=${encodeURIComponent(
    codigo
  )}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  return res.json();
}

function StatusBadge({
  valido,
  statusValidacao,
}: {
  valido?: boolean;
  statusValidacao?: string;
}) {
  if (valido) {
    return (
      <div className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
        ✔ Documento válido
      </div>
    );
  }

  if (statusValidacao === "INVALIDADO") {
    return (
      <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
        ⚠ Documento localizado, porém inválido
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
      ✖ Documento não encontrado
    </div>
  );
}

export default async function ValidarDocumentoPage({
  searchParams,
}: {
  searchParams: { codigo?: string };
}) {
  const codigo = (searchParams?.codigo || "").trim();

  if (!codigo) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Validação de documento
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Informe um código para validar
          </h1>
          <p className="mt-4 text-slate-600">
            Use o QR Code do documento ou acesse esta página com o parâmetro
            <strong> codigo</strong>.
          </p>
        </div>
      </div>
    );
  }

  const data = await buscarValidacao(codigo);
  const doc = data.documento;
  const nomeExibicao =
    doc?.aluno?.nomeSocial?.trim() || doc?.aluno?.nome || "-";
  const nomeInstituicao = doc?.instituicao?.nome || "Instituição";

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Central de validação
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                Verificação de autenticidade
              </h1>
              <p className="mt-4 max-w-2xl text-slate-600">
                Consulte a autenticidade de documentos emitidos pelo sistema por
                meio do código de validação.
              </p>
            </div>

            <StatusBadge
              valido={data.valido}
              statusValidacao={data.statusValidacao}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Código consultado
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">{codigo}</p>
          </div>
        </div>

        {!data.valido && (
          <div
            className={`rounded-3xl border bg-white p-8 shadow-sm ${
              data.statusValidacao === "INVALIDADO"
                ? "border-amber-200"
                : "border-red-200"
            }`}
          >
            <h2 className="text-2xl font-bold text-slate-900">
              {data.statusValidacao === "INVALIDADO"
                ? "Documento inválido para uso"
                : "Documento inválido ou não encontrado"}
            </h2>
            <p className="mt-4 text-slate-600">
              {data.mensagem || "Não foi possível validar este documento."}
            </p>

            {doc && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p>
                  <strong>Título:</strong> {doc.titulo || "-"}
                </p>
                <p className="mt-2">
                  <strong>Status:</strong> {doc.status || "-"}
                </p>
                <p className="mt-2">
                  <strong>Instituição:</strong> {nomeInstituicao}
                </p>
              </div>
            )}
          </div>
        )}

        {data.valido && doc && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Dados do documento
                </h2>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong>Título:</strong> {doc.titulo}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {labelTipo(doc.tipo)}
                  </p>
                  <p>
                    <strong>Status:</strong> {doc.status || "-"}
                  </p>
                  <p>
                    <strong>Emitido em:</strong> {formatarData(doc.criadoEm)}
                  </p>
                  <p>
                    <strong>Atualizado em:</strong>{" "}
                    {formatarData(doc.atualizadoEm)}
                  </p>
                  <p>
                    <strong>Template:</strong> {doc.template?.nome || "-"}
                  </p>
                  <p>
                    <strong>Exige assinatura:</strong>{" "}
                    {doc.exigeAssinatura ? "Sim" : "Não"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Dados vinculados
                </h2>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong>Aluno:</strong> {nomeExibicao}
                  </p>
                  <p>
                    <strong>Matrícula:</strong> {doc.aluno?.matricula || "-"}
                  </p>
                  <p>
                    <strong>CPF:</strong> {doc.aluno?.cpf || "-"}
                  </p>
                  <p>
                    <strong>Curso:</strong> {doc.matricula?.curso?.nome || "-"}
                  </p>
                  <p>
                    <strong>Semestre:</strong> {doc.matricula?.semestre ?? "-"}
                  </p>
                  <p>
                    <strong>Status da matrícula:</strong>{" "}
                    {doc.matricula?.status || "-"}
                  </p>
                  <p>
                    <strong>Instituição:</strong> {nomeInstituicao}
                  </p>
                  <p>
                    <strong>Instituição:</strong> {nomeInstituicao}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Resultado da validação
              </h2>
              <p className="mt-4 text-slate-700">
                Este documento foi localizado na base institucional e está
                reconhecido pelo sistema como autêntico e válido para consulta.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}