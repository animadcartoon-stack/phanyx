"use client";

import { useEffect, useRef, useState } from "react";

export default function PerfilAdminPage() {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const inputFotoRef = useRef<HTMLInputElement | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

async function alterarFotoPerfil(file: File | null) {
  if (!file) return;

  try {
    setErro("");
    setSucesso("");
    setEnviandoFoto(true);

    const formData = new FormData();
    formData.append("file", file);

    const resUpload = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const jsonUpload = await resUpload.json();

    if (!resUpload.ok) {
      setErro(jsonUpload?.error || "Não foi possível enviar a imagem.");
      return;
    }

    const fotoUrl = jsonUpload?.url || jsonUpload?.arquivo?.url;

    if (!fotoUrl) {
      setErro("A imagem foi enviada, mas a URL não voltou do servidor.");
      return;
    }

    const resSalvar = await fetch("/api/admin/funcionarios/me", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...dados,
        fotoPerfil: fotoUrl,
      }),
    });

    const jsonSalvar = await resSalvar.json();

    if (!resSalvar.ok) {
      setErro(jsonSalvar?.error || "A foto foi enviada, mas não foi salva no perfil.");
      return;
    }

    setDados(jsonSalvar);
    setSucesso("Foto do perfil atualizada com sucesso.");
  } catch (e: any) {
    setErro(e?.message || "Erro de comunicação ao alterar foto do perfil.");
  } finally {
    setEnviandoFoto(false);
  }
}

  async function carregar() {
    try {
      const res = await fetch("/api/admin/funcionarios/me");

      const data = await res.json();

      setDados(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: React.FormEvent) {
  e.preventDefault();

  try {
    setErro("");
    setSucesso("");

    const res = await fetch("/api/admin/funcionarios/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(dados),
    });

    const json = await res.json();

    if (!res.ok) {
      setErro(
        json?.error ||
          "Não foi possível salvar o perfil. Verifique os dados e tente novamente."
      );
      return;
    }

    setDados(json);
    setSucesso("Perfil atualizado com sucesso.");
  } catch (e: any) {
    setErro(
      e?.message ||
        "Não foi possível salvar o perfil por erro de comunicação com o servidor."
    );
  }
}

  if (loading) {
    return <div className="p-10">Carregando...</div>;
  }

  return (
    <main className="max-w-3xl p-8">
        <input
  ref={inputFotoRef}
  type="file"
  accept="image/png,image/jpeg,image/jpg,image/webp"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    alterarFotoPerfil(file);
    e.target.value = "";
  }}
/>
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          Meu perfil
        </h1>

        <p className="mt-2 text-slate-500">
          Atualize seus dados administrativos.
        </p>

<div className="mt-6 flex items-center gap-4 rounded-2xl border bg-slate-50 p-4">
  <div className="h-20 w-20 overflow-hidden rounded-2xl border bg-slate-100">
    {dados?.fotoPerfil ? (
      <img
        src={dados.fotoPerfil}
        alt={dados?.nome || "Perfil"}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-700">
        {dados?.nome?.charAt(0)?.toUpperCase() || "A"}
      </div>
    )}
  </div>

  <div>
    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
      Foto do perfil
    </p>

    <button
      type="button"
      onClick={() => inputFotoRef.current?.click()}
      disabled={enviandoFoto}
      className="mt-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {enviandoFoto ? "Enviando..." : "Alterar foto"}
    </button>
  </div>
</div>

        <form onSubmit={salvar} className="mt-8 space-y-6">
            {erro && (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <strong>Não foi possível salvar.</strong>
    <br />
    {erro}
  </div>
)}

{sucesso && (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
    <strong>Tudo certo.</strong>
    <br />
    {sucesso}
  </div>
)}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nome
            </label>

            <input
              type="text"
              value={dados?.nome || ""}
              onChange={(e) =>
                setDados({
                  ...dados,
                  nome: e.target.value,
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Telefone
            </label>

            <input
              type="text"
              value={dados?.telefone || ""}
              onChange={(e) =>
                setDados({
                  ...dados,
                  telefone: e.target.value,
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Cargo
            </label>

            <input
              type="text"
              value={dados?.cargo || ""}
              onChange={(e) =>
                setDados({
                  ...dados,
                  cargo: e.target.value,
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Salvar alterações
          </button>
        </form>
      </div>
    </main>
  );
}