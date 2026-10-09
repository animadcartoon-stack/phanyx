import "server-only";

import { Prisma, StatusModuloAdicional, TipoModuloAdicional } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obterLeitorBiblioteca, licencasVigentes } from "@/lib/biblioteca-leitor";
import { direitosLeituraBiblioteca } from "@/lib/biblioteca-direitos-leitura";
import { ErroBiblioteca } from "@/lib/biblioteca-acesso";
import { podeBaixarPdfBiblioteca } from "@/lib/biblioteca-direitos-download";

export type PortalLeitor = "aluno" | "professor";

export async function bibliotecaDisponivel(instituicaoId: number) {
  const modulo = await prisma.moduloAdicionalInstituicao.findUnique({
    where: { instituicaoId_tipo: { instituicaoId, tipo: TipoModuloAdicional.BIBLIOTECA_VIRTUAL } },
    select: { status: true, testeGratisFimEm: true },
  });
  return Boolean(modulo && (
    modulo.status === StatusModuloAdicional.ATIVO ||
    modulo.status === StatusModuloAdicional.EM_ATRASO ||
    (modulo.status === StatusModuloAdicional.TESTE_GRATIS && modulo.testeGratisFimEm && modulo.testeGratisFimEm > new Date())
  ));
}

export async function contextoLeitor(portal: PortalLeitor) {
  try {
    const leitor = await obterLeitorBiblioteca();
    if (leitor.portal !== portal) redirect(`/login?portal=${portal}`);
    return leitor;
  } catch (erro) {
    if (erro instanceof ErroBiblioteca && erro.status === 401) redirect(`/login?portal=${portal}`);
    if (erro instanceof ErroBiblioteca && erro.status === 403) return null;
    throw erro;
  }
}

type Leitor = NonNullable<Awaited<ReturnType<typeof contextoLeitor>>>;

export function filtroPrateleiras(leitor: Leitor): Prisma.BibliotecaPrateleiraWhereInput {
  return {
    instituicaoId: leitor.instituicaoId,
    ativa: true,
    OR: [
      { tipo: { not: "PESSOAL" }, visibilidade: { in: ["TODOS", leitor.portal === "aluno" ? "ALUNOS" : "PROFESSORES"] } },
      { proprietarioId: leitor.usuarioId },
    ],
  };
}

const resumoItem = {
  id: true,
  slug: true,
  titulo: true,
  subtitulo: true,
  tipo: true,
  modalidade: true,
  capaUrl: true,
  miniaturaUrl: true,
  sinopse: true,
  anoPublicacao: true,
  autores: { orderBy: { ordem: "asc" }, take: 3, select: { autor: { select: { nome: true } } } },
} satisfies Prisma.BibliotecaItemSelect;

export async function listarCatalogo(leitor: Leitor, entrada: { q?: string; prateleira?: string; pagina?: string; filtro?: string }) {
  const busca = (typeof entrada.q === "string" ? entrada.q : "").trim().slice(0, 100);
  const numero = Number(typeof entrada.pagina === "string" ? entrada.pagina : 1);
  const pagina = Number.isSafeInteger(numero) && numero > 0 ? Math.min(numero, 10000) : 1;
  const slugPrateleira = typeof entrada.prateleira === "string" ? entrada.prateleira.slice(0, 150) : "";
  const selecao = { id: true, slug: true, nome: true, descricao: true, destaque: true } as const;
  const [prateleiras, selecionada] = await Promise.all([
    prisma.bibliotecaPrateleira.findMany({
      where: filtroPrateleiras(leitor), select: selecao,
      orderBy: [{ destaque: "desc" }, { ordem: "asc" }, { nome: "asc" }], take: 50,
    }),
    slugPrateleira ? prisma.bibliotecaPrateleira.findFirst({ where: { AND: [filtroPrateleiras(leitor), { slug: slugPrateleira }] }, select: selecao }) : Promise.resolve(null),
  ]);
  if (slugPrateleira && !selecionada) notFound();
  if (selecionada && !prateleiras.some((p) => p.id === selecionada.id)) prateleiras.push(selecionada);
  const filtro = entrada.filtro === "favoritos" && leitor.configuracao?.permitirFavoritos ? "favoritos" : entrada.filtro === "andamento" ? "andamento" : "todos";
  const pessoal = { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId };
  const where: Prisma.BibliotecaItemWhereInput = {
    instituicaoId: leitor.instituicaoId,
    status: "PUBLICADO",
    ...(filtro === "favoritos" ? { favoritos: { some: pessoal } } : {}),
    ...(filtro === "andamento" ? { progressosLeitura: { some: { ...pessoal, arquivo: { status: "DISPONIVEL", arquivadoEm: null } } } } : {}),
    ...(selecionada ? { prateleiras: { some: { instituicaoId: leitor.instituicaoId, prateleiraId: selecionada.id } } } : {}),
    ...(busca ? {
      OR: [
        { titulo: { contains: busca, mode: "insensitive" } },
        { subtitulo: { contains: busca, mode: "insensitive" } },
        { autores: { some: { autor: { nome: { contains: busca, mode: "insensitive" } } } } },
      ],
    } : {}),
  };
  const [itens, total] = await Promise.all([
    prisma.bibliotecaItem.findMany({ where, select: resumoItem, orderBy: [{ destaque: "desc" }, { titulo: "asc" }], skip: (pagina - 1) * 24, take: 24 }),
    prisma.bibliotecaItem.count({ where }),
  ]);
  return { prateleiras, selecionada, itens, total, pagina, busca, filtro };
}

export async function obterItemCatalogo(leitor: Leitor, slug: string) {
  const item = await prisma.bibliotecaItem.findFirst({
    where: { instituicaoId: leitor.instituicaoId, slug, status: "PUBLICADO" },
    select: {
      ...resumoItem,
      descricao: true,
      isbn10: true,
      isbn13: true,
      issn: true,
      doi: true,
      idioma: true,
      numeroPaginas: true,
      editora: { select: { nome: true } },
      categorias: { select: { categoria: { select: { nome: true } } } },
      licencas: {
        where: licencasVigentes(leitor.instituicaoId),
        select: { id: true, permitirVisualizacao: true, permitirDownload: true, permitirCopia: true, permitirImpressao: true },
      },
      favoritos: { where: { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId }, select: { id: true }, take: 1 },
      progressosLeitura: { where: { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId },
        select: { arquivoId: true, paginaAtual: true, totalPaginas: true, percentual: true }, take: 1 },
      acessoLivre: true,
      permitirDownload: true,
      arquivos: {
        where: { instituicaoId: leitor.instituicaoId, tipo: { in: ["LINK_EXTERNO", "PDF"] }, status: "DISPONIVEL", arquivadoEm: null },
        select: { id: true, tipo: true, urlExterna: true, storageKey: true }, orderBy: [{ principal: "desc" }, { id: "desc" }],
      },
      _count: { select: { exemplares: { where: { instituicaoId: leitor.instituicaoId, status: "DISPONIVEL" } } } },
    },
  });
  if (!item) notFound();
  const { licencas, acessoLivre, permitirDownload, arquivos, favoritos, progressosLeitura, ...publico } = item;
  const candidato = arquivos.find((arquivo) => arquivo.tipo === "LINK_EXTERNO")?.urlExterna;
  let linkExterno: string | null = null;
  const direitos = direitosLeituraBiblioteca(item);
  const acessoDisponivel = direitos.visualizar;
  if (candidato && acessoDisponivel) {
    try {
      const url = new URL(candidato);
      if (url.protocol === "https:" && !url.username && !url.password) linkExterno = url.href;
    } catch { /* Um endereço inválido nunca é entregue ao leitor. */ }
  }
  const pdf = ["ACESSO_LIVRE", "DOWNLOAD_AUTORIZADO"].includes(item.modalidade)
    ? arquivos.find((arquivo) => arquivo.tipo === "PDF" && arquivo.storageKey) : null;
  const configuracao = pdf ? await prisma.bibliotecaConfiguracao.findUnique({
    where: { instituicaoId: leitor.instituicaoId }, select: { permitirDownload: true },
  }) : null;
  const podeBaixarPdf = Boolean(pdf && podeBaixarPdfBiblioteca({
    configuracao, item: { permitirDownload, acessoLivre }, licencas,
  }));
  const pdfLeitura = direitos.lerPdf ? arquivos.find((arquivo) => arquivo.tipo === "PDF" && arquivo.storageKey) : null;
  const progresso = progressosLeitura.find((p) => p.arquivoId === pdfLeitura?.id);
  return { ...publico, linkExterno, pdfArquivoId: podeBaixarPdf ? pdf!.id : null,
    pdfLeituraId: pdfLeitura?.id || null, direitos,
    favorito: favoritos.length > 0,
    progresso: progresso ? { ...progresso, percentual: Number(progresso.percentual) } : null,
    acessoDisponivel, exemplaresDisponiveis: item._count.exemplares };
}
