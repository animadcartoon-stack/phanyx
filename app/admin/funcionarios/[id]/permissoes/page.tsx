"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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

/*
 * A busca aceita termos dos cinco idiomas oficiais.
 * Os nomes visíveis das permissões também são traduzidos e
 * entram no cálculo de relevância.
 */
const CONTEXTOS_BUSCA: ContextoBusca[] = [
  {
    gatilhos: [
      "aluno", "alunos", "estudante", "estudantes",
      "student", "students",
      "estudiante", "estudiantes",
      "étudiant", "étudiants",
    ],
    relacionados: [
      "aluno", "matricula", "turma", "curso", "disciplina", "boletim",
      "nota", "frequencia", "presenca", "prova", "avaliacao",
      "student", "enrollment", "class", "course", "subject", "grade",
      "attendance", "assessment",
      "estudiante", "matricula", "clase", "curso", "asignatura", "nota",
      "asistencia", "evaluacion",
      "étudiant", "inscription", "classe", "cours", "matiere", "note",
      "presence", "evaluation",
    ],
  },
  {
    gatilhos: [
      "professor", "professores", "docente", "docentes",
      "teacher", "teachers", "faculty",
      "profesor", "profesores",
      "enseignant", "enseignants",
    ],
    relacionados: [
      "professor", "docente", "disciplina", "turma", "aula", "prova",
      "avaliacao", "publicacao", "substituicao",
      "teacher", "subject", "class", "lesson", "assessment", "publication",
      "profesor", "asignatura", "clase", "evaluacion", "publicacion",
      "enseignant", "matiere", "classe", "evaluation", "publication",
    ],
  },
  {
    gatilhos: [
      "funcionario", "funcionarios", "colaborador", "equipe", "pessoal", "rh",
      "employee", "employees", "staff", "hr",
      "empleado", "empleados", "personal", "rr hh",
      "employe", "employes", "personnel",
    ],
    relacionados: [
      "funcionario", "departamento", "rh", "ponto", "ferias", "holerite",
      "beneficio", "exame", "rescisao", "jornada", "escala",
      "employee", "department", "time clock", "leave", "payslip", "benefit",
      "exam", "termination", "schedule",
      "empleado", "departamento", "fichaje", "vacaciones", "nomina",
      "beneficio", "baja", "jornada",
      "employe", "departement", "pointage", "conge", "paie", "avantage",
      "examen", "contrat",
    ],
  },
  {
    gatilhos: [
      "comercial", "vendedor", "vendedores", "venda", "vendas", "lead",
      "leads", "cliente", "oportunidade", "meta", "comissao", "crm",
      "sales", "salesperson", "seller", "opportunity", "target", "commission",
      "ventas", "vendedor", "oportunidad", "objetivo", "comision",
      "commercial", "vente", "vendeur", "prospect", "opportunite",
      "objectif", "commission",
    ],
    relacionados: [
      "comercial", "lead", "oportunidade", "vendedor", "venda", "meta",
      "comissao", "funil", "pipeline", "tarefa", "transferir", "relatorio",
      "sales", "lead", "opportunity", "salesperson", "target", "commission",
      "pipeline", "task", "transfer", "report",
      "ventas", "oportunidad", "vendedor", "objetivo", "comision", "tarea",
      "commercial", "vente", "prospect", "objectif", "commission", "tache",
    ],
  },
  {
    gatilhos: [
      "dinheiro", "financeiro", "financas", "pagamento", "mensalidade",
      "cobranca", "receita", "despesa", "caixa",
      "money", "finance", "payment", "tuition", "billing", "revenue",
      "expense", "cash",
      "dinero", "finanzas", "pago", "cobro", "ingreso", "gasto", "caja",
      "argent", "finance", "paiement", "facturation", "recette", "depense",
      "caisse",
    ],
    relacionados: [
      "financeiro", "pagamento", "mensalidade", "cobranca", "receita",
      "despesa", "contrato", "boleto", "caixa", "inadimplencia",
      "finance", "payment", "billing", "revenue", "expense", "contract",
      "cash", "past due",
      "finanzas", "pago", "cobro", "ingreso", "gasto", "contrato", "caja",
      "finance", "paiement", "facturation", "recette", "depense", "contrat",
      "caisse",
    ],
  },
  {
    gatilhos: [
      "cracha", "crachas", "cartao", "identificacao", "credencial",
      "id card", "badge", "credential",
      "credencial", "tarjeta",
      "badge", "carte",
    ],
    relacionados: [
      "cracha", "modelo", "emitir", "emissao", "identificacao",
      "id card", "template", "issue", "badge",
      "credencial", "plantilla", "emitir",
      "badge", "modele", "emettre",
    ],
  },
  {
    gatilhos: [
      "visitante", "visitantes", "visita", "portaria", "entrada", "saida",
      "visitor", "visitors", "entry", "exit", "access",
      "visitante", "entrada", "salida", "acceso",
      "visiteur", "visiteurs", "entree", "sortie", "acces",
    ],
    relacionados: [
      "visitante", "entrada", "saida", "acesso", "bloquear", "arquivar",
      "visitor", "entry", "exit", "access", "block", "archive",
      "visitante", "entrada", "salida", "acceso", "bloquear", "archivar",
      "visiteur", "entree", "sortie", "acces", "bloquer", "archiver",
    ],
  },
  {
    gatilhos: [
      "documento", "documentos", "arquivo", "certificado", "certificados",
      "document", "documents", "file", "certificate", "certificates",
      "documento", "archivo", "certificado",
      "document", "fichier", "certificat",
    ],
    relacionados: [
      "documento", "arquivo", "pdf", "contrato", "modelo", "certificado",
      "document", "file", "contract", "template", "certificate",
      "documento", "archivo", "contrato", "plantilla", "certificado",
      "document", "fichier", "contrat", "modele", "certificat",
    ],
  },
  {
    gatilhos: [
      "mensagem", "comunicacao", "aviso", "whatsapp", "email", "notificacao",
      "message", "communication", "notice", "notification",
      "mensaje", "comunicacion", "aviso", "notificacion",
      "message", "communication", "avis", "notification",
    ],
    relacionados: [
      "mensagem", "comunicacao", "aviso", "whatsapp", "email", "notificacao",
      "publicacao", "reuniao",
      "message", "communication", "notice", "notification", "publication",
      "meeting",
      "mensaje", "comunicacion", "aviso", "notificacion", "reunion",
      "message", "communication", "avis", "notification", "reunion",
    ],
  },
  {
    gatilhos: [
      "ver", "visualizar", "consultar", "acessar", "listar",
      "view", "see", "access", "list",
      "ver", "consultar", "acceder", "listar",
      "voir", "consulter", "acceder", "lister",
    ],
    relacionados: [
      "ver", "visualizar", "consultar", "acessar", "listar",
      "view", "access", "list",
      "ver", "acceder", "listar",
      "voir", "acceder", "lister",
    ],
  },
  {
    gatilhos: [
      "criar", "cadastrar", "adicionar", "incluir", "novo", "registrar",
      "create", "add", "register", "new",
      "crear", "registrar", "anadir", "nuevo",
      "creer", "ajouter", "enregistrer", "nouveau",
    ],
    relacionados: [
      "criar", "cadastrar", "adicionar", "incluir", "registrar",
      "create", "add", "register",
      "crear", "registrar", "anadir",
      "creer", "ajouter", "enregistrer",
    ],
  },
  {
    gatilhos: [
      "editar", "alterar", "atualizar", "modificar", "corrigir",
      "edit", "update", "modify",
      "editar", "actualizar", "modificar",
      "modifier", "mettre a jour", "corriger",
    ],
    relacionados: [
      "editar", "alterar", "atualizar", "modificar", "corrigir",
      "edit", "update", "modify",
      "editar", "actualizar", "modificar",
      "modifier", "corriger",
    ],
  },
  {
    gatilhos: [
      "excluir", "apagar", "remover", "deletar",
      "delete", "remove",
      "eliminar", "borrar",
      "supprimer", "retirer",
    ],
    relacionados: [
      "excluir", "apagar", "remover", "deletar",
      "delete", "remove",
      "eliminar", "borrar",
      "supprimer", "retirer",
    ],
  },
  {
    gatilhos: [
      "relatorio", "relatorios", "planilha", "excel", "exportar",
      "report", "reports", "spreadsheet", "export",
      "informe", "informes", "hoja", "exportar",
      "rapport", "rapports", "tableur", "exporter",
    ],
    relacionados: [
      "relatorio", "excel", "exportar", "imprimir", "pdf", "planilha",
      "report", "export", "print", "spreadsheet",
      "informe", "exportar", "imprimir",
      "rapport", "exporter", "imprimer",
    ],
  },
];

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
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

  const termos = new Set<string>([
    consulta,
    ...palavrasDigitadas,
  ]);

  CONTEXTOS_BUSCA.forEach((contexto) => {
    const contextoEncontrado =
      contexto.gatilhos.some((gatilho) => {
        const gatilhoNormalizado =
          normalizarTexto(gatilho);

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
  valorBusca: string,
  nomeExibicao: string
) {
  const consulta = normalizarTexto(valorBusca);

  if (!consulta) {
    return 1;
  }

  const nomeTraduzido =
    normalizarTexto(nomeExibicao);

  const nomeOriginal =
    normalizarTexto(permissao.nome);

  const chave =
    normalizarTexto(permissao.chave);

  const textoCompleto =
    `${nomeTraduzido} ${nomeOriginal} ${chave}`;

  const termosExpandidos =
    expandirBusca(valorBusca);

  let pontuacao = 0;

  if (
    nomeTraduzido === consulta ||
    nomeOriginal === consulta
  ) {
    pontuacao += 200;
  }

  if (chave === consulta) {
    pontuacao += 190;
  }

  if (
    nomeTraduzido.includes(consulta) ||
    nomeOriginal.includes(consulta)
  ) {
    pontuacao += 120;
  }

  if (chave.includes(consulta)) {
    pontuacao += 110;
  }

  termosExpandidos.forEach((termo) => {
    if (!termo) {
      return;
    }

    if (
      nomeTraduzido.includes(termo) ||
      nomeOriginal.includes(termo)
    ) {
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

function chaveTraducaoPermissao(
  chave: string
) {
  return chave.replaceAll(".", "__");
}

export default function FuncionarioPermissoesPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const funcionarioId = params.id;

  const locale = useLocale();
  const tBase =
    useTranslations(
      "AdminFuncionariosPermissoes"
    );

  const t = tBase as any;

  const [
    selecionadas,
    setSelecionadas,
  ] = useState<string[]>([]);

  const [
    herdadasDepartamento,
    setHerdadasDepartamento,
  ] = useState<string[]>([]);

  const [
    funcionarioNome,
    setFuncionarioNome,
  ] = useState("");

  const [
    funcionarioCargo,
    setFuncionarioCargo,
  ] = useState("");

  const [
    departamentoNome,
    setDepartamentoNome,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    busca,
    setBusca,
  ] = useState("");

  function nomePermissao(
    permissao: PermissaoPhanyx
  ) {
    const chave =
      chaveTraducaoPermissao(
        permissao.chave
      );

    const chaveMensagem =
      `permissionNames.${chave}`;

    try {
      if (
        typeof t.has === "function" &&
        !t.has(chaveMensagem)
      ) {
        return permissao.nome;
      }

      const traduzida =
        t(chaveMensagem) as string;

      if (
        !traduzida ||
        traduzida ===
          chaveMensagem ||
        traduzida ===
          `AdminFuncionariosPermissoes.${chaveMensagem}`
      ) {
        return permissao.nome;
      }

      return traduzida;
    } catch {
      return permissao.nome;
    }
  }

  const permissoesFiltradas =
    useMemo(() => {
      const consulta =
        busca.trim();

      if (!consulta) {
        return PERMISSOES_PHANYX;
      }

      return PERMISSOES_PHANYX
        .map((permissao) => ({
          permissao,
          nome:
            nomePermissao(
              permissao
            ),
          pontuacao:
            pontuarPermissao(
              permissao,
              consulta,
              nomePermissao(
                permissao
              )
            ),
        }))
        .filter(
          (resultado) =>
            resultado.pontuacao > 0
        )
        .sort((a, b) => {
          if (
            b.pontuacao !==
            a.pontuacao
          ) {
            return (
              b.pontuacao -
              a.pontuacao
            );
          }

          return a.nome.localeCompare(
            b.nome,
            locale
          );
        })
        .map(
          (resultado) =>
            resultado.permissao
        );
    }, [
      busca,
      locale,
    ]);

  const sugestoesBusca =
    useMemo(() => {
      if (!busca.trim()) {
        return [];
      }

      return permissoesFiltradas.slice(
        0,
        6
      );
    }, [
      busca,
      permissoesFiltradas,
    ]);

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

      const data:
        FuncionarioPermissoesPayload & {
          error?: string;
        } = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("loadError")
        );
      }

      setFuncionarioNome(
        data?.funcionario?.nome ||
          ""
      );

      setFuncionarioCargo(
        data?.funcionario?.cargo ||
          ""
      );

      setDepartamentoNome(
        data?.funcionario
          ?.departamento?.nome ||
          ""
      );

      setSelecionadas(
        Array.isArray(
          data?.permissoesIndividuais
        )
          ? data
              .permissoesIndividuais
              .filter(
                (p) => p.ativo
              )
              .map(
                (p) => p.chave
              )
          : []
      );

      setHerdadasDepartamento(
        Array.isArray(
          data?.permissoesDepartamento
        )
          ? data
              .permissoesDepartamento
              .filter(
                (p) => p.ativo
              )
              .map(
                (p) => p.chave
              )
          : []
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          t("loadError")
      );
    } finally {
      setCarregando(false);
    }
  }

  function alternar(
    chave: string
  ) {
    setSelecionadas(
      (atuais) =>
        atuais.includes(chave)
          ? atuais.filter(
              (item) =>
                item !== chave
            )
          : [
              ...atuais,
              chave,
            ]
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
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            chaves: selecionadas,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("saveError")
        );
      }

      setMensagem(
        t("saveSuccess")
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          t("saveError")
      );
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
          {t("back")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {carregando ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t(
              "loadingEmployee"
            )}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("employee")}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {funcionarioNome ||
                  "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("position")}
              </p>

              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {funcionarioCargo ||
                  "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(
                  "department"
                )}
              </p>

              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {departamentoNome ||
                  t(
                    "noDepartment"
                  )}
              </p>
            </div>
          </div>
        )}
      </div>

      {mensagem && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4 text-sm font-medium"
        >
          {mensagem}
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/50 bg-red-500/10 p-4 text-sm font-medium"
        >
          {erro}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="phanyx-permissoes-funcionario-aviso mb-5 rounded-2xl border p-4 text-sm">
          <strong>
            {t(
              "howWorksTitle"
            )}
          </strong>{" "}
          {t(
            "howWorksText"
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="busca-permissoes-funcionario"
            className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            {t("searchLabel")}
          </label>

          <div className="relative">
            <input
              id="busca-permissoes-funcionario"
              type="search"
              value={busca}
              onChange={(
                event
              ) =>
                setBusca(
                  event.target
                    .value
                )
              }
              placeholder={t(
                "searchPlaceholder"
              )}
              autoComplete="off"
              className="phanyx-busca-permissoes-input w-full rounded-2xl border px-5 py-4 pr-24 text-sm outline-none transition"
            />

            {busca && (
              <button
                type="button"
                onClick={() =>
                  setBusca("")
                }
                className="phanyx-busca-permissoes-limpar absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
              >
                {t("clear")}
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "searchHelp"
              )}
            </p>

            {busca.trim() && (
              <span className="phanyx-busca-permissoes-contador rounded-full border px-3 py-1 text-xs font-semibold">
                {t(
                  "resultCount",
                  {
                    count:
                      permissoesFiltradas.length,
                  }
                )}
              </span>
            )}
          </div>

          {sugestoesBusca.length >
            0 && (
            <div
              data-permissoes-sugestoes="true"
              className="phanyx-busca-permissoes-sugestoes mt-4 rounded-2xl border p-4"
            >
              <p className="phanyx-busca-permissoes-titulo-sugestoes mb-3 text-xs font-bold uppercase tracking-wide">
                {t(
                  "suggestions"
                )}
              </p>

              <div className="flex flex-wrap gap-2">
                {sugestoesBusca.map(
                  (
                    sugestao
                  ) => (
                    <button
                      key={`sugestao-${sugestao.chave}`}
                      type="button"
                      data-permissao-sugestao="true"
                      onClick={() =>
                        setBusca(
                          nomePermissao(
                            sugestao
                          )
                        )
                      }
                      className="phanyx-busca-permissoes-chip rounded-full border px-3 py-2 text-xs font-semibold transition"
                    >
                      {nomePermissao(
                        sugestao
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {permissoesFiltradas.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-slate-400/50 bg-slate-500/5 p-8 text-center">
            <div className="text-3xl">
              🔍
            </div>

            <h3 className="mt-3 font-bold">
              {t(
                "emptyTitle"
              )}
            </h3>

            <p className="mt-1 text-sm opacity-75">
              {t(
                "emptyHelp"
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                setBusca("")
              }
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t("showAll")}
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {permissoesFiltradas.map(
              (
                permissao
              ) => {
                const marcadaIndividual =
                  selecionadas.includes(
                    permissao.chave
                  );

                const herdada =
                  herdadasDepartamento.includes(
                    permissao.chave
                  );

                return (
                  <button
                    key={
                      permissao.chave
                    }
                    type="button"
                    aria-pressed={
                      marcadaIndividual
                    }
                    onClick={() =>
                      alternar(
                        permissao.chave
                      )
                    }
                    className={`phanyx-permissao-funcionario-card ${
                      marcadaIndividual
                        ? "individual"
                        : herdada
                          ? "herdada"
                          : "inativa"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-left">
                        <div className="font-semibold">
                          {marcadaIndividual
                            ? "✅ "
                            : herdada
                              ? "🟢 "
                              : "⬜ "}
                          {nomePermissao(
                            permissao
                          )}
                        </div>

                        <div className="mt-1 text-xs opacity-80">
                          {
                            permissao.chave
                          }
                        </div>
                      </div>

                      {herdada &&
                        !marcadaIndividual && (
                          <span className="phanyx-permissao-funcionario-badge herdada">
                            {t(
                              "inherited"
                            )}
                          </span>
                        )}

                      {marcadaIndividual && (
                        <span className="phanyx-permissao-funcionario-badge individual">
                          {t(
                            "individual"
                          )}
                        </span>
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={
            salvando ||
            carregando
          }
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {salvando
            ? t("saving")
            : t("save")}
        </button>
      </div>
    </div>
  );
}
