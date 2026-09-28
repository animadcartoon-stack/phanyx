import { DetalheCatalogoLeitor } from "@/components/biblioteca/CatalogoLeitor";

export default function ItemBibliotecaProfessor({ params }: { params: { slug: string } }) {
  return <DetalheCatalogoLeitor portal="professor" slug={params.slug} />;
}
