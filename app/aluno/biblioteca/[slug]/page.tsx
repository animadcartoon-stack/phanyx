import { DetalheCatalogoLeitor } from "@/components/biblioteca/CatalogoLeitor";

export default function ItemBibliotecaAluno({ params }: { params: { slug: string } }) {
  return <DetalheCatalogoLeitor portal="aluno" slug={params.slug} />;
}
