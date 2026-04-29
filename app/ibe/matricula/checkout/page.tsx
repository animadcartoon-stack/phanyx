"use client";

import Image from "next/image";
import { useState } from "react";

export default function IbeCheckoutPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [disciplinas, setDisciplinas] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(false);

  const listaDisciplinas = [
    { id: 1, nome: "Antigo Testamento", valor: 120 },
    { id: 2, nome: "Novo Testamento", valor: 120 },
    { id: 3, nome: "Teologia Sistemática", valor: 150 },
    { id: 4, nome: "Missões", valor: 100 },
  ];

  function toggleDisciplina(id: number) {
    setDisciplinas((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  const total = listaDisciplinas
    .filter((d) => disciplinas.includes(d.id))
    .reduce((acc, d) => acc + d.valor, 0);

  async function handleSubmit() {
    if (carregando) return;

    if (!nome.trim() || !email.trim() || !whatsapp.trim() || !cpf.trim()) {
      alert("Preencha nome, email, WhatsApp e CPF.");
      return;
    }

    if (disciplinas.length === 0) {
      alert("Selecione pelo menos uma disciplina.");
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
      alert(data?.error || "Erro ao iniciar pagamento.");
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    setCarregando(false);
    alert(
      data?.error ||
        "Pagamento criado, mas o Asaas não retornou link de pagamento."
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px]">
        <section className="rounded-3xl bg-white p-8 shadow-xl">
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
                Finalize sua inscrição
              </h1>
            </div>
          </div>

          <div className="mb-8 rounded-2xl bg-emerald-50 p-5 text-slate-700">
            <p className="font-semibold text-emerald-800">
              Seja bem-vindo ao Instituto Batista de Educação.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Preencha seus dados, escolha as disciplinas desejadas e siga para
              o pagamento com segurança. Após a confirmação, sua matrícula será
              processada automaticamente.
            </p>
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
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              Escolha as disciplinas
            </h2>

            <div className="space-y-3">
              {listaDisciplinas.map((d) => (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={disciplinas.includes(d.id)}
                      onChange={() => toggleDisciplina(d.id)}
                    />
                    <span className="font-medium text-slate-800">
                      {d.nome}
                    </span>
                  </div>

                  <span className="font-bold text-emerald-700">
                    R$ {d.valor}
                  </span>
                </label>
              ))}
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

          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p>
              Disciplinas selecionadas:{" "}
              <strong className="text-white">{disciplinas.length}</strong>
            </p>

            <p>
              Pagamento seguro via{" "}
              <strong className="text-white">Asaas</strong>
            </p>

            <p>
              Liberação após confirmação do pagamento.
            </p>
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
            {carregando ? "Gerando pagamento..." : "Ir para pagamento"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Você será direcionado para a página segura de pagamento.
          </p>
        </aside>
      </div>
    </main>
  );
}