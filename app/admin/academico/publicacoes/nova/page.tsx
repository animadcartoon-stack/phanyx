"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";

type Opcao = {
  id: number;
  nome: string;
};

export default function NovaPublicacaoAcademicaPage() {
  const [professores, setProfessores] = useState<Opcao[]>([]);
  const [turmas, setTurmas] = useState<Opcao[]>([]);
  const [disciplinas, setDisciplinas] = useState<Opcao[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [professorResponsavelId, setProfessorResponsavelId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [prazo, setPrazo] = useState("");
  const [notaMaxima, setNotaMaxima] = useState("10");
  const [linkExterno, setLinkExterno] = useState("");
  const [publicarAgora, setPublicarAgora] = useState(true);

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState("");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarOpcoes() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/academico/publicacoes/nova", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar opções");
      }

      setProfessores(Array.isArray(data?.professores) ? data.professores : []);
      setTurmas(Array.isArray(data?.turmas) ? data.turmas : []);
      setDisciplinas(Array.isArray(data?.disciplinas) ? data.disciplinas : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar opções");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const res = await fetch("/api/admin/academico/publicacoes/nova", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descricao,
          professorResponsavelId,
          turmaId,
          disciplinaId,
          prazo,
          notaMaxima,
          linkExterno,
          publicarAgora,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar publicação");
      }

      const atividadeId = Number(data?.atividade?.id);

if (arquivos.length > 0) {
  if (!atividadeId || !Number.isFinite(atividadeId)) {
    throw new Error("Publicação criada, mas não foi possível anexar arquivos.");
  }

  setUploading(true);

  for (let i = 0; i < arquivos.length; i++) {
    const arquivo = arquivos[i];

    setProgressoUpload(`Enviando ${i + 1} de ${arquivos.length}: ${arquivo.name}`);

    await upload(arquivo.name, arquivo, {
      access: "public",
      handleUploadUrl: "/api/admin/academico/publicacoes/upload-url",
      clientPayload: JSON.stringify({
        atividadeId,
      }),
    });
  }

  setUploading(false);
  setProgressoUpload("");
}

      setMensagem(
        publicarAgora
          ? "Atividade publicada para os alunos com sucesso."
          : "Atividade criada e enviada para fila de publicação."
      );

      setTitulo("");
      setDescricao("");
      setProfessorResponsavelId("");
      setTurmaId("");
      setDisciplinaId("");
      setPrazo("");
      setNotaMaxima("10");
      setLinkExterno("");
      setPublicarAgora(true);
      setArquivos([]);
    } catch (e: any) {
      setErro(e?.message || "Erro ao criar publicação");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    carregarOpcoes();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Link
            href="/admin/academico/publicacoes"
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
          >
            ← Voltar para publicações
          </Link>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Apoio Docente
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            Nova publicação acadêmica
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Cadastre atividades, trabalhos, links ou orientações recebidas dos
            professores e publique na turma/disciplina correta.
          </p>
        </section>

        {mensagem && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Carregando dados...
          </div>
        ) : (
          <form
            onSubmit={salvar}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Título da atividade
                </label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Ex.: Estudo dirigido sobre..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Descrição / instruções do professor
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Digite as orientações que serão vistas pelos alunos..."
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Professor responsável
                </label>
                <select
                  value={professorResponsavelId}
                  onChange={(e) => setProfessorResponsavelId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                >
                  <option value="">Selecione</option>
                  {professores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Turma
                </label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                >
                  <option value="">Selecione</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Disciplina
                </label>
                <select
                  value={disciplinaId}
                  onChange={(e) => setDisciplinaId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Sem disciplina específica</option>
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Prazo
                </label>
                <input
                  type="datetime-local"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Nota máxima
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={notaMaxima}
                  onChange={(e) => setNotaMaxima(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              <div>
  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
    Link externo opcional
  </label>

  <input
    value={linkExterno}
    onChange={(e) => setLinkExterno(e.target.value)}
    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
    placeholder="https://..."
  />
</div>

<div className="md:col-span-2">
  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
    Arquivos da publicação
  </label>

  <input
    type="file"
    multiple
    onChange={(e) => {
      setArquivos(Array.from(e.target.files || []));
    }}
    className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
  />

  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
    Aceita PDF, imagens, vídeos, PowerPoint, Word, Excel, ZIP, Blender, Maya,
    After Effects e outros formatos comuns. Limite: 500 MB por arquivo.
  </p>

  {arquivos.length > 0 && (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        Arquivos selecionados
      </p>

      <div className="mt-2 space-y-2">
        {arquivos.map((arquivo) => (
          <div
            key={`${arquivo.name}-${arquivo.size}`}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {arquivo.name} — {(arquivo.size / 1024 / 1024).toFixed(2)} MB
          </div>
        ))}
      </div>
    </div>
  )}

  {progressoUpload && (
    <p className="mt-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
      {progressoUpload}
    </p>
  )}
</div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setPublicarAgora((v) => !v)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-800 dark:bg-slate-950"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Publicar imediatamente para os alunos
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Se desligado, ficará na fila aguardando publicação.
                    </p>
                  </div>

                  <span
                    className={`relative inline-flex h-7 w-12 rounded-full transition ${
                      publicarAgora ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                        publicarAgora ? "left-6" : "left-1"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/academico/publicacoes"
                className="inline-flex justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={salvando || uploading}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {salvando || uploading ? "Salvando..." : "Salvar publicação"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}