import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Blog PHANYX | Sistema de Gestão Escolar e EAD",
  description:
    "Conteúdos sobre sistema de gestão escolar, plataforma EAD, gestão acadêmica e tecnologia educacional.",
};

export default function BlogPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold mb-6">
            Blog PHANYX
          </h1>

          <p className="text-lg text-slate-600 mb-10">
            Conteúdos completos sobre gestão escolar, plataformas EAD e tecnologia educacional.
          </p>

          <div className="space-y-6">

            <Link href="/blog/sistema-gestao-escolar" className="block border p-6 rounded-lg hover:shadow">
              <h2 className="text-2xl font-semibold">
                Melhor sistema de gestão escolar em 2026
              </h2>
              <p className="text-slate-600 mt-2">
                Descubra como escolher o melhor sistema escolar para sua instituição.
              </p>
            </Link>
<Link href="/blog/como-escolher-sistema-escolar" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Como escolher um sistema de gestão escolar
  </h2>
  <p className="text-slate-600 mt-2">
    Entenda os critérios mais importantes antes de contratar uma plataforma para sua instituição.
  </p>
</Link>
<Link href="/blog/sistema-escolar-gratis-vs-pago" className="block border p-6 rounded-lg hover:shadow">
  <h2 className="text-2xl font-semibold">
    Sistema escolar grátis vs pago: qual escolher?
  </h2>
  <p className="text-slate-600 mt-2">
    Compare vantagens e descubra qual opção faz mais sentido para sua instituição.
  </p>
</Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}