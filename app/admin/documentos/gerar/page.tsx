"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PhanyxToast from "@/components/ui/PhanyxToast";

type TipoCampoManual =
  | "texto"
  | "textarea"
  | "moeda"
  | "data"
  | "select";

type CampoManual = {
  tag: string;
  label: string;
  tipo: TipoCampoManual;
  placeholder?: string;
  opcoes?: string[];
};

type Template = {
  id: number;
  nome: string;
  tipo: string;
  contexto?: string | null;
  conteudo?: string;
  ativo?: boolean;
  exigeAssinatura?: boolean;
  formatoImpressao?: string;
  tags?: string[];
  tagsAutomaticas?: string[];
  tagsManuais?: string[];
  camposManuais?: CampoManual[];
};

type Aluno = {
  id: number;
  nome: string;
};

type Matricula = {
  id: number;
  aluno?: {
    id?: number | null;
    nome?: string | null;
  } | null;
};

type FormatoImpressao =
  | "A4_INTEIRA"
  | "DUAS_VIAS_A4";

function extrairLista<T>(
  data: any,
  chave: string
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[chave])) {
    return data[chave];
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizarTipo(
  valor?: string | null
) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function converterValorMonetario(
  valor?: string
) {
  const texto = String(valor || "")
    .trim();

  if (!texto) {
    return null;
  }

  let normalizado = texto;

  if (
    normalizado.includes(",") &&
    normalizado.includes(".")
  ) {
    normalizado = normalizado
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (
    normalizado.includes(",")
  ) {
    normalizado =
      normalizado.replace(",", ".");
  }

  const numero =
    Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : null;
}

export default function GerarDocumentoPage() {
  const searchParams =
    useSearchParams();

  const [templates, setTemplates] =
    useState<Template[]>([]);

  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [matriculas, setMatriculas] =
    useState<Matricula[]>([]);

  const [templateId, setTemplateId] =
    useState("");

  const [alunoId, setAlunoId] =
    useState("");

  const [matriculaId, setMatriculaId] =
    useState("");

  const [titulo, setTitulo] =
    useState("");

  const [
    dadosPreenchimento,
    setDadosPreenchimento,
  ] = useState<
    Record<string, string>
  >({});

  const [
    formatoImpressao,
    setFormatoImpressao,
  ] = useState<FormatoImpressao>(
    "A4_INTEIRA"
  );

  const [loading, setLoading] =
    useState(false);

  const [resultado, setResultado] =
    useState<any>(null);

  const [erro, setErro] =
    useState("");

  const templateSelecionado =
    templates.find(
      (item) =>
        item.id ===
        Number(templateId)
    ) || null;

  const tipoSelecionado =
    normalizarTipo(
      templateSelecionado?.tipo
    );

  const ehContratoSelecionado =
    tipoSelecionado.includes(
      "contrato"
    );

  const camposManuais =
    Array.isArray(
      templateSelecionado
        ?.camposManuais
    )
      ? templateSelecionado
          ?.camposManuais || []
      : [];

  useEffect(() => {
    void carregarDados();
  }, []);

  useEffect(() => {
    const matriculaIdUrl =
      searchParams.get(
        "matriculaId"
      );

    const id =
      Number(matriculaIdUrl);

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      setMatriculaId(
        String(id)
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (!templateSelecionado) {
      setDadosPreenchimento({});
      setFormatoImpressao(
        "A4_INTEIRA"
      );

      return;
    }

    const dadosIniciais:
      Record<string, string> = {};

    for (
      const campo of
      templateSelecionado
        .camposManuais || []
    ) {
      dadosIniciais[
        campo.tag
      ] = "";
    }

    setDadosPreenchimento(
      dadosIniciais
    );

    setFormatoImpressao(
      templateSelecionado
        .formatoImpressao ===
        "DUAS_VIAS_A4"
        ? "DUAS_VIAS_A4"
        : "A4_INTEIRA"
    );

    setTitulo("");
    setResultado(null);
    setErro("");
  }, [templateSelecionado?.id]);

  useEffect(() => {
    if (!matriculaId) {
      return;
    }

    const matricula =
      matriculas.find(
        (item) =>
          item.id ===
          Number(matriculaId)
      );

    const alunoDaMatricula =
      Number(
        matricula?.aluno?.id
      );

    if (
      Number.isInteger(
        alunoDaMatricula
      ) &&
      alunoDaMatricula > 0
    ) {
      setAlunoId(
        String(
          alunoDaMatricula
        )
      );
    }
  }, [
    matriculaId,
    matriculas,
  ]);

  async function carregarDados() {
    try {
      const [
        tRes,
        aRes,
        mRes,
      ] = await Promise.all([
        fetch(
          "/api/admin/documentos/templates?somenteAtivos=1",
          {
            credentials:
              "include",
            cache:
              "no-store",
          }
        ),

        fetch("/api/aluno", {
          credentials:
            "include",
          cache:
            "no-store",
        }),

        fetch("/api/matricula", {
          credentials:
            "include",
          cache:
            "no-store",
        }),
      ]);

      const tData =
        await tRes
          .json()
          .catch(() => null);

      const aData =
        await aRes
          .json()
          .catch(() => null);

      const mData =
        await mRes
          .json()
          .catch(() => null);

      setTemplates(
        extrairLista<Template>(
          tData,
          "templates"
        )
      );

      setAlunos(
        extrairLista<Aluno>(
          aData,
          "alunos"
        )
      );

      setMatriculas(
        extrairLista<Matricula>(
          mData,
          "matriculas"
        )
      );
    } catch (error) {
      console.error(
        "Erro ao carregar dados",
        error
      );

      setTemplates([]);
      setAlunos([]);
      setMatriculas([]);

      setErro(
        "Erro ao carregar dados para gerar documento."
      );
    }
  }

  function atualizarCampoManual(
    tag: string,
    valor: string
  ) {
    setDadosPreenchimento(
      (anterior) => ({
        ...anterior,
        [tag]: valor,
      })
    );
  }

  function obterValorFinanceiro() {
    const tagsFinanceiras = [
      "valorDocumento",
      "valorRecebido",
      "valor",
    ];

    for (
      const tag of
      tagsFinanceiras
    ) {
      const valor =
        converterValorMonetario(
          dadosPreenchimento[
            tag
          ]
        );

      if (
        valor !== null
      ) {
        return valor;
      }
    }

    return null;
  }

  async function gerarDocumento() {
    try {
      setLoading(true);
      setErro("");
      setResultado(null);

      if (!templateId) {
        setErro(
          "Selecione um template antes de gerar o documento."
        );

        return;
      }

      if (
        ehContratoSelecionado
      ) {
        if (!matriculaId) {
          setErro(
            "Selecione a matrícula do aluno para gerar o contrato."
          );

          return;
        }

        const matriculaNumero =
          Number(matriculaId);

        if (
          !Number.isInteger(
            matriculaNumero
          ) ||
          matriculaNumero <= 0
        ) {
          setErro(
            "A matrícula selecionada é inválida."
          );

          return;
        }

        window.open(
          `/api/admin/contratos/pdf?matriculaId=${matriculaNumero}`,
          "_blank",
          "noopener,noreferrer"
        );

        setResultado({
          titulo:
            templateSelecionado
              ?.nome ||
            "Contrato educacional",

          status:
            "ABERTO",

          conteudo:
            "O contrato oficial foi aberto pelo módulo de Contratos do PHANYX.",
        });

        return;
      }

      const quantidadeVias =
        formatoImpressao ===
        "DUAS_VIAS_A4"
          ? 2
          : 1;

      const res = await fetch(
        "/api/admin/documentos/gerar",
        {
          method: "POST",
          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            templateId:
              Number(templateId),

            alunoId:
              alunoId
                ? Number(
                    alunoId
                  )
                : null,

            matriculaId:
              matriculaId
                ? Number(
                    matriculaId
                  )
                : null,

            titulo,

            valor:
              obterValorFinanceiro(),

            dadosPreenchimento,

            formatoImpressao,

            quantidadeVias,
          }),
        }
      );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        setErro(
          data?.error ||
          "Erro ao gerar documento."
        );

        return;
      }

      setResultado(data);
    } catch (error) {
      console.error(error);

      setErro(
        "Erro ao gerar documento."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderizarCampoManual(
    campo: CampoManual
  ) {
    const valor =
      dadosPreenchimento[
        campo.tag
      ] || "";

    if (
      campo.tipo === "textarea"
    ) {
      return (
        <textarea
          className="phanyx-doc-input min-h-32 resize-y"
          value={valor}
          onChange={(evento) =>
            atualizarCampoManual(
              campo.tag,
              evento.target.value
            )
          }
          placeholder={
            campo.placeholder
          }
          rows={5}
        />
      );
    }

    if (
      campo.tipo === "select"
    ) {
      return (
        <select
          className="phanyx-doc-input"
          value={valor}
          onChange={(evento) =>
            atualizarCampoManual(
              campo.tag,
              evento.target.value
            )
          }
        >
          <option value="">
            Selecione
          </option>

          {(campo.opcoes || []).map(
            (opcao) => (
              <option
                key={opcao}
                value={opcao}
              >
                {opcao}
              </option>
            )
          )}
        </select>
      );
    }

    if (
      campo.tipo === "data"
    ) {
      return (
        <input
          type="date"
          className="phanyx-doc-input"
          value={valor}
          onChange={(evento) =>
            atualizarCampoManual(
              campo.tag,
              evento.target.value
            )
          }
        />
      );
    }

    if (
      campo.tipo === "moeda"
    ) {
      return (
        <input
          type="text"
          inputMode="decimal"
          className="phanyx-doc-input"
          value={valor}
          onChange={(evento) =>
            atualizarCampoManual(
              campo.tag,
              evento.target.value
            )
          }
          placeholder={
            campo.placeholder ||
            "Ex.: 150,00"
          }
        />
      );
    }

    return (
      <input
        type="text"
        className="phanyx-doc-input"
        value={valor}
        onChange={(evento) =>
          atualizarCampoManual(
            campo.tag,
            evento.target.value
          )
        }
        placeholder={
          campo.placeholder
        }
      />
    );
  }

  return (
    <div className="phanyx-docs-page space-y-6">
      <div>
        <h1 className="phanyx-doc-title text-2xl font-bold">
          📄 Emitir Documento
        </h1>

        <p className="phanyx-doc-muted mt-1 text-sm">
          Selecione o modelo oficial e preencha os dados específicos desta emissão.
        </p>
      </div>

      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo="Não foi possível gerar"
          mensagem={erro}
          onClose={() =>
            setErro("")
          }
        />
      )}

      <div className="phanyx-doc-card space-y-5 p-6">
        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            Modelo do documento
          </label>

          <select
            className="phanyx-doc-input"
            value={templateId}
            onChange={(evento) =>
              setTemplateId(
                evento.target.value
              )
            }
          >
            <option value="">
              Selecione
            </option>

            {templates.map(
              (template) => (
                <option
                  key={
                    template.id
                  }
                  value={
                    template.id
                  }
                >
                  {template.nome} (
                  {template.tipo})
                </option>
              )
            )}
          </select>
        </div>

        {templateSelecionado && (
          <div className="phanyx-doc-preview rounded-2xl p-4 text-sm">
            <p className="font-bold">
              {
                templateSelecionado.nome
              }
            </p>

            <p className="phanyx-doc-muted mt-1">
              Tipo:{" "}
              {
                templateSelecionado.tipo
              }
              {templateSelecionado
                .contexto
                ? ` • Contexto: ${templateSelecionado.contexto}`
                : ""}
            </p>
          </div>
        )}

        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            Aluno ou pessoa vinculada
          </label>

          <select
            className="phanyx-doc-input"
            value={alunoId}
            onChange={(evento) => {
              setAlunoId(
                evento.target.value
              );

              if (
                evento.target.value ===
                ""
              ) {
                setMatriculaId("");
              }
            }}
          >
            <option value="">
              Nenhum aluno selecionado
            </option>

            {alunos.map(
              (aluno) => (
                <option
                  key={aluno.id}
                  value={aluno.id}
                >
                  {aluno.nome}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="phanyx-doc-label mb-2 block text-sm">
            Matrícula
            {ehContratoSelecionado
              ? " (obrigatória para contrato)"
              : " (opcional)"}
          </label>

          <select
            className="phanyx-doc-input"
            value={matriculaId}
            onChange={(evento) =>
              setMatriculaId(
                evento.target.value
              )
            }
          >
            <option value="">
              {ehContratoSelecionado
                ? "Selecione a matrícula"
                : "Nenhuma"}
            </option>

            {matriculas.map(
              (matricula) => (
                <option
                  key={matricula.id}
                  value={matricula.id}
                >
                  #{matricula.id} -{" "}
                  {matricula.aluno
                    ?.nome ||
                    "Aluno sem nome"}
                </option>
              )
            )}
          </select>
        </div>

        {!ehContratoSelecionado &&
          camposManuais.length >
            0 && (
            <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div>
                <h2 className="phanyx-doc-section-title text-base font-bold">
                  Informações desta emissão
                </h2>

                <p className="phanyx-doc-muted mt-1 text-sm">
                  Estes campos serão inseridos nas tags correspondentes do modelo.
                </p>
              </div>

              {camposManuais.map(
                (campo) => (
                  <div
                    key={
                      campo.tag
                    }
                  >
                    <label className="phanyx-doc-label mb-2 block text-sm">
                      {
                        campo.label
                      }
                    </label>

                    {renderizarCampoManual(
                      campo
                    )}
                  </div>
                )
              )}
            </div>
          )}

        {!ehContratoSelecionado &&
          templateSelecionado &&
          camposManuais.length ===
            0 && (
            <div className="phanyx-doc-preview rounded-2xl p-4 text-sm">
              Este modelo não possui campos de preenchimento manual. Os dados serão preenchidos automaticamente pelo PHANYX.
            </div>
          )}

        {!ehContratoSelecionado && (
          <div>
            <label className="phanyx-doc-label mb-2 block text-sm">
              Complemento do título
              (opcional)
            </label>

            <input
              type="text"
              className="phanyx-doc-input"
              value={titulo}
              onChange={(evento) =>
                setTitulo(
                  evento.target.value
                )
              }
              placeholder="Ex.: Serviço realizado em agosto de 2026"
            />
          </div>
        )}

        {!ehContratoSelecionado && (
          <div className="space-y-3">
            <div>
              <h2 className="phanyx-doc-section-title text-base font-bold">
                Formato de impressão
              </h2>

              <p className="phanyx-doc-muted mt-1 text-sm">
                Escolha como o documento será organizado na folha A4.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="phanyx-doc-preview flex cursor-pointer items-start gap-3 rounded-2xl p-4">
                <input
                  type="radio"
                  name="formatoImpressao"
                  value="A4_INTEIRA"
                  checked={
                    formatoImpressao ===
                    "A4_INTEIRA"
                  }
                  onChange={() =>
                    setFormatoImpressao(
                      "A4_INTEIRA"
                    )
                  }
                  className="mt-1"
                />

                <span>
                  <strong className="block">
                    Uma via
                  </strong>

                  <span className="phanyx-doc-muted mt-1 block text-sm">
                    Um documento ocupando uma folha A4 inteira.
                  </span>
                </span>
              </label>

              <label className="phanyx-doc-preview flex cursor-pointer items-start gap-3 rounded-2xl p-4">
                <input
                  type="radio"
                  name="formatoImpressao"
                  value="DUAS_VIAS_A4"
                  checked={
                    formatoImpressao ===
                    "DUAS_VIAS_A4"
                  }
                  onChange={() =>
                    setFormatoImpressao(
                      "DUAS_VIAS_A4"
                    )
                  }
                  className="mt-1"
                />

                <span>
                  <strong className="block">
                    Duas vias
                  </strong>

                  <span className="phanyx-doc-muted mt-1 block text-sm">
                    Via do interessado e via da instituição na mesma folha A4.
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={
              gerarDocumento
            }
            disabled={
              loading
            }
            className="phanyx-doc-primary-action disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Gerando..."
              : ehContratoSelecionado
                ? "Abrir contrato oficial"
                : "Gerar Documento"}
          </button>
        </div>
      </div>

      {resultado && (
        <div className="phanyx-doc-card space-y-4 p-6">
          <h2 className="phanyx-doc-section-title text-xl font-bold">
            Documento Gerado
          </h2>

          <p className="phanyx-doc-value">
            <b>ID:</b>{" "}
            {resultado.id ||
              resultado
                .documento?.id ||
              "-"}
          </p>

          <p className="phanyx-doc-value">
            <b>Título:</b>{" "}
            {resultado.titulo ||
              resultado
                .documento
                ?.titulo ||
              "-"}
          </p>

          <p className="phanyx-doc-value">
            <b>Status:</b>{" "}
            {resultado.status ||
              resultado
                .documento
                ?.status ||
              "-"}
          </p>

          <div className="phanyx-doc-preview whitespace-pre-wrap p-4 text-sm leading-7">
            {resultado.conteudo ||
              resultado
                .documento
                ?.conteudo ||
              "Documento gerado, mas nenhum conteúdo foi retornado para pré-visualização."}
          </div>

          {(resultado.id ||
            resultado.documento
              ?.id) && (
            <div className="flex justify-end">
              <button
                type="button"
                className="phanyx-doc-primary-action"
                onClick={() => {
                  const documentoId =
                    resultado.id ||
                    resultado
                      .documento
                      ?.id;

                  window.open(
                    `/api/admin/documentos/pdf/${documentoId}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Abrir PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}