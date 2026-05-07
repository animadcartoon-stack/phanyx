"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import PhanyxToast from "@/components/ui/PhanyxToast"; 

type Disciplina = {
  id: number;
  nome: string;
  descricao?: string | null;
  cargaHoraria?: number | null;
  valor?: number;
  prerequisitos?: { id: number; nome: string }[];
};

type Modulo = {
  id: number;
  numero: number;
  titulo: string;
  descricao?: string | null;
  disciplinas: Disciplina[];
};

const VALOR_DISCIPLINA = 110;
const VALOR_SEMESTRE_COMPLETO = 550;
const VALOR_CURSO_COMPLETO = 3000;
const INSTITUICAO_ID_PADRAO = 1; // IBE

export default function IbeCheckoutPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [disciplinas, setDisciplinas] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [modulosAbertos, setModulosAbertos] = useState<number[]>([1]);
  const [modulosCompletos, setModulosCompletos] = useState<number[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/ibe/disciplinas?instituicaoId=${INSTITUICAO_ID_PADRAO}`)
      .then((res) => res.json())
      .then((data) => {
        setModulos(Array.isArray(data?.modulos) ? data.modulos : []);
      })
      .catch(() => setModulos([]));
  }, []);

useEffect(() => {
  const modulosComSelecao = modulos
    .filter((m) =>
      m.disciplinas.some((d) => disciplinas.includes(d.id))
    )
    .map((m) => m.numero);

  if (modulosComSelecao.length) {
    setModulosAbertos(modulosComSelecao);
  }
}, [disciplinas]);

  function toggleDisciplina(id: number) {
  const moduloDaDisciplina = modulos.find((m) =>
    m.disciplinas.some((d) => d.id === id)
  );

  setDisciplinas((prev) =>
    prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
  );

  if (moduloDaDisciplina) {
    setModulosCompletos((prev) =>
      prev.filter((numero) => numero !== moduloDaDisciplina.numero)
    );
  }
}

  function toggleModulo(numero: number) {
    setModulosAbertos((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero]
    );
  }

function selecionarCursoCompleto() {
  const ids = todasDisciplinas.map((d) => d.id);
  setDisciplinas(ids);
  setModulosCompletos(modulos.map((m) => m.numero));
}

function deselecionarTudo() {
  setDisciplinas([]);
  setModulosCompletos([]);
}

function selecionarModulo(numeroModulo: number, disciplinasDoModulo: Disciplina[]) {
  const ids = disciplinasDoModulo.map((d) => d.id);

  setDisciplinas((prev) => Array.from(new Set([...prev, ...ids])));

  setModulosCompletos((prev) =>
    prev.includes(numeroModulo) ? prev : [...prev, numeroModulo]
  );
}

function deselecionarModulo(numeroModulo: number, disciplinasDoModulo: Disciplina[]) {
  const ids = disciplinasDoModulo.map((d) => d.id);

  setDisciplinas((prev) => prev.filter((id) => !ids.includes(id)));

  setModulosCompletos((prev) =>
    prev.filter((numero) => numero !== numeroModulo)
  );
}

  const todasDisciplinas = modulos.flatMap((m) => m.disciplinas);

  const cursoCompletoSelecionado =
  todasDisciplinas.length > 0 &&
  todasDisciplinas.every((d) => disciplinas.includes(d.id)) &&
  modulos.length > 0 &&
  modulos.every((m) => modulosCompletos.includes(m.numero));

const total = cursoCompletoSelecionado
  ? VALOR_CURSO_COMPLETO
  : modulos.reduce((acc, modulo) => {
      const idsDoModulo = modulo.disciplinas.map((d) => d.id);

      const selecionadasDoModulo = modulo.disciplinas.filter((d) =>
        disciplinas.includes(d.id)
      );

      const moduloInteiroSelecionado =
        idsDoModulo.length > 0 &&
        idsDoModulo.every((id) => disciplinas.includes(id)) &&
        modulosCompletos.includes(modulo.numero);

      if (moduloInteiroSelecionado) {
        return acc + VALOR_SEMESTRE_COMPLETO;
      }

      return acc + selecionadasDoModulo.length * VALOR_DISCIPLINA;
    }, 0);

  async function handleSubmit() {
    if (carregando) return;

    if (!nome.trim() || !email.trim() || !whatsapp.trim() || !cpf.trim()) {
      setErro("Preencha nome, email, WhatsApp e CPF antes de finalizar a matrícula.");
      return;
    }

    if (disciplinas.length === 0) {
      setErro("Selecione pelo menos uma disciplina antes de continuar para o pagamento.");
      return;
    }

    setCarregando(true);

    const res = await fetch("/api/ibe/matricula", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome,
        email,
        whatsapp,
        cpf,
        disciplinas,
        valorTotal: total,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setCarregando(false);
      setErro(data?.error || "Erro ao iniciar pagamento.");
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    setCarregando(false);
    setErro(
  data?.error ||
    "Pagamento criado, mas o Asaas não retornou o link de pagamento. Tente novamente ou fale com o suporte."
);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px]">
        <section className="rounded-3xl bg-white p-8 shadow-xl">
          {erro && (
  <div className="mb-5">
    <PhanyxToast
      tipo="erro"
      titulo="Não foi possível finalizar"
      mensagem={erro}
      onClose={() => setErro("")}
    />
  </div>
)}
          <div className="mb-8 flex items-center gap-4">
            <Image
              src="/ibe/logo-preta.png"
              alt="Logo IBE"
              width={120}
              height={70}
              className="h-auto w-28"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Matrícula online IBE
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Bacharel Livre em Teologia
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Há mais de 25 anos capacitando vidas vocacionadas para o
                ministério cristão.
              </p>
            </div>
          </div>

          <div className="mb-8 grid gap-4 rounded-2xl bg-emerald-50 p-5 text-slate-700 md:grid-cols-[1fr_170px]">
            <div>
              <p className="font-semibold text-emerald-800">
                Seja bem-vindo ao Instituto Batista de Educação.
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                Monte sua grade de estudos. O curso é 100% EAD,
                possui carga total de 2.616 horas e oferece certificado após
                conclusão e aprovação conforme as regras acadêmicas.
              </p>

              <a
                href="/ibe/matriz-curricular.pdf"
                target="_blank"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                Baixar matriz curricular
              </a>
            </div>

            <Image
              src="/ibe/certificado-referencia.png"
              alt="Certificado de referência"
              width={180}
              height={130}
              className="rounded-xl border bg-white object-cover shadow"
            />
          </div>

          <div className="space-y-4">
            <input
              placeholder="Nome completo"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-500"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              placeholder="Email"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              placeholder="WhatsApp"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-500"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />

            <input
              placeholder="CPF"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-500"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />
          </div>

          <div className="mt-8">
            <h2 className="mb-2 text-lg font-bold text-slate-900">
              Escolha as disciplinas que deseja aderir
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Selecione as disciplinas que deseja cursar neste momento.
Você pode avançar por módulos conforme sua disponibilidade.
            </p>

<div className="mb-4 flex flex-wrap gap-3">
  <button
    type="button"
    onClick={selecionarCursoCompleto}
    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
  >
    Selecionar curso completo
  </button>

  <button
    type="button"
    onClick={deselecionarTudo}
    className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
  >
    Desselecionar tudo
  </button>
</div>

            <div className="space-y-4">
              {modulos.map((modulo) => {
                const aberto = modulosAbertos.includes(modulo.numero);

                return (
                  <div
                    key={modulo.id}
                    className="overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleModulo(modulo.numero)}
                      className="flex w-full items-center justify-between bg-slate-50 px-5 py-4 text-left font-bold text-slate-900 hover:bg-emerald-50"
                    >
                      <span>
                        Módulo {modulo.numero}
                        {modulo.titulo &&
                        !modulo.titulo
                          .toLowerCase()
                          .includes(`módulo ${modulo.numero}`)
                          ? ` — ${modulo.titulo}`
                          : ""}
                      </span>
                      <span>{aberto ? "▲ Fechar" : "▼ Abrir"}</span>
                    </button>

                    {aberto && (
                      <div className="space-y-3 p-4">

<div className="flex flex-wrap gap-3 px-4 pt-4">
  <button
    type="button"
    onClick={() => selecionarModulo(modulo.numero, modulo.disciplinas)}
    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
  >
    Selecionar todas do Módulo {modulo.numero}
  </button>

  <button
    type="button"
    onClick={() => deselecionarModulo(modulo.numero, modulo.disciplinas)}
    className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
  >
    Desselecionar Módulo {modulo.numero}
  </button>
</div>

                        {modulo.disciplinas.length === 0 && (
                          <p className="text-sm text-slate-500">
                            Nenhuma disciplina cadastrada neste módulo.
                          </p>
                        )}

{modulo.disciplinas.map((d) => {
  const bloqueada =
    d.prerequisitos &&
    d.prerequisitos.some((pre) => !disciplinas.includes(pre.id));

  return (
    <label
      key={d.id}
      className={`block rounded-xl border border-slate-200 p-4 ${
        bloqueada
          ? "cursor-not-allowed bg-slate-100 opacity-50"
          : "cursor-pointer hover:border-emerald-500 hover:bg-emerald-50"
      }`}
    >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <input
  type="checkbox"
  disabled={bloqueada}
  checked={disciplinas.includes(d.id)}
  onChange={() => toggleDisciplina(d.id)}
/>
                                <div>
                                  <span className="font-medium text-slate-800">
                                    {d.nome}
                                  </span>

                                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                                    {d.cargaHoraria ? (
                                      <span>{d.cargaHoraria} h/a</span>
                                    ) : null}

                                    {d.prerequisitos &&
                                    d.prerequisitos.length > 0 ? (
                                      <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
                                        Pré-requisito:{" "}
                                        {d.prerequisitos
                                          .map((p) => p.nome)
                                          .join(", ")}
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">
                                        Sem pré-requisito
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className="font-bold text-emerald-700">
                                R${" "}
{Number(d.valor ?? VALOR_DISCIPLINA)
  .toFixed(2)
  .replace(".", ",")}
                              </span>
                            </div>
                          </label>
  );
})}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
          <Image
            src="/ibe/logo-branca.png"
            alt="Logo IBE"
            width={140}
            height={80}
            className="mb-6 h-auto w-32"
          />

          <h2 className="text-xl font-bold">Resumo da matrícula</h2>

          <div className="mt-4 text-sm text-slate-300">
  {todasDisciplinas
    .filter((d) => disciplinas.includes(d.id))
    .map((d) => (
      <p key={d.id}>• {d.nome}</p>
    ))}
</div>

          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p>
              Disciplinas selecionadas:{" "}
              <strong className="text-white">{disciplinas.length}</strong>
            </p>

            <p>
              Pagamento seguro via{" "}
              <strong className="text-white">Asaas</strong>
            </p>

            <p>Certificado após conclusão e aprovação.</p>
          </div>

          <div className="mt-8 rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">Total</p>
            <p className="mt-1 text-3xl font-black text-white">
              R$ {total.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={carregando}
            className="mt-6 w-full rounded-xl bg-emerald-500 p-4 font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "🔄 Redirecionando para pagamento..." : "Finalizar matrícula"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Você será direcionado para a página segura de pagamento.
          </p>
        </aside>
      </div>
    </main>
  );
}