import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Como aumentar matrículas com um sistema escolar moderno | PHANYX",
  description:
    "Descubra como aumentar matrículas utilizando um sistema de gestão escolar moderno. Veja estratégias que realmente funcionam para escolas e cursos.",
};

export default function AumentarMatriculasPage() {
  return (
    <>
      <Header />

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-4xl font-bold">
            Como aumentar matrículas com um sistema escolar moderno
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Aumentar o número de matrículas é um dos maiores desafios de escolas,
            faculdades e cursos. Muitas instituições investem apenas em marketing,
            mas esquecem que a organização interna e a experiência do aluno têm
            impacto direto no crescimento.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Organização interna influencia nas matrículas
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Quando uma instituição é organizada, responde rápido, controla bem
            alunos e oferece uma experiência clara, ela transmite mais confiança.
            Isso aumenta conversão de interessados em alunos matriculados.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Atendimento mais rápido e profissional
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Um sistema de gestão escolar permite acesso rápido às informações,
            facilitando atendimento e fechamento de matrícula. Quanto mais rápido
            o atendimento, maior a chance de conversão.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Experiência do aluno influencia indicação
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Alunos satisfeitos indicam a instituição. Plataformas modernas com
            área do aluno, acesso a conteúdos, notas e acompanhamento aumentam
            retenção e indicação.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            Plataforma EAD amplia alcance
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Com ensino online, a instituição não depende apenas da localização
            física. Isso permite captar alunos de outras cidades e aumentar
            significativamente o número de matrículas.
          </p>

          <h2 className="mt-10 text-3xl font-bold">
            PHANYX como aliado no crescimento
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            O PHANYX reúne gestão escolar, acadêmica, financeiro e plataforma
            EAD em um único sistema, ajudando instituições a crescer com mais
            controle, organização e eficiência.
          </p>

          <a
            href="/sistema-escolar"
            className="mt-6 inline-block text-blue-600 underline"
          >
            Conheça o sistema de gestão escolar do PHANYX
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}