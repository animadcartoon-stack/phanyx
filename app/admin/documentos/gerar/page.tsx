"use client";

import { useEffect, useState } from "react";

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
  aluno: {
    nome: string;
  };
};

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

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [tRes, aRes, mRes] = await Promise.all([
        fetch("/api/admin/documentos/templates"),
        fetch("/api/admin/alunos"),
        fetch("/api/admin/matriculas"),
      ]);

      const tData = await tRes.json();
      const aData = await aRes.json();
      const mData = await mRes.json();

      setTemplates(tData);
      setAlunos(aData);
      setMatriculas(mData);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  }

  async function gerarDocumento() {
    try {
      setLoading(true);
      setResultado(null);

      const res = await fetch("/api/admin/documentos/gerar", {
        method: "POST",
        body: JSON.stringify({
          templateId: Number(templateId),
          alunoId: alunoId ? Number(alunoId) : null,
          matriculaId: matriculaId ? Number(matriculaId) : null,
          valor: valor ? Number(valor) : null,
          titulo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao gerar documento");
        return;
      }

      setResultado(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar documento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📄 Gerar Documento</h1>

      <div className="bg-white p-6 rounded shadow space-y-4">

        {/* TEMPLATE */}
        <div>
          <label className="block text-sm font-medium">Template</label>
          <select
            className="w-full border rounded p-2"
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

        {/* ALUNO */}
        <div>
          <label className="block text-sm font-medium">Aluno</label>
          <select
            className="w-full border rounded p-2"
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

        {/* MATRÍCULA */}
        <div>
          <label className="block text-sm font-medium">
            Matrícula (opcional)
          </label>
          <select
            className="w-full border rounded p-2"
            value={matriculaId}
            onChange={(e) => setMatriculaId(e.target.value)}
          >
            <option value="">Nenhuma</option>
            {matriculas.map((m) => (
              <option key={m.id} value={m.id}>
                #{m.id} - {m.aluno?.nome}
              </option>
            ))}
          </select>
        </div>

        {/* VALOR */}
        <div>
          <label className="block text-sm font-medium">
            Valor (opcional)
          </label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>

        {/* TÍTULO */}
        <div>
          <label className="block text-sm font-medium">
            Título personalizado
          </label>
          <input
            className="w-full border rounded p-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <button
          onClick={gerarDocumento}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Gerando..." : "Gerar Documento"}
        </button>
      </div>

      {/* RESULTADO */}
      {resultado && (
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-bold">Documento Gerado</h2>

          <p><b>ID:</b> {resultado.id}</p>
          <p><b>Título:</b> {resultado.titulo}</p>
          <p><b>Status:</b> {resultado.status}</p>

          <div className="border p-4 rounded bg-gray-50 whitespace-pre-wrap">
            {resultado.conteudo}
          </div>
        </div>
      )}
    </div>
  );
}