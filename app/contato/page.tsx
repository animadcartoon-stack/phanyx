import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { emailContatoPhanyx, emailSuportePhanyx, linkContatoPhanyx, linkSuportePhanyx } from "@/lib/contatos-phanyx";

const canais = [
  {
    titulo: "Contato institucional e comercial",
    valor: emailContatoPhanyx,
    descricao: "Propostas, parcerias e solicitações de demonstração.",
    href: linkContatoPhanyx(),
  },
  {
    titulo: "Suporte e atendimento",
    valor: emailSuportePhanyx,
    descricao: "Atendimento aos clientes, suporte técnico e Central de Ajuda.",
    href: linkSuportePhanyx,
  },
];

export default function ContatoPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Contato
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Fale com a equipe do PHANYX
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                Tire dúvidas, conheça os planos e descubra como o PHANYX pode
                ajudar sua instituição a crescer com mais controle, experiência
                digital e organização operacional.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="grid gap-6 md:grid-cols-2">
            {canais.map((canal) => (
              <a
                key={canal.titulo}
                href={canal.href}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                  {canal.titulo}
                </p>
                <p className="mt-3 text-lg font-bold text-slate-900">{canal.valor}</p>
                <p className="mt-2 text-slate-600">{canal.descricao}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 lg:px-12">
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Atendimento
              </p>

              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Estamos prontos para entender sua instituição e apresentar a melhor solução
              </h2>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Se você busca uma plataforma para gestão escolar, gestão acadêmica,
                EAD, documentos e operação institucional, nossa equipe pode orientar
                o melhor caminho para implantar o PHANYX com mais segurança.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
