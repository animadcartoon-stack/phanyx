"use client";

import { FormEvent, useEffect, useState } from "react";
import PhanyxToast from "@/components/ui/PhanyxToast";
import Link from "next/link";

type PlanoComissao = {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  inicioVigencia?: string | null;
  fimVigencia?: string | null;
  exigePagamentoConfirmado: boolean;
  permiteCompartilhamento: boolean;

  resumo?: {
    vigente: boolean;
    configurado: boolean;
    quantidadeRegras: number;
    quantidadeRegrasAtivas: number;
    quantidadeVendedoresAtivos: number;
    quantidadeVinculos: number;
    quantidadeLancamentos: number;
  };
};

type PlanoForm = {
  nome: string;
  descricao: string;
  inicioVigencia: string;
  fimVigencia: string;
  ativo: boolean;
  exigePagamentoConfirmado: boolean;
  permiteCompartilhamento: boolean;
};

const FORM_INICIAL: PlanoForm = {
  nome: "",
  descricao: "",
  inicioVigencia: "",
  fimVigencia: "",
  ativo: true,
  exigePagamentoConfirmado: true,
  permiteCompartilhamento: false,
};

function formatarData(valor?: string | null) {
  if (!valor) return "Sem limite";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data inválida";
  }

  return data.toLocaleDateString("pt-BR");
}

export default function ConfiguracoesComerciaisPage() {
  const [planos, setPlanos] = useState<PlanoComissao[]>([]);
  const [form, setForm] = useState<PlanoForm>(FORM_INICIAL);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [toast, setToast] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);

  async function carregarPlanos() {
    try {
      setCarregando(true);

      const resposta = await fetch(
        "/api/admin/comercial/planos-comissao",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível carregar os planos de comissão."
        );
      }

      setPlanos(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      setPlanos([]);

      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          "Não foi possível carregar os planos de comissão.",
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPlanos();
  }, []);

  async function criarPlano(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!form.nome.trim()) {
      setToast({
        tipo: "erro",
        mensagem: "Informe o nome do plano de comissão.",
      });

      return;
    }

    try {
      setSalvando(true);

      const resposta = await fetch(
        "/api/admin/comercial/planos-comissao",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
            descricao: form.descricao.trim() || null,
            inicioVigencia: form.inicioVigencia || null,
            fimVigencia: form.fimVigencia || null,
            ativo: form.ativo,
            exigePagamentoConfirmado:
              form.exigePagamentoConfirmado,
            permiteCompartilhamento:
              form.permiteCompartilhamento,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível criar o plano de comissão."
        );
      }

      setForm(FORM_INICIAL);

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          "Plano de comissão criado com sucesso.",
      });

      await carregarPlanos();
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          "Não foi possível criar o plano de comissão.",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-comercial-config-page mx-auto w-full max-w-7xl space-y-7 p-6 lg:p-8">
      {toast && (
        <PhanyxToast
          tipo={toast.tipo}
          mensagem={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}

      <header>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
          Comercial
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
          ⚙️ Planos de comissão
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Defina como as vendas serão avaliadas antes de gerar
          comissão para os vendedores.
        </p>
      </header>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Novo plano de comissão
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Criar o plano não libera vendedores imediatamente. O
            plano ainda precisará ter regras ativas e vendedores
            vinculados.
          </p>
        </div>

        <form
          onSubmit={criarPlano}
          className="mt-6 space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Nome do plano
              </label>

              <input
                value={form.nome}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    nome: evento.target.value,
                  }))
                }
                placeholder="Ex.: Comissão vendedores 2026"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Descrição
              </label>

              <input
                value={form.descricao}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    descricao: evento.target.value,
                  }))
                }
                placeholder="Ex.: Plano padrão da equipe comercial"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Início da vigência
              </label>

              <input
                type="date"
                value={form.inicioVigencia}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    inicioVigencia: evento.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Fim da vigência
              </label>

              <input
                type="date"
                value={form.fimVigencia}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    fimVigencia: evento.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    ativo: evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm text-slate-950 dark:text-white">
                  Plano ativo
                </strong>

                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400">
                  Permite que o plano seja usado durante sua
                  vigência.
                </span>
              </span>
            </label>

            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.exigePagamentoConfirmado}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    exigePagamentoConfirmado:
                      evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm text-slate-950 dark:text-white">
                  Exigir pagamento confirmado
                </strong>

                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400">
                  A matrícula sozinha não torna a comissão
                  elegível.
                </span>
              </span>
            </label>

            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.permiteCompartilhamento}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    permiteCompartilhamento:
                      evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm text-slate-950 dark:text-white">
                  Permitir venda compartilhada
                </strong>

                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400">
                  Permite dividir uma comissão entre vendedores
                  participantes.
                </span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando
              ? "Criando plano..."
              : "Criar plano de comissão"}
          </button>
        </form>
      </section>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Planos cadastrados
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Um plano só fica pronto quando possui pelo menos uma
            regra ativa.
          </p>
        </div>

        {carregando ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            Carregando planos...
          </div>
        ) : planos.length === 0 ? (
          <div className="phanyx-comercial-config-empty mt-6 rounded-2xl border border-dashed p-8 text-center">
            <p className="font-bold text-slate-950 dark:text-white">
              Nenhum plano cadastrado
            </p>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Cadastre o primeiro plano usando o formulário acima.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {planos.map((plano) => (
              <article
                key={plano.id}
                className="phanyx-comercial-config-plan-card rounded-3xl border p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 dark:text-white">
                      {plano.nome}
                    </h3>

                    <p className="phanyx-comercial-config-plan-description mt-1 text-sm">
  {plano.descricao || "Sem descrição cadastrada."}
</p>
                  </div>

                  <span
  className={[
    "phanyx-comercial-config-status rounded-full border px-3 py-1 text-xs font-black",
    plano.resumo?.configurado
      ? "phanyx-comercial-config-status-ok"
      : "phanyx-comercial-config-status-pendente",
  ].join(" ")}
>
  {plano.resumo?.configurado
    ? "Configurado"
    : "Configuração pendente"}
</span>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Vigência
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {formatarData(plano.inicioVigencia)}
                      {" até "}
                      {formatarData(plano.fimVigencia)}
                    </dd>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Regras ativas
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {plano.resumo?.quantidadeRegrasAtivas ?? 0}
                    </dd>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Vendedores vinculados
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {plano.resumo?.quantidadeVendedoresAtivos ?? 0}
                    </dd>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Pagamento confirmado
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {plano.exigePagamentoConfirmado
                        ? "Obrigatório"
                        : "Não obrigatório"}
                    </dd>
                  </div>
                </dl>

                {!plano.resumo?.configurado && (
                  <div className="phanyx-comercial-config-warning mt-4 rounded-2xl border px-4 py-3 text-sm">
                    Este plano ainda não libera vendedores porque
                    não possui regra ativa.
                  </div>
                )}

<div className="mt-4">
  <Link
    href={`/admin/comercial/configuracoes/planos/${plano.id}`}
    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
  >
    ⚙️ Configurar regras
  </Link>
</div>

              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}