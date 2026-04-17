import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Sistema escolar grátis vs pago: qual escolher? | PHANYX",
  description:
    "Compare sistema escolar gratuito e pago. Veja vantagens, riscos e qual opção é melhor para sua instituição de ensino.",
};

export default function SistemaEscolarGratisVsPagoPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Sistema escolar grátis vs pago: qual escolher?
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Muitas instituições de ensino ficam em dúvida entre usar um sistema
            escolar gratuito ou investir em uma solução paga. A escolha pode
            impactar diretamente a organização, crescimento e qualidade da
            operação acadêmica.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Vantagens de um sistema escolar gratuito
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Sistemas gratuitos podem ser úteis no início, especialmente para
            instituições pequenas ou em fase de teste. Eles permitem validar
            processos sem investimento inicial.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Limitações de sistemas gratuitos
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            A maioria das soluções gratuitas possui limitações importantes, como
            falta de suporte, ausência de funcionalidades completas, baixa
            integração entre módulos e dificuldades de crescimento.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Vantagens de um sistema escolar pago
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Sistemas pagos oferecem maior estabilidade, suporte técnico,
            atualizações constantes e funcionalidades completas, como gestão
            acadêmica, financeiro, documentos e plataforma EAD integrados.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Quando vale investir em um sistema pago
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Se a instituição busca crescimento, organização profissional e
            redução de retrabalho, investir em um sistema completo é a melhor
            escolha. A economia de tempo e controle compensa rapidamente o custo.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como solução completa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX é uma plataforma completa que reúne gestão escolar,
            acadêmica, financeira e EAD em um único sistema, oferecendo uma
            estrutura sólida para instituições que desejam crescer com segurança.
          </p>

          <a
            href="/planos"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça os planos do PHANYX
          </a>
          <div className="mt-10 border-t pt-6">
  <h3 className="text-xl font-bold text-slate-900">
    Leia também
  </h3>

  <ul className="mt-4 space-y-2">
    <li>
      <a href="/blog/sistema-escolar-vs-moodle" className="text-blue-600 underline">
        Sistema escolar vs Moodle: qual é melhor?
      </a>
    </li>

    <li>
      <a href="/blog/como-escolher-sistema-escolar" className="text-blue-600 underline">
        Como escolher um sistema de gestão escolar
      </a>
    </li>

    <li>
      <a href="/blog/sistema-escolar-gratis-vs-pago" className="text-blue-600 underline">
        Sistema escolar grátis vs pago: qual escolher?
      </a>
    </li>
  </ul>
</div>
        </section>
      </main>

      <Footer />
    </>
  );
}