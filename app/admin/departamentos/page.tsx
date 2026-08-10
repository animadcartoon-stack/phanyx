"use client";

import { useEffect, useState } from "react";
import withAuth from "@/components/auth/withAuth";

interface Departamento {
  id: number;
  nome: string;
  slug?: string | null;
  ativo: boolean;
}

interface Cargo {
  id: number;
  nome: string;
  ativo: boolean;
  departamentoId: number;
  quantidadeFuncionarios?: number;
}

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminDepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");

  const [
    cargosNovoDepartamento,
    setCargosNovoDepartamento,
  ] = useState<string[]>([""]);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);
  const [permissoes, setPermissoes] = useState<string[]>([]);

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [departamentoParaExcluir, setDepartamentoParaExcluir] =
    useState<Departamento | null>(null);

  const [
    departamentoCargosAbertoId,
    setDepartamentoCargosAbertoId,
  ] = useState<number | null>(null);

  const [
    cargosPorDepartamento,
    setCargosPorDepartamento,
  ] = useState<Record<number, Cargo[]>>({});

  const [
    carregandoCargosId,
    setCarregandoCargosId,
  ] = useState<number | null>(null);

  const [
    novoCargoNome,
    setNovoCargoNome,
  ] = useState("");

  const [
    criandoCargoDepartamentoId,
    setCriandoCargoDepartamentoId,
  ] = useState<number | null>(null);

  const [
    editandoCargoId,
    setEditandoCargoId,
  ] = useState<number | null>(null);

  const [
    editCargoNome,
    setEditCargoNome,
  ] = useState("");

  const [
    editCargoAtivo,
    setEditCargoAtivo,
  ] = useState(true);

  const [
    salvandoCargoId,
    setSalvandoCargoId,
  ] = useState<number | null>(null);

  const [
    cargoParaAlterarStatus,
    setCargoParaAlterarStatus,
  ] = useState<{
    departamentoId: number;
    cargo: Cargo;
  } | null>(null);

  const [
    alterandoStatusCargoId,
    setAlterandoStatusCargoId,
  ] = useState<number | null>(null);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  async function carregarDepartamentos() {
    const res = await fetch("/api/departamento", {
      credentials: "include",
    });
    const data = await res.json();
    setDepartamentos(Array.isArray(data) ? data : []);
  }

  function adicionarCargoNovoDepartamento() {
    setCargosNovoDepartamento(
      (atuais) => [
        ...atuais,
        "",
      ]
    );
  }

  function alterarCargoNovoDepartamento(
    indice: number,
    valor: string
  ) {
    setCargosNovoDepartamento(
      (atuais) =>
        atuais.map(
          (cargo, i) =>
            i === indice
              ? valor
              : cargo
        )
    );
  }

  function removerCargoNovoDepartamento(
    indice: number
  ) {
    setCargosNovoDepartamento(
      (atuais) => {
        const restantes =
          atuais.filter(
            (_, i) =>
              i !== indice
          );

        return restantes.length > 0
          ? restantes
          : [""];
      }
    );
  }

  async function criarDepartamento(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

      const cargos =
        cargosNovoDepartamento
          .map((cargo) =>
            cargo
              .trim()
              .replace(/\s+/g, " ")
          )
          .filter(Boolean);

      const res = await fetch(
        "/api/departamento",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            nome,
            slug,
            cargos,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar departamento");
      }

      setNome("");
      setSlug("");
      setCargosNovoDepartamento([""]);

      await carregarDepartamentos();
      mostrarFeedback("sucesso", "Departamento criado com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao criar departamento");
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(dep: Departamento) {
    setEditandoId(dep.id);
    setEditNome(dep.nome);
    setEditSlug(dep.slug || "");
    setEditAtivo(dep.ativo);
  }

  async function salvarEdicao(id: number) {
    try {
      setSalvandoId(id);

      const res = await fetch(`/api/departamento/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: editNome,
          slug: editSlug,
          ativo: editAtivo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar departamento");
      }

      setEditandoId(null);
      await carregarDepartamentos();
      mostrarFeedback("sucesso", "Departamento atualizado com sucesso.");
    } catch (error: any) {
      mostrarFeedback(
        "erro",
        error?.message || "Erro ao atualizar departamento"
      );
    } finally {
      setSalvandoId(null);
    }
  }

  async function carregarCargosDepartamento(
    departamentoId: number
  ) {
    try {
      setCarregandoCargosId(
        departamentoId
      );

      const res = await fetch(
        `/api/departamento/${departamentoId}/cargos`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await res.json().catch(
          () => null
        );

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível carregar os cargos."
        );
      }

      const listaRecebida =
        Array.isArray(data)
          ? data
          : Array.isArray(
            data?.cargos
          )
            ? data.cargos
            : [];

      const lista: Cargo[] =
        listaRecebida
          .map((cargo: any) => ({
            id: Number(cargo?.id),

            nome: String(
              cargo?.nome || "Cargo"
            ),

            ativo:
              cargo?.ativo !== false,

            departamentoId:
              Number(
                cargo?.departamentoId ??
                departamentoId
              ),

            quantidadeFuncionarios:
              Number(
                cargo
                  ?.quantidadeFuncionarios ??
                cargo?._count
                  ?.funcionarios ??
                0
              ),
          }))
          .filter(
            (cargo: Cargo) =>
              Number.isInteger(
                cargo.id
              ) &&
              cargo.id > 0
          );

      setCargosPorDepartamento(
        (anterior) => ({
          ...anterior,
          [departamentoId]:
            lista,
        })
      );
    } catch (error: any) {
      mostrarFeedback(
        "erro",
        error?.message ||
        "Não foi possível carregar os cargos."
      );
    } finally {
      setCarregandoCargosId(
        null
      );
    }
  }

  async function alternarCargosDepartamento(
    departamentoId: number
  ) {
    if (
      departamentoCargosAbertoId ===
      departamentoId
    ) {
      setDepartamentoCargosAbertoId(
        null
      );

      setNovoCargoNome("");
      setEditandoCargoId(null);

      return;
    }

    setDepartamentoCargosAbertoId(
      departamentoId
    );

    setNovoCargoNome("");
    setEditandoCargoId(null);

    await carregarCargosDepartamento(
      departamentoId
    );
  }

  async function criarCargo(
    departamentoId: number
  ) {
    const nomeFinal =
      novoCargoNome.trim();

    if (!nomeFinal) {
      mostrarFeedback(
        "erro",
        "Informe o nome do cargo."
      );

      return;
    }

    try {
      setCriandoCargoDepartamentoId(
        departamentoId
      );

      const res = await fetch(
        `/api/departamento/${departamentoId}/cargos`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            nome: nomeFinal,
          }),
        }
      );

      const data =
        await res.json().catch(
          () => null
        );

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível criar o cargo."
        );
      }

      setNovoCargoNome("");

      await carregarCargosDepartamento(
        departamentoId
      );

      mostrarFeedback(
        "sucesso",
        "Cargo criado com sucesso."
      );
    } catch (error: any) {
      mostrarFeedback(
        "erro",
        error?.message ||
        "Não foi possível criar o cargo."
      );
    } finally {
      setCriandoCargoDepartamentoId(
        null
      );
    }
  }

  function iniciarEdicaoCargo(
    cargo: Cargo
  ) {
    setEditandoCargoId(
      cargo.id
    );

    setEditCargoNome(
      cargo.nome
    );

    setEditCargoAtivo(
      cargo.ativo
    );
  }

  function cancelarEdicaoCargo() {
    setEditandoCargoId(null);
    setEditCargoNome("");
    setEditCargoAtivo(true);
  }

  async function salvarEdicaoCargo(
    departamentoId: number
  ) {
    if (!editandoCargoId) {
      return;
    }

    const nomeFinal =
      editCargoNome.trim();

    if (!nomeFinal) {
      mostrarFeedback(
        "erro",
        "Informe o nome do cargo."
      );

      return;
    }

    try {
      setSalvandoCargoId(
        editandoCargoId
      );

      const res = await fetch(
        `/api/departamento/${departamentoId}/cargos/${editandoCargoId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            nome: nomeFinal,
            ativo:
              editCargoAtivo,
          }),
        }
      );

      const data =
        await res.json().catch(
          () => null
        );

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível atualizar o cargo."
        );
      }

      cancelarEdicaoCargo();

      await carregarCargosDepartamento(
        departamentoId
      );

      mostrarFeedback(
        "sucesso",
        "Cargo atualizado com sucesso."
      );
    } catch (error: any) {
      mostrarFeedback(
        "erro",
        error?.message ||
        "Não foi possível atualizar o cargo."
      );
    } finally {
      setSalvandoCargoId(
        null
      );
    }
  }

  async function confirmarAlteracaoStatusCargo() {
    if (
      !cargoParaAlterarStatus
    ) {
      return;
    }

    const {
      departamentoId,
      cargo,
    } = cargoParaAlterarStatus;

    try {
      setAlterandoStatusCargoId(
        cargo.id
      );

      const res = await fetch(
        `/api/departamento/${departamentoId}/cargos/${cargo.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            ativo: !cargo.ativo,
          }),
        }
      );

      const data =
        await res.json().catch(
          () => null
        );

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível alterar o status do cargo."
        );
      }

      setCargoParaAlterarStatus(
        null
      );

      await carregarCargosDepartamento(
        departamentoId
      );

      mostrarFeedback(
        "sucesso",
        cargo.ativo
          ? "Cargo desativado com sucesso."
          : "Cargo reativado com sucesso."
      );
    } catch (error: any) {
      mostrarFeedback(
        "erro",
        error?.message ||
        "Não foi possível alterar o status do cargo."
      );
    } finally {
      setAlterandoStatusCargoId(
        null
      );
    }
  }

  async function confirmarExclusaoDepartamento() {
    if (!departamentoParaExcluir) return;

    try {
      setExcluindoId(departamentoParaExcluir.id);

      const res = await fetch(`/api/departamento/${departamentoParaExcluir.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir departamento");
      }

      setDepartamentoParaExcluir(null);
      await carregarDepartamentos();
      mostrarFeedback("sucesso", "Departamento excluído com sucesso.");
    } catch (error: any) {
      mostrarFeedback(
        "erro",
        error?.message || "Erro ao excluir departamento"
      );
    } finally {
      setExcluindoId(null);
    }
  }

  function temPermissao(chave: string) {
    return permissoes.includes("*") || permissoes.includes(chave);
  }

  useEffect(() => {
    carregarDepartamentos();
    async function carregarPermissoes() {
      try {
        const res = await fetch("/api/admin/permissoes/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setPermissoes(Array.isArray(data.permissoes) ? data.permissoes : []);
        }
      } catch {
        setPermissoes([]);
      }
    }
  }, []);

  return (
    <>
      <div className="max-w-4xl space-y-6">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${feedbackTipo === "sucesso"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            {feedback}
          </div>
        )}

        <h1 className="text-2xl font-bold">🏢 Departamentos</h1>

        <form
          onSubmit={criarDepartamento}
          className="bg-white border rounded-lg p-6 space-y-4"
        >
          <h2 className="font-semibold">Novo departamento</h2>

          <input
            placeholder="Nome do departamento"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            placeholder="Slug público (opcional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">
                Cargos do departamento
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Opcional. Cadastre agora
                as funções que existem
                neste departamento.
              </p>
            </div>

            <div className="space-y-2">
              {cargosNovoDepartamento.map(
                (cargo, indice) => (
                  <div
                    key={indice}
                    className="flex gap-2"
                  >
                    <input
                      value={cargo}
                      onChange={(e) =>
                        alterarCargoNovoDepartamento(
                          indice,
                          e.target.value
                        )
                      }
                      placeholder={
                        indice === 0
                          ? "Ex.: Vendedor"
                          : "Nome do cargo"
                      }
                      className="min-w-0 flex-1 rounded-lg border p-2"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removerCargoNovoDepartamento(
                          indice
                        )
                      }
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={
                adicionarCargoNovoDepartamento
              }
              className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-600"
            >
              + Adicionar cargo
            </button>
          </div>

          <button
            disabled={criando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {criando ? "Criando..." : "Criar departamento"}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="font-semibold">Lista de departamentos</h2>

          {departamentos.map((d) => (
            <div key={d.id} className="bg-white border rounded-lg p-4">
              {editandoId === d.id ? (
                <div className="space-y-3">
                  <input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="border p-2 rounded w-full"
                    placeholder="Nome"
                  />

                  <input
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="border p-2 rounded w-full"
                    placeholder="Slug"
                  />

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editAtivo}
                      onChange={(e) => setEditAtivo(e.target.checked)}
                    />
                    Ativo
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => salvarEdicao(d.id)}
                      disabled={salvandoId === d.id}
                      className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                    >
                      {salvandoId === d.id ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="bg-gray-400 text-white px-3 py-1 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium">{d.nome}</p>
                  <p className="text-sm text-gray-600">Slug: {d.slug || "-"}</p>
                  <p className="text-sm text-gray-600">
                    Status: {d.ativo ? "Ativo" : "Inativo"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        iniciarEdicao(d)
                      }
                      className="text-sm font-medium text-blue-600"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        alternarCargosDepartamento(
                          d.id
                        )
                      }
                      className="phanyx-departamentos-cargos-toggle text-sm font-bold"
                    >
                      {departamentoCargosAbertoId ===
                        d.id
                        ? "Fechar cargos"
                        : "Cargos"}
                    </button>

                    <a
                      href={`/admin/departamentos/${d.id}/permissoes`}
                      className="text-sm font-medium text-emerald-600"
                    >
                      Permissões
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        setDepartamentoParaExcluir(
                          d
                        )
                      }
                      className="text-sm font-medium text-red-600"
                    >
                      Excluir
                    </button>
                  </div>

                  {departamentoCargosAbertoId ===
                    d.id && (
                      <div className="phanyx-departamentos-cargos-box mt-5 rounded-2xl border p-4">
                        <div className="flex flex-col gap-1">
                          <h3 className="phanyx-departamentos-cargos-title font-bold">
                            Cargos de {d.nome}
                          </h3>

                          <p className="phanyx-departamentos-cargos-text text-sm">
                            Cadastre as funções
                            existentes neste
                            departamento.
                          </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <input
                            value={novoCargoNome}
                            onChange={(e) =>
                              setNovoCargoNome(
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter"
                              ) {
                                e.preventDefault();

                                criarCargo(d.id);
                              }
                            }}
                            placeholder="Ex.: Vendedor"
                            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              criarCargo(d.id)
                            }
                            disabled={
                              criandoCargoDepartamentoId ===
                              d.id
                            }
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {criandoCargoDepartamentoId ===
                              d.id
                              ? "Criando..."
                              : "+ Novo cargo"}
                          </button>
                        </div>

                        {carregandoCargosId ===
                          d.id ? (
                          <p className="mt-4 text-sm text-slate-500">
                            Carregando cargos...
                          </p>
                        ) : (
                          <div className="mt-4 space-y-2">
                            {(cargosPorDepartamento[
                              d.id
                            ] || []).length ===
                              0 ? (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                                Nenhum cargo
                                cadastrado neste
                                departamento.
                              </div>
                            ) : (
                              (
                                cargosPorDepartamento[
                                d.id
                                ] || []
                              ).map((cargo) => (
                                <div
                                  key={cargo.id}
                                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950"
                                >
                                  {editandoCargoId ===
                                    cargo.id ? (
                                    <div className="space-y-3">
                                      <input
                                        value={
                                          editCargoNome
                                        }
                                        onChange={(e) =>
                                          setEditCargoNome(
                                            e.target
                                              .value
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                      />

                                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={
                                            editCargoAtivo
                                          }
                                          onChange={(
                                            e
                                          ) =>
                                            setEditCargoAtivo(
                                              e.target
                                                .checked
                                            )
                                          }
                                        />

                                        Cargo ativo
                                      </label>

                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            salvarEdicaoCargo(
                                              d.id
                                            )
                                          }
                                          disabled={
                                            salvandoCargoId ===
                                            cargo.id
                                          }
                                          className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                        >
                                          {salvandoCargoId ===
                                            cargo.id
                                            ? "Salvando..."
                                            : "Salvar"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={
                                            cancelarEdicaoCargo
                                          }
                                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="phanyx-cargo-nome font-semibold">
                                            {cargo.nome}
                                          </span>

                                          <span
                                            className={[
                                              "phanyx-cargo-status rounded-full px-2 py-0.5 text-xs font-semibold",
                                              cargo.ativo
                                                ? "phanyx-cargo-status-ativo"
                                                : "phanyx-cargo-status-inativo",
                                            ].join(" ")}
                                          >
                                            {cargo.ativo
                                              ? "Ativo"
                                              : "Inativo"}
                                          </span>
                                        </div>

                                        <p className="phanyx-cargo-vinculos mt-1 text-xs">
                                          {cargo.quantidadeFuncionarios ||
                                            0}{" "}
                                          funcionário(s)
                                          vinculado(s)
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap gap-3">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            iniciarEdicaoCargo(
                                              cargo
                                            )
                                          }
                                          className="phanyx-cargo-editar text-sm font-semibold"
                                        >
                                          Editar
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setCargoParaAlterarStatus(
                                              {
                                                departamentoId:
                                                  d.id,
                                                cargo,
                                              }
                                            )
                                          }
                                          className={
                                            cargo.ativo
                                              ? "phanyx-cargo-desativar text-sm font-semibold"
                                              : "phanyx-cargo-reativar text-sm font-semibold"
                                          }
                                        >
                                          {cargo.ativo
                                            ? "Desativar"
                                            : "Reativar"}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {cargoParaAlterarStatus && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4">
                      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {cargoParaAlterarStatus
                            .cargo.ativo
                            ? "Desativar cargo"
                            : "Reativar cargo"}
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {cargoParaAlterarStatus
                            .cargo.ativo
                            ? "O cargo deixará de aparecer para novos vínculos, mas os funcionários já vinculados não serão apagados."
                            : "O cargo voltará a ficar disponível para novos vínculos."}
                        </p>

                        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                          Cargo:{" "}
                          <strong>
                            {
                              cargoParaAlterarStatus
                                .cargo.nome
                            }
                          </strong>
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setCargoParaAlterarStatus(
                                null
                              )
                            }
                            disabled={
                              alterandoStatusCargoId ===
                              cargoParaAlterarStatus
                                .cargo.id
                            }
                            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            onClick={
                              confirmarAlteracaoStatusCargo
                            }
                            disabled={
                              alterandoStatusCargoId ===
                              cargoParaAlterarStatus
                                .cargo.id
                            }
                            className={
                              cargoParaAlterarStatus
                                .cargo.ativo
                                ? "rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                : "rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            }
                          >
                            {alterandoStatusCargoId ===
                              cargoParaAlterarStatus
                                .cargo.id
                              ? "Salvando..."
                              : cargoParaAlterarStatus
                                .cargo.ativo
                                ? "Confirmar desativação"
                                : "Confirmar reativação"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {departamentoParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Confirmar exclusão
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tem certeza que deseja excluir o departamento{" "}
                  <strong>"{departamentoParaExcluir.nome}"</strong>?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDepartamentoParaExcluir(null)}
                disabled={excluindoId === departamentoParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusaoDepartamento}
                disabled={excluindoId === departamentoParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === departamentoParaExcluir.id
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(AdminDepartamentosPage, ["admin"]);