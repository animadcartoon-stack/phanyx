"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/lib/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";

type TipoDocumentoTemplate =
  | "CONTRATO"
  | "DECLARACAO"
  | "RECIBO"
  | "COMPROVANTE"
  | "TRANCAMENTO"
  | "COMPARECIMENTO"
  | "HISTORICO"
  | "OUTRO";

type TemplateDocumento = {
  id: number;
  nome: string;
  descricao?: string | null;
  tipo: TipoDocumentoTemplate;
  contexto?: string | null;
  conteudo: string;
  ativo: boolean;
  exigeAssinatura: boolean;
  camposVisuais?: CampoVisualContrato[] | null;
  criadoEm?: string;
  atualizadoEm?: string;
};

type CampoVisualContrato = {
  id: string;
  tipo: "ASSINATURA_DIRETOR";
  x: number;
  y: number;
  largura: number;
  altura: number;
  pagina: number;
};

type ConfiguracaoInstituicao = {
  certificadoAssinaturaUrl?: string | null;
};

const TIPOS_DOCUMENTO: Array<{
  value: TipoDocumentoTemplate;
  label: string;
}> = [
  { value: "CONTRATO", label: "Contrato" },
  { value: "DECLARACAO", label: "Declaração" },
  { value: "RECIBO", label: "Recibo" },
  { value: "COMPROVANTE", label: "Comprovante" },
  { value: "TRANCAMENTO", label: "Trancamento" },
  { value: "COMPARECIMENTO", label: "Comparecimento" },
  { value: "HISTORICO", label: "Histórico" },
  { value: "OUTRO", label: "Outro" },
];

const MODELO_INICIAL_CONTRATO = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

A instituição {{nomeInstituicao}}, inscrita no CNPJ {{cnpjInstituicao}}, neste ato representada por {{responsavelLegal}}, celebra contrato com o(a) aluno(a) {{nomeAluno}}, CPF {{cpfAluno}}, matrícula {{matriculaAluno}}, para o curso {{curso}}.

Disciplinas contratadas:
{{disciplinas}}

Valor contratado:
{{valorContrato}}

E por estarem de pleno acordo, firmam o presente contrato.

{{cidadeAssinatura}}, {{dataAtual}}.`;

const MODELO_INICIAL_DECLARACAO = `DECLARAÇÃO

Declaramos, para os devidos fins, que o(a) aluno(a) {{nomeAluno}}, matrícula {{matriculaAluno}}, encontra-se vinculado(a) à instituição {{nomeInstituicao}} no curso {{curso}}.

Documento emitido em {{dataAtual}}.

{{cidadeAssinatura}}.`;

function labelTipo(tipo: TipoDocumentoTemplate) {
  const item = TIPOS_DOCUMENTO.find((t) => t.value === tipo);
  return item?.label ?? tipo;
}

function templateInicialPorTipo(tipo: TipoDocumentoTemplate) {
  switch (tipo) {
    case "CONTRATO":
      return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

A instituição {{nomeInstituicao}}, inscrita no CNPJ {{cnpjInstituicao}}, neste ato representada por {{responsavelLegal}}, celebra o presente contrato com o(a) aluno(a) {{nomeAluno}}, CPF {{cpfAluno}}, matrícula {{matriculaAluno}}, regularmente matriculado(a) no curso {{curso}}.

DISCIPLINAS CONTRATADAS:
{{disciplinas}}

VALOR CONTRATADO:
{{valorContrato}}

O presente contrato regula a prestação dos serviços educacionais conforme as normas institucionais vigentes.

As partes declaram estar de pleno acordo com os termos estabelecidos.

{{cidadeAssinatura}}, {{dataAtual}}.

{{assinaturaDiretor}}
`;

    case "DECLARACAO":
      return `DECLARAÇÃO

Declaramos, para os devidos fins, que o(a) aluno(a) {{nomeAluno}}, inscrito(a) sob matrícula {{matriculaAluno}}, CPF {{cpfAluno}}, encontra-se regularmente vinculado(a) à instituição {{nomeInstituicao}}, no curso {{curso}}.

Esta declaração é emitida a pedido do(a) interessado(a) para os fins que se fizerem necessários.

Emitido em {{dataAtual}}.

{{cidadeAssinatura}}

{{assinaturaDiretor}}
`;

    case "RECIBO":
      return `RECIBO DE PAGAMENTO

Recebemos de {{nomeAluno}}, CPF {{cpfAluno}}, a quantia de {{valorContrato}}, referente a {{referenciaFinanceira}}.

Este recibo comprova a quitação do valor mencionado nesta data.

Emitido por {{nomeInstituicao}} em {{dataAtual}}.

{{cidadeAssinatura}}

{{assinaturaDiretor}}
`;

    case "COMPROVANTE":
      return `COMPROVANTE DE PAGAMENTO

Certificamos que foi identificado pagamento em nome de {{nomeAluno}}, matrícula {{matriculaAluno}}, no valor de {{valorContrato}}, referente a {{referenciaFinanceira}}.

Documento emitido para fins de comprovação financeira.

{{nomeInstituicao}}
{{dataAtual}}

{{assinaturaDiretor}}
`;

    case "TRANCAMENTO":
      return `DECLARAÇÃO DE TRANCAMENTO DE MATRÍCULA

Declaramos que a matrícula do(a) aluno(a) {{nomeAluno}}, matrícula {{matriculaAluno}}, CPF {{cpfAluno}}, vinculada ao curso {{curso}}, encontra-se oficialmente trancada conforme registro acadêmico institucional.

Este documento é emitido para fins comprobatórios.

Emitido em {{dataAtual}}.

{{cidadeAssinatura}}

{{assinaturaDiretor}}
`;

    case "COMPARECIMENTO":
      return `DECLARAÇÃO DE COMPARECIMENTO

Declaramos, para os devidos fins, que o(a) aluno(a) {{nomeAluno}}, matrícula {{matriculaAluno}}, compareceu à instituição {{nomeInstituicao}} na data de {{dataAtual}}.

Documento emitido para comprovação de comparecimento.

{{cidadeAssinatura}}

{{assinaturaDiretor}}
`;

    case "HISTORICO":
      return `HISTÓRICO ACADÊMICO

Aluno(a): {{nomeAluno}}
CPF: {{cpfAluno}}
Matrícula: {{matriculaAluno}}
Curso: {{curso}}

DISCIPLINAS:
{{disciplinas}}

Documento emitido em {{dataAtual}} por {{nomeInstituicao}}.

{{assinaturaDiretor}}
`;

    case "OUTRO":
    default:
      return `DOCUMENTO INSTITUCIONAL

Título: {{tituloDocumento}}

Aluno(a): {{nomeAluno}}
CPF: {{cpfAluno}}
Matrícula: {{matriculaAluno}}

Conteúdo personalizado.

Emitido em {{dataAtual}} por {{nomeInstituicao}}.

{{assinaturaDiretor}}
`;
  }
}

function formatarData(data?: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

function AdminDocumentosTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoDocumentoTemplate>("CONTRATO");
  const [contexto, setContexto] = useState("MATRICULA");
  const [conteudo, setConteudo] = useState(MODELO_INICIAL_CONTRATO);
  const [ativo, setAtivo] = useState(true);
  const [exigeAssinatura, setExigeAssinatura] = useState(true);
  const [camposVisuais, setCamposVisuais] = useState<CampoVisualContrato[]>([]);
  const [configInstituicao, setConfigInstituicao] =
  useState<ConfiguracaoInstituicao | null>(null);

  async function carregarTemplates() {
    try {
      setLoading(true);
      setMensagem("");

      const res = await fetch("/api/admin/documentos/templates", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar templates");
      }

      setTemplates(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      setTemplates([]);
      setMensagem(error?.message || "Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTemplates();
  }, []);

  useEffect(() => {
  async function carregarConfigInstituicao() {
    try {
      const res = await fetch("/api/admin/configuracoes/instituicao", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) {
        setConfigInstituicao(data);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração da instituição:", error);
    }
  }

  carregarConfigInstituicao();
}, []);

  function limparFormulario() {
    setEditingId(null);
    setNome("");
    setDescricao("");
    setTipo("CONTRATO");
    setContexto("MATRICULA");
    setConteudo(MODELO_INICIAL_CONTRATO);
    setAtivo(true);
    setExigeAssinatura(true);
    setCamposVisuais([]);
  }

  function preencherFormulario(template: TemplateDocumento) {
    setEditingId(template.id);
    setNome(template.nome || "");
    setDescricao(template.descricao || "");
    setTipo(template.tipo);
    setContexto(template.contexto || "");
    setConteudo(template.conteudo || "");
    setAtivo(Boolean(template.ativo));
    setExigeAssinatura(Boolean(template.exigeAssinatura));
    setCamposVisuais(Array.isArray(template.camposVisuais) ? template.camposVisuais : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarTemplate() {
    try {
      setSaving(true);
      setMensagem("");

      if (!nome.trim()) {
        setErro("Informe o nome do template.");
        return;
      }

      if (!tipo) {
        setErro("Selecione o tipo do template.");
        return;
      }

      if (!conteudo.trim()) {
        setErro("Informe o conteúdo do template.");
        return;
      }

      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        tipo,
        contexto: contexto.trim() || null,
        conteudo: conteudo.trim(),
        ativo,
        exigeAssinatura,
        camposVisuais,
        
      };

      const url = editingId
        ? `/api/admin/documentos/templates/${editingId}`
        : "/api/admin/documentos/templates";

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar template");
      }

      await carregarTemplates();
      limparFormulario();
      setMensagem(
        editingId
          ? "Template atualizado com sucesso!"
          : "Template criado com sucesso!"
      );
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  }

  async function excluirTemplate(id: number) {
    const confirmar = confirm(
      "Tem certeza que deseja excluir este template?"
    );

    if (!confirmar) return;

    try {
      setDeletingId(id);
      setMensagem("");

      const res = await fetch(`/api/admin/documentos/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir template");
      }

      if (editingId === id) {
        limparFormulario();
      }

      await carregarTemplates();
      setMensagem("Template excluído com sucesso!");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao excluir template");
    } finally {
      setDeletingId(null);
    }
  }

  async function alternarAtivo(template: TemplateDocumento) {
    try {
      setMensagem("");

      const res = await fetch(`/api/admin/documentos/templates/${template.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ativo: !template.ativo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao atualizar status");
      }

      await carregarTemplates();
      setMensagem("Status do template atualizado com sucesso!");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao atualizar status");
    }
  }

  const templatesFiltrados = useMemo(() => {
    return templates.filter((t) => {
      const termo = filtroBusca.trim().toLowerCase();

      const bateBusca =
        !termo ||
        t.nome?.toLowerCase().includes(termo) ||
        t.descricao?.toLowerCase().includes(termo) ||
        t.contexto?.toLowerCase().includes(termo) ||
        t.tipo?.toLowerCase().includes(termo);

      const bateTipo = !filtroTipo || t.tipo === filtroTipo;

      return bateBusca && bateTipo;
    });
  }, [templates, filtroBusca, filtroTipo]);

  function aplicarModeloInicial() {
  setConteudo(templateInicialPorTipo(tipo));
}

function trocarTipoDocumento(novoTipo: TipoDocumentoTemplate) {
  setTipo(novoTipo);
  setConteudo(templateInicialPorTipo(novoTipo));

  if (!nome.trim()) {
    setNome(`${labelTipo(novoTipo)} padrão`);
  }
}

function adicionarAssinaturaDiretor() {
  setCamposVisuais((atuais) => [
    ...atuais,
    {
      id: crypto.randomUUID(),
      tipo: "ASSINATURA_DIRETOR",
      x: 70,
      y: 18,
      largura: 180,
      altura: 55,
      pagina: 1,
    },
  ]);
}

function moverCampoVisual(id: string, x: number, y: number) {
  setCamposVisuais((atuais) =>
    atuais.map((campo) =>
      campo.id === id
        ? {
            ...campo,
            x: Math.max(0, x),
            y: Math.max(0, y),
          }
        : campo
    )
  );
}

  return (
  <div className="space-y-6">

    {erro && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Não foi possível salvar
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {erro}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setErro("")}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-200"
        >
          ×
        </button>
      </div>

      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        Preencha os campos obrigatórios antes de criar ou salvar o template.
      </div>

      <button
        type="button"
        onClick={() => setErro("")}
        className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
      >
        Entendi
      </button>
    </div>
  </div>
)}
      <div>
        <h1 className="text-2xl font-bold">📄 Templates de documentos</h1>
        <p className="mt-1 text-gray-600">
          Cadastre modelos dinâmicos de contrato, declaração, recibo,
          comprovante, trancamento e outros documentos institucionais.
        </p>
      </div>

      {mensagem ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-gray-700 shadow-sm">
          {mensagem}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Editar template" : "Novo template"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Defina o tipo, contexto, conteúdo e regras do documento.
                </p>
              </div>

              {editingId ? (
                <button
                  onClick={limparFormulario}
                  className="rounded-xl border px-3 py-2 text-sm hover:border-blue-400"
                >
                  Novo
                </button>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
  Nome
  <span className="group relative inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
    a
    <span className="pointer-events-none absolute left-6 top-0 z-50 hidden w-72 rounded-xl border bg-white p-3 text-xs font-normal leading-relaxed text-slate-700 shadow-lg group-hover:block">
      Este nome é apenas interno, para a equipe administrativa identificar o modelo depois.
      Ele não aparece no documento gerado para o aluno.
      <br />
      <br />
      Exemplos: Contrato de matrícula padrão, Declaração de vínculo, Recibo financeiro.
    </span>
  </span>
</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Ex.: Contrato de matrícula padrão"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Descrição opcional"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Tipo do documento
                  </label>
                  <select
  value={tipo}
  onChange={(e) =>
    trocarTipoDocumento(e.target.value as TipoDocumentoTemplate)
  }
  className="mt-1 w-full rounded-xl border px-3 py-2 bg-white"
>
                    {TIPOS_DOCUMENTO.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Contexto
                  </label>
                  <input
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    placeholder="Ex.: MATRICULA, FINANCEIRO, TRANCAMENTO"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                  Ativo
                </label>

                <label className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={exigeAssinatura}
                    onChange={(e) => setExigeAssinatura(e.target.checked)}
                  />
                  Exige assinatura
                </label>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-slate-800">
                      Variáveis dinâmicas
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">
                      Use estas marcações dentro do texto.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={aplicarModeloInicial}
                    className="rounded-xl border bg-white px-3 py-2 text-sm hover:border-blue-400"
                  >
                    Carregar modelo base
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {[
                    "{{nomeInstituicao}}",
                    "{{cnpjInstituicao}}",
                    "{{responsavelLegal}}",
                    "{{nomeAluno}}",
                    "{{cpfAluno}}",
                    "{{matriculaAluno}}",
                    "{{numeroMatricula}}",
                    "{{assinaturaDiretor}}",
                    "{{curso}}",
                    "{{disciplinas}}",
                    "{{valorContrato}}",
                    "{{cidadeAssinatura}}",
                    "{{dataAtual}}",
                    "{{referenciaFinanceira}}",
                    "{{tituloDocumento}}",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border bg-white px-3 py-1 text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Conteúdo do template
                </label>
                <textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="mt-1 min-h-[320px] w-full rounded-2xl border px-3 py-3 font-mono text-sm"
                  placeholder="Digite o conteúdo do documento com as variáveis dinâmicas..."
                />
              </div>

<div className="rounded-2xl border bg-slate-50 p-4">
  <div className="mb-3 flex items-center justify-between gap-3">
    <div>
      <h3 className="font-semibold text-slate-800">
        Campos visuais do contrato
      </h3>
      <p className="text-xs text-slate-600">
        Arraste a assinatura para o ponto desejado da página.
      </p>
    </div>

    <button
      type="button"
      onClick={adicionarAssinaturaDiretor}
      className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      🖋 Adicionar assinatura do diretor
    </button>
  </div>

  <div className="rounded-2xl border bg-white p-5">
  <div className="mx-auto w-full max-w-[520px] rounded-2xl border bg-slate-50 p-5">
    <div className="mb-3 text-sm font-semibold text-slate-800">
      Área real da assinatura do diretor
    </div>

    <div className="relative h-[150px] rounded-xl border bg-white">
      <div className="absolute left-10 right-10 top-[92px] border-t border-slate-700" />

      <div className="absolute left-10 top-[100px] text-xs text-slate-600">
        Nome do diretor/responsável
      </div>

      {camposVisuais.map((campo) => (
        <div
          key={campo.id}
          onMouseDown={(e) => {
            e.preventDefault();

            const elemento = e.currentTarget;
            const area = elemento.parentElement;
            if (!area) return;

            const areaRect = area.getBoundingClientRect();
            const elementoRect = elemento.getBoundingClientRect();

            const offsetX = e.clientX - elementoRect.left;
            const offsetY = e.clientY - elementoRect.top;

            function aoMover(ev: MouseEvent) {
              const novoX = ev.clientX - areaRect.left - offsetX;
              const novoY = ev.clientY - areaRect.top - offsetY;

              moverCampoVisual(campo.id, novoX, novoY);
            }

            function aoSoltar() {
              window.removeEventListener("mousemove", aoMover);
              window.removeEventListener("mouseup", aoSoltar);
            }

            window.addEventListener("mousemove", aoMover);
            window.addEventListener("mouseup", aoSoltar);
          }}
          className="absolute cursor-move select-none rounded border-2 border-blue-500 bg-blue-50/20"
          style={{
            left: campo.x,
            top: campo.y,
            width: campo.largura,
            height: campo.altura,
          }}
        >
          {configInstituicao?.certificadoAssinaturaUrl ? (
            <img
              src={configInstituicao.certificadoAssinaturaUrl}
              alt="Assinatura do diretor"
              className="h-full w-full object-contain pointer-events-none contrast-200 brightness-75 saturate-0"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-blue-400 bg-blue-50 text-center text-[9px] font-semibold text-blue-700">
              🖋 Assinatura do diretor
            </div>
          )}

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();

              const inicioX = e.clientX;
              const inicioY = e.clientY;
              const larguraInicial = campo.largura;
              const alturaInicial = campo.altura;

              function aoMover(ev: MouseEvent) {
                const novaLargura = Math.max(
                  60,
                  larguraInicial + (ev.clientX - inicioX)
                );

                const novaAltura = Math.max(
                  20,
                  alturaInicial + (ev.clientY - inicioY)
                );

                setCamposVisuais((atuais) =>
                  atuais.map((item) =>
                    item.id === campo.id
                      ? {
                          ...item,
                          largura: novaLargura,
                          altura: novaAltura,
                        }
                      : item
                  )
                );
              }

              function aoSoltar() {
                window.removeEventListener("mousemove", aoMover);
                window.removeEventListener("mouseup", aoSoltar);
              }

              window.addEventListener("mousemove", aoMover);
              window.addEventListener("mouseup", aoSoltar);
            }}
            className="absolute -bottom-2 -right-2 h-5 w-5 cursor-se-resize rounded-full border-2 border-blue-700 bg-white shadow"
            title="Redimensionar assinatura"
          />
        </div>
      ))}
    </div>

    <p className="mt-3 text-xs text-slate-500">
      Posicione a assinatura exatamente como ela deverá aparecer sobre a linha do diretor no contrato.
    </p>
  </div>
</div>
</div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={salvarTemplate}
                  disabled={saving}
                  className={[
                    "rounded-xl px-4 py-2 font-semibold text-white",
                    saving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700",
                  ].join(" ")}
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                    ? "Salvar alterações"
                    : "Criar template"}
                </button>

                <button
                  onClick={limparFormulario}
                  type="button"
                  className="rounded-xl border px-4 py-2 hover:border-blue-400"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Templates cadastrados</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Gerencie os modelos documentais da instituição.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                    className="rounded-xl border px-3 py-2"
                    placeholder="Buscar por nome, contexto ou tipo"
                  />

                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="rounded-xl border px-3 py-2 bg-white"
                  >
                    <option value="">Todos os tipos</option>
                    {TIPOS_DOCUMENTO.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={carregarTemplates}
                    className="rounded-xl border px-3 py-2 hover:border-blue-400"
                  >
                    Recarregar
                  </button>

                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-gray-600">Carregando templates...</div>
            ) : templatesFiltrados.length === 0 ? (
              <div className="p-6 text-gray-600">
                Nenhum template encontrado.
              </div>
            ) : (
              <div className="divide-y">
                {templatesFiltrados.map((template) => (
                  <div key={template.id} className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {template.nome}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                            {labelTipo(template.tipo)}
                          </span>

                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs",
                              template.ativo
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700",
                            ].join(" ")}
                          >
                            {template.ativo ? "Ativo" : "Inativo"}
                          </span>

                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs",
                              template.exigeAssinatura
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700",
                            ].join(" ")}
                          >
                            {template.exigeAssinatura
                              ? "Com assinatura"
                              : "Sem assinatura"}
                          </span>
                        </div>

                        {template.descricao ? (
                          <p className="text-sm text-gray-600">
                            {template.descricao}
                          </p>
                        ) : null}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                          <div>
                            <p className="text-gray-500">Contexto</p>
                            <p className="font-medium text-gray-800">
                              {template.contexto || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500">Atualizado em</p>
                            <p className="font-medium text-gray-800">
                              {formatarData(template.atualizadoEm)}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border bg-slate-50 p-4">
                          <p className="mb-2 text-sm font-medium text-slate-700">
                            Prévia do conteúdo
                          </p>
                          <div className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs leading-6 text-slate-700">
                            {template.conteudo}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:w-[260px] xl:justify-end">
                        <button
                          onClick={() => preencherFormulario(template)}
                          className="rounded-xl border px-3 py-2 text-sm hover:border-blue-400 hover:text-blue-700"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => alternarAtivo(template)}
                          className="rounded-xl border px-3 py-2 text-sm hover:border-amber-400 hover:text-amber-700"
                        >
                          {template.ativo ? "Desativar" : "Ativar"}
                        </button>

                        <button
                          onClick={() => excluirTemplate(template.id)}
                          disabled={deletingId === template.id}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm",
                            deletingId === template.id
                              ? "cursor-not-allowed bg-gray-100 text-gray-400"
                              : "hover:border-red-400 hover:text-red-700",
                          ].join(" ")}
                        >
                          {deletingId === template.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminDocumentosTemplatesPage, ["admin"]);