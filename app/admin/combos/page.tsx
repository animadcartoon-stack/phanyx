"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import withAuth from "@/lib/withAuth";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import CamposPlanosPagamento, { planosParaFormulario, type PlanoPagamentoFormulario } from "@/components/admin/CamposPlanosPagamento";
import type { ConfiguracaoPlanosPagamento } from "@/lib/matriculas/planos-pagamento";

type Curso = {
  id: number;
  nome: string;
  ativo: boolean;
  participaCombo: boolean;
  valorMensalidadeCombo: string | null;
};
type Combo = {
  id: number;
  nome: string;
  ativo: boolean;
  minimoModalidades: number;
  maximoModalidades: number | null;
  modoPreco: "FIXO" | "SOMA" | "PERCENTUAL";
  descontoPercentual: string | null;
  valorMatricula: string;
  valorMensalidade: string | null;
  quantidadeParcelas: number;
  cursoIds: number[];
  planosPagamento?: ConfiguracaoPlanosPagamento | null;
  totalMatriculasVinculadas: number;
  updatedAt: string;
};
const novo = () => ({
  id: null as number | null,
  nome: "",
  ativo: true,
  minimoModalidades: "3",
  maximoModalidades: "",
  modoPreco: "FIXO" as "FIXO" | "SOMA" | "PERCENTUAL",
  descontoPercentual: "",
  valorMatricula: "",
  valorMensalidade: "",
  quantidadeParcelas: "12",
  cursoIds: [] as number[],
  planosPagamento: [] as PlanoPagamentoFormulario[],
  versao: "",
});
const input =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

function CombosPage() {
  const t = useTranslations("EnrollmentCombos");
  const locale = useLocale();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [form, setForm] = useState(novo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [confirmacaoCombo, setConfirmacaoCombo] = useState<{ combo: Combo; acao: "EXCLUIR" | "DESATIVAR" } | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const traduzirErro = (codigo?: string) =>
    t.has(`errors.${codigo}`)
      ? t(`errors.${codigo}`)
      : t("errors.ERRO_INTERNO");

  async function carregar() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/combos", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(traduzirErro(data.codigo));
      setCursos(data.cursos);
      setCombos(data.combos);
    } catch (error) {
      setErro(error instanceof Error ? error.message : traduzirErro());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMensagem("");
    try {
      const { id, versao, ...campos } = form;
      const res = await fetch("/api/admin/combos", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campos,
          ...(id ? { id, versao } : {}),
          minimoModalidades: Number(form.minimoModalidades),
          maximoModalidades: form.maximoModalidades
            ? Number(form.maximoModalidades)
            : null,
          valorMensalidade:
            form.modoPreco === "FIXO" ? form.valorMensalidade : null,
          descontoPercentual:
            form.modoPreco === "PERCENTUAL" ? form.descontoPercentual : null,
          quantidadeParcelas: Number(form.quantidadeParcelas),
          // Cadastro de oferta apenas. Nenhuma cobranca e criada nesta operacao.
          planosPagamento: form.planosPagamento.length ? {
            versao: 1,
            planos: form.planosPagamento.map(p => ({
              ...p,
              quantidadeParcelas: Number(p.quantidadeParcelas),
              valorParcela: p.valorParcela.replace(',', '.'),
              valorAntecipacao: p.valorAntecipacao.replace(',', '.'),
              ajustes: p.ajustes.map(a => ({ numero: Number(a.numero), valor: a.valor.replace(',', '.') })),
            })),
          } : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.codigo === "PLANOS_PAGAMENTO_INVALIDOS" ? data.error : traduzirErro(data.codigo));
      setForm(novo());
      setMensagem(t("saved"));
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : traduzirErro());
    } finally {
      setSaving(false);
    }
  }
  async function executarAcaoCombo() {
    if (!confirmacaoCombo || processandoAcao) return;
    const { combo, acao } = confirmacaoCombo;
    setProcessandoAcao(true);
    setErro("");
    setMensagem("");
    try {
      const res = await fetch("/api/admin/combos", {
        method: acao === "EXCLUIR" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: combo.id, versao: combo.updatedAt }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.codigo === "COMBO_EM_USO") {
          await carregar();
          throw new Error("Este pacote possui matrículas ou contratos vinculados e não pode ser excluído. Desative-o para impedir novas contratações.");
        }
        if (data.codigo === "DADOS_ALTERADOS") {
          await carregar();
          throw new Error("Este pacote foi alterado por outra pessoa. A lista foi atualizada; tente novamente.");
        }
        if (data.codigo === "COMBO_NAO_ENCONTRADO") {
          await carregar();
          throw new Error("O pacote não foi encontrado nesta instituição. A lista foi atualizada.");
        }
        throw new Error(traduzirErro(data.codigo));
      }
      if (form.id === combo.id) setForm(novo());
      setConfirmacaoCombo(null);
      await carregar();
      setMensagem(acao === "EXCLUIR"
        ? "Pacote sem vínculos excluído com segurança."
        : "Pacote desativado. Matrículas, contratos e cobranças foram preservados.");
    } catch (error) {
      setConfirmacaoCombo(null);
      setErro(error instanceof Error ? error.message : traduzirErro());
    } finally {
      setProcessandoAcao(false);
    }
  }
  function editar(combo: Combo) {
    setForm({
      id: combo.id,
      nome: combo.nome,
      ativo: combo.ativo,
      minimoModalidades: String(combo.minimoModalidades),
      maximoModalidades:
        combo.maximoModalidades === null ? "" : String(combo.maximoModalidades),
      modoPreco: combo.modoPreco,
      descontoPercentual:
        combo.descontoPercentual == null
          ? ""
          : String(combo.descontoPercentual),
      valorMatricula: String(combo.valorMatricula),
      valorMensalidade:
        combo.valorMensalidade === null ? "" : String(combo.valorMensalidade),
      quantidadeParcelas: String(combo.quantidadeParcelas),
      cursoIds: combo.cursoIds,
      planosPagamento: planosParaFormulario(combo.planosPagamento),
      versao: combo.updatedAt,
    });
    document
      .getElementById("combo-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  const moeda = (valor: string | null) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  return (
    <main className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("manageCombos")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            {t("configHelp")}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/cursos" className="underline">
            {t("courses")}
          </Link>
          <Link href="/admin/matriculas/modalidades" className="underline">
            {t("enroll")}
          </Link>
        </div>
      </div>
      {mensagem && (
        <p
          role="status"
          className="rounded-xl bg-emerald-100 p-3 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100"
        >
          {mensagem}
        </p>
      )}
      <form
        id="combo-form"
        onSubmit={salvar}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 className="text-lg font-semibold">
          {form.id ? t("editCombo") : t("newCombo")}
        </h2>
        <fieldset
          disabled={saving || loading}
          className="grid gap-4 md:grid-cols-2 disabled:opacity-60"
        >
          <label>
            {t("name")}
            <input
              required
              maxLength={120}
              className={input}
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </label>
          <label>
            {t("pricingMode")}
            <select
              className={input}
              value={form.modoPreco}
              onChange={(e) =>
                setForm({
                  ...form,
                  modoPreco: e.target.value as "FIXO" | "SOMA" | "PERCENTUAL",
                })
              }
            >
              <option value="FIXO">{t("fixed")}</option>
              <option value="SOMA">{t("sum")}</option>
              <option value="PERCENTUAL">{t("percentage")}</option>
            </select>
          </label>
          <label>
            {t("minimum")}
            <input
              required
              type="number"
              min="2"
              max="100"
              className={input}
              value={form.minimoModalidades}
              onChange={(e) =>
                setForm({ ...form, minimoModalidades: e.target.value })
              }
            />
          </label>
          <label>
            {t("maximum")}
            <input
              type="number"
              min={form.minimoModalidades || 2}
              max="100"
              className={input}
              value={form.maximoModalidades}
              onChange={(e) =>
                setForm({ ...form, maximoModalidades: e.target.value })
              }
            />
          </label>
          <label>
            {t("singleEnrollmentFee")}
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className={input}
              value={form.valorMatricula}
              onChange={(e) =>
                setForm({ ...form, valorMatricula: e.target.value })
              }
            />
          </label>
          {form.modoPreco === "PERCENTUAL" && (
            <label>
              {t("discountPercent")}
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.01"
                className={input}
                value={form.descontoPercentual}
                onChange={(e) =>
                  setForm({ ...form, descontoPercentual: e.target.value })
                }
              />
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                {t("percentageHelp")}
              </span>
            </label>
          )}
          {form.modoPreco === "FIXO" && (
            <label>
              {t("packageMonthly")}
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={input}
                value={form.valorMensalidade}
                onChange={(e) =>
                  setForm({ ...form, valorMensalidade: e.target.value })
                }
              />
            </label>
          )}
          <label>
            {t("installments")}
            <input
              required
              type="number"
              min="1"
              max="120"
              className={input}
              value={form.quantidadeParcelas}
              onChange={(e) =>
                setForm({ ...form, quantidadeParcelas: e.target.value })
              }
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            {t("active")}
          </label>
          <div className="md:col-span-2">
            <h3 className="font-semibold">{t("eligibleCourses")}</h3>
            <p className="my-2 text-sm text-slate-600 dark:text-slate-300">
              {t("eligibleHelp")}
            </p>
            <div className="grid max-h-80 gap-2 overflow-y-auto md:grid-cols-2">
              {cursos.map((c) => {
                const indisponivel = !c.ativo || !c.participaCombo;
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.cursoIds.includes(c.id)}
                      disabled={indisponivel && !form.cursoIds.includes(c.id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cursoIds: e.target.checked
                            ? [...form.cursoIds, c.id]
                            : form.cursoIds.filter((id) => id !== c.id),
                        })
                      }
                    />
                    <span>
                      {c.nome}
                      {indisponivel && (
                        <span className="ml-2 text-xs text-amber-800 dark:text-amber-200">
                          {t("enableInCourse")}
                        </span>
                      )}
                      {form.modoPreco === "SOMA" && (
                        <span className="ml-2 text-xs">
                          {c.valorMensalidadeCombo === null
                            ? t("missingPrice")
                            : moeda(c.valorMensalidadeCombo)}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <strong>Planos personalizados do combo (opcional).</strong> Cadastre valores e antecipacao para este pacote.
              A escolha e as cobrancas so serao liberadas depois da homologacao da proxima etapa.
              Sem plano selecionado, permanece a regra financeira tradicional do combo.
            </p>
            <CamposPlanosPagamento
              planos={form.planosPagamento}
              onChange={planosPagamento => setForm(atual => ({ ...atual, planosPagamento }))}
              disabled={saving || loading}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 md:col-span-2">
            {t("rulesHelp")}
          </p>
          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white"
            >
              {saving ? t("saving") : t("save")}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(novo())}
                className="rounded-lg border border-slate-400 px-4 py-2"
              >
                {t("cancel")}
              </button>
            )}
          </div>
        </fieldset>
      </form>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("registeredCombos")}</h2>
        {loading ? (
          <p>{t("loading")}</p>
        ) : combos.length === 0 ? (
          <p>{t("noCombos")}</p>
        ) : (
          combos.map((c) => (
            <article
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div>
                <h3 className="font-semibold">
                  {c.nome} · {c.ativo ? t("active") : t("inactive")}
                </h3>
                <p className="mt-1 text-sm">
                  {t("minimum")}: {c.minimoModalidades} · {t("maximum")}:{" "}
                  {c.maximoModalidades ?? t("unlimited")} · {t("installments")}:{" "}
                  {c.quantidadeParcelas}
                </p>
                <p className="mt-1 text-sm">
                  {t("enrollmentFee")}: {moeda(c.valorMatricula)} ·{" "}
                  {c.modoPreco === "FIXO"
                    ? `${t("monthly")}: ${moeda(c.valorMensalidade)}`
                    : c.modoPreco === "PERCENTUAL"
                      ? `${t("discountPercent")}: ${c.descontoPercentual}%`
                      : t("sum")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={saving || processandoAcao}
                  onClick={() => editar(c)}
                  className="rounded-lg border border-slate-400 px-4 py-2 disabled:opacity-50"
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  disabled={saving || processandoAcao || c.totalMatriculasVinculadas > 0}
                  title={c.totalMatriculasVinculadas > 0 ? "Exclusão bloqueada: o pacote já possui matrículas ou contratos." : "Excluir pacote sem vínculos"}
                  onClick={() => setConfirmacaoCombo({ combo: c, acao: "EXCLUIR" })}
                  className="rounded-lg border border-red-500 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950"
                >
                  Excluir
                </button>
                {c.ativo && c.totalMatriculasVinculadas > 0 && (
                  <button
                    type="button"
                    disabled={saving || processandoAcao}
                    onClick={() => setConfirmacaoCombo({ combo: c, acao: "DESATIVAR" })}
                    className="rounded-lg border border-amber-500 px-4 py-2 font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-200 dark:hover:bg-amber-950"
                  >
                    Desativar
                  </button>
                )}
                {c.totalMatriculasVinculadas > 0 && (
                  <p className="w-full text-xs text-amber-800 dark:text-amber-200">
                    {c.totalMatriculasVinculadas} matrícula(s) vinculada(s). Exclusão protegida.
                  </p>
                )}
              </div>
            </article>
          ))
        )}
      </section>
      <PhanyxConfirmModal
        aberto={Boolean(confirmacaoCombo)}
        titulo={confirmacaoCombo?.acao === "EXCLUIR" ? "Excluir pacote?" : "Desativar pacote?"}
        mensagem={confirmacaoCombo?.acao === "EXCLUIR"
          ? `Excluir definitivamente o pacote “${confirmacaoCombo?.combo.nome ?? ""}”? Esta ação só será permitida se não houver matrículas ou contratos vinculados.`
          : `Desativar o pacote “${confirmacaoCombo?.combo.nome ?? ""}”? Novas contratações serão impedidas, mas todo o histórico será preservado.`}
        textoConfirmar={confirmacaoCombo?.acao === "EXCLUIR" ? "Sim, excluir" : "Sim, desativar"}
        textoCancelar="Cancelar"
        tipo={confirmacaoCombo?.acao === "EXCLUIR" ? "perigo" : "normal"}
        carregando={processandoAcao}
        onConfirmar={() => { void executarAcaoCombo(); }}
        onCancelar={() => { if (!processandoAcao) setConfirmacaoCombo(null); }}
      />
      <PhanyxConfirmModal
        aberto={Boolean(erro)}
        titulo={t("attention")}
        mensagem={erro}
        textoConfirmar={t("ok")}
        mostrarCancelar={false}
        onConfirmar={() => setErro("")}
        onCancelar={() => setErro("")}
      />
    </main>
  );
}
export default withAuth(CombosPage, ["admin"]);
