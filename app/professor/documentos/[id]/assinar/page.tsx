import Link from "next/link";
import LeitorPdfDocumento from "@/components/documentos-docentes/LeitorPdfDocumento";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AssinaturaDocumentoDocentePagina } from "@/components/documentos-docentes/AssinaturaDocumentoDocenteModal";
import { professorPodeEditarDocumentoDocente } from "@/lib/documentos-docentes/fluxo";
import { traduzirDocumentoDocente } from "@/lib/documentos-docentes/i18n";
import { traducaoDocentesEtapa3, type ChaveDocentesEtapa3 } from "@/lib/documentos-docentes/i18n-etapa3";
import { hashVersaoDocente } from "@/lib/documentos-docentes/integridade";
import { documentoAutorizado } from "@/lib/documentos-docentes/seguranca";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
  searchParams: { versao?: string | string[] };
};

export default async function AssinarDocumentoDocentePage({ params, searchParams }: Props) {
  const [auth, locale] = await Promise.all([
    documentoAutorizado(Number(params.id)),
    getLocale(),
  ]);
  if (!auth || auth.ctx.papel !== "PROFESSOR") notFound();

  const { ctx, documento } = auth;
  const versao = typeof searchParams.versao === "string" ? Number(searchParams.versao) : NaN;
  const versaoAtual = versao === documento.versaoAtual;
  const retorno = `/professor/documentos?documento=${documento.id}`;
  const pdf = `/api/documentos-docentes/${documento.id}/pdf?versao=${documento.versaoAtual}`;
  const t = (chave: ChaveDocentesEtapa3) => traducaoDocentesEtapa3(locale, chave);

  const [assinatura, anexos, snapshot] = versaoAtual ? await Promise.all([
    prisma.documentoDocenteAssinatura.findUnique({
      where: { documentoId_versao_papel: { documentoId: documento.id, versao, papel: "PROFESSOR" } },
      select: { id: true },
    }),
    prisma.documentoDocenteAnexo.findMany({
      where: { documentoId: documento.id, versao: { lte: versao } },
      select: { id: true, versao: true, nomeOriginal: true, mime: true, tamanho: true, sha256: true },
      orderBy: { id: "asc" },
    }),
    prisma.documentoDocenteVersao.findUnique({
      where: { documentoId_numero: { documentoId: documento.id, numero: versao } },
      select: { numero: true, modeloSnapshot: true, campos: true },
    }),
  ]) : [null, [], null] as const;
  if (versaoAtual && !snapshot) notFound();

  let situacao: ChaveDocentesEtapa3 | null = null;
  if (!versaoAtual) situacao = "signatureVersionChanged";
  else if (assinatura) situacao = "signatureAlreadySigned";
  else if (!professorPodeEditarDocumentoDocente(documento.status)) situacao = "signatureUnavailable";
  else if (ctx.usuario.impersonacao) situacao = "signatureLoginRequired";

  return (
    <main className="mx-auto max-w-7xl space-y-5 text-slate-900 dark:text-slate-100">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="docente-pagina-assinatura-titulo" className="text-2xl font-bold">{t("signatureTitle")}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {documento.titulo} · {traduzirDocumentoDocente(locale, "version")} {documento.versaoAtual}
          </p>
        </div>
        <Link href={retorno} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600">
          {t("backToDocument")}
        </Link>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {versaoAtual && <section className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <a href={`${pdf}&baixar=1`} className="inline-block text-sm font-semibold text-blue-700 underline dark:text-blue-300">
            {t("downloadPdf")}
          </a>
          <LeitorPdfDocumento url={pdf} />
          {anexos.length > 0 && <div className="space-y-2">
            <h2 className="text-sm font-semibold">{t("fileTitle")}</h2>
            <ul className="space-y-1 text-sm">
              {anexos.map(anexo => <li key={anexo.id}>
                <a href={`/api/documentos-docentes/${documento.id}/anexos/${anexo.id}`} className="break-words text-blue-700 underline dark:text-blue-300">
                  {anexo.nomeOriginal}
                </a>
              </li>)}
            </ul>
          </div>}
        </section>}

        {situacao ? (
          <p role="status" className="rounded-xl border border-slate-300 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
            {t(situacao)}
          </p>
        ) : snapshot && (
          <AssinaturaDocumentoDocentePagina
            documentoId={documento.id}
            titulo={documento.titulo}
            versao={versao}
            retorno={retorno}
            hashEsperado={hashVersaoDocente(documento.id, snapshot, [...anexos])}
          />
        )}
      </div>
    </main>
  );
}
