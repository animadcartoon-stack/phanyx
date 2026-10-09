import { CatalogoLeitor } from "@/components/biblioteca/CatalogoLeitor";

export default function BibliotecaAluno({ searchParams }: { searchParams: { q?: string; prateleira?: string; pagina?: string; filtro?: string } }) {
  return <CatalogoLeitor portal="aluno" searchParams={searchParams} />;
}
