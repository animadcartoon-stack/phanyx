import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SuportePage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        {/* HERO */}
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-3xl">
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
          </div>
        </section>

        {/* CARDS */}
        <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
          <div className="grid gap-6 md:grid-cols-2">

            {/* WhatsApp */}
            <a
              href="https://wa.me/5548988101240"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-slate-900">
                💬 WhatsApp
              </h2>
              <p className="mt-2 text-slate-600">
                Fale diretamente com nossa equipe comercial e de suporte.
              </p>
              <p className="mt-4 font-semibold text-green-600">
                +55 48 98810-1240
              </p>
            </a>

            {/* Email */}
            <a
              href="mailto:atendimento@institutobatista.com"
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-slate-900">
                📧 Email
              </h2>
              <p className="mt-2 text-slate-600">
                Envie sua dúvida e nossa equipe responderá o mais rápido possível.
              </p>
              <p className="mt-4 font-semibold text-blue-600">
                atendimento@institutobatista.com
              </p>
            </a>

          </div>

          {/* Telefones */}
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              📞 Telefones
            </h2>

            <div className="mt-4 space-y-2 text-slate-700">
              <p>Comercial: (48) 98810-1240</p>
              <p>Fixo: (48) 3208-1353</p>
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
              href="https://wa.me/5548988101240"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-2xl bg-green-600 px-6 py-3 font-semibold hover:bg-green-500"
            >
              Falar no WhatsApp
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}