"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/lib/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type TipoDocumentoTemplate =
  | "CONTRATO"
  | "DECLARACAO"
  | "RECIBO"
  | "COMPROVANTE"
  | "TRANCAMENTO"
  | "COMPARECIMENTO"
  | "HISTORICO"

  | "HOLERITE"

  | "DOCUMENTO_RH"
  | "CONTRATO_TRABALHO"
  | "CONTRATO_EXPERIENCIA"
  | "TERMO_LGPD_RH"
  | "TERMO_EQUIPAMENTOS"

  | "ADMISSAO"
  | "DEMISSAO"
  | "PEDIDO_DEMISSAO"
  | "AVISO_PREVIO"
  | "TRCT"

  | "FERIAS"
  | "AVISO_FERIAS"
  | "RECIBO_FERIAS"

  | "ADVERTENCIA"
  | "SUSPENSAO"

  | "AFASTAMENTO_MEDICO"
  | "AFASTAMENTO_MATERNIDADE"
  | "AFASTAMENTO_PERICIA"
  | "RETORNO_TRABALHO"

  | "ASO"
  | "ASO_ADMISSIONAL"
  | "ASO_PERIODICO"
  | "ASO_RETORNO"
  | "ASO_MUDANCA_FUNCAO"
  | "ASO_DEMISSIONAL"

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
  { value: "CONTRATO", label: "Contrato acadêmico" },
  { value: "DECLARACAO", label: "Declaração" },
  { value: "RECIBO", label: "Recibo" },
  { value: "COMPROVANTE", label: "Comprovante" },
  { value: "TRANCAMENTO", label: "Trancamento" },
  { value: "COMPARECIMENTO", label: "Comparecimento" },
  { value: "HISTORICO", label: "Histórico acadêmico" },

  { value: "HOLERITE", label: "RH - Holerite" },

  { value: "DOCUMENTO_RH", label: "RH - Documento geral" },
  { value: "CONTRATO_TRABALHO", label: "RH - Contrato de trabalho" },
  { value: "CONTRATO_EXPERIENCIA", label: "RH - Contrato de experiência" },
  { value: "TERMO_LGPD_RH", label: "RH - Termo LGPD" },
  { value: "TERMO_EQUIPAMENTOS", label: "RH - Termo de uso de equipamentos" },

  { value: "ADMISSAO", label: "RH - Documento de admissão" },
  { value: "DEMISSAO", label: "RH - Documento de demissão" },
  { value: "PEDIDO_DEMISSAO", label: "RH - Pedido de demissão" },
  { value: "AVISO_PREVIO", label: "RH - Aviso prévio" },
  { value: "TRCT", label: "RH - TRCT" },

  { value: "FERIAS", label: "RH - Documento de férias" },
  { value: "AVISO_FERIAS", label: "RH - Aviso de férias" },
  { value: "RECIBO_FERIAS", label: "RH - Recibo de férias" },

  { value: "ADVERTENCIA", label: "RH - Advertência" },
  { value: "SUSPENSAO", label: "RH - Suspensão" },

  { value: "AFASTAMENTO_MEDICO", label: "RH - Afastamento médico" },
  { value: "AFASTAMENTO_MATERNIDADE", label: "RH - Afastamento maternidade" },
  { value: "AFASTAMENTO_PERICIA", label: "RH - Afastamento perícia" },
  { value: "RETORNO_TRABALHO", label: "RH - Retorno ao trabalho" },

  { value: "ASO", label: "RH - ASO geral" },
  { value: "ASO_ADMISSIONAL", label: "RH - ASO admissional" },
  { value: "ASO_PERIODICO", label: "RH - ASO periódico" },
  { value: "ASO_RETORNO", label: "RH - ASO retorno ao trabalho" },
  { value: "ASO_MUDANCA_FUNCAO", label: "RH - ASO mudança de função" },
  { value: "ASO_DEMISSIONAL", label: "RH - ASO demissional" },

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

{{blocoAssinaturaDiretor}}
`;

    case "DECLARACAO":
      return `DECLARAÇÃO

Declaramos, para os devidos fins, que o(a) aluno(a) {{nomeAluno}}, inscrito(a) sob matrícula {{matriculaAluno}}, CPF {{cpfAluno}}, encontra-se regularmente vinculado(a) à instituição {{nomeInstituicao}}, no curso {{curso}}.

Esta declaração é emitida a pedido do(a) interessado(a) para os fins que se fizerem necessários.

Emitido em {{dataAtual}}.

{{cidadeAssinatura}}

{{assinaturaDiretor}}

{{blocoAssinaturaDiretor}}
`;

    case "RECIBO":
      return `RECIBO DE PAGAMENTO

Recebemos de {{nomeAluno}}, CPF {{cpfAluno}}, a quantia de {{valorContrato}}, referente a {{referenciaFinanceira}}.

Este recibo comprova a quitação do valor mencionado nesta data.

Emitido por {{nomeInstituicao}} em {{dataAtual}}.

{{cidadeAssinatura}}

{{assinaturaDiretor}}

{{blocoAssinaturaDiretor}}
`;

    case "COMPROVANTE":
      return `COMPROVANTE DE PAGAMENTO

Certificamos que foi identificado pagamento em nome de {{nomeAluno}}, matrícula {{matriculaAluno}}, no valor de {{valorContrato}}, referente a {{referenciaFinanceira}}.

Documento emitido para fins de comprovação financeira.

{{nomeInstituicao}}
{{dataAtual}}

{{assinaturaDiretor}}

{{blocoAssinaturaDiretor}}
`;

    case "TRANCAMENTO":
      return `DECLARAÇÃO DE TRANCAMENTO DE MATRÍCULA

Declaramos que a matrícula do(a) aluno(a) {{nomeAluno}}, matrícula {{matriculaAluno}}, CPF {{cpfAluno}}, vinculada ao curso {{curso}}, encontra-se oficialmente trancada conforme registro acadêmico institucional.

Este documento é emitido para fins comprobatórios.

Emitido em {{dataAtual}}.

{{cidadeAssinatura}}

{{assinaturaDiretor}}

{{blocoAssinaturaDiretor}}
`;

    case "COMPARECIMENTO":
      return `DECLARAÇÃO DE COMPARECIMENTO

Declaramos, para os devidos fins, que o(a) aluno(a) {{nomeAluno}}, matrícula {{matriculaAluno}}, compareceu à instituição {{nomeInstituicao}} na data de {{dataAtual}}.

Documento emitido para comprovação de comparecimento.

{{cidadeAssinatura}}

{{assinaturaDiretor}}

{{blocoAssinaturaDiretor}}
`;

    case "HISTORICO":
      return `[CABEÇALHO INSTITUCIONAL]

{{blocoInstituicao}}

[TÍTULO]

HISTÓRICO ACADÊMICO ESCOLAR

[DADOS DO ALUNO]

Aluno(a): {{nomeAluno}}
CPF: {{cpfAluno}}
Matrícula: {{matriculaAluno}}
Status do aluno: {{statusAluno}}

[DADOS DA MATRÍCULA]

Curso: {{curso}}
Status da matrícula: {{statusMatricula}}
Data da matrícula: {{dataMatricula}}
Data de conclusão: {{dataConclusao}}
Semestre atual: {{semestreAtual}}
Carga horária do curso: {{cargaHorariaCurso}}
Percentual de conclusão: {{percentualConclusao}}

[DADOS DO POLO]

{{blocoPolo}}

[COMPONENTES CURRICULARES]

{{disciplinas}}

[OBSERVAÇÕES]

Documento emitido em {{dataAtual}} por {{nomeInstituicao}}.

Este histórico acadêmico foi emitido eletronicamente pelo PHANYX com base nos registros acadêmicos da instituição.

[ASSINATURA INSTITUCIONAL]

{{assinaturaDiretor}}

{{blocoAssinaturaDiretor}}

[RODAPÉ]

{{nomeInstituicao}} - CNPJ {{cnpjInstituicao}}
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

{{blocoAssinaturaDiretor}}
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
  const [templateParaExcluir, setTemplateParaExcluir] = useState<number | null>(null);

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
  const [buscaVariavel, setBuscaVariavel] = useState("");
  const [mostrarTodasVariaveis, setMostrarTodasVariaveis] = useState(false);

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
      setMensagem(
  `Erro ao excluir template: ${error?.message || "Erro desconhecido"}`
);
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

  async function visualizarPdfTemplate() {
  try {
    const res = await fetch("/api/admin/documentos/templates/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        tipo,
        conteudo,
      }),
    });

    if (!res.ok) {
      throw new Error("Não foi possível gerar a prévia.");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (error: any) {
    setErro(error?.message || "Erro ao visualizar PDF.");
  }
}

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

const todasAsTags = [
  "{{logoInstituicao}}",
  "{{nomeInstituicao}}",
  "{{cnpjInstituicao}}",
  "{{enderecoInstituicao}}",
  "{{telefoneInstituicao}}",
  "{{emailInstituicao}}",
  "{{cidadeInstituicao}}",
  "{{estadoInstituicao}}",
  "{{cepInstituicao}}",
  "{{blocoInstituicao}}",

  "{{dataInicioAluno}}",
  "{{dataConclusaoAluno}}",
  "{{cargaHorariaMinimaCurso}}",
  "{{cargaHorariaMaximaCurso}}",

  "{{dataEmissao}}",
  "{{horaEmissao}}",
  "{{dataHoraEmissao}}",
  "{{numeroDocumento}}",

  "{{nomePolo}}",
  "{{enderecoPolo}}",
  "{{telefonePolo}}",
  "{{emailPolo}}",
  "{{cidadePolo}}",
  "{{estadoPolo}}",
  "{{cepPolo}}",
  "{{blocoPolo}}",

  "{{responsavelLegal}}",
  "{{nomeAluno}}",
  "{{cpfAluno}}",
  "{{matriculaAluno}}",
  "{{statusAluno}}",
  "{{statusMatricula}}",
  "{{dataMatricula}}",
  "{{dataConclusao}}",
  "{{semestreAtual}}",
  "{{cargaHorariaCurso}}",
  "{{percentualConclusao}}",
  "{{numeroMatricula}}",
  "{{assinaturaDiretor}}",
  "{{blocoAssinaturaDiretor}}",
  "{{curso}}",
  "{{disciplinas}}",
  "{{valorContrato}}",
  "{{cidadeAssinatura}}",
  "{{dataAtual}}",
  "{{referenciaFinanceira}}",
  "{{tituloDocumento}}",

  "{{codigoValidacao}}",
  "{{urlValidacao}}",

  "{{atoLegalCriacao}}",
  "{{numeroAutorizacaoCurso}}",
  "{{dataPublicacaoAutorizacao}}",
  "{{diarioOficialAutorizacao}}",

  "{{naturalidadeAluno}}",
  "{{nacionalidadeAluno}}",
  "{{sexoAluno}}",
  "{{rgAluno}}",
  "{{orgaoExpedidorAluno}}",
  "{{dataNascimentoAluno}}",
  "{{formaIngressoAluno}}",
  "{{curriculoAluno}}",
  "{{situacaoAcademicaAluno}}",

  "{{haMaximaCurso}}",
  "{{haTotalCursada}}",
  "{{haTotalAprovada}}",
  "{{indiceAproveitamentoSemestral}}",
  "{{indiceAproveitamentoAcumulado}}",
  "{{indiceAproveitamentoAprovadas}}",
  "{{prazoIntegralizacao}}",
  "{{semestresCursados}}",
  "{{semestresRevalidados}}",
  "{{provavelSemestreFormatura}}",

  "{{disciplinasPorSemestre}}",
  "{{disciplinasBaseNacionalComum}}",
  "{{disciplinasParteDiversificada}}",
  "{{totalAulasBaseNacionalComum}}",
  "{{totalAulasParteDiversificada}}",
  "{{totalCargaHorariaAnualAulas}}",
  "{{totalCargaHorariaAnualHoras}}",

  "{{observacoesHistorico}}",
  "{{legendaHistorico}}",
  "{{certificacaoDeclaracao}}",
  "{{escolaOrigem}}",
];

const descricoesVariaveis: Record<
  string,
  {
    titulo: string;
    descricao: string;
    ondeUsar: string;
    palavras: string[];
  }
> = {
  "{{logoInstituicao}}": {
    titulo: "Logo da instituição",
    descricao: "Insere a logo cadastrada da instituição.",
    ondeUsar: "Cabeçalhos de históricos, certificados e documentos oficiais.",
    palavras: ["logo", "marca", "brasão", "imagem da escola", "logo da escola", "logo da faculdade"],
  },
  "{{nomeInstituicao}}": {
    titulo: "Nome da instituição",
    descricao: "Mostra o nome fantasia da instituição cadastrada.",
    ondeUsar: "Cabeçalhos, rodapés, contratos, declarações e históricos.",
    palavras: ["nome da escola", "nome da faculdade", "instituição", "faculdade", "escola"],
  },
  "{{cnpjInstituicao}}": {
    titulo: "CNPJ da instituição",
    descricao: "Mostra o CNPJ cadastrado da instituição.",
    ondeUsar: "Contratos, recibos, históricos, certificados e rodapés.",
    palavras: ["cnpj", "cnpj da escola", "cnpj da faculdade", "documento da instituição"],
  },
  "{{enderecoInstituicao}}": {
    titulo: "Endereço da instituição",
    descricao: "Mostra o endereço completo cadastrado da instituição.",
    ondeUsar: "Cabeçalhos, contratos, declarações e rodapés.",
    palavras: ["endereço", "rua", "local da escola", "localização"],
  },
  "{{telefoneInstituicao}}": {
    titulo: "Telefone da instituição",
    descricao: "Mostra o telefone cadastrado da instituição.",
    ondeUsar: "Cabeçalhos, contratos e rodapés.",
    palavras: ["telefone", "contato", "whatsapp", "número da escola"],
  },
  "{{emailInstituicao}}": {
    titulo: "E-mail da instituição",
    descricao: "Mostra o e-mail institucional cadastrado.",
    ondeUsar: "Cabeçalhos, contratos e rodapés.",
    palavras: ["email", "e-mail", "contato", "email da escola"],
  },
  "{{cidadeInstituicao}}": {
    titulo: "Cidade da instituição",
    descricao: "Mostra a cidade cadastrada da instituição.",
    ondeUsar: "Cabeçalhos, declarações, contratos e assinaturas.",
    palavras: ["cidade", "município", "cidade da escola"],
  },
  "{{estadoInstituicao}}": {
    titulo: "Estado da instituição",
    descricao: "Mostra o estado/UF cadastrado da instituição.",
    ondeUsar: "Cabeçalhos, contratos e documentos oficiais.",
    palavras: ["estado", "uf", "estado da escola"],
  },
  "{{cepInstituicao}}": {
    titulo: "CEP da instituição",
    descricao: "Mostra o CEP cadastrado da instituição.",
    ondeUsar: "Cabeçalhos, contratos e documentos oficiais.",
    palavras: ["cep", "código postal"],
  },
  "{{blocoInstituicao}}": {
    titulo: "Bloco completo da instituição",
    descricao: "Insere nome, CNPJ, endereço, telefone e e-mail da instituição.",
    ondeUsar: "Cabeçalho de históricos, contratos, declarações e documentos oficiais.",
    palavras: ["dados da escola", "dados da instituição", "cabeçalho", "bloco da escola"],
  },

  "{{nomeAluno}}": {
    titulo: "Nome do aluno",
    descricao: "Mostra o nome completo do aluno cadastrado.",
    ondeUsar: "Todos os documentos acadêmicos.",
    palavras: ["aluno", "estudante", "nome do aluno", "nome estudante"],
  },
  "{{cpfAluno}}": {
    titulo: "CPF do aluno",
    descricao: "Mostra o CPF cadastrado no perfil do aluno.",
    ondeUsar: "Contratos, históricos, certificados e declarações.",
    palavras: ["cpf", "cpf estudante", "documento do aluno"],
  },
  "{{rgAluno}}": {
    titulo: "RG do aluno",
    descricao: "Mostra o RG cadastrado do aluno.",
    ondeUsar: "Históricos, declarações e documentos oficiais.",
    palavras: ["rg", "identidade", "documento identidade"],
  },
  "{{orgaoExpedidorAluno}}": {
    titulo: "Órgão expedidor do aluno",
    descricao: "Mostra o órgão expedidor do RG do aluno.",
    ondeUsar: "Históricos e documentos oficiais.",
    palavras: ["órgão expedidor", "orgao expedidor", "rg"],
  },
  "{{dataNascimentoAluno}}": {
    titulo: "Data de nascimento do aluno",
    descricao: "Mostra a data de nascimento cadastrada do aluno.",
    ondeUsar: "Históricos, declarações e documentos oficiais.",
    palavras: ["nascimento", "data nascimento", "idade"],
  },
  "{{naturalidadeAluno}}": {
    titulo: "Naturalidade do aluno",
    descricao: "Mostra a cidade/estado de naturalidade do aluno.",
    ondeUsar: "Históricos acadêmicos e documentos oficiais.",
    palavras: ["naturalidade", "cidade natal"],
  },
  "{{nacionalidadeAluno}}": {
    titulo: "Nacionalidade do aluno",
    descricao: "Mostra a nacionalidade cadastrada do aluno.",
    ondeUsar: "Históricos acadêmicos e documentos oficiais.",
    palavras: ["nacionalidade", "país", "brasileiro"],
  },
  "{{sexoAluno}}": {
    titulo: "Sexo do aluno",
    descricao: "Mostra o sexo cadastrado do aluno.",
    ondeUsar: "Históricos e documentos oficiais quando necessário.",
    palavras: ["sexo", "gênero"],
  },

  "{{matriculaAluno}}": {
    titulo: "Matrícula do aluno",
    descricao: "Mostra o número de matrícula do aluno.",
    ondeUsar: "Históricos, contratos, certificados e declarações.",
    palavras: ["matrícula", "numero da matrícula", "registro acadêmico"],
  },
  "{{numeroMatricula}}": {
    titulo: "Número da matrícula",
    descricao: "Mostra o número de matrícula do aluno.",
    ondeUsar: "Históricos e documentos acadêmicos.",
    palavras: ["número matrícula", "matrícula", "registro"],
  },
  "{{statusAluno}}": {
    titulo: "Status do aluno",
    descricao: "Mostra a situação cadastral do aluno.",
    ondeUsar: "Históricos, declarações e relatórios acadêmicos.",
    palavras: ["status", "situação do aluno", "ativo", "inativo", "concluído"],
  },
  "{{statusMatricula}}": {
    titulo: "Status da matrícula",
    descricao: "Mostra a situação da matrícula no curso.",
    ondeUsar: "Históricos, contratos e declarações.",
    palavras: ["status matrícula", "situação matrícula", "ativa", "desistência", "trancada"],
  },
  "{{dataMatricula}}": {
    titulo: "Data da matrícula",
    descricao: "Mostra a data em que a matrícula foi criada.",
    ondeUsar: "Contratos, históricos e declarações.",
    palavras: ["data matrícula", "ingresso", "entrada"],
  },
  "{{dataInicioAluno}}": {
    titulo: "Data de início do aluno",
    descricao: "Mostra a data de início/ingresso do aluno.",
    ondeUsar: "Históricos, contratos e declarações.",
    palavras: ["data início", "começou", "ingresso", "entrada"],
  },
  "{{dataConclusao}}": {
    titulo: "Data de conclusão",
    descricao: "Mostra a data de conclusão da matrícula quando houver.",
    ondeUsar: "Históricos, certificados e declarações.",
    palavras: ["conclusão", "finalizou", "terminou"],
  },
  "{{dataConclusaoAluno}}": {
    titulo: "Data de conclusão do aluno",
    descricao: "Mostra a data de conclusão do aluno no curso.",
    ondeUsar: "Históricos, certificados e declarações.",
    palavras: ["data conclusão", "conclusão do curso", "formatura"],
  },

  "{{curso}}": {
    titulo: "Nome do curso",
    descricao: "Mostra o curso vinculado ao aluno.",
    ondeUsar: "Históricos, certificados, contratos e declarações.",
    palavras: ["curso", "nome do curso", "bacharelado", "graduação", "teologia"],
  },
  "{{semestreAtual}}": {
    titulo: "Semestre atual",
    descricao: "Mostra o semestre atual do aluno no curso.",
    ondeUsar: "Históricos e relatórios acadêmicos.",
    palavras: ["semestre", "período", "fase atual"],
  },
  "{{cargaHorariaCurso}}": {
    titulo: "Carga horária do curso",
    descricao: "Mostra a carga horária total cadastrada para o curso.",
    ondeUsar: "Históricos, certificados e declarações.",
    palavras: ["carga horária", "horas do curso", "total de horas"],
  },
  "{{cargaHorariaMinimaCurso}}": {
    titulo: "Carga horária mínima do curso",
    descricao: "Mostra a carga horária mínima exigida do curso.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["carga mínima", "horas mínimas"],
  },
  "{{cargaHorariaMaximaCurso}}": {
    titulo: "Carga horária máxima do curso",
    descricao: "Mostra a carga horária máxima prevista do curso.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["carga máxima", "horas máximas"],
  },
  "{{percentualConclusao}}": {
    titulo: "Percentual de conclusão",
    descricao: "Mostra o percentual de conclusão do curso/matrícula.",
    ondeUsar: "Históricos e relatórios acadêmicos.",
    palavras: ["percentual", "progresso", "conclusão", "andamento"],
  },
  "{{curriculoAluno}}": {
    titulo: "Currículo do aluno",
    descricao: "Mostra o currículo ou grade curricular vinculada ao aluno.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["currículo", "grade", "matriz curricular"],
  },
  "{{formaIngressoAluno}}": {
    titulo: "Forma de ingresso",
    descricao: "Mostra como o aluno ingressou no curso.",
    ondeUsar: "Históricos e documentos acadêmicos.",
    palavras: ["forma ingresso", "entrada", "vestibular", "transferência"],
  },
  "{{situacaoAcademicaAluno}}": {
    titulo: "Situação acadêmica",
    descricao: "Mostra a situação acadêmica do aluno.",
    ondeUsar: "Históricos e declarações.",
    palavras: ["situação acadêmica", "status acadêmico", "ativo", "concluído"],
  },

  "{{disciplinas}}": {
    titulo: "Lista de disciplinas",
    descricao: "Lista as disciplinas vinculadas ao aluno ou matrícula.",
    ondeUsar: "Históricos, contratos e declarações acadêmicas.",
    palavras: ["disciplinas", "matérias", "componentes curriculares", "grade"],
  },
  "{{disciplinasPorSemestre}}": {
    titulo: "Disciplinas por semestre",
    descricao: "Lista as disciplinas organizadas por semestre/período.",
    ondeUsar: "Históricos acadêmicos de faculdade ou curso superior.",
    palavras: ["disciplinas semestre", "matérias por período", "grade por semestre"],
  },
  "{{disciplinasBaseNacionalComum}}": {
    titulo: "Disciplinas da Base Nacional Comum",
    descricao: "Lista disciplinas da Base Nacional Comum.",
    ondeUsar: "Históricos do ensino fundamental e médio.",
    palavras: ["base nacional", "bncc", "ensino médio", "ensino fundamental"],
  },
  "{{disciplinasParteDiversificada}}": {
    titulo: "Disciplinas da Parte Diversificada",
    descricao: "Lista disciplinas da parte diversificada do currículo.",
    ondeUsar: "Históricos do ensino fundamental e médio.",
    palavras: ["parte diversificada", "currículo", "ensino médio"],
  },

  "{{haMaximaCurso}}": {
    titulo: "H/A máxima do curso",
    descricao: "Mostra a carga horária/aulas máxima do curso.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["ha máxima", "hora aula máxima", "carga máxima"],
  },
  "{{haTotalCursada}}": {
    titulo: "H/A total cursada",
    descricao: "Mostra o total de horas/aula cursadas pelo aluno.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["horas cursadas", "ha cursada", "total cursado"],
  },
  "{{haTotalAprovada}}": {
    titulo: "H/A total aprovada",
    descricao: "Mostra o total de horas/aula aprovadas pelo aluno.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["horas aprovadas", "ha aprovada", "total aprovado"],
  },
  "{{indiceAproveitamentoSemestral}}": {
    titulo: "Índice de aproveitamento semestral",
    descricao: "Mostra o índice de aproveitamento do semestre.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["ia", "índice", "aproveitamento semestral"],
  },
  "{{indiceAproveitamentoAcumulado}}": {
    titulo: "Índice de aproveitamento acumulado",
    descricao: "Mostra o índice de aproveitamento acumulado do aluno.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["iaa", "aproveitamento acumulado"],
  },
  "{{indiceAproveitamentoAprovadas}}": {
    titulo: "Índice de aproveitamento das aprovadas",
    descricao: "Mostra o índice considerando disciplinas aprovadas.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["iap", "aprovadas", "índice aprovadas"],
  },
  "{{prazoIntegralizacao}}": {
    titulo: "Prazo de integralização",
    descricao: "Mostra o prazo previsto para integralização do curso.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["integralização", "prazo", "concluir curso"],
  },
  "{{semestresCursados}}": {
    titulo: "Semestres cursados",
    descricao: "Mostra a quantidade de semestres cursados pelo aluno.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["semestres cursados", "períodos cursados"],
  },
  "{{semestresRevalidados}}": {
    titulo: "Semestres revalidados",
    descricao: "Mostra semestres aproveitados ou revalidados.",
    ondeUsar: "Históricos acadêmicos.",
    palavras: ["revalidados", "aproveitamento", "semestres aproveitados"],
  },
  "{{provavelSemestreFormatura}}": {
    titulo: "Provável semestre de formatura",
    descricao: "Mostra o semestre previsto para conclusão/formatura.",
    ondeUsar: "Históricos e relatórios acadêmicos.",
    palavras: ["formatura", "previsão conclusão", "provável formatura"],
  },

  "{{nomePolo}}": {
    titulo: "Nome do polo",
    descricao: "Mostra o nome do polo/unidade vinculada ao aluno.",
    ondeUsar: "Históricos, contratos e declarações.",
    palavras: ["polo", "unidade", "campus"],
  },
  "{{enderecoPolo}}": {
    titulo: "Endereço do polo",
    descricao: "Mostra o endereço cadastrado do polo.",
    ondeUsar: "Documentos por unidade, polo ou campus.",
    palavras: ["endereço polo", "unidade", "campus"],
  },
  "{{telefonePolo}}": {
    titulo: "Telefone do polo",
    descricao: "Mostra o telefone cadastrado do polo.",
    ondeUsar: "Cabeçalhos e documentos por polo.",
    palavras: ["telefone polo", "contato polo"],
  },
  "{{emailPolo}}": {
    titulo: "E-mail do polo",
    descricao: "Mostra o e-mail cadastrado do polo.",
    ondeUsar: "Cabeçalhos e documentos por polo.",
    palavras: ["email polo", "contato polo"],
  },
  "{{cidadePolo}}": {
    titulo: "Cidade do polo",
    descricao: "Mostra a cidade cadastrada do polo.",
    ondeUsar: "Documentos por polo/unidade.",
    palavras: ["cidade polo", "município polo"],
  },
  "{{estadoPolo}}": {
    titulo: "Estado do polo",
    descricao: "Mostra o estado/UF do polo.",
    ondeUsar: "Documentos por polo/unidade.",
    palavras: ["estado polo", "uf polo"],
  },
  "{{cepPolo}}": {
    titulo: "CEP do polo",
    descricao: "Mostra o CEP cadastrado do polo.",
    ondeUsar: "Documentos por polo/unidade.",
    palavras: ["cep polo", "código postal polo"],
  },
  "{{blocoPolo}}": {
    titulo: "Bloco completo do polo",
    descricao: "Insere nome, endereço, telefone e e-mail do polo.",
    ondeUsar: "Cabeçalhos e documentos por unidade.",
    palavras: ["dados do polo", "dados da unidade", "campus"],
  },

  "{{assinaturaDiretor}}": {
    titulo: "Imagem da assinatura do diretor",
    descricao: "Insere apenas a imagem da assinatura cadastrada.",
    ondeUsar: "Área visual de assinatura.",
    palavras: ["assinatura", "imagem assinatura", "assinatura diretor"],
  },
  "{{blocoAssinaturaDiretor}}": {
    titulo: "Bloco de assinatura do diretor",
    descricao: "Insere assinatura, nome, cargo e instituição do responsável.",
    ondeUsar: "Final de históricos, certificados, contratos e declarações.",
    palavras: ["assinatura diretor", "assinatura reitor", "responsável", "coordenador"],
  },
  "{{responsavelLegal}}": {
    titulo: "Responsável legal",
    descricao: "Mostra o responsável legal cadastrado pela instituição.",
    ondeUsar: "Contratos, declarações e documentos oficiais.",
    palavras: ["responsável", "diretor", "representante legal"],
  },

  "{{valorContrato}}": {
    titulo: "Valor do contrato",
    descricao: "Mostra o valor financeiro vinculado ao contrato ou matrícula.",
    ondeUsar: "Contratos, recibos e comprovantes.",
    palavras: ["valor", "pagamento", "mensalidade", "preço"],
  },
  "{{referenciaFinanceira}}": {
    titulo: "Referência financeira",
    descricao: "Mostra a referência financeira do pagamento/documento.",
    ondeUsar: "Recibos e comprovantes.",
    palavras: ["referência", "pagamento", "financeiro"],
  },

  "{{dataAtual}}": {
    titulo: "Data atual",
    descricao: "Mostra a data do dia em que o documento foi gerado.",
    ondeUsar: "Todos os documentos.",
    palavras: ["data", "hoje", "emitido em"],
  },
  "{{dataEmissao}}": {
    titulo: "Data de emissão",
    descricao: "Mostra a data de emissão do documento.",
    ondeUsar: "Rodapés e documentos oficiais.",
    palavras: ["emissão", "data emissão", "emitido"],
  },
  "{{horaEmissao}}": {
    titulo: "Hora de emissão",
    descricao: "Mostra a hora em que o documento foi emitido.",
    ondeUsar: "Rodapés e validação documental.",
    palavras: ["hora", "horário", "hora emissão"],
  },
  "{{dataHoraEmissao}}": {
    titulo: "Data e hora de emissão",
    descricao: "Mostra data e hora completas da emissão.",
    ondeUsar: "Documentos oficiais e validação.",
    palavras: ["data e hora", "emissão completa", "horário"],
  },
  "{{cidadeAssinatura}}": {
    titulo: "Cidade da assinatura",
    descricao: "Mostra a cidade usada no local de assinatura.",
    ondeUsar: "Final de contratos, declarações e recibos.",
    palavras: ["cidade assinatura", "local assinatura"],
  },

  "{{numeroDocumento}}": {
    titulo: "Número do documento",
    descricao: "Mostra o número identificador do documento gerado.",
    ondeUsar: "Rodapés, protocolos e validação.",
    palavras: ["número documento", "protocolo", "identificador"],
  },
  "{{codigoValidacao}}": {
    titulo: "Código de validação",
    descricao: "Mostra o código usado para validar a autenticidade do documento.",
    ondeUsar: "Rodapé de históricos, certificados e documentos oficiais.",
    palavras: ["validação", "autenticidade", "código validar", "validar documento"],
  },
  "{{urlValidacao}}": {
    titulo: "Link de validação",
    descricao: "Mostra o endereço onde o documento pode ser validado.",
    ondeUsar: "Rodapé de documentos oficiais.",
    palavras: ["link validação", "site validar", "url validar"],
  },
  "{{tituloDocumento}}": {
    titulo: "Título do documento",
    descricao: "Mostra o título personalizado informado para o documento.",
    ondeUsar: "Documentos personalizados.",
    palavras: ["título", "nome documento", "documento"],
  },

  "{{atoLegalCriacao}}": {
    titulo: "Ato legal de criação",
    descricao: "Mostra o ato legal de criação/autorização da instituição ou curso.",
    ondeUsar: "Históricos oficiais e documentos regulatórios.",
    palavras: ["ato legal", "autorização", "criação"],
  },
  "{{numeroAutorizacaoCurso}}": {
    titulo: "Número de autorização do curso",
    descricao: "Mostra o número de autorização do curso.",
    ondeUsar: "Históricos e documentos oficiais.",
    palavras: ["autorização curso", "número autorização"],
  },
  "{{dataPublicacaoAutorizacao}}": {
    titulo: "Data de publicação da autorização",
    descricao: "Mostra a data de publicação da autorização do curso.",
    ondeUsar: "Históricos e documentos oficiais.",
    palavras: ["data publicação", "autorização", "diário oficial"],
  },
  "{{diarioOficialAutorizacao}}": {
    titulo: "Diário oficial da autorização",
    descricao: "Mostra o diário oficial ou referência de publicação da autorização.",
    ondeUsar: "Históricos e documentos oficiais.",
    palavras: ["diário oficial", "publicação", "autorização"],
  },

  "{{totalAulasBaseNacionalComum}}": {
    titulo: "Total de aulas da Base Nacional Comum",
    descricao: "Mostra o total de aulas da Base Nacional Comum.",
    ondeUsar: "Históricos do ensino fundamental e médio.",
    palavras: ["total base nacional", "base comum", "ensino médio"],
  },
  "{{totalAulasParteDiversificada}}": {
    titulo: "Total de aulas da Parte Diversificada",
    descricao: "Mostra o total de aulas da parte diversificada.",
    ondeUsar: "Históricos do ensino fundamental e médio.",
    palavras: ["parte diversificada", "total aulas"],
  },
  "{{totalCargaHorariaAnualAulas}}": {
    titulo: "Total anual em aulas",
    descricao: "Mostra o total de carga horária anual em aulas.",
    ondeUsar: "Históricos escolares.",
    palavras: ["total anual aulas", "carga anual"],
  },
  "{{totalCargaHorariaAnualHoras}}": {
    titulo: "Total anual em horas",
    descricao: "Mostra o total de carga horária anual em horas.",
    ondeUsar: "Históricos escolares.",
    palavras: ["total anual horas", "carga horária anual"],
  },

  "{{observacoesHistorico}}": {
    titulo: "Observações do histórico",
    descricao: "Mostra observações acadêmicas do histórico.",
    ondeUsar: "Campo de observações do histórico acadêmico.",
    palavras: ["observações", "observação", "histórico observação"],
  },
  "{{legendaHistorico}}": {
    titulo: "Legenda do histórico",
    descricao: "Mostra legenda de notas, frequência, siglas e situação acadêmica.",
    ondeUsar: "Rodapé ou observações de históricos.",
    palavras: ["legenda", "siglas", "notas", "frequência"],
  },
  "{{certificacaoDeclaracao}}": {
    titulo: "Certificação ou declaração",
    descricao: "Texto de certificação/declaratória usado no histórico.",
    ondeUsar: "Históricos escolares e documentos oficiais.",
    palavras: ["certifico", "declaro", "certificação", "declaração"],
  },
  "{{escolaOrigem}}": {
    titulo: "Escola de origem",
    descricao: "Mostra a escola de origem do aluno quando cadastrada.",
    ondeUsar: "Históricos escolares e documentos de transferência.",
    palavras: ["escola origem", "transferência", "instituição anterior"],
  },
};

const variaveisInteligentes = todasAsTags.map((tag) => {
  const info = descricoesVariaveis[tag];

  return {
    tag,
    titulo:
      info?.titulo ||
      tag.replaceAll("{{", "").replaceAll("}}", "").replace(/([A-Z])/g, " $1").trim(),
    descricao:
      info?.descricao ||
      "Variável dinâmica disponível para utilização em documentos.",
    ondeUsar:
      info?.ondeUsar ||
      "Contratos, históricos, certificados, declarações e documentos.",
    palavras: [tag, tag.toLowerCase(), ...(info?.palavras || [])],
  };
});

function gerarPreviaAmigavelTemplate(conteudo: string) {
  let texto = conteudo || "";

  for (const variavel of variaveisInteligentes) {
    texto = texto.replaceAll(variavel.tag, `[${variavel.titulo}]`);
  }

  return texto
    .replaceAll("[Logo da instituição]", "[Logo institucional]")
    .slice(0, 1200);
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
                  <button
  type="button"
  onClick={visualizarPdfTemplate}
  className="rounded-xl border bg-white px-3 py-2 text-sm hover:border-blue-400"
>
  👁 Visualizar PDF
</button>
                </div>

<button
  type="button"
  onClick={() => setMostrarTodasVariaveis((v) => !v)}
  className="mt-3 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-400"
>
  {mostrarTodasVariaveis
    ? "▲ Ocultar todas as variáveis"
    : "▼ Ver todas as variáveis"}
</button>

                <div className="mt-4">
  <input
    value={buscaVariavel}
    onChange={(e) => setBuscaVariavel(e.target.value)}
    className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
    placeholder="Buscar variável por nome ou finalidade. Ex.: nome da escola, assinatura diretor, curso..."
  />

  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
  {variaveisInteligentes
    .filter((v) => {
      const termo = buscaVariavel.trim().toLowerCase();

      if (!mostrarTodasVariaveis && !termo) return false;

      if (mostrarTodasVariaveis && !termo) return true;

      return (
        v.tag.toLowerCase().includes(termo) ||
        v.titulo.toLowerCase().includes(termo) ||
        v.descricao.toLowerCase().includes(termo) ||
        v.ondeUsar.toLowerCase().includes(termo) ||
        v.palavras.some((p) => p.toLowerCase().includes(termo))
      );
    })
  
      .map((variavel) => (
        <button
          key={variavel.tag}
          type="button"
          onClick={() =>
            setConteudo((atual) =>
              atual ? `${atual}\n${variavel.tag}` : variavel.tag
            )
          }
          className="rounded-2xl border bg-white p-3 text-left text-xs hover:border-blue-400 hover:bg-blue-50"
        >
          <div className="font-mono font-bold text-blue-700">
            {variavel.tag}
          </div>

          <div className="mt-1 font-semibold text-slate-800">
            {variavel.titulo}
          </div>

          <p className="mt-1 text-slate-600">
            {variavel.descricao}
          </p>

          <p className="mt-2 text-[11px] text-slate-500">
            Usar em: {variavel.ondeUsar}
          </p>
        </button>
      ))}
  </div>
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
                            {gerarPreviaAmigavelTemplate(template.conteudo)}
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
                          onClick={() => setTemplateParaExcluir(template.id)}
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
      {templateParaExcluir && (
  <PhanyxConfirmModal
    aberto={true}
    titulo="Excluir template"
    mensagem="Tem certeza que deseja excluir este template? Esta ação não poderá ser desfeita."
    textoConfirmar="Sim, excluir"
    textoCancelar="Cancelar"
    onConfirmar={() => {
      excluirTemplate(templateParaExcluir);
      setTemplateParaExcluir(null);
    }}
    onCancelar={() => setTemplateParaExcluir(null)}
  />
)}
    </div>
  );
}

export default withAuth(AdminDocumentosTemplatesPage, ["admin"]);