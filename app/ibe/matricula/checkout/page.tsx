"use client";

import { useState } from "react";

export default function IbeCheckoutPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [disciplinas, setDisciplinas] = useState<number[]>([]);
  const [cpf, setCpf] = useState("");

  const listaDisciplinas = [
    { id: 1, nome: "Antigo Testamento", valor: 120 },
    { id: 2, nome: "Novo Testamento", valor: 120 },
    { id: 3, nome: "Teologia Sistemática", valor: 150 },
    { id: 4, nome: "Missões", valor: 100 },
  ];

  function toggleDisciplina(id: number) {
    setDisciplinas((prev) =>
      prev.includes(id)
        ? prev.filter((d) => d !== id)
        : [...prev, id]
    );
  }

  const total = listaDisciplinas
    .filter((d) => disciplinas.includes(d.id))
    .reduce((acc, d) => acc + d.valor, 0);

  async function handleSubmit() {
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
  alert(data?.error || "Erro ao iniciar pagamento.");
  return;
}

    if (data.checkoutUrl) {
  window.location.href = data.checkoutUrl;
  return;
}

alert(data?.error || "Pagamento criado, mas o Asaas não retornou link de pagamento.");
console.log("Resposta da API matrícula IBE:", data);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Finalizar matrícula</h1>

        <input
          placeholder="Nome"
          className="w-full rounded border p-3"
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          placeholder="Email"
          className="w-full rounded border p-3"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="WhatsApp"
          className="w-full rounded border p-3"
          onChange={(e) => setWhatsapp(e.target.value)}
        />
<input
  placeholder="CPF"
  className="w-full rounded border p-3"
  value={cpf}
  onChange={(e) => setCpf(e.target.value)}
/>
        <div>
          <h2 className="font-semibold mb-2">Escolha as disciplinas</h2>

          {listaDisciplinas.map((d) => (
            <label key={d.id} className="flex gap-2 py-2">
              <input
                type="checkbox"
                onChange={() => toggleDisciplina(d.id)}
              />
              {d.nome} - R$ {d.valor}
            </label>
          ))}
        </div>

        <div className="text-lg font-bold">
          Total: R$ {total}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full rounded bg-green-500 p-4 text-white font-bold"
        >
          Ir para pagamento
        </button>
      </div>
    </main>
  );
}