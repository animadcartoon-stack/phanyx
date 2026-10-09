import LeituraBiblioteca from "@/components/biblioteca/LeituraBiblioteca";
export const dynamic = "force-dynamic";
export default function Page({ params }: { params: { slug: string } }) {
  return <LeituraBiblioteca portal="aluno" slug={params.slug} />;
}
