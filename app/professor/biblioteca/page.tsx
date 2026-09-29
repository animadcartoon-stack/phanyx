import { CatalogoLeitor } from "@/components/biblioteca/CatalogoLeitor";

export default function BibliotecaProfessor({ searchParams }: { searchParams: { q?: string; prateleira?: string; pagina?: string } }) {
  return <CatalogoLeitor portal="professor" searchParams={searchParams} />;
}
