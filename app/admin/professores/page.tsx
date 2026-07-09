"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";

interface Polo {
  id: number;
  nome: string;
  codigo?: string | null;
}

interface DisciplinaOpcao {
  id: number;
  nome: string;
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
  const [disciplinas, setDisciplinas] = useState<DisciplinaOpcao[]>([]);
  const [disciplinasAberto, setDisciplinasAberto] = useState(false);
  const [editDisciplinasAberto, setEditDisciplinasAberto] = useState(false);
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
  const [enviandoFotoPerfil, setEnviandoFotoPerfil] = useState(false);
  const [slug, setSlug] = useState("");
  const [poloId, setPoloId] = useState("");

  const [documentosProfessor, setDocumentosProfessor] = useState<
  { tipo: string; titulo: string; arquivo: File | null }[]
>([
  { tipo: "RG", titulo: "RG", arquivo: null },
  { tipo: "CPF", titulo: "CPF", arquivo: null },
  { tipo: "CNH", titulo: "CNH", arquivo: null },
  { tipo: "COMPROVANTE_RESIDENCIA", titulo: "Comprovante de residência", arquivo: null },
  { tipo: "CURRICULO", titulo: "Currículo", arquivo: null },
  { tipo: "PORTFOLIO", titulo: "Portfólio", arquivo: null },
  { tipo: "CERTIFICADOS", titulo: "Certificados", arquivo: null },
]);

const [linksPortfolioProfessor, setLinksPortfolioProfessor] = useState([
  { tipo: "LinkedIn", url: "" },
]);

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
  const [editEnviandoFotoPerfil, setEditEnviandoFotoPerfil] = useState(false);
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

  const FORMATOS_FOTO_PROFESSOR_ACEITOS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const TAMANHO_MAXIMO_FOTO_PROFESSOR_MB = 2;
const TAMANHO_MAXIMO_FOTO_PROFESSOR_BYTES =
  TAMANHO_MAXIMO_FOTO_PROFESSOR_MB * 1024 * 1024;

function validarFotoOficialProfessor(arquivo: File) {
  if (!FORMATOS_FOTO_PROFESSOR_ACEITOS.includes(arquivo.type)) {
    throw new Error(
      "Formato inválido. Envie uma foto em JPG, JPEG, PNG ou WEBP."
    );
  }

  if (arquivo.size > TAMANHO_MAXIMO_FOTO_PROFESSOR_BYTES) {
    throw new Error(
      `Foto muito grande. Envie uma foto com no máximo ${TAMANHO_MAXIMO_FOTO_PROFESSOR_MB} MB. Recomendado: imagem quadrada, no mínimo 600x600 px, com rosto centralizado.`
    );
  }
}

async function enviarFotoOficialProfessor(
  arquivo: File | null,
  modo: "CRIACAO" | "EDICAO"
) {
  if (!arquivo) return;

  try {
    validarFotoOficialProfessor(arquivo);

    if (modo === "CRIACAO") {
      setEnviandoFotoPerfil(true);
    } else {
      setEditEnviandoFotoPerfil(true);
    }

    const formData = new FormData();
    formData.append("file", arquivo);

    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao enviar foto.");
    }

    const url =
      data?.url ||
      data?.fileUrl ||
      data?.arquivoUrl ||
      data?.publicUrl;

    if (!url) {
      throw new Error("Upload realizado, mas a URL da foto não retornou.");
    }

    if (modo === "CRIACAO") {
      setFotoPerfil(url);
    } else {
      setEditFotoPerfil(url);
    }

    mostrarFeedback("sucesso", "Foto oficial do professor enviada com sucesso.");
  } catch (error: any) {
    mostrarFeedback(
      "erro",
      error?.message ||
        "Não foi possível enviar a foto. Verifique o formato e o tamanho do arquivo."
    );
  } finally {
    setEnviandoFotoPerfil(false);
    setEditEnviandoFotoPerfil(false);
  }
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

async function carregarDisciplinas() {
  const res = await fetch("/api/disciplina", {
    credentials: "include",
  });

  if (!res.ok) {
    console.error("Erro ao buscar disciplinas");
    setDisciplinas([]);
    return;
  }

  const data = await res.json();

  if (Array.isArray(data)) {
    setDisciplinas(data);
  } else {
    setDisciplinas([]);
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

      const professorIdCriado = Number(data?.id);

if (professorIdCriado) {
  for (const doc of documentosProfessor) {
    if (!doc.arquivo) continue;

    const formData = new FormData();
    formData.append("titulo", doc.titulo);
    formData.append("tipo", doc.tipo);
    formData.append("arquivo", doc.arquivo);

    await fetch(`/api/admin/professores/${professorIdCriado}/documentos`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  }

  for (const link of linksPortfolioProfessor) {
    if (!link.url.trim()) continue;

    await fetch(`/api/admin/professores/${professorIdCriado}/documentos`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo: link.tipo.toUpperCase(),
        titulo: link.tipo,
        url: link.url,
      }),
    });
  }
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
      setDocumentosProfessor((prev) =>
  prev.map((doc) => ({ ...doc, arquivo: null }))
);

setLinksPortfolioProfessor([{ tipo: "LinkedIn", url: "" }]);

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
carregarDisciplinas();
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
          className="space-y-4 rounded-lg border bg-white dark:bg-slate-950 p-6"
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

            <div>
  <label className="mb-1 block text-xs font-semibold text-slate-600">
    Data de nascimento
  </label>

  <input
    type="date"
    value={dataNascimento}
    onChange={(e) => setDataNascimento(e.target.value)}
    className="w-full rounded-lg border p-2"
  />
</div>

            <input
              placeholder="Titulação"
              value={titulacao}
              onChange={(e) => setTitulacao(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <div className="rounded-lg border p-2 md:col-span-2">
  <button
    type="button"
    onClick={() => setDisciplinasAberto((prev) => !prev)}
    className="flex w-full items-center justify-between text-left"
  >
    <span>
      {especialidade
        ? `Disciplinas: ${especialidade}`
        : "Selecionar disciplinas do professor"}
    </span>
    <span>{disciplinasAberto ? "▲" : "▼"}</span>
  </button>

  {disciplinasAberto && (
    <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
      {disciplinas.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma disciplina encontrada.</p>
      ) : (
        disciplinas.map((disciplina) => {
          const selecionadas = especialidade
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

          const checked = selecionadas.includes(disciplina.nome);

          return (
            <label
              key={disciplina.id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const novas = e.target.checked
                    ? [...selecionadas, disciplina.nome]
                    : selecionadas.filter((nome) => nome !== disciplina.nome);

                  setEspecialidade(novas.join(", "));
                }}
              />
              {disciplina.nome}
            </label>
          );
        })
      )}
    </div>
  )}
</div>

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

            <div className="phanyx-foto-oficial-card md:col-span-2">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
    <div className="phanyx-foto-oficial-preview">
      {fotoPerfil ? (
        <img
          src={fotoPerfil}
          alt={nome || "Foto oficial do professor"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-3xl font-black text-slate-400">
          {nome?.charAt(0)?.toUpperCase() || "P"}
        </span>
      )}
    </div>

    <div className="flex-1">
      <h3 className="phanyx-foto-oficial-titulo">
        Foto oficial do professor
      </h3>

      <p className="phanyx-foto-oficial-texto">
        Esta é a foto institucional usada em crachás, identificação, documentos e portal acadêmico.
      </p>

      <p className="phanyx-foto-oficial-ajuda">
        Formatos aceitos: JPG, JPEG, PNG ou WEBP. Tamanho máximo: 2 MB.
        Recomendado: foto quadrada, no mínimo 600x600 px, com rosto centralizado.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="phanyx-foto-oficial-botao">
          {enviandoFotoPerfil ? "Enviando..." : "Enviar foto"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            disabled={enviandoFotoPerfil}
            onChange={(e) =>
              enviarFotoOficialProfessor(e.target.files?.[0] || null, "CRIACAO")
            }
            className="hidden"
          />
        </label>

        {fotoPerfil && (
          <button
            type="button"
            onClick={() => setFotoPerfil("")}
            className="phanyx-foto-oficial-remover"
          >
            Remover foto
          </button>
        )}
      </div>
    </div>
  </div>
</div>

            <input
              placeholder="URL do documento"
              value={documentoUrl}
              onChange={(e) => setDocumentoUrl(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

<div className="phanyx-documentos-professor md:col-span-2 rounded-2xl border p-5 shadow-sm">
  <div className="mb-4">
    <h3 className="text-lg font-bold">
      📁 Documentos e Portfólio
    </h3>

    <p className="mt-2 text-sm font-medium">
      Envie documentos pessoais, currículo, certificados, portfólio e links profissionais.
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-2">
    {documentosProfessor.map((doc, index) => (
      <div
  key={doc.tipo}
  className="
    rounded-2xl
    border
    border-slate-300
    bg-white
    p-4
    shadow-sm

    dark:border-slate-700
    dark:bg-slate-900
  "
>
        <label className="mb-3 block text-sm font-semibold">
          {doc.titulo}
        </label>

        <input
          id={`arquivo-professor-${doc.tipo}`}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.psd,.ai,.eps,.svg,.blend,.fbx,.obj,.glb,.gltf,.ma,.mb,.max,.zip,.rar"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0] || null;

            setDocumentosProfessor((prev) =>
              prev.map((item, i) =>
                i === index ? { ...item, arquivo } : item
              )
            );
          }}
        />

        <label
          htmlFor={`arquivo-professor-${doc.tipo}`}
          className="phanyx-upload-funcionario"
        >
          <span>📎</span>
          <span>Selecionar arquivo</span>
        </label>

        {doc.arquivo && (
          <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {doc.arquivo.name}
          </p>
        )}

        {doc.tipo === "PORTFOLIO" && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-slate-100 p-3 dark:border-blue-900/60 dark:bg-slate-800">
            <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
              Links do portfólio
            </h4>

            <div className="space-y-3">
              {linksPortfolioProfessor.map((link, linkIndex) => (
                <div
                  key={linkIndex}
                  className="flex flex-col gap-2 md:flex-row md:items-center"
                >
                  <select
                    value={link.tipo}
                    onChange={(e) =>
                      setLinksPortfolioProfessor((prev) =>
                        prev.map((item, i) =>
                          i === linkIndex ? { ...item, tipo: e.target.value } : item
                        )
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white dark:bg-slate-950 p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-900 dark:text-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Behance">Behance</option>
                    <option value="ArtStation">ArtStation</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Vimeo">Vimeo</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Site">Site pessoal</option>
                    <option value="Outro">Outro</option>
                  </select>

                  <input
                    type="url"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) =>
                      setLinksPortfolioProfessor((prev) =>
                        prev.map((item, i) =>
                          i === linkIndex ? { ...item, url: e.target.value } : item
                        )
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white dark:bg-slate-950 p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-900 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setLinksPortfolioProfessor((prev) =>
                        prev.length === 1
                          ? prev
                          : prev.filter((_, i) => i !== linkIndex)
                      )
                    }
                    className="shrink-0 rounded-lg border border-red-300 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-800 dark:bg-slate-900 dark:text-red-300"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setLinksPortfolioProfessor((prev) => [
                  ...prev,
                  { tipo: "LinkedIn", url: "" },
                ])
              }
              className="mt-3 rounded-lg border border-blue-300 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-bold text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
            >
              + Adicionar link
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
</div>

          </div>

          <textarea
            placeholder="Mini bio"
            value={miniBio}
            onChange={(e) => setMiniBio(e.target.value)}
            className="min-h-[120px] w-full rounded-lg border p-2"
          />

          <button
            disabled={criando}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
            <div className="rounded-lg border bg-white dark:bg-slate-950 p-4 text-sm text-gray-600">
              Nenhum professor encontrado para essa busca.
            </div>
          ) : (
            professoresFiltrados.map((p) => (
              <div key={p.id} className="rounded-lg border bg-white dark:bg-slate-950 p-4">
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
                      <div>
  <label className="mb-1 block text-xs font-semibold text-slate-600">
    Data de nascimento
  </label>

  <input
    type="date"
    value={editDataNascimento}
    onChange={(e) => setEditDataNascimento(e.target.value)}
    className="w-full rounded border p-2"
  />
</div>
                      <input
                        value={editTitulacao}
                        onChange={(e) => setEditTitulacao(e.target.value)}
                        className="rounded border p-2"
                        placeholder="Titulação"
                      />
                      <div className="rounded border p-2 md:col-span-2">
  <button
    type="button"
    onClick={() => setEditDisciplinasAberto((prev) => !prev)}
    className="flex w-full items-center justify-between text-left"
  >
    <span>
      {editEspecialidade
        ? `Disciplinas: ${editEspecialidade}`
        : "Selecionar disciplinas do professor"}
    </span>
    <span>{editDisciplinasAberto ? "▲" : "▼"}</span>
  </button>

  {editDisciplinasAberto && (
    <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
      {disciplinas.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma disciplina encontrada.</p>
      ) : (
        disciplinas.map((disciplina) => {
          const selecionadas = editEspecialidade
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

          const checked = selecionadas.includes(disciplina.nome);

          return (
            <label
              key={disciplina.id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const novas = e.target.checked
                    ? [...selecionadas, disciplina.nome]
                    : selecionadas.filter((nome) => nome !== disciplina.nome);

                  setEditEspecialidade(novas.join(", "));
                }}
              />
              {disciplina.nome}
            </label>
          );
        })
      )}
    </div>
  )}
</div>
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
                      <div className="phanyx-foto-oficial-card md:col-span-2">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
    <div className="phanyx-foto-oficial-preview">
      {editFotoPerfil ? (
        <img
          src={editFotoPerfil}
          alt={editNome || "Foto oficial do professor"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-3xl font-black text-slate-400">
          {editNome?.charAt(0)?.toUpperCase() || "P"}
        </span>
      )}
    </div>

    <div className="flex-1">
      <h3 className="phanyx-foto-oficial-titulo">
        Foto oficial do professor
      </h3>

      <p className="phanyx-foto-oficial-texto">
        Foto controlada pela instituição e usada em crachás, identificação e documentos oficiais.
      </p>

      <p className="phanyx-foto-oficial-ajuda">
        Formatos aceitos: JPG, JPEG, PNG ou WEBP. Tamanho máximo: 2 MB.
        Recomendado: foto quadrada, no mínimo 600x600 px, com rosto centralizado.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="phanyx-foto-oficial-botao">
          {editEnviandoFotoPerfil ? "Enviando..." : "Trocar foto"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            disabled={editEnviandoFotoPerfil}
            onChange={(e) =>
              enviarFotoOficialProfessor(e.target.files?.[0] || null, "EDICAO")
            }
            className="hidden"
          />
        </label>

        {editFotoPerfil && (
          <button
            type="button"
            onClick={() => setEditFotoPerfil("")}
            className="phanyx-foto-oficial-remover"
          >
            Remover foto
          </button>
        )}
      </div>
    </div>
  </div>
</div>
                      <input
                        value={editDocumentoUrl}
                        onChange={(e) => setEditDocumentoUrl(e.target.value)}
                        className="rounded border p-2"
                        placeholder="URL do documento"
                      />

<div
  className="
    phanyx-documentos-professor
    md:col-span-2
    rounded-2xl
    border
    border-slate-300
    bg-white
    p-5
    shadow-sm
    dark:border-slate-700
    dark:bg-slate-900
  "
>
  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
    📁 Documentos e Portfólio
  </h3>

  <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
    Envie documentos pessoais, currículo, certificados, portfólio e links profissionais.
  </p>

  <div className="mt-4 grid gap-4 md:grid-cols-2">
    {documentosProfessor.map((doc, index) => (
      <div
        key={doc.tipo}
        className="rounded-2xl border p-4 shadow-sm"
      >
        <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {doc.titulo}
        </label>

        <input
          id={`edit-arquivo-professor-${doc.tipo}`}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.psd,.ai,.eps,.svg,.blend,.fbx,.obj,.glb,.gltf,.ma,.mb,.max,.zip,.rar"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0] || null;

            setDocumentosProfessor((prev) =>
              prev.map((item, i) =>
                i === index ? { ...item, arquivo } : item
              )
            );
          }}
        />

        <label
          htmlFor={`edit-arquivo-professor-${doc.tipo}`}
          className="phanyx-upload-funcionario"
        >
          <span>📎</span>
          <span>Selecionar arquivo</span>
        </label>

        {doc.arquivo && (
          <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {doc.arquivo.name}
          </p>
        )}
      </div>
    ))}
  </div>
</div>

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
                        className="rounded bg-green-600 px-3 py-1 text-slate-900 dark:text-white disabled:opacity-50"
                      >
                        {salvandoId === p.id ? "Salvando..." : "Salvar"}
                      </button>

                      <button
                        onClick={() => setEditandoId(null)}
                        className="rounded bg-gray-400 px-3 py-1 text-slate-900 dark:text-white"
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
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white dark:bg-slate-950 p-6 shadow-2xl">
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
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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