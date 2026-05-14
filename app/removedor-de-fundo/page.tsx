import Link from "next/link";
import Image from "next/image";
import RemovedorDeFundoClient from "./RemovedorDeFundoClient";

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

        <div className="flex-1 rounded-3xl border border-cyan-400/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-500/10">
  <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-8 backdrop-blur">
    <div className="mb-6 flex items-center gap-4">
      <Image
        src="/favicon.ico.png"
        alt="PHANYX"
        width={60}
        height={60}
        className="rounded-2xl"
      />

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
          IA PHANYX
        </p>
        <h3 className="text-xl font-black text-white">
          Remoção Inteligente de Fundo
        </h3>
      </div>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-slate-800/60 p-6">
        <p className="mb-4 text-sm font-semibold text-slate-300">
          Mascote PHANYX
        </p>

        <div className="flex justify-center">
          <Image
            src="/images/formix.png"
            alt="Formix mascote PHANYX"
            width={220}
            height={220}
            className="object-contain"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-6">
        <p className="mb-4 text-sm font-semibold text-cyan-200">
          PNG transparente pronto
        </p>

        <div className="flex justify-center">
          <Image
            src="/images/formix.png"
            alt="Formix transparente"
            width={220}
            height={220}
            className="object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  </div>
</div>
      </section>

      <section
  id="upload"
  className="mx-auto max-w-7xl px-6 pb-20"
>
        <div className="rounded-[2rem] border border-cyan-400/10 bg-white/5 p-4 shadow-2xl shadow-cyan-500/10 md:p-8">
          <h2 className="text-2xl font-black">
            Envie sua imagem
          </h2>

          <p className="mt-3 text-slate-300">
            Em breve, esta ferramenta permitirá remover fundos com IA e baixar
            em PNG transparente, JPG ou WebP. Estamos preparando a integração
            profissional do PHANYX.
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-cyan-300/40 bg-slate-900 p-10 text-center">
            <RemovedorDeFundoClient />
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
            <h3 className="text-xl font-black">Recorte inteligente</h3>
<p className="mt-3 text-slate-300">
  Reconhecimento automático de fundo para gerar imagens com transparência rapidamente.
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