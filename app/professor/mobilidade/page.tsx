import { getLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ErroMobilidade } from "@/lib/mobilidade-acesso";
import { candidaturaDocenteEditavel, diaOferta, exigirContextoMobilidadeDocente, filtroOfertasDocentes } from "@/lib/mobilidade-docente";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { EnviarDocumentoDocente, InscreverDocente } from "./acoes";

export const dynamic = "force-dynamic";

const cartao = "rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900";
const subtitulo = "text-sm text-slate-600 dark:text-slate-300";

export default async function MobilidadeProfessorPage() {
  const usuario = await getUserFromToken();
  if (usuario?.role !== "PROFESSOR") redirect("/login?portal=professor");
  const { instituicaoId, professor, podeInscrever } = await exigirContextoMobilidadeDocente(usuario).catch((erro: unknown) => {
    if (erro instanceof ErroMobilidade) notFound();
    throw erro;
  });

  const agora = new Date();
  const [t, tAluno, tOfertas, locale, ofertas, candidaturas] = await Promise.all([
    getTranslations("ProfessorMobility"),
    getTranslations("StudentMobility"),
    getTranslations("StudentMobilityOpportunities"),
    getLocale(),
    prisma.mobilidadeOferta.findMany({
      where: filtroOfertasDocentes(instituicaoId, agora),
      orderBy: [{ inscricoesFim: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      select: {
        id: true, titulo: true, descricao: true, status: true, instrucoes: true,
        inscricoesInicio: true, inscricoesFim: true, mobilidadeInicio: true, mobilidadeFim: true,
        vagas: true, requisitosDocentes: true,
        programa: {
          select: {
            nome: true, tipo: true, idiomaPrincipal: true, nivelIdiomaMinimo: true,
            instituicaoParceira: { select: { nome: true, paisNome: true, paisCodigo: true } },
            convenio: { select: { instituicaoParceira: { select: { nome: true, paisNome: true, paisCodigo: true } } } },
          },
        },
        requisitosDocumentos: {
          where: { instituicaoId, ativo: true },
          orderBy: [{ ordem: "asc" }, { id: "asc" }],
          select: { id: true, titulo: true, descricao: true, obrigatorio: true, exigeValidade: true },
        },
      },
    }),
    prisma.mobilidadeCandidatura.findMany({
      where: { instituicaoId, professorId: professor.id, vinculoCandidato: "PROFESSOR_PHANYX" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true, ofertaId: true, status: true, motivoStatus: true, classificacao: true,
        oferta: { select: { titulo: true } },
        documentos: {
          where: { instituicaoId },
          orderBy: [{ ordem: "asc" }, { id: "asc" }],
          select: { id: true, titulo: true, status: true, obrigatorio: true, exigeValidade: true,
            descricaoRequisito: true, arquivoNome: true, motivoRejeicao: true },
        },
      },
    }),
  ]);

  const data = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const hoje = diaOferta(agora);
  const candidaturaPorOferta = new Map(candidaturas.map((candidatura) => [candidatura.ofertaId, candidatura.id]));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-4 text-slate-900 dark:text-slate-100 md:p-6">
      <header className={cartao}>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className={subtitulo}>{t("subtitle")}</p>
        {(podeInscrever || candidaturas.length > 0) && (
          <a href="#minhas-candidaturas" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline dark:text-blue-300">{tAluno("title")}</a>
        )}
      </header>
      <section aria-labelledby="editais-docentes" className="space-y-3">
        <h2 id="editais-docentes" className="text-xl font-bold">{tOfertas("resultsTitle")}</h2>
        {!ofertas.length && <p className={cartao}>{t("empty")}</p>}
        {ofertas.map((oferta) => {
          const parceiro = oferta.programa.instituicaoParceira ?? oferta.programa.convenio?.instituicaoParceira;
          const aberta = oferta.status === "INSCRICOES_ABERTAS" && (!oferta.inscricoesInicio || diaOferta(oferta.inscricoesInicio) <= hoje);
          const candidaturaId = candidaturaPorOferta.get(oferta.id);
          return (
            <article key={oferta.id} className={`${cartao} space-y-3`}>
              <p className={subtitulo}>{tOfertas(`programTypes.${oferta.programa.tipo}`)} · {oferta.programa.nome}</p>
              <h3 className="text-lg font-bold">{oferta.titulo}</h3>
              <p className={subtitulo}>
                {parceiro && `${parceiro.nome} · ${parceiro.paisNome ?? parceiro.paisCodigo} · `}
                {t(aberta ? "open" : "scheduled")}
                {oferta.inscricoesFim && ` · ${tOfertas("deadline")}: ${data.format(oferta.inscricoesFim)}`}
              </p>
              <details className="space-y-3">
                <summary className="cursor-pointer font-semibold text-blue-700 dark:text-blue-300">{t("details")}</summary>
                {oferta.descricao && <p className="whitespace-pre-line text-sm">{oferta.descricao}</p>}
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  {oferta.inscricoesInicio && <div><dt className="font-semibold">{t("registrationStart")}</dt><dd>{data.format(oferta.inscricoesInicio)}</dd></div>}
                  <div><dt className="font-semibold">{tOfertas("vacancies")}</dt><dd>{oferta.vagas ?? tOfertas("notInformed")}</dd></div>
                  <div><dt className="font-semibold">{tOfertas("mobilityPeriod")}</dt><dd>{oferta.mobilidadeInicio ? data.format(oferta.mobilidadeInicio) : "—"} · {oferta.mobilidadeFim ? data.format(oferta.mobilidadeFim) : "—"}</dd></div>
                  {oferta.programa.idiomaPrincipal && <div><dt className="font-semibold">{tOfertas("language")}</dt><dd>{[oferta.programa.idiomaPrincipal, oferta.programa.nivelIdiomaMinimo].filter(Boolean).join(" · ")}</dd></div>}
                </dl>
                {oferta.requisitosDocentes && <div><h4 className="font-semibold">{t("requirements")}</h4><p className="whitespace-pre-line text-sm">{oferta.requisitosDocentes}</p></div>}
                {!!oferta.requisitosDocumentos.length && (
                  <div><h4 className="font-semibold">{tAluno("documents")}</h4>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {oferta.requisitosDocumentos.map((doc) => (
                        <li key={doc.id}>{doc.titulo} · {tAluno(doc.obrigatorio ? "required" : "optional")}
                          {doc.exigeValidade && ` · ${tAluno("validityRequired")}`}
                          {doc.descricao && <p className="whitespace-pre-line">{doc.descricao}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div><h4 className="font-semibold">{t("instructions")}</h4><p className="whitespace-pre-line text-sm">{oferta.instrucoes || t("contactInstitution")}</p></div>
              </details>
              {candidaturaId ? (
                <a href={`#candidatura-${candidaturaId}`} className="text-sm font-semibold text-blue-700 underline dark:text-blue-300">{tOfertas("viewApplication")}</a>
              ) : aberta && podeInscrever ? (
                <InscreverDocente ofertaId={oferta.id} />
              ) : aberta && !usuario.impersonacao ? (
                <p className={subtitulo}>{t("externalRegistration")}</p>
              ) : null}
            </article>
          );
        })}
      </section>

      {(podeInscrever || candidaturas.length > 0) && (
        <section aria-labelledby="minhas-candidaturas" className="space-y-3">
          <h2 id="minhas-candidaturas" className="text-xl font-bold">{tAluno("title")}</h2>
          {!candidaturas.length && <p className={cartao}>{tAluno("emptyTitle")}</p>}
          {candidaturas.map((candidatura) => (
            <article key={candidatura.id} id={`candidatura-${candidatura.id}`} className={`${cartao} scroll-mt-6 space-y-3`}>
              <h3 className="text-lg font-bold">{candidatura.oferta.titulo}</h3>
              <p className={subtitulo}>{tAluno(`statuses.${candidatura.status}`)}
                {candidatura.classificacao !== null && ` · ${t("ranking", { position: candidatura.classificacao })}`}
              </p>
              {candidatura.motivoStatus && <p className="whitespace-pre-line text-sm">{candidatura.motivoStatus}</p>}
              {!!candidatura.documentos.length && (
                <ul className="space-y-3">
                  {candidatura.documentos.map((doc) => (
                    <li key={doc.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                      <h4 className="font-semibold">{doc.titulo}</h4>
                      <p className={subtitulo}>{tAluno(doc.obrigatorio ? "required" : "optional")} · {tAluno(`documentStatuses.${doc.status}`)}</p>
                      {doc.descricaoRequisito && <p className="whitespace-pre-line text-sm">{doc.descricaoRequisito}</p>}
                      {doc.arquivoNome && <p className={subtitulo}>{tAluno("file", { name: doc.arquivoNome })}</p>}
                      {doc.motivoRejeicao && <p className="whitespace-pre-line text-sm">{tAluno("reviewReason")}: {doc.motivoRejeicao}</p>}
                      {!usuario.impersonacao && candidaturaDocenteEditavel(candidatura.status) &&
                        doc.status !== "APROVADO" && doc.status !== "EM_ANALISE" && (
                          <EnviarDocumentoDocente candidaturaId={candidatura.id} documentoId={doc.id} exigeValidade={doc.exigeValidade} />
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
