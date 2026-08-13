"use client";

import { FormEvent, useEffect, useState } from "react";

type ConfiguracaoEmail = {
    id: number;
    ativo: boolean;
    host: string;
    port: number;
    secure: boolean;
    usuario: string;
    remetenteNome: string | null;
    remetenteEmail: string;
    senhaConfigurada: boolean;
    criadoEm: string;
    atualizadoEm: string;
};

type FormularioEmail = {
    ativo: boolean;
    host: string;
    port: string;
    secure: boolean;
    usuario: string;
    senha: string;
    remetenteNome: string;
    remetenteEmail: string;
};

const FORMULARIO_INICIAL: FormularioEmail = {
    ativo: false,
    host: "",
    port: "465",
    secure: true,
    usuario: "",
    senha: "",
    remetenteNome: "",
    remetenteEmail: "",
};

export default function IntegracaoEmailPage() {
    const [form, setForm] =
        useState<FormularioEmail>(
            FORMULARIO_INICIAL
        );

    const [
        senhaConfigurada,
        setSenhaConfigurada,
    ] = useState(false);

    const [
        configurado,
        setConfigurado,
    ] = useState(false);

    const [carregando, setCarregando] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [testando, setTestando] =
        useState(false);

    const [mensagem, setMensagem] =
        useState("");

    const [tipoMensagem, setTipoMensagem] =
        useState<
            "sucesso" | "erro" | "info" | null
        >(null);

    function mostrarMensagem(
        texto: string,
        tipo:
            | "sucesso"
            | "erro"
            | "info"
    ) {
        setMensagem(texto);
        setTipoMensagem(tipo);
    }

    function limparMensagem() {
        setMensagem("");
        setTipoMensagem(null);
    }

    useEffect(() => {
        carregarConfiguracao();
    }, []);

    async function carregarConfiguracao() {
        try {
            setCarregando(true);
            limparMensagem();

            const resposta = await fetch(
                "/api/admin/integracoes/email",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados?.error ||
                    "Erro ao carregar configuração."
                );
            }

            if (
                !dados?.configurado ||
                !dados?.configuracao
            ) {
                setConfigurado(false);

                setForm(
                    FORMULARIO_INICIAL
                );

                setSenhaConfigurada(false);

                return;
            }

            const configuracao =
                dados.configuracao as ConfiguracaoEmail;

            setConfigurado(true);

            setSenhaConfigurada(
                Boolean(
                    configuracao.senhaConfigurada
                )
            );

            setForm({
                ativo:
                    configuracao.ativo,

                host:
                    configuracao.host || "",

                port: String(
                    configuracao.port || 465
                ),

                secure:
                    configuracao.secure,

                usuario:
                    configuracao.usuario || "",

                senha: "",

                remetenteNome:
                    configuracao.remetenteNome ||
                    "",

                remetenteEmail:
                    configuracao.remetenteEmail ||
                    "",
            });
        } catch (error: any) {
            mostrarMensagem(
                error?.message ||
                "Erro ao carregar configuração de e-mail.",
                "erro"
            );
        } finally {
            setCarregando(false);
        }
    }

    function atualizarCampo(
        campo: keyof FormularioEmail,
        valor: string | boolean
    ) {
        setForm((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));

        limparMensagem();
    }

    function alterarPorta(
        valor: string
    ) {
        atualizarCampo(
            "port",
            valor.replace(/\D/g, "")
        );
    }

    function aplicarPortaSugerida(
        secure: boolean
    ) {
        setForm((anterior) => ({
            ...anterior,
            secure,
            port:
                anterior.port === "465" ||
                    anterior.port === "587" ||
                    anterior.port === ""
                    ? secure
                        ? "465"
                        : "587"
                    : anterior.port,
        }));

        limparMensagem();
    }

    function validarFormulario() {
        if (!form.host.trim()) {
            mostrarMensagem(
                "Informe o servidor SMTP.",
                "erro"
            );

            return false;
        }

        const porta = Number(form.port);

        if (
            !Number.isInteger(porta) ||
            porta <= 0 ||
            porta > 65535
        ) {
            mostrarMensagem(
                "Informe uma porta SMTP válida.",
                "erro"
            );

            return false;
        }

        if (!form.usuario.trim()) {
            mostrarMensagem(
                "Informe o usuário SMTP.",
                "erro"
            );

            return false;
        }

        if (
            !senhaConfigurada &&
            !form.senha.trim()
        ) {
            mostrarMensagem(
                "Informe a senha SMTP.",
                "erro"
            );

            return false;
        }

        if (
            !form.remetenteEmail.trim()
        ) {
            mostrarMensagem(
                "Informe o e-mail remetente.",
                "erro"
            );

            return false;
        }

        return true;
    }

    async function testarConexao() {
        if (!validarFormulario()) {
            return;
        }

        try {
            setTestando(true);
            limparMensagem();

            const resposta = await fetch(
                "/api/admin/integracoes/email/testar",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        host: form.host.trim(),
                        port: Number(form.port),
                        secure: form.secure,
                        usuario:
                            form.usuario.trim(),
                        senha: form.senha,
                    }),
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados?.error ||
                    "Não foi possível testar a conexão SMTP."
                );
            }

            mostrarMensagem(
                dados?.message ||
                "Conexão SMTP realizada com sucesso.",
                "sucesso"
            );
        } catch (error: any) {
            mostrarMensagem(
                error?.message ||
                "Erro ao testar conexão SMTP.",
                "erro"
            );
        } finally {
            setTestando(false);
        }
    }

    async function salvarConfiguracao(
        event: FormEvent
    ) {
        event.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        try {
            setSalvando(true);
            limparMensagem();

            const resposta = await fetch(
                "/api/admin/integracoes/email",
                {
                    method: "PUT",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        ativo: form.ativo,

                        host:
                            form.host.trim(),

                        port:
                            Number(form.port),

                        secure:
                            form.secure,

                        usuario:
                            form.usuario.trim(),

                        senha:
                            form.senha,

                        remetenteNome:
                            form.remetenteNome.trim(),

                        remetenteEmail:
                            form.remetenteEmail
                                .trim()
                                .toLowerCase(),
                    }),
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados?.error ||
                    "Erro ao salvar configuração."
                );
            }

            setConfigurado(true);
            setSenhaConfigurada(true);

            setForm((anterior) => ({
                ...anterior,
                senha: "",
            }));

            mostrarMensagem(
                dados?.message ||
                "Configuração de e-mail salva com sucesso.",
                "sucesso"
            );
        } catch (error: any) {
            mostrarMensagem(
                error?.message ||
                "Erro ao salvar configuração de e-mail.",
                "erro"
            );
        } finally {
            setSalvando(false);
        }
    }

    if (carregando) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 animate-spin mx-auto" />

                    <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                        Carregando configuração de
                        e-mail...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="phanyx-email-integracao-page w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                            Integrações
                        </p>

                        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                            E-mail institucional
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm sm:text-base leading-6 text-zinc-600 dark:text-zinc-400">
                            Configure o servidor de
                            e-mail utilizado pela sua
                            instituição para enviar
                            mensagens pelo PHANYX.
                        </p>
                    </div>

                    <div
                        className={[
                            "inline-flex self-start items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",

                            form.ativo &&
                                configurado
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
                        ].join(" ")}
                    >
                        <span
                            className={[
                                "h-2 w-2 rounded-full",

                                form.ativo &&
                                    configurado
                                    ? "bg-emerald-500"
                                    : "bg-zinc-400",
                            ].join(" ")}
                        />

                        {form.ativo &&
                            configurado
                            ? "E-mail ativo"
                            : configurado
                                ? "Configurado, mas inativo"
                                : "Não configurado"}
                    </div>
                </div>
            </div>

            {mensagem && tipoMensagem && (
                <div
                    className={[
                        "mb-6 rounded-xl border px-4 py-3 text-sm",

                        tipoMensagem ===
                            "sucesso"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : tipoMensagem ===
                                "erro"
                                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                                : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                    ].join(" ")}
                >
                    {mensagem}
                </div>
            )}

            <form
                onSubmit={
                    salvarConfiguracao
                }
                className="space-y-6"
            >
                <section className="phanyx-email-card rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="border-b border-zinc-200 px-5 py-5 sm:px-6 dark:border-zinc-800">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                                    Envio de e-mail
                                </h2>

                                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                    Ative somente após
                                    configurar e testar o
                                    servidor SMTP.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    atualizarCampo(
                                        "ativo",
                                        !form.ativo
                                    )
                                }
                                aria-pressed={
                                    form.ativo
                                }
                                className={[
                                    "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",

                                    form.ativo
                                        ? "bg-emerald-600"
                                        : "bg-zinc-300 dark:bg-zinc-700",
                                ].join(" ")}
                            >
                                <span
                                    className={[
                                        "pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform",

                                        form.ativo
                                            ? "translate-x-5"
                                            : "translate-x-0",
                                    ].join(" ")}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="host"
                                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                                >
                                    Servidor SMTP
                                </label>

                                <input
                                    id="host"
                                    type="text"
                                    value={form.host}
                                    onChange={(e) =>
                                        atualizarCampo(
                                            "host",
                                            e.target.value
                                        )
                                    }
                                    placeholder="smtp.exemplo.com.br"
                                    autoComplete="off"
                                    className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="port"
                                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                                >
                                    Porta SMTP
                                </label>

                                <input
                                    id="port"
                                    type="text"
                                    inputMode="numeric"
                                    value={form.port}
                                    onChange={(e) =>
                                        alterarPorta(
                                            e.target.value
                                        )
                                    }
                                    placeholder="465"
                                    className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <p className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                    Segurança da conexão
                                </p>

                                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            aplicarPortaSugerida(
                                                true
                                            )
                                        }
                                        className={[
                                            "phanyx-email-security-option rounded-xl border p-4 text-left transition",
                                            form.secure ? "is-active" : "",
                                        ].join(" ")}
                                    >
                                        <div className="font-semibold text-zinc-950 dark:text-white">
                                            SSL/TLS
                                        </div>

                                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                            Normalmente utiliza
                                            a porta 465.
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            aplicarPortaSugerida(false)
                                        }
                                        className={[
                                            "phanyx-email-security-option rounded-xl border p-4 text-left transition",
                                            !form.secure ? "is-active" : "",
                                        ].join(" ")}
                                    >
                                        <div className="font-semibold">
                                            STARTTLS
                                        </div>

                                        <div className="mt-1 text-sm">
                                            Normalmente utiliza a porta 587.
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="usuario"
                                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                                >
                                    Usuário SMTP
                                </label>

                                <input
                                    id="usuario"
                                    type="text"
                                    value={
                                        form.usuario
                                    }
                                    onChange={(e) =>
                                        atualizarCampo(
                                            "usuario",
                                            e.target.value
                                        )
                                    }
                                    placeholder="secretaria@instituicao.com.br"
                                    autoComplete="username"
                                    className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="senha"
                                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                                >
                                    Senha SMTP
                                </label>

                                <input
                                    id="senha"
                                    type="password"
                                    value={form.senha}
                                    onChange={(e) =>
                                        atualizarCampo(
                                            "senha",
                                            e.target.value
                                        )
                                    }
                                    placeholder={
                                        senhaConfigurada
                                            ? "Deixe vazio para manter a atual"
                                            : "Informe a senha SMTP"
                                    }
                                    autoComplete="new-password"
                                    className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                                />

                                {senhaConfigurada && (
                                    <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                                        Uma senha já está
                                        armazenada com
                                        criptografia. Preencha
                                        somente se desejar
                                        alterá-la.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="phanyx-email-card rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="border-b border-zinc-200 px-5 py-5 sm:px-6 dark:border-zinc-800">
                        <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                            Remetente
                        </h2>

                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            Essas informações serão
                            exibidas ao destinatário
                            quando a instituição enviar
                            um e-mail.
                        </p>
                    </div>

                    <div className="p-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="remetenteNome"
                                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                                >
                                    Nome do remetente
                                </label>

                                <input
                                    id="remetenteNome"
                                    type="text"
                                    value={
                                        form.remetenteNome
                                    }
                                    onChange={(e) =>
                                        atualizarCampo(
                                            "remetenteNome",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Secretaria Acadêmica"
                                    className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="remetenteEmail"
                                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                                >
                                    E-mail do remetente
                                </label>

                                <input
                                    id="remetenteEmail"
                                    type="email"
                                    value={
                                        form.remetenteEmail
                                    }
                                    onChange={(e) =>
                                        atualizarCampo(
                                            "remetenteEmail",
                                            e.target.value
                                        )
                                    }
                                    placeholder="secretaria@instituicao.com.br"
                                    className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="phanyx-email-security rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <h3 className="font-semibold text-zinc-950 dark:text-white">
                        Segurança das credenciais
                    </h3>

                    <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        <p>
                            A senha SMTP não é exibida
                            novamente depois de salva.
                        </p>

                        <p>
                            As credenciais são
                            armazenadas vinculadas à
                            instituição autenticada.
                        </p>

                        <p>
                            O PHANYX não utiliza a
                            configuração de uma
                            instituição para enviar
                            mensagens de outra.
                        </p>
                    </div>
                </section>

                <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:justify-end dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={
                            testarConexao
                        }
                        disabled={
                            testando ||
                            salvando
                        }
                        className="phanyx-email-test-button inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                        {testando
                            ? "Testando..."
                            : "Testar conexão"}
                    </button>

                    <button
                        type="submit"
                        disabled={
                            salvando ||
                            testando
                        }
                        className="phanyx-email-test-button inline-flex min-h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                        {salvando
                            ? "Salvando..."
                            : "Salvar configuração"}
                    </button>
                </div>
            </form>
        </div>
    );
}