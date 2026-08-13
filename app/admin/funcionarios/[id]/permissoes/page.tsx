"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PERMISSOES_PHANYX } from "@/lib/permissoes-phanyx";

type PermissaoSalva = {
  chave: string;
  ativo: boolean;
};

type FuncionarioPermissoesPayload = {
  funcionario?: {
    id: number;
    nome: string;
    cargo?: string | null;
    departamento?: {
      id: number;
      nome: string;
    } | null;
  };
  permissoesIndividuais?: PermissaoSalva[];
  permissoesDepartamento?: PermissaoSalva[];
};

type PermissaoPhanyx = (typeof PERMISSOES_PHANYX)[number];

type ContextoBusca = {
  gatilhos: string[];
  relacionados: string[];
};

const CONTEXTOS_BUSCA: ContextoBusca[] = [
  {
    gatilhos: [
      "aluno",
      "alunos",
      "estudante",
      "estudantes",
      "discente",
      "academico",
      "pipeline",
      "etapa",
      "etapas",
      "tarefa",
      "tarefas",
      "negociação",
      "transferência",
      "histórico",
      "auditoria",
      "perda",
    ],
    relacionados: [
      "aluno",
      "matricula",
      "turma",
      "curso",
      "disciplina",
      "boletim",
      "nota",
      "frequencia",
      "presenca",
      "prova",
      "avaliacao",
      "funil",
      "pipeline",
      "etapa",
      "movimentar",
      "tarefa",
      "retorno",
      "negociação",
      "transferir",
      "arquivar",
      "restaurar",
      "histórico",
      "auditoria",
      "perda",
    ],
  },
  {
    gatilhos: [
      "professor",
      "professores",
      "docente",
      "docentes",
      "educador",
    ],
    relacionados: [
      "professor",
      "docente",
      "disciplina",
      "turma",
      "aula",
      "prova",
      "avaliacao",
      "publicacao",
      "substituicao",
    ],
  },
  {
    gatilhos: [
      "funcionario",
      "funcionarios",
      "colaborador",
      "colaboradores",
      "empregado",
      "equipe",
      "pessoal",
      "rh",
    ],
    relacionados: [
      "funcionario",
      "departamento",
      "rh",
      "ponto",
      "ferias",
      "holerite",
      "beneficio",
      "exame",
      "rescisao",
      "jornada",
      "escala",
    ],
  },
  {
    gatilhos: [
      "comercial",
      "vendedor",
      "vendedores",
      "venda",
      "vendas",
      "lead",
      "leads",
      "cliente",
      "clientes",
      "prospect",
      "prospects",
      "oportunidade",
      "oportunidades",
      "meta",
      "metas",
      "comissão",
      "comissões",
      "funil",
      "conversão",
      "crm",
    ],
    relacionados: [
      "comercial",
      "lead",
      "oportunidade",
      "vendedor",
      "venda",
      "matrícula",
      "meta",
      "comissão",
      "atribuir",
      "converter",
      "aprovar",
      "cancelar",
      "relatório",
      "exportar",
      "configuração",
    ],
  },
  {
    gatilhos: [
      "dinheiro",
      "financeiro",
      "financas",
      "pagamento",
      "pagamentos",
      "mensalidade",
      "mensalidades",
      "cobranca",
      "cobrancas",
      "receita",
      "despesa",
      "caixa",
    ],
    relacionados: [
      "financeiro",
      "pagamento",
      "mensalidade",
      "cobranca",
      "receita",
      "despesa",
      "contrato",
      "boleto",
      "caixa",
      "inadimplencia",
    ],
  },
  {
    gatilhos: [
      "cracha",
      "crachas",
      "cartao",
      "identificacao",
      "credencial",
    ],
    relacionados: [
      "cracha",
      "modelo",
      "emitir",
      "emissao",
      "identificacao",
    ],
  },
  {
    gatilhos: [
      "visitante",
      "visitantes",
      "visita",
      "portaria",
      "entrada",
      "saida",
      "acesso",
    ],
    relacionados: [
      "visitante",
      "entrada",
      "saida",
      "acesso",
      "bloquear",
      "arquivar",
      "portaria",
    ],
  },
  {
    gatilhos: [
      "certificado",
      "certificados",
      "diploma",
      "conclusao",
      "formatura",
    ],
    relacionados: [
      "certificado",
      "modelo",
      "emitir",
      "emissao",
      "conclusao",
    ],
  },
  {
    gatilhos: [
      "documento",
      "documentos",
      "arquivo",
      "arquivos",
      "pdf",
      "contrato",
    ],
    relacionados: [
      "documento",
      "arquivo",
      "pdf",
      "contrato",
      "modelo",
      "editor",
    ],
  },
  {
    gatilhos: [
      "mensagem",
      "mensagens",
      "comunicacao",
      "aviso",
      "avisos",
      "whatsapp",
      "email",
      "notificacao",
    ],
    relacionados: [
      "mensagem",
      "comunicacao",
      "aviso",
      "whatsapp",
      "email",
      "notificacao",
      "publicacao",
    ],
  },
  {
    gatilhos: [
      "configuracao",
      "configuracoes",
      "ajuste",
      "ajustes",
      "instituicao",
      "sistema",
    ],
    relacionados: [
      "configuracao",
      "instituicao",
      "integracao",
      "sistema",
      "personalizacao",
    ],
  },
  {
    gatilhos: [
      "assinatura",
      "plano",
      "planos",
      "phanyx",
      "cancelar assinatura",
    ],
    relacionados: [
      "assinatura",
      "plano",
      "cancelar",
      "phanyx",
      "pagamento",
    ],
  },
  {
    gatilhos: [
      "painel",
      "inicio",
      "dashboard",
      "pagina inicial",
      "resumo",
    ],
    relacionados: ["dashboard", "painel", "inicio", "resumo", "geral"],
  },
  {
    gatilhos: ["ver", "visualizar", "consultar", "acessar", "abrir", "listar"],
    relacionados: ["ver", "visualizar", "consultar", "acessar", "listar"],
  },
  {
    gatilhos: ["criar", "cadastrar", "adicionar", "incluir", "novo", "registrar"],
    relacionados: ["criar", "cadastrar", "adicionar", "incluir", "registrar"],
  },
  {
    gatilhos: ["editar", "alterar", "atualizar", "modificar", "corrigir"],
    relacionados: ["editar", "alterar", "atualizar", "modificar", "corrigir"],
  },
  {
    gatilhos: ["excluir", "apagar", "remover", "deletar", "eliminar"],
    relacionados: ["excluir", "apagar", "remover", "deletar"],
  },
  {
    gatilhos: ["gerenciar", "administrar", "controlar", "gestao"],
    relacionados: ["gerenciar", "administrar", "controlar", "gestao"],
  },
  {
    gatilhos: ["emitir", "gerar", "imprimir", "expedir"],
    relacionados: ["emitir", "gerar", "imprimir", "emissao"],
  },
  {
    gatilhos: [
      "relatorio",
      "relatorios",
      "planilha",
      "excel",
      "exportar",
      "imprimir",
    ],
    relacionados: [
      "relatorio",
      "excel",
      "exportar",
      "imprimir",
      "pdf",
      "planilha",
    ],
  },
  {
    gatilhos: [
      "nota",
      "notas",
      "boletim",
      "prova",
      "provas",
      "avaliacao",
      "avaliacoes",
    ],
    relacionados: [
      "nota",
      "boletim",
      "prova",
      "avaliacao",
      "tentativa",
      "resultado",
    ],
  },
  {
    gatilhos: [
      "presenca",
      "presencas",
      "falta",
      "faltas",
      "frequencia",
      "chamada",
    ],
    relacionados: [
      "presenca",
      "falta",
      "frequencia",
      "chamada",
      "aula",
    ],
  },
];

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[._/\\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandirBusca(valor: string) {
  const consulta = normalizarTexto(valor);

  if (!consulta) {
    return [];
  }

  const palavrasDigitadas = consulta
    .split(" ")
    .filter((palavra) => palavra.length >= 2);

  const termos = new Set<string>([consulta, ...palavrasDigitadas]);

  CONTEXTOS_BUSCA.forEach((contexto) => {
    const contextoEncontrado = contexto.gatilhos.some((gatilho) => {
      const gatilhoNormalizado = normalizarTexto(gatilho);

      return (
        consulta.includes(gatilhoNormalizado) ||
        palavrasDigitadas.some(
          (palavra) =>
            gatilhoNormalizado.includes(palavra) ||
            palavra.includes(gatilhoNormalizado)
        )
      );
    });

    if (contextoEncontrado) {
      contexto.gatilhos.forEach((termo) =>
        termos.add(normalizarTexto(termo))
      );

      contexto.relacionados.forEach((termo) =>
        termos.add(normalizarTexto(termo))
      );
    }
  });

  return Array.from(termos).filter(Boolean);
}

function pontuarPermissao(
  permissao: PermissaoPhanyx,
  valorBusca: string
) {
  const consulta = normalizarTexto(valorBusca);

  if (!consulta) {
    return 1;
  }

  const nome = normalizarTexto(permissao.nome);
  const chave = normalizarTexto(permissao.chave);
  const textoCompleto = `${nome} ${chave}`;
  const termosExpandidos = expandirBusca(valorBusca);

  let pontuacao = 0;

  if (nome === consulta) {
    pontuacao += 200;
  }

  if (chave === consulta) {
    pontuacao += 190;
  }

  if (nome.includes(consulta)) {
    pontuacao += 120;
  }

  if (chave.includes(consulta)) {
    pontuacao += 110;
  }

  termosExpandidos.forEach((termo) => {
    if (!termo) return;

    if (nome.includes(termo)) {
      pontuacao += 20;
    }

    if (chave.includes(termo)) {
      pontuacao += 18;
    }

    if (textoCompleto.startsWith(termo)) {
      pontuacao += 5;
    }
  });

  return pontuacao;
}

export default function FuncionarioPermissoesPage({
  params,
}: {
  params: { id: string };
}) {
  const funcionarioId = params.id;

  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [herdadasDepartamento, setHerdadasDepartamento] = useState<string[]>(
    []
  );
  const [funcionarioNome, setFuncionarioNome] = useState("");
  const [funcionarioCargo, setFuncionarioCargo] = useState("");
  const [departamentoNome, setDepartamentoNome] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const permissoesFiltradas = useMemo(() => {
    const consulta = busca.trim();

    if (!consulta) {
      return PERMISSOES_PHANYX;
    }

    return PERMISSOES_PHANYX.map((permissao) => ({
      permissao,
      pontuacao: pontuarPermissao(permissao, consulta),
    }))
      .filter((resultado) => resultado.pontuacao > 0)
      .sort((a, b) => {
        if (b.pontuacao !== a.pontuacao) {
          return b.pontuacao - a.pontuacao;
        }

        return a.permissao.nome.localeCompare(b.permissao.nome, "pt-BR");
      })
      .map((resultado) => resultado.permissao);
  }, [busca]);

  const sugestoesBusca = useMemo(() => {
    if (!busca.trim()) {
      return [];
    }

    return permissoesFiltradas.slice(0, 6);
  }, [busca, permissoesFiltradas]);

  async function carregarPermissoes() {
    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const res = await fetch(
        `/api/admin/funcionarios/${funcionarioId}/permissoes`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const data: FuncionarioPermissoesPayload & { error?: string } =
        await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar permissões.");
      }

      setFuncionarioNome(data?.funcionario?.nome || "");
      setFuncionarioCargo(data?.funcionario?.cargo || "");
      setDepartamentoNome(data?.funcionario?.departamento?.nome || "");

      setSelecionadas(
        Array.isArray(data?.permissoesIndividuais)
          ? data.permissoesIndividuais
            .filter((p) => p.ativo)
            .map((p) => p.chave)
          : []
      );

      setHerdadasDepartamento(
        Array.isArray(data?.permissoesDepartamento)
          ? data.permissoesDepartamento
            .filter((p) => p.ativo)
            .map((p) => p.chave)
          : []
      );
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar permissões.");
    } finally {
      setCarregando(false);
    }
  }

  function alternar(chave: string) {
    setSelecionadas((atuais) =>
      atuais.includes(chave)
        ? atuais.filter((item) => item !== chave)
        : [...atuais, chave]
    );
  }

  async function salvar() {
    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        `/api/admin/funcionarios/${funcionarioId}/permissoes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ chaves: selecionadas }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar permissões.");
      }

      setMensagem("Permissões individuais salvas com sucesso.");
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar permissões.");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    carregarPermissoes();
  }, []);

  return (
    <div className="phanyx-funcionario-permissoes-page mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link
          href="/admin/funcionarios"
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          ← Voltar para Funcionários
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          🔐 Permissões individuais do funcionário
        </h1>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Libere permissões extras somente para este funcionário, sem alterar as
          permissões do departamento.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {carregando ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Carregando dados do funcionário...
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Funcionário
              </p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {funcionarioNome || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cargo
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {funcionarioCargo || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Departamento
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {departamentoNome || "Sem departamento"}
              </p>
            </div>
          </div>
        )}
      </div>

      {mensagem && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {erro}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="phanyx-permissoes-funcionario-aviso mb-5 rounded-2xl border p-4 text-sm">
          <strong>Como funciona:</strong> as permissões herdadas do departamento
          continuam valendo. Aqui você marca apenas permissões extras para este
          funcionário.
        </div>

        <div className="mb-6">
          <label
            htmlFor="busca-permissoes-funcionario"
            className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            🔎 Busca inteligente de permissões
          </label>

          <div className="relative">
            <input
              id="busca-permissoes-funcionario"
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Ex.: editar alunos, vendedor, comissão, dinheiro, ponto, crachá..."
              autoComplete="off"
              className="phanyx-busca-permissoes-input w-full rounded-2xl border px-5 py-4 pr-24 text-sm outline-none transition"
            />

            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="phanyx-busca-permissoes-limpar absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digite com suas próprias palavras. O PHANYX procurará permissões
              diretas e relacionadas.
            </p>

            {busca.trim() && (
              <span className="phanyx-busca-permissoes-contador rounded-full border px-3 py-1 text-xs font-semibold">
                {permissoesFiltradas.length}{" "}
                {permissoesFiltradas.length === 1
                  ? "permissão encontrada"
                  : "permissões encontradas"}
              </span>
            )}
          </div>

          {sugestoesBusca.length > 0 && (
            <div
              data-permissoes-sugestoes="true"
              className="phanyx-busca-permissoes-sugestoes mt-4 rounded-2xl border p-4"
            >
              <p className="phanyx-busca-permissoes-titulo-sugestoes mb-3 text-xs font-bold uppercase tracking-wide">
                Sugestões mais próximas
              </p>

              <div className="flex flex-wrap gap-2">
                {sugestoesBusca.map((sugestao) => (
                  <button
                    key={`sugestao-${sugestao.chave}`}
                    type="button"
                    data-permissao-sugestao="true"
                    onClick={() => setBusca(sugestao.nome)}
                    className="phanyx-busca-permissoes-chip rounded-full border px-3 py-2 text-xs font-semibold transition"
                  >
                    {sugestao.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {permissoesFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
            <div className="text-3xl">🔍</div>

            <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
              Nenhuma permissão encontrada
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tente escrever de outra forma, como “alunos”, “comercial”,
              “vendedor”, “financeiro”, “funcionários” ou “documentos”.
            </p>

            <button
              type="button"
              onClick={() => setBusca("")}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Mostrar todas as permissões
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {permissoesFiltradas.map((permissao) => {
              const marcadaIndividual = selecionadas.includes(permissao.chave);
              const herdada = herdadasDepartamento.includes(permissao.chave);

              return (
                <button
                  key={permissao.chave}
                  type="button"
                  onClick={() => alternar(permissao.chave)}
                  className={`phanyx-permissao-funcionario-card ${marcadaIndividual
                    ? "individual"
                    : herdada
                      ? "herdada"
                      : "inativa"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {marcadaIndividual ? "✅ " : herdada ? "🟢 " : "⬜ "}
                        {permissao.nome}
                      </div>

                      <div className="mt-1 text-xs opacity-80">
                        {permissao.chave}
                      </div>
                    </div>

                    {herdada && !marcadaIndividual && (
                      <span className="phanyx-permissao-funcionario-badge herdada">
                        Herdada
                      </span>
                    )}

                    {marcadaIndividual && (
                      <span className="phanyx-permissao-funcionario-badge individual">
                        Individual
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={salvando || carregando}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {salvando ? "Salvando..." : "Salvar permissões individuais"}
        </button>
      </div>
    </div>
  );
}