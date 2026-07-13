"use client";

import { useEffect, useMemo, useState } from "react";
import { PERMISSOES_PHANYX } from "@/lib/permissoes-phanyx";
import Link from "next/link";

type PermissaoPhanyx = {
  chave: string;
  nome: string;
  descricao?: string;
};

type GrupoPermissoes = {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  prefixos: string[];
};

const GRUPOS_PERMISSOES: GrupoPermissoes[] = [
  {
    id: "geral",
    nome: "Geral / Dashboard",
    icone: "🏠",
    descricao: "Acessos gerais do painel administrativo.",
    prefixos: ["dashboard", "painel", "perfil"],
  },
  {
    id: "assinatura",
    nome: "Assinatura PHANYX",
    icone: "💳",
    descricao:
      "Plano, valores, forma de cobrança e cancelamento da assinatura da instituição.",
    prefixos: ["assinatura"],
  },
  {
    id: "apoio-docente",
    nome: "Apoio Docente",
    icone: "🧑‍🏫",
    descricao:
      "Publicações acadêmicas, materiais, trabalhos e apoio às ações dos professores.",
    prefixos: [
      "academico.publicacoes",
      "academico.materiais",
      "academico.trabalhos",
      "academico.turmas.selecionar",
      "academico.disciplinas.selecionar",
      "academico.professores.selecionar",
      "academico.alunos.selecionar",
    ],
  },
  {
    id: "academico",
    nome: "Acadêmico",
    icone: "🎓",
    descricao:
      "Alunos, professores, cursos, turmas, matrículas, disciplinas e gestão acadêmica.",
    prefixos: [
      "alunos",
      "professores",
      "matriculas",
      "turmas",
      "disciplinas",
      "cursos",
      "aulas",
      "provas",
      "atividades",
      "substituicoes",
      "substituicoes-docentes",
    ],
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    icone: "💰",
    descricao:
      "Recebimentos, caixa, inadimplentes, relatórios financeiros e cobranças.",
    prefixos: [
      "financeiro",
      "caixa",
      "recebimentos",
      "mensalidades",
      "cobrancas",
      "inadimplentes",
      "relatorios-financeiros",
    ],
  },
  {
    id: "rh",
    nome: "Pessoal / RH",
    icone: "👥",
    descricao:
      "Funcionários, departamentos, ponto, holerites, férias, exames, rescisões e documentos de RH.",
    prefixos: [
      "rh",
      "funcionarios",
      "departamentos",
      "ponto",
      "holerites",
      "ferias",
      "exames",
      "rescisoes",
      "beneficios",
      "banco-horas",
    ],
  },
  {
    id: "controle-acesso",
    nome: "Controle de Acesso",
    icone: "🚪",
    descricao:
      "Crachás, edição de crachás, modelos, emissão, visitantes, entrada e saída.",
    prefixos: ["crachas", "visitantes", "controle-acesso", "controle_acesso"],
  },
  {
    id: "documentos",
    nome: "Documentos",
    icone: "📄",
    descricao:
      "Certificados, contratos, documentos, modelos, assinaturas e validações.",
    prefixos: [
      "documentos",
      "certificados",
      "contratos",
      "templates",
      "assinaturas",
      "validacoes",
      "validacoes-documentos",
    ],
  },
  {
    id: "comunicacao",
    nome: "Comunicação",
    icone: "💬",
    descricao:
      "Reuniões, aniversariantes, ouvidoria, mensagens, WhatsApp e comunicação interna.",
    prefixos: [
      "comunicacao",
      "reunioes",
      "aniversariantes",
      "ouvidoria",
      "mensagens",
      "whatsapp",
      "chat",
    ],
  },
  {
    id: "configuracoes",
    nome: "Configurações / Integrações",
    icone: "⚙️",
    descricao:
      "Configurações da instituição, integrações e recursos administrativos.",
    prefixos: ["configuracoes", "integracoes", "google", "reputacao", "ads"],
  },
];

const GRUPO_OUTROS: GrupoPermissoes = {
  id: "outros",
  nome: "Outras permissões",
  icone: "🧩",
  descricao: "Permissões ainda não classificadas em um grupo específico.",
  prefixos: [],
};

function normalizarTexto(valor: string) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pertenceAoGrupo(permissao: PermissaoPhanyx, grupo: GrupoPermissoes) {
  const chave = normalizarTexto(permissao.chave);
  const nome = normalizarTexto(permissao.nome);

  return grupo.prefixos.some((prefixo) => {
    const p = normalizarTexto(prefixo);

    return (
      chave === p ||
      chave.startsWith(`${p}.`) ||
      chave.startsWith(`${p}_`) ||
      chave.startsWith(`${p}-`) ||
      nome.startsWith(p)
    );
  });
}

function encontrarGrupo(permissao: PermissaoPhanyx) {
  return (
    GRUPOS_PERMISSOES.find((grupo) => pertenceAoGrupo(permissao, grupo)) ||
    GRUPO_OUTROS
  );
}

export default function DepartamentoPermissoesPage({
  params,
}: {
  params: { id: string };
}) {
  const departamentoId = params.id;

  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [nomeDepartamento, setNomeDepartamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [gruposAbertos, setGruposAbertos] = useState<string[]>([
    "academico",
    "apoio-docente",
  ]);

  const gruposComPermissoes = useMemo(() => {
    const mapa = new Map<
      string,
      {
        grupo: GrupoPermissoes;
        permissoes: PermissaoPhanyx[];
      }
    >();

    [...GRUPOS_PERMISSOES, GRUPO_OUTROS].forEach((grupo) => {
      mapa.set(grupo.id, {
        grupo,
        permissoes: [],
      });
    });

    (PERMISSOES_PHANYX as readonly PermissaoPhanyx[]).forEach((permissao) => {
      const grupo = encontrarGrupo(permissao);
      const item = mapa.get(grupo.id);

      if (item) {
        item.permissoes.push(permissao);
      }
    });

    return Array.from(mapa.values())
      .map((item) => ({
        ...item,
        permissoes: item.permissoes.sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR")
        ),
      }))
      .filter((item) => item.permissoes.length > 0);
  }, []);

  async function carregarPermissoes() {
    try {
      setErro("");

      const res = await fetch(
        `/api/admin/departamentos/${departamentoId}/permissoes`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar permissões.");
      }

      setNomeDepartamento(data?.departamento?.nome || "");

      setSelecionadas(
        Array.isArray(data?.permissoes)
          ? data.permissoes
              .filter((p: any) => p.ativo)
              .map((p: any) => p.chave)
          : []
      );
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar permissões.");
    }
  }

  function alternar(chave: string) {
    setSelecionadas((atuais) =>
      atuais.includes(chave)
        ? atuais.filter((item) => item !== chave)
        : [...atuais, chave]
    );
  }

  function alternarGrupo(grupoId: string) {
    setGruposAbertos((atuais) =>
      atuais.includes(grupoId)
        ? atuais.filter((id) => id !== grupoId)
        : [...atuais, grupoId]
    );
  }

  function marcarGrupo(permissoes: PermissaoPhanyx[]) {
    const chaves = permissoes.map((permissao) => permissao.chave);

    setSelecionadas((atuais) => Array.from(new Set([...atuais, ...chaves])));
  }

  function limparGrupo(permissoes: PermissaoPhanyx[]) {
    const chaves = permissoes.map((permissao) => permissao.chave);

    setSelecionadas((atuais) =>
      atuais.filter((chaveAtual) => !chaves.includes(chaveAtual))
    );
  }

  async function salvar() {
    try {
      setLoading(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        `/api/admin/departamentos/${departamentoId}/permissoes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chaves: selecionadas }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar permissões.");
      }

      setMensagem("Permissões salvas com sucesso.");
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar permissões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPermissoes();
  }, []);

  return (
    <div className="phanyx-departamento-permissoes-page mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link
          href="/admin/departamentos"
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          ← Voltar para Departamentos
        </Link>

        <h1 className="text-2xl font-black text-slate-950 dark:text-white">
          🔐 Permissões do Departamento {nomeDepartamento || ""}
        </h1>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Defina quais áreas e funções os funcionários deste departamento
          poderão acessar. As permissões estão organizadas por área para
          facilitar o uso.
        </p>
      </div>

      {mensagem ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
          {mensagem}
        </div>
      ) : null}

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              Permissões por setor
            </p>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Selecionadas:{" "}
              <strong className="text-slate-950 dark:text-white">
                {selecionadas.length}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={salvar}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-400"
          >
            {loading ? "Salvando..." : "Salvar permissões"}
          </button>
        </div>

        <div className="space-y-4">
          {gruposComPermissoes.map(({ grupo, permissoes }) => {
            const aberto = gruposAbertos.includes(grupo.id);
            const totalSelecionadasNoGrupo = permissoes.filter((permissao) =>
              selecionadas.includes(permissao.chave)
            ).length;

            return (
              <div
                key={grupo.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
              >
                <button
                  type="button"
                  onClick={() => alternarGrupo(grupo.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl dark:border-slate-700 dark:bg-slate-900">
                      {grupo.icone}
                    </div>

                    <div>
                      <h2 className="text-base font-black text-slate-950 dark:text-white">
                        {grupo.nome}
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {grupo.descricao}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                        {totalSelecionadasNoGrupo} de {permissoes.length}{" "}
                        selecionada(s)
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-slate-300 px-3 py-1 text-sm font-black text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    {aberto ? "▲" : "▼"}
                  </span>
                </button>

                {aberto ? (
                  <div className="border-t border-slate-200 p-5 dark:border-slate-800">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => marcarGrupo(permissoes)}
                        className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-950"
                      >
                        Marcar todas deste setor
                      </button>

                      <button
                        type="button"
                        onClick={() => limparGrupo(permissoes)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Limpar este setor
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {permissoes.map((permissao) => {
                        const marcada = selecionadas.includes(
                          permissao.chave
                        );

                        return (
                          <button
                            key={permissao.chave}
                            type="button"
                            onClick={() => alternar(permissao.chave)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              marcada
                                ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="font-bold">
                              {marcada ? "✅ " : "⬜ "}
                              {permissao.nome}
                            </div>

                            <div className="mt-1 text-xs opacity-75">
                              {permissao.chave}
                            </div>

                            {permissao.descricao ? (
                              <div className="mt-2 text-xs leading-5 opacity-75">
                                {permissao.descricao}
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={salvar}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-400"
          >
            {loading ? "Salvando..." : "Salvar permissões"}
          </button>
        </div>
      </div>
    </div>
  );
}