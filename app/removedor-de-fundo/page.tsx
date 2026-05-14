import Link from "next/link";

export const metadata = {
  title: "Removedor de Fundo de Imagem Grátis com IA | PHANYX",
  description:
    "Remova o fundo de imagens online com o Removedor de Fundo PHANYX. Gere PNG transparente para assinaturas, documentos, contratos, fotos e artes.",
  keywords: [
    "removedor de fundo",
    "remover fundo de imagem",
    "remover fundo online",
    "removedor de fundo grátis",
    "png transparente",
    "assinatura transparente",
    "PHANYX",
  ],
};

export default function RemovedorDeFundoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="mb-4 inline-flex rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
            Ferramenta grátis PHANYX
          </p>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Removedor de Fundo de Imagem PHANYX
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Remova o fundo de imagens online e gere arquivos com fundo
            transparente para assinaturas, contratos, certificados, documentos,
            fotos, artes e materiais profissionais.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="#upload"
              className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
            >
              Remover fundo agora
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-white/20 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Conhecer o PHANYX
            </Link>
          </div>
        </div>

        <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="rounded-2xl bg-slate-900 p-6">
            <div className="mb-4 grid grid-cols-2 gap-4 text-center text-sm text-slate-300">
              <div className="rounded-xl bg-white/10 p-4">Imagem original</div>
              <div className="rounded-xl bg-cyan-400/10 p-4 text-cyan-200">
                Fundo removido
              </div>
            </div>

            <div className="grid min-h-64 grid-cols-2 gap-4">
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-slate-400">
                Antes
              </div>
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-cyan-300/40 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] text-cyan-200">
                PNG transparente
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="upload"
        className="mx-auto max-w-4xl px-6 pb-20"
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <h2 className="text-2xl font-black">
            Envie sua imagem
          </h2>

          <p className="mt-3 text-slate-300">
            Em breve, esta ferramenta permitirá remover fundos com IA e baixar
            em PNG transparente, JPG ou WebP. Estamos preparando a integração
            profissional do PHANYX.
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-cyan-300/40 bg-slate-900 p-10 text-center">
            <p className="text-lg font-bold text-cyan-200">
              Área de upload em preparação
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Próximo passo: conectar a API de IA para remover fundo automaticamente.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-black">PNG transparente</h3>
            <p className="mt-3 text-slate-300">
              Ideal para assinaturas digitais, contratos, certificados e documentos.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-black">Remoção com IA</h3>
            <p className="mt-3 text-slate-300">
              Pensado para fundos brancos, fotos, imagens de pessoas, objetos e artes.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-black">Ferramenta grátis</h3>
            <p className="mt-3 text-slate-300">
              Disponível online para usuários do PHANYX e para qualquer pessoa.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}