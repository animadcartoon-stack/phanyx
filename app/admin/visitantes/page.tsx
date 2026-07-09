"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";

type StatusVisitante =
  | "AGUARDANDO"
  | "DENTRO"
  | "SAIU"
  | "CANCELADO"
  | "BLOQUEADO";

type Visitante = {
  id: number;
  nome: string;
  documentoTipo?: string | null;
  documentoNumero?: string | null;
  telefone?: string | null;
  email?: string | null;
  empresa?: string | null;
  destino?: string | null;
  pessoaVisitada?: string | null;
  setorVisitado?: string | null;
  motivo?: string | null;
  evento?: string | null;
  fotoPerfil?: string | null;
  codigoVisitante: string;
  codigoCracha?: string | null;
  status: StatusVisitante;
  entradaPrevistaEm?: string | null;
  entradaEm?: string | null;
  saidaPrevistaEm?: string | null;
  saidaEm?: string | null;
  crachaEmitidoEm?: string | null;
  crachaValidoAte?: string | null;
  observacoes?: string | null;
};

type FormVisitante = {
  nome: string;
  documentoTipo: string;
  documentoNumero: string;
  telefone: string;
  email: string;
  empresa: string;
  destino: string;
  pessoaVisitada: string;
  setorVisitado: string;
  motivo: string;
  evento: string;
  fotoPerfil: string;
  status: StatusVisitante;
  entradaPrevistaEm: string;
  saidaPrevistaEm: string;
  crachaValidoAte: string;
  observacoes: string;
};

const formInicial: FormVisitante = {
  nome: "",
  documentoTipo: "CPF",
  documentoNumero: "",
  telefone: "",
  email: "",
  empresa: "",
  destino: "",
  pessoaVisitada: "",
  setorVisitado: "",
  motivo: "",
  evento: "",
  fotoPerfil: "",
  status: "AGUARDANDO",
  entradaPrevistaEm: "",
  saidaPrevistaEm: "",
  crachaValidoAte: "",
  observacoes: "",
};

function dataParaInput(valor?: string | null) {
  if (!valor) return "";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "";

  return data.toISOString().slice(0, 16);
}

function formatarData(valor?: string | null) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleString("pt-BR");
}

function classeStatus(status: StatusVisitante) {
  if (status === "DENTRO") {
    return "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300";
  }

  if (status === "SAIU") {
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
  }

  if (status === "CANCELADO" || status === "BLOQUEADO") {
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300";
}

function AdminVisitantesPage() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [form, setForm] = useState<FormVisitante>(formInicial);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [eventoFiltro, setEventoFiltro] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const totalDentro = useMemo(
    () => visitantes.filter((v) => v.status === "DENTRO").length,
    [visitantes]
  );

  const totalAguardando = useMemo(
    () => visitantes.filter((v) => v.status === "AGUARDANDO").length,
    [visitantes]
  );

  const totalSemFoto = useMemo(
    () => visitantes.filter((v) => !v.fotoPerfil).length,
    [visitantes]
  );

  function atualizarForm(campo: keyof FormVisitante, valor: string) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function carregarVisitantes() {
    try {
      setCarregando(true);

      const params = new URLSearchParams();

      if (busca.trim()) params.set("busca", busca.trim());
      if (statusFiltro) params.set("status", statusFiltro);
      if (eventoFiltro.trim()) params.set("evento", eventoFiltro.trim());

      const res = await fetch(`/api/admin/visitantes?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar visitantes.");
      }

      setVisitantes(Array.isArray(data.visitantes) ? data.visitantes : []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar visitantes.");
    } finally {
      setCarregando(false);
    }
  }

  async function enviarFotoVisitante(arquivo: File | null) {
    if (!arquivo) return;

    const tiposPermitidos = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      setErro("Formato inválido. Envie uma foto em JPG, JPEG, PNG ou WEBP.");
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro("Foto muito grande. Envie uma foto com no máximo 2 MB.");
      return;
    }

    try {
      setEnviandoFoto(true);
      setErro("");
      setSucesso("");

      const formData = new FormData();
      formData.append("file", arquivo);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao enviar foto.");
      }

      const url =
        data?.url ||
        data?.fileUrl ||
        data?.arquivoUrl ||
        data?.publicUrl;

      if (!url) {
        throw new Error("Upload realizado, mas a URL da foto não retornou.");
      }

      atualizarForm("fotoPerfil", url);
      setSucesso("Foto do visitante enviada com sucesso.");
    } catch (e: any) {
      setErro(e.message || "Erro ao enviar foto do visitante.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  function iniciarEdicao(visitante: Visitante) {
    setEditandoId(visitante.id);

    setForm({
      nome: visitante.nome || "",
      documentoTipo: visitante.documentoTipo || "CPF",
      documentoNumero: visitante.documentoNumero || "",
      telefone: visitante.telefone || "",
      email: visitante.email || "",
      empresa: visitante.empresa || "",
      destino: visitante.destino || "",
      pessoaVisitada: visitante.pessoaVisitada || "",
      setorVisitado: visitante.setorVisitado || "",
      motivo: visitante.motivo || "",
      evento: visitante.evento || "",
      fotoPerfil: visitante.fotoPerfil || "",
      status: visitante.status || "AGUARDANDO",
      entradaPrevistaEm: dataParaInput(visitante.entradaPrevistaEm),
      saidaPrevistaEm: dataParaInput(visitante.saidaPrevistaEm),
      crachaValidoAte: dataParaInput(visitante.crachaValidoAte),
      observacoes: visitante.observacoes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limparFormulario() {
    setEditandoId(null);
    setForm(formInicial);
  }

  async function salvarVisitante(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      setErro("Informe o nome do visitante.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const url = editandoId
        ? `/api/admin/visitantes/${editandoId}`
        : "/api/admin/visitantes";

      const res = await fetch(url, {
        method: editandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar visitante.");
      }

      setSucesso(
        editandoId
          ? "Visitante atualizado com sucesso."
          : "Visitante cadastrado com sucesso."
      );

      limparFormulario();
      await carregarVisitantes();
    } catch (e: any) {
      setErro(e.message || "Erro ao salvar visitante.");
    } finally {
      setSalvando(false);
    }
  }

  async function executarAcaoVisitante(
    visitanteId: number,
    acao: "REGISTRAR_ENTRADA" | "REGISTRAR_SAIDA" | "CANCELAR" | "BLOQUEAR"
  ) {
    try {
      setErro("");
      setSucesso("");

      const res = await fetch(`/api/admin/visitantes/${visitanteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ acao }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao alterar visitante.");
      }

      const mensagens = {
        REGISTRAR_ENTRADA: "Entrada registrada com sucesso.",
        REGISTRAR_SAIDA: "Saída registrada com sucesso.",
        CANCELAR: "Visitante cancelado com sucesso.",
        BLOQUEAR: "Visitante bloqueado com sucesso.",
      };

      setSucesso(mensagens[acao]);
      await carregarVisitantes();
    } catch (e: any) {
      setErro(e.message || "Erro ao alterar visitante.");
    }
  }

  useEffect(() => {
    carregarVisitantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="phanyx-visitantes-page min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo="Não foi possível concluir"
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      {sucesso && (
        <PhanyxToast
          tipo="sucesso"
          titulo="Tudo certo"
          mensagem={sucesso}
          onClose={() => setSucesso("")}
        />
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
            PHANYX Controle de Acesso
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            Visitantes
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600 dark:text-slate-400">
            Cadastro temporário para portaria, recepção, eventos, fornecedores,
            palestrantes e emissão de crachás provisórios.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Dentro da instituição
            </p>
            <strong className="mt-2 block text-3xl text-green-600 dark:text-green-300">
              {totalDentro}
            </strong>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Aguardando entrada
            </p>
            <strong className="mt-2 block text-3xl text-yellow-600 dark:text-yellow-300">
              {totalAguardando}
            </strong>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Sem foto oficial
            </p>
            <strong className="mt-2 block text-3xl text-red-600 dark:text-red-300">
              {totalSemFoto}
            </strong>
          </div>
        </div>

        <form
          onSubmit={salvarVisitante}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                {editandoId ? "Editar visitante" : "Novo visitante"}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Visitantes não recebem login. Este cadastro é apenas para
                controle de acesso e crachá.
              </p>
            </div>

            {editandoId && (
              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar edição
              </button>
            )}
          </div>

          <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                {form.fotoPerfil ? (
                  <img
                    src={form.fotoPerfil}
                    alt={form.nome || "Foto do visitante"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-400">
                    {form.nome?.charAt(0)?.toUpperCase() || "V"}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-slate-950 dark:text-white">
                  Foto do visitante
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Usada em crachás provisórios e identificação na portaria.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                    {enviandoFoto ? "Enviando..." : "Enviar foto"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      disabled={enviandoFoto}
                      onChange={(e) =>
                        enviarFotoVisitante(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>

                  {form.fotoPerfil && (
                    <button
                      type="button"
                      onClick={() => atualizarForm("fotoPerfil", "")}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nome do visitante *
              </span>
              <input
                value={form.nome}
                onChange={(e) => atualizarForm("nome", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Status
              </span>
              <select
                value={form.status}
                onChange={(e) =>
                  atualizarForm("status", e.target.value as StatusVisitante)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="AGUARDANDO">Aguardando</option>
                <option value="DENTRO">Dentro</option>
                <option value="SAIU">Saiu</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tipo de documento
              </span>
              <select
                value={form.documentoTipo}
                onChange={(e) => atualizarForm("documentoTipo", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="CPF">CPF</option>
                <option value="RG">RG</option>
                <option value="CNH">CNH</option>
                <option value="PASSAPORTE">Passaporte</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nº documento
              </span>
              <input
                value={form.documentoNumero}
                onChange={(e) =>
                  atualizarForm("documentoNumero", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Telefone
              </span>
              <input
                value={form.telefone}
                onChange={(e) => atualizarForm("telefone", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => atualizarForm("email", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Empresa / organização
              </span>
              <input
                value={form.empresa}
                onChange={(e) => atualizarForm("empresa", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Destino
              </span>
              <input
                value={form.destino}
                onChange={(e) => atualizarForm("destino", e.target.value)}
                placeholder="Ex.: Diretoria, Secretaria, Biblioteca"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pessoa visitada
              </span>
              <input
                value={form.pessoaVisitada}
                onChange={(e) =>
                  atualizarForm("pessoaVisitada", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Setor visitado
              </span>
              <input
                value={form.setorVisitado}
                onChange={(e) =>
                  atualizarForm("setorVisitado", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Evento
              </span>
              <input
                value={form.evento}
                onChange={(e) => atualizarForm("evento", e.target.value)}
                placeholder="Ex.: Congresso, culto, reunião"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Entrada prevista
              </span>
              <input
                type="datetime-local"
                value={form.entradaPrevistaEm}
                onChange={(e) =>
                  atualizarForm("entradaPrevistaEm", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Saída prevista
              </span>
              <input
                type="datetime-local"
                value={form.saidaPrevistaEm}
                onChange={(e) =>
                  atualizarForm("saidaPrevistaEm", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Crachá válido até
              </span>
              <input
                type="datetime-local"
                value={form.crachaValidoAte}
                onChange={(e) =>
                  atualizarForm("crachaValidoAte", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1 md:col-span-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Motivo da visita
              </span>
              <input
                value={form.motivo}
                onChange={(e) => atualizarForm("motivo", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1 md:col-span-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Observações
              </span>
              <textarea
                value={form.observacoes}
                onChange={(e) => atualizarForm("observacoes", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Salvar alterações"
                : "Cadastrar visitante"}
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                Visitantes cadastrados
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Controle de entrada, saída, pendências de foto e eventos.
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar visitante"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Todos os status</option>
                <option value="AGUARDANDO">Aguardando</option>
                <option value="DENTRO">Dentro</option>
                <option value="SAIU">Saiu</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>

              <input
                value={eventoFiltro}
                onChange={(e) => setEventoFiltro(e.target.value)}
                placeholder="Filtrar evento"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <button
                type="button"
                onClick={carregarVisitantes}
                className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100"
              >
                Filtrar
              </button>
            </div>
          </div>

          {carregando ? (
            <div className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              Carregando visitantes...
            </div>
          ) : visitantes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              Nenhum visitante encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {visitantes.map((visitante) => (
                <div
                  key={visitante.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        {visitante.fotoPerfil ? (
                          <img
                            src={visitante.fotoPerfil}
                            alt={visitante.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-black text-slate-400">
                            {visitante.nome?.charAt(0)?.toUpperCase() || "V"}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950 dark:text-white">
                            {visitante.nome}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatus(
                              visitante.status
                            )}`}
                          >
                            {visitante.status}
                          </span>

                          {!visitante.fotoPerfil && (
                            <span className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                              Sem foto
                            </span>
                          )}
                        </div>

                        <div className="mt-2 grid gap-1 text-sm text-slate-600 dark:text-slate-400 md:grid-cols-2">
                          <p>Código: {visitante.codigoVisitante}</p>
                          <p>Documento: {visitante.documentoNumero || "-"}</p>
                          <p>Empresa: {visitante.empresa || "-"}</p>
                          <p>Destino: {visitante.destino || "-"}</p>
                          <p>Pessoa visitada: {visitante.pessoaVisitada || "-"}</p>
                          <p>Evento: {visitante.evento || "-"}</p>
                          <p>Entrada: {formatarData(visitante.entradaEm)}</p>
                          <p>Saída: {formatarData(visitante.saidaEm)}</p>
                          <p>
                            Crachá válido até:{" "}
                            {formatarData(visitante.crachaValidoAte)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(visitante)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executarAcaoVisitante(
                            visitante.id,
                            "REGISTRAR_ENTRADA"
                          )
                        }
                        className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                      >
                        Entrada
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executarAcaoVisitante(
                            visitante.id,
                            "REGISTRAR_SAIDA"
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Saída
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executarAcaoVisitante(visitante.id, "BLOQUEAR")
                        }
                        className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                      >
                        Bloquear
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default withAuth(AdminVisitantesPage, ["admin"]);