import "server-only";

import { Prisma, StatusModuloAdicional, TipoModuloAdicional } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { ErroBiblioteca, obterContextoBiblioteca } from "@/lib/biblioteca-acesso";

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
  const usuario = await getUserFromToken();
  if (!usuario || usuario.role.toUpperCase() !== portal.toUpperCase() || !usuario.instituicaoId) {
    redirect(`/login?portal=${portal}`);
  }

  const vinculo = portal === "aluno"
    ? await prisma.aluno.findFirst({ where: { userId: usuario.id, instituicaoId: usuario.instituicaoId }, select: { id: true } })
    : await prisma.professor.findFirst({ where: { userId: usuario.id, instituicaoId: usuario.instituicaoId }, select: { id: true } });
  if (!vinculo) redirect(`/login?portal=${portal}`);

  try {
    await obterContextoBiblioteca(usuario);
  } catch (erro) {
    if (erro instanceof ErroBiblioteca && erro.status === 403) return null;
    throw erro;
  }
  return { instituicaoId: usuario.instituicaoId, usuarioId: usuario.id, portal };
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

export async function listarCatalogo(leitor: Leitor, entrada: { q?: string; prateleira?: string; pagina?: string }) {
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
  const where: Prisma.BibliotecaItemWhereInput = {
    instituicaoId: leitor.instituicaoId,
    status: "PUBLICADO",
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
  return { prateleiras, selecionada, itens, total, pagina, busca };
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
        where: { instituicaoId: leitor.instituicaoId, ativo: true, permitirVisualizacao: true, OR: [{ inicioVigencia: null }, { inicioVigencia: { lte: new Date() } }], AND: [{ OR: [{ fimVigencia: null }, { fimVigencia: { gte: new Date() } }] }] },
        select: { id: true }, take: 1,
      },
      acessoLivre: true,
      _count: { select: { exemplares: { where: { instituicaoId: leitor.instituicaoId, status: "DISPONIVEL" } } } },
    },
  });
  if (!item) notFound();
  const { licencas, acessoLivre, ...publico } = item;
  return { ...publico, acessoDisponivel: acessoLivre || licencas.length > 0, exemplaresDisponiveis: item._count.exemplares };
}
