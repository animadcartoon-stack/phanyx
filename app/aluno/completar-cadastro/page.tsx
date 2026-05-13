"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FormAluno = {
  cpf: string;
  rg: string;
  telefone: string;
  dataNascimento: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
  telefoneResponsavel: string;
  emailResponsavel: string;
  parentescoResponsavel: string;
  possuiNecessidadeEspecial: boolean;
  descricaoNecessidadeEspecial: string;
  observacoesAcessibilidade: string;
};

const vazio: FormAluno = {
  cpf: "",
  rg: "",
  telefone: "",
  dataNascimento: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  nomeResponsavel: "",
  cpfResponsavel: "",
  telefoneResponsavel: "",
  emailResponsavel: "",
  parentescoResponsavel: "",
  possuiNecessidadeEspecial: false,
  descricaoNecessidadeEspecial: "",
  observacoesAcessibilidade: "",
};

export default function CompletarCadastroAlunoPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormAluno>(vazio);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function atualizar(campo: keyof FormAluno, valor: any) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/completar-cadastro", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar cadastro.");
      }

      setForm({
        ...vazio,
        cpf: data.cpf || "",
        rg: data.rg || "",
        telefone: data.telefone || "",
        dataNascimento: data.dataNascimento
          ? String(data.dataNascimento).slice(0, 10)
          : "",
        cep: data.cep || "",
        endereco: data.endereco || "",
        numero: data.numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        nomeResponsavel: data.nomeResponsavel || "",
        cpfResponsavel: data.cpfResponsavel || "",
        telefoneResponsavel: data.telefoneResponsavel || "",
        emailResponsavel: data.emailResponsavel || "",
        parentescoResponsavel: data.parentescoResponsavel || "",
        possuiNecessidadeEspecial: Boolean(data.possuiNecessidadeEspecial),
        descricaoNecessidadeEspecial: data.descricaoNecessidadeEspecial || "",
        observacoesAcessibilidade: data.observacoesAcessibilidade || "",
      });
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      if (!form.cpf || !form.telefone || !form.dataNascimento) {
        setErro("Preencha CPF, telefone e data de nascimento para continuar.");
        return;
      }

      const res = await fetch("/api/aluno/completar-cadastro", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar cadastro.");
      }

      setSucesso("Cadastro atualizado com sucesso.");
      setTimeout(() => router.push("/aluno"), 800);
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar cadastro.");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return <div className="p-6">Carregando cadastro...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 rounded-3xl bg-blue-600 p-6 text-white shadow">
        <h1 className="text-2xl font-bold">Complete seu cadastro</h1>
        <p className="mt-2 text-sm text-blue-50">
          Para manter seus documentos, contratos e registros acadêmicos corretos,
          preencha seus dados pessoais.
        </p>
      </div>

      {erro && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {sucesso}
        </div>
      )}

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Dados pessoais</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border p-3" placeholder="CPF" value={form.cpf} onChange={(e) => atualizar("cpf", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="RG" value={form.rg} onChange={(e) => atualizar("rg", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Telefone" value={form.telefone} onChange={(e) => atualizar("telefone", e.target.value)} />
          <input className="rounded-xl border p-3" type="date" value={form.dataNascimento} onChange={(e) => atualizar("dataNascimento", e.target.value)} />
        </div>

        <h2 className="mb-4 mt-8 text-lg font-bold">Endereço</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border p-3" placeholder="CEP" value={form.cep} onChange={(e) => atualizar("cep", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Endereço" value={form.endereco} onChange={(e) => atualizar("endereco", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Número" value={form.numero} onChange={(e) => atualizar("numero", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Complemento" value={form.complemento} onChange={(e) => atualizar("complemento", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Bairro" value={form.bairro} onChange={(e) => atualizar("bairro", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Cidade" value={form.cidade} onChange={(e) => atualizar("cidade", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Estado" value={form.estado} onChange={(e) => atualizar("estado", e.target.value)} />
        </div>

        <h2 className="mb-4 mt-8 text-lg font-bold">Responsável</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border p-3" placeholder="Nome do responsável" value={form.nomeResponsavel} onChange={(e) => atualizar("nomeResponsavel", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="CPF do responsável" value={form.cpfResponsavel} onChange={(e) => atualizar("cpfResponsavel", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Telefone do responsável" value={form.telefoneResponsavel} onChange={(e) => atualizar("telefoneResponsavel", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="E-mail do responsável" value={form.emailResponsavel} onChange={(e) => atualizar("emailResponsavel", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Parentesco" value={form.parentescoResponsavel} onChange={(e) => atualizar("parentescoResponsavel", e.target.value)} />
        </div>

        <h2 className="mb-4 mt-8 text-lg font-bold">Acessibilidade</h2>

        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.possuiNecessidadeEspecial}
            onChange={(e) => atualizar("possuiNecessidadeEspecial", e.target.checked)}
          />
          Possuo necessidade especial ou necessidade de acessibilidade
        </label>

        <textarea
          className="mb-4 w-full rounded-xl border p-3"
          rows={3}
          placeholder="Descreva a necessidade especial, se houver"
          value={form.descricaoNecessidadeEspecial}
          onChange={(e) => atualizar("descricaoNecessidadeEspecial", e.target.value)}
        />

        <textarea
          className="w-full rounded-xl border p-3"
          rows={3}
          placeholder="Observações de acessibilidade"
          value={form.observacoesAcessibilidade}
          onChange={(e) => atualizar("observacoesAcessibilidade", e.target.value)}
        />

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar cadastro"}
        </button>
      </div>
    </div>
  );
}