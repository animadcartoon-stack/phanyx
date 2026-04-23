"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";

interface Polo {
  id: number;
  nome: string;
  codigo?: string | null;
}

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
  poloId?: number | null;
  polo?: Polo | null;
  user: {
    email: string;
  };
}

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminProfessoresPage() {
  const searchParams = useSearchParams();

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [polos, setPolos] = useState<Polo[]>([]);
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
  const [poloId, setPoloId] = useState("");

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
  const [editPoloId, setEditPoloId] = useState("");

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [professorParaExcluir, setProfessorParaExcluir] =
    useState<Professor | null>(null);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

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

  async function carregarPolos() {
    const res = await fetch("/api/admin/polos", {
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Erro ao buscar polos");
      setPolos([]);
      return;
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      setPolos(data);
    } else {
      setPolos([]);
    }
  }

  async function handleCriarProfessor(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

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
          poloId: poloId ? Number(poloId) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar professor");
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
      setPoloId("");

      await carregarProfessores();
      mostrarFeedback("sucesso", "Professor criado com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao criar professor");
    } finally {
      setCriando(false);
    }
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
    setEditPoloId(
      professor.poloId !== null && professor.poloId !== undefined
        ? String(professor.poloId)
        : ""
    );
  }

  async function salvarEdicao(id: number) {
    try {
      setSalvandoId(id);

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
          poloId: editPoloId ? Number(editPoloId) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar professor");
      }

      setEditandoId(null);
      await carregarProfessores();
      mostrarFeedback("sucesso", "Professor atualizado com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao atualizar professor");
    } finally {
      setSalvandoId(null);
    }
  }

  async function confirmarExclusaoProfessor() {
    if (!professorParaExcluir) return;

    try {
      setExcluindoId(professorParaExcluir.id);

      const res = await fetch(`/api/professor/${professorParaExcluir.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detalhe || data?.error || "Erro ao deletar professor");
      }

      setProfessorParaExcluir(null);
      await carregarProfessores();
      mostrarFeedback("sucesso", "Professor excluído com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao deletar professor");
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
    carregarProfessores();
    carregarPolos();
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
      const poloTexto = String(professor.polo?.nome || "").toLowerCase().trim();

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
        poloTexto.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (cpfNumerico.includes(termoNumerico) ||
            rgNumerico.includes(termoNumerico) ||
            telefoneNumerico.includes(termoNumerico) ||
            codigoNumerico.includes(termoNumerico)))
      );
    });
  }, [professores, busca]);

  return (
    <>
      <div className="max-w-5xl space-y-6">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              feedbackTipo === "sucesso"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback}
          </div>
        )}

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

            <select
              value={poloId}
              onChange={(e) => setPoloId(e.target.value)}
              className="w-full rounded-lg border p-2"
            >
              <option value="">Selecione o polo</option>
              {polos.map((polo) => (
                <option key={polo.id} value={polo.id}>
                  {polo.nome}
                </option>
              ))}
            </select>

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

          <button
            disabled={criando}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {criando ? "Criando..." : "Criar professor"}
          </button>
        </form>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-semibold">Lista de professores</h2>

            <input
              type="text"
              placeholder="Buscar por nome, email, CPF, telefone, código, especialidade ou polo"
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

                      <select
                        value={editPoloId}
                        onChange={(e) => setEditPoloId(e.target.value)}
                        className="rounded border p-2"
                      >
                        <option value="">Selecione o polo</option>
                        {polos.map((polo) => (
                          <option key={polo.id} value={polo.id}>
                            {polo.nome}
                          </option>
                        ))}
                      </select>

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
                        disabled={salvandoId === p.id}
                        className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
                      >
                        {salvandoId === p.id ? "Salvando..." : "Salvar"}
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
                    <p className="text-sm text-gray-600">
                      Polo: {p.polo?.nome || "-"}
                    </p>
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
                        onClick={() => setProfessorParaExcluir(p)}
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

      {professorParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Confirmar exclusão
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tem certeza que deseja excluir o professor{" "}
                  <strong>"{professorParaExcluir.nome}"</strong>?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProfessorParaExcluir(null)}
                disabled={excluindoId === professorParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusaoProfessor}
                disabled={excluindoId === professorParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === professorParaExcluir.id
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(AdminProfessoresPage, ["admin"]);