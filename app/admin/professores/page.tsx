"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";

interface Professor {
  id: number;
  nome: string;
  cpf?: string | null;
  rg?: string | null;
  telefone?: string | null;
  dataNascimento?: string | null;
  titulacao?: string | null;
  especialidade?: string | null;
  formacao?: string | null;
  miniBio?: string | null;
  codigoFuncionario?: string | null;
  fotoPerfil?: string | null;
  documentoUrl?: string | null;
  slug?: string | null;
  user: {
    email: string;
  };
}

function AdminProfessoresPage() {
  const searchParams = useSearchParams();

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [titulacao, setTitulacao] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [formacao, setFormacao] = useState("");
  const [miniBio, setMiniBio] = useState("");
  const [codigoFuncionario, setCodigoFuncionario] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [slug, setSlug] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editRg, setEditRg] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editDataNascimento, setEditDataNascimento] = useState("");
  const [editTitulacao, setEditTitulacao] = useState("");
  const [editEspecialidade, setEditEspecialidade] = useState("");
  const [editFormacao, setEditFormacao] = useState("");
  const [editMiniBio, setEditMiniBio] = useState("");
  const [editCodigoFuncionario, setEditCodigoFuncionario] = useState("");
  const [editFotoPerfil, setEditFotoPerfil] = useState("");
  const [editDocumentoUrl, setEditDocumentoUrl] = useState("");
  const [editSlug, setEditSlug] = useState("");

  async function carregarProfessores() {
    const res = await fetch("/api/professor", {
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Erro ao buscar professores");
      setProfessores([]);
      return;
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      setProfessores(data);
    } else {
      console.error("Resposta inesperada:", data);
      setProfessores([]);
    }
  }

  async function handleCriarProfessor(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/professor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome,
        email,
        cpf,
        rg,
        telefone,
        dataNascimento: dataNascimento || null,
        titulacao,
        especialidade,
        formacao,
        miniBio,
        codigoFuncionario,
        fotoPerfil,
        documentoUrl,
        slug,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao criar professor");
      return;
    }

    setNome("");
    setEmail("");
    setCpf("");
    setRg("");
    setTelefone("");
    setDataNascimento("");
    setTitulacao("");
    setEspecialidade("");
    setFormacao("");
    setMiniBio("");
    setCodigoFuncionario("");
    setFotoPerfil("");
    setDocumentoUrl("");
    setSlug("");

    carregarProfessores();
  }

  function iniciarEdicao(professor: Professor) {
    setEditandoId(professor.id);
    setEditNome(professor.nome || "");
    setEditEmail(professor.user?.email || "");
    setEditCpf(professor.cpf || "");
    setEditRg(professor.rg || "");
    setEditTelefone(professor.telefone || "");
    setEditDataNascimento(
      professor.dataNascimento
        ? new Date(professor.dataNascimento).toISOString().slice(0, 10)
        : ""
    );
    setEditTitulacao(professor.titulacao || "");
    setEditEspecialidade(professor.especialidade || "");
    setEditFormacao(professor.formacao || "");
    setEditMiniBio(professor.miniBio || "");
    setEditCodigoFuncionario(professor.codigoFuncionario || "");
    setEditFotoPerfil(professor.fotoPerfil || "");
    setEditDocumentoUrl(professor.documentoUrl || "");
    setEditSlug(professor.slug || "");
  }

  async function salvarEdicao(id: number) {
    const res = await fetch(`/api/professor/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome: editNome,
        email: editEmail,
        cpf: editCpf,
        rg: editRg,
        telefone: editTelefone,
        dataNascimento: editDataNascimento || null,
        titulacao: editTitulacao,
        especialidade: editEspecialidade,
        formacao: editFormacao,
        miniBio: editMiniBio,
        codigoFuncionario: editCodigoFuncionario,
        fotoPerfil: editFotoPerfil,
        documentoUrl: editDocumentoUrl,
        slug: editSlug,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao atualizar professor");
      return;
    }

    setEditandoId(null);
    carregarProfessores();
  }

  async function deletarProfessor(id: number) {
    if (!confirm("Tem certeza que deseja excluir este professor?")) return;

    const res = await fetch(`/api/professor/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao deletar professor");
      return;
    }

    carregarProfessores();
  }

  useEffect(() => {
    carregarProfessores();
  }, []);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const professoresFiltrados = useMemo(() => {
    const termoTexto = busca.trim().toLowerCase();
    const termoNumerico = busca.replace(/\D/g, "");

    if (!termoTexto) return professores;

    return professores.filter((professor) => {
      const nomeTexto = String(professor.nome || "").toLowerCase().trim();
      const emailTexto = String(professor.user?.email || "")
        .toLowerCase()
        .trim();
      const cpfTexto = String(professor.cpf || "").toLowerCase().trim();
      const rgTexto = String(professor.rg || "").toLowerCase().trim();
      const telefoneTexto = String(professor.telefone || "")
        .toLowerCase()
        .trim();
      const titulacaoTexto = String(professor.titulacao || "")
        .toLowerCase()
        .trim();
      const especialidadeTexto = String(professor.especialidade || "")
        .toLowerCase()
        .trim();
      const formacaoTexto = String(professor.formacao || "")
        .toLowerCase()
        .trim();
      const codigoFuncionarioTexto = String(professor.codigoFuncionario || "")
        .toLowerCase()
        .trim();
      const slugTexto = String(professor.slug || "").toLowerCase().trim();

      const cpfNumerico = cpfTexto.replace(/\D/g, "");
      const rgNumerico = rgTexto.replace(/\D/g, "");
      const telefoneNumerico = telefoneTexto.replace(/\D/g, "");
      const codigoNumerico = codigoFuncionarioTexto.replace(/\D/g, "");

      return (
        nomeTexto.includes(termoTexto) ||
        emailTexto.includes(termoTexto) ||
        cpfTexto.includes(termoTexto) ||
        rgTexto.includes(termoTexto) ||
        telefoneTexto.includes(termoTexto) ||
        titulacaoTexto.includes(termoTexto) ||
        especialidadeTexto.includes(termoTexto) ||
        formacaoTexto.includes(termoTexto) ||
        codigoFuncionarioTexto.includes(termoTexto) ||
        slugTexto.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (cpfNumerico.includes(termoNumerico) ||
            rgNumerico.includes(termoNumerico) ||
            telefoneNumerico.includes(termoNumerico) ||
            codigoNumerico.includes(termoNumerico)))
      );
    });
  }, [professores, busca]);

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">👨‍🏫 Professores</h1>

      <form
        onSubmit={handleCriarProfessor}
        className="space-y-4 rounded-lg border bg-white p-6"
      >
        <h2 className="font-semibold">Novo professor</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            placeholder="Nome do professor"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border p-2"
            required
          />

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-2"
            required
          />

          <input
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="RG"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Titulação"
            value={titulacao}
            onChange={(e) => setTitulacao(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Especialidade"
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Formação"
            value={formacao}
            onChange={(e) => setFormacao(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Código do funcionário"
            value={codigoFuncionario}
            onChange={(e) => setCodigoFuncionario(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Slug público"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="URL da foto"
            value={fotoPerfil}
            onChange={(e) => setFotoPerfil(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="URL do documento"
            value={documentoUrl}
            onChange={(e) => setDocumentoUrl(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </div>

        <textarea
          placeholder="Mini bio"
          value={miniBio}
          onChange={(e) => setMiniBio(e.target.value)}
          className="min-h-[120px] w-full rounded-lg border p-2"
        />

        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">
          Criar professor
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">Lista de professores</h2>

          <input
            type="text"
            placeholder="Buscar por nome, email, CPF, telefone, código ou especialidade"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border p-2 md:w-[460px]"
          />
        </div>

        {professoresFiltrados.length === 0 ? (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            Nenhum professor encontrado para essa busca.
          </div>
        ) : (
          professoresFiltrados.map((p) => (
            <div key={p.id} className="rounded-lg border bg-white p-4">
              {editandoId === p.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Nome"
                    />
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Email"
                    />
                    <input
                      value={editCpf}
                      onChange={(e) => setEditCpf(e.target.value)}
                      className="rounded border p-2"
                      placeholder="CPF"
                    />
                    <input
                      value={editRg}
                      onChange={(e) => setEditRg(e.target.value)}
                      className="rounded border p-2"
                      placeholder="RG"
                    />
                    <input
                      value={editTelefone}
                      onChange={(e) => setEditTelefone(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Telefone"
                    />
                    <input
                      type="date"
                      value={editDataNascimento}
                      onChange={(e) => setEditDataNascimento(e.target.value)}
                      className="rounded border p-2"
                    />
                    <input
                      value={editTitulacao}
                      onChange={(e) => setEditTitulacao(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Titulação"
                    />
                    <input
                      value={editEspecialidade}
                      onChange={(e) => setEditEspecialidade(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Especialidade"
                    />
                    <input
                      value={editFormacao}
                      onChange={(e) => setEditFormacao(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Formação"
                    />
                    <input
                      value={editCodigoFuncionario}
                      onChange={(e) => setEditCodigoFuncionario(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Código do funcionário"
                    />
                    <input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Slug público"
                    />
                    <input
                      value={editFotoPerfil}
                      onChange={(e) => setEditFotoPerfil(e.target.value)}
                      className="rounded border p-2"
                      placeholder="URL da foto"
                    />
                    <input
                      value={editDocumentoUrl}
                      onChange={(e) => setEditDocumentoUrl(e.target.value)}
                      className="rounded border p-2"
                      placeholder="URL do documento"
                    />
                  </div>

                  <textarea
                    value={editMiniBio}
                    onChange={(e) => setEditMiniBio(e.target.value)}
                    className="min-h-[120px] w-full rounded border p-2"
                    placeholder="Mini bio"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => salvarEdicao(p.id)}
                      className="rounded bg-green-600 px-3 py-1 text-white"
                    >
                      Salvar
                    </button>

                    <button
                      onClick={() => setEditandoId(null)}
                      className="rounded bg-gray-400 px-3 py-1 text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium">{p.nome}</p>
                  <p className="text-sm text-gray-600">{p.user?.email}</p>
                  <p className="text-sm text-gray-600">CPF: {p.cpf || "-"}</p>
                  <p className="text-sm text-gray-600">RG: {p.rg || "-"}</p>
                  <p className="text-sm text-gray-600">
                    Telefone: {p.telefone || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Titulação: {p.titulacao || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Especialidade: {p.especialidade || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Formação: {p.formacao || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Código: {p.codigoFuncionario || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Slug: {p.slug || "-"}
                  </p>

                  <div className="mt-3 flex gap-4">
                    <button
                      onClick={() => iniciarEdicao(p)}
                      className="text-sm text-blue-600"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deletarProfessor(p.id)}
                      className="text-sm text-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminProfessoresPage, ["admin"]);