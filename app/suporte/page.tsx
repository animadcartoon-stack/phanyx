import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HelpCenterLink from "@/components/layout/HelpCenterLink";
import OpcoesEmailPhanyx from "@/components/marketing/OpcoesEmailPhanyx";

export default function SuportePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
       {/* HERO */}
<section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
  <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-10 lg:px-12 lg:py-20">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
        Suporte
      </p>

      <h1 className="mt-4 text-4xl font-bold md:text-5xl">
        Central de suporte PHANYX
      </h1>

      <p className="mt-6 text-lg text-slate-300">
        Nossa equipe está pronta para ajudar sua instituição com dúvidas,
        suporte técnico e orientações sobre a plataforma.
      </p>
    </div>

    <div className="flex justify-center md:justify-end">
      <img
        src="/images/formix-tutorial.png"
        alt="Mascote PHANYX suporte"
        className="w-64 md:w-80 lg:w-96 drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
      />
    </div>
  </div>
</section>
        {/* CARDS */}
        <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
          <div className="grid gap-6 md:grid-cols-2">

            <article
              id="email-suporte"
              className="scroll-mt-36 space-y-3 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Suporte por e-mail
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Envie sua dúvida ou solicitação de suporte técnico à equipe do PHANYX.
              </p>
              <OpcoesEmailPhanyx canal="suporte" />
            </article>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                <HelpCenterLink locale="pt-BR" className="text-blue-600 hover:underline" />
              </h2>
              <p className="mt-2 text-slate-600">
                Consulte os guias dos portais administrativo, docente e discente.
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center">
            <h2 className="text-3xl font-bold">
              Precisa de ajuda agora?
            </h2>

            <p className="mt-4 text-slate-300">
              Nossa equipe está pronta para te atender e ajudar sua instituição a evoluir com o PHANYX.
            </p>

            <a
              href="#email-suporte"
              className="mt-8 inline-block rounded-2xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-600"
            >
              Enviar e-mail ao suporte
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
