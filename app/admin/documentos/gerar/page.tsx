"use client";

import { useEffect, useState } from "react";
import PhanyxToast from "@/components/ui/PhanyxToast";

type Template = {
  id: number;
  nome: string;
  tipo: string;
};

type Aluno = {
  id: number;
  nome: string;
};

type Matricula = {
  id: number;
  aluno?: {
    nome?: string | null;
  } | null;
};

function extrairLista<T>(data: any, chave: string): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[chave])) return data[chave];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function GerarDocumentoPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);

  const [templateId, setTemplateId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [matriculaId, setMatriculaId] = useState("");

  const [valor, setValor] = useState("");
  const [titulo, setTitulo] = useState("");

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [tRes, aRes, mRes] = await Promise.all([
        fetch("/api/admin/documentos/templates", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/aluno", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/matricula", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const tData = await tRes.json().catch(() => null);
      const aData = await aRes.json().catch(() => null);
      const mData = await mRes.json().catch(() => null);

      setTemplates(extrairLista<Template>(tData, "templates"));
      setAlunos(extrairLista<Aluno>(aData, "alunos"));
      setMatriculas(extrairLista<Matricula>(mData, "matriculas"));
    } catch (error) {
      console.error("Erro ao carregar dados", error);
      setTemplates([]);
      setAlunos([]);
      setMatriculas([]);
      setErro("Erro ao carregar dados para gerar documento.");
    }
  }

  async function gerarDocumento() {
    try {
      setLoading(true);
      setErro("");
      setResultado(null);

      if (!templateId) {
        setErro("Selecione um template antes de gerar o documento.");
        return;
      }

      const res = await fetch("/api/admin/documentos/gerar", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: Number(templateId),
          alunoId: alunoId ? Number(alunoId) : null,
          matriculaId: matriculaId ? Number(matriculaId) : null,
          valor: valor ? Number(valor) : null,
          titulo,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.error || "Erro ao gerar documento.");
        return;
      }

      setResultado(data);
    } catch (error) {
      console.error(error);
      setErro("Erro ao gerar documento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phanyx-docs-page space-y-6">
      <div>
        <h1 className="phanyx-doc-title text-2xl font-bold">
          📄 Gerar Documento
        </h1>

        <p className="phanyx-doc-muted mt-1 text-sm">
          Selecione o template e gere o documento com segurança.
        </p>
      </div>

      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo="Não foi possível gerar"
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      <div className="phanyx-doc-card space-y-4 p-6">
        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            Template
          </label>

          <select
            className="phanyx-doc-input"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">Selecione</option>

            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.tipo})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            Aluno
          </label>

          <select
            className="phanyx-doc-input"
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
          >
            <option value="">Selecione</option>

            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            Matrícula (opcional)
          </label>

          <select
            className="phanyx-doc-input"
            value={matriculaId}
            onChange={(e) => setMatriculaId(e.target.value)}
          >
            <option value="">Nenhuma</option>

            {matriculas.map((m) => (
              <option key={m.id} value={m.id}>
                #{m.id} - {m.aluno?.nome || "Aluno sem nome"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            Valor (opcional)
          </label>

          <input
            type="number"
            className="phanyx-doc-input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Ex.: 150.00"
          />
        </div>

        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            Título personalizado
          </label>

          <input
            className="phanyx-doc-input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Contrato educacional"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={gerarDocumento}
            disabled={loading}
            className="phanyx-doc-primary-action disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Gerando..." : "Gerar Documento"}
          </button>
        </div>
      </div>

      {resultado && (
        <div className="phanyx-doc-card space-y-4 p-6">
          <h2 className="phanyx-doc-section-title text-xl font-bold">
            Documento Gerado
          </h2>

          <p className="phanyx-doc-value">
            <b>ID:</b> {resultado.id || resultado.documento?.id || "-"}
          </p>

          <p className="phanyx-doc-value">
            <b>Título:</b>{" "}
            {resultado.titulo || resultado.documento?.titulo || "-"}
          </p>

          <p className="phanyx-doc-value">
            <b>Status:</b>{" "}
            {resultado.status || resultado.documento?.status || "-"}
          </p>

          <div className="phanyx-doc-preview whitespace-pre-wrap p-4 text-sm leading-7">
            {resultado.conteudo ||
              resultado.documento?.conteudo ||
              "Documento gerado, mas nenhum conteúdo foi retornado para pré-visualização."}
          </div>
        </div>
      )}
    </div>
  );
}