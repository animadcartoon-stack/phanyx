"use client";

import { useLocale, useTranslations } from "next-intl";

import { useEffect, useMemo, useState } from "react";
import BuscaBanco, {
    type BancoSelecionado,
} from "@/components/rh/BuscaBanco";

type FormaPagamentoHolerite =
    | "FOLHA_BANCARIA"
    | "PIX"
    | "TRANSFERENCIA"
    | "CONTA_SALARIO"
    | "DINHEIRO"
    | "CHEQUE"
    | "OUTRO";

type TipoItemPagamento =
    | "SALARIO_E_DEMAIS"
    | "COMISSAO"
    | "REMUNERACAO_VARIAVEL";

type OrigemContaPagamento =
    | "CONTA_SALARIO"
    | "CONTA_COMISSAO"
    | "MANUAL";

type TipoContaBancaria =
    | "CORRENTE"
    | "POUPANCA"
    | "SALARIO"
    | "PAGAMENTO"
    | "OUTRA"
    | "";

type TipoChavePix =
    | "CPF"
    | "CNPJ"
    | "EMAIL"
    | "TELEFONE"
    | "ALEATORIA"
    | "";

type ContaBancariaPagamento = {
    id: number;
    finalidade: "SALARIO" | "COMISSAO_REMUNERACAO_VARIAVEL";
    bancoCodigo?: string | null;
    bancoNome?: string | null;
    agencia?: string | null;
    conta?: string | null;
    tipoConta?: TipoContaBancaria | null;
    tipoChavePix?: TipoChavePix | null;
    chavePix?: string | null;
    titularNome?: string | null;
    titularDocumentoMascarado?: string | null;
};

type PreparacaoPagamento = {
    holerite: {
        id: number;
        funcionarioId: number;
        funcionarioNome: string;
        competenciaMes: number;
        competenciaAno: number;
        valorLiquido: number;
    };
    composicao: {
        salarioEDemais: number;
        comissao: number;
        remuneracaoVariavel: number;
        exigePagamentoDividido: boolean;
    };
    contas: {
        salario: ContaBancariaPagamento | null;
        comissao: ContaBancariaPagamento | null;
        destinoPreferencialComissao: ContaBancariaPagamento | null;
        origemPreferencialComissao: OrigemContaPagamento;
    };
};

export type HoleritePagamentoResumo = {
    id: number;
    competenciaMes: number;
    competenciaAno: number;
    valorLiquido: string | number;
    funcionario?: {
        nome: string;
        cargo?: string | null;
    };
};

type ItemPagamentoForm = {
    tipoItem: TipoItemPagamento;
    titulo: string;
    origemConta: OrigemContaPagamento;
    contaBancariaFuncionarioId: number | null;
    formaPagamento: FormaPagamentoHolerite;
    valorPago: string;
    pagoEm: string;
    identificadorTransacao: string;
    bancoOrigemTexto: string;
    bancoOrigemCodigo: string;
    bancoOrigemNome: string;
    agenciaOrigem: string;
    contaOrigem: string;
    bancoDestinoTexto: string;
    bancoDestinoCodigo: string;
    bancoDestinoNome: string;
    agenciaDestino: string;
    contaDestino: string;
    tipoContaDestino: TipoContaBancaria;
    tipoChavePixDestino: TipoChavePix;
    chavePixDestino: string;
    titularDestino: string;
    titularDocumento: string;
    salvarComoPreferencialComissao: boolean;
    observacoes: string;
};

type Props = {
    holerite: HoleritePagamentoResumo;
    onFechar: () => void;
    onConcluido: (mensagem: string) => void | Promise<void>;
};

const FORMAS_QUE_EXIGEM_TRANSACAO = new Set<FormaPagamentoHolerite>([
    "FOLHA_BANCARIA",
    "PIX",
    "TRANSFERENCIA",
    "CONTA_SALARIO",
    "CHEQUE",
]);

const FORMAS_BANCARIAS = new Set<FormaPagamentoHolerite>([
    "FOLHA_BANCARIA",
    "PIX",
    "TRANSFERENCIA",
    "CONTA_SALARIO",
]);

const FORMAS_QUE_EXIGEM_CONTA_DESTINO = new Set<FormaPagamentoHolerite>([
    "FOLHA_BANCARIA",
    "TRANSFERENCIA",
    "CONTA_SALARIO",
]);

function numero(valor: unknown) {
    if (valor === null || valor === undefined || valor === "") return 0;

    const texto = String(valor)
        .trim()
        .replace(/\s/g, "")
        .replace(/\.(?=\d{3}(?:\D|$))/g, "")
        .replace(",", ".");

    return Number(texto) || 0;
}

function moeda(valor: number, locale: string) {
    return valor.toLocaleString(locale, {
        style: "currency",
        currency: "BRL",
    });
}

function valorInput(valor: number, locale: string) {
    return new Intl.NumberFormat(locale, { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
}

function dataHoraLocalAgora() {
    const agora = new Date();
    const dataLocal = new Date(
        agora.getTime() - agora.getTimezoneOffset() * 60_000,
    );

    return dataLocal.toISOString().slice(0, 16);
}

function labelBanco(conta?: ContaBancariaPagamento | null) {
    if (!conta) return "";

    return [conta.bancoCodigo, conta.bancoNome].filter(Boolean).join(" — ");
}

function criarItemPagamento(
    tipoItem: TipoItemPagamento,
    titulo: string,
    valor: number,
    conta: ContaBancariaPagamento | null,
    origemConta: OrigemContaPagamento,
    locale: string,
): ItemPagamentoForm {
    const possuiPix = Boolean(conta?.chavePix);

    return {
        tipoItem,
        titulo,
        origemConta: conta ? origemConta : "MANUAL",
        contaBancariaFuncionarioId: conta?.id ?? null,
        formaPagamento: possuiPix ? "PIX" : "TRANSFERENCIA",
        valorPago: valorInput(valor, locale),
        pagoEm: dataHoraLocalAgora(),
        identificadorTransacao: "",
        bancoOrigemTexto: "",
        bancoOrigemCodigo: "",
        bancoOrigemNome: "",
        agenciaOrigem: "",
        contaOrigem: "",
        bancoDestinoTexto: labelBanco(conta),
        bancoDestinoCodigo: conta?.bancoCodigo || "",
        bancoDestinoNome: conta?.bancoNome || "",
        agenciaDestino: conta?.agencia || "",
        contaDestino: conta?.conta || "",
        tipoContaDestino: conta?.tipoConta || "",
        tipoChavePixDestino: conta?.tipoChavePix || "",
        chavePixDestino: conta?.chavePix || "",
        titularDestino: conta?.titularNome || "",
        titularDocumento: "",
        salvarComoPreferencialComissao: false,
        observacoes: "",
    };
}

function montarItensPagamento(
    preparacao: PreparacaoPagamento,
    locale: string,
    labels: { salary: string; commission: string; variable: string },
): ItemPagamentoForm[] {
    const itens: ItemPagamentoForm[] = [];

    if (preparacao.composicao.salarioEDemais > 0.009) {
        itens.push(
            criarItemPagamento(
                "SALARIO_E_DEMAIS",
                labels.salary,
                preparacao.composicao.salarioEDemais,
                preparacao.contas.salario,
                "CONTA_SALARIO",
                locale,
            ),
        );
    }

    if (preparacao.composicao.comissao > 0.009) {
        itens.push(
            criarItemPagamento(
                "COMISSAO",
                labels.commission,
                preparacao.composicao.comissao,
                preparacao.contas.destinoPreferencialComissao,
                preparacao.contas.origemPreferencialComissao,
                locale,
            ),
        );
    }

    if (preparacao.composicao.remuneracaoVariavel > 0.009) {
        itens.push(
            criarItemPagamento(
                "REMUNERACAO_VARIAVEL",
                labels.variable,
                preparacao.composicao.remuneracaoVariavel,
                preparacao.contas.destinoPreferencialComissao,
                preparacao.contas.origemPreferencialComissao,
                locale,
            ),
        );
    }

    return itens;
}

export default function PagamentoHoleriteModal({
    holerite,
    onFechar,
    onConcluido,
}: Props) {
    const t = useTranslations("AdminHRPayslipPayment");
    const locale = useLocale();
    const formatMoney = (value: number) => moeda(value, locale);
    const [preparacao, setPreparacao] = useState<PreparacaoPagamento | null>(null);
    const [itens, setItens] = useState<ItemPagamentoForm[]>([]);
    const [observacoesGerais, setObservacoesGerais] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [pixCopiadoIndex, setPixCopiadoIndex] = useState<number | null>(null);

    const totalItens = useMemo(
        () => itens.reduce((total, item) => total + numero(item.valorPago), 0),
        [itens],
    );

    useEffect(() => {
        const controller = new AbortController();

        async function carregarPreparacao() {
            try {
                setCarregando(true);
                setErro("");

                const resposta = await fetch(
                    `/api/admin/rh/holerites/${holerite.id}/pagamento`,
                    {
                        method: "GET",
                        cache: "no-store",
                        signal: controller.signal,
                    },
                );

                const dados = await resposta.json().catch(() => null);

                if (!resposta.ok) {
                    throw new Error(
                        t("errorPrepare"),
                    );
                }

                const preparacaoRecebida = dados as PreparacaoPagamento;

                setPreparacao(preparacaoRecebida);
                setItens(montarItensPagamento(preparacaoRecebida, locale, {
                    salary: t("salary"), commission: t("commission"), variable: t("variable"),
                }));
            } catch (error: any) {
                if (error?.name === "AbortError") return;

                setErro(
                    error?.message || t("errorBanks"),
                );
            } finally {
                if (!controller.signal.aborted) {
                    setCarregando(false);
                }
            }
        }

        carregarPreparacao();

        return () => controller.abort();
    }, [holerite.id, locale, t]);

    function atualizarItem<K extends keyof ItemPagamentoForm>(
        index: number,
        campo: K,
        valor: ItemPagamentoForm[K],
    ) {
        setItens((atuais) =>
            atuais.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [campo]: valor } : item,
            ),
        );
    }

    function contaPorOrigem(origem: OrigemContaPagamento) {
        if (!preparacao) return null;

        if (origem === "CONTA_SALARIO") return preparacao.contas.salario;
        if (origem === "CONTA_COMISSAO") return preparacao.contas.comissao;

        return null;
    }

    function trocarOrigemConta(index: number, origem: OrigemContaPagamento) {
        const conta = contaPorOrigem(origem);

        setItens((atuais) =>
            atuais.map((item, itemIndex) => {
                if (itemIndex !== index) return item;

                if (origem === "MANUAL") {
                    return {
                        ...item,
                        origemConta: "MANUAL",
                        contaBancariaFuncionarioId: null,
                        bancoDestinoTexto: "",
                        bancoDestinoCodigo: "",
                        bancoDestinoNome: "",
                        agenciaDestino: "",
                        contaDestino: "",
                        tipoContaDestino: "",
                        tipoChavePixDestino: "",
                        chavePixDestino: "",
                        titularDestino: preparacao?.holerite.funcionarioNome || "",
                        titularDocumento: "",
                        salvarComoPreferencialComissao: false,
                    };
                }

                if (!conta) return item;

                return {
                    ...item,
                    origemConta: origem,
                    contaBancariaFuncionarioId: conta.id,
                    bancoDestinoTexto: labelBanco(conta),
                    bancoDestinoCodigo: conta.bancoCodigo || "",
                    bancoDestinoNome: conta.bancoNome || "",
                    agenciaDestino: conta.agencia || "",
                    contaDestino: conta.conta || "",
                    tipoContaDestino: conta.tipoConta || "",
                    tipoChavePixDestino: conta.tipoChavePix || "",
                    chavePixDestino: conta.chavePix || "",
                    titularDestino:
                        conta.titularNome || preparacao?.holerite.funcionarioNome || "",
                    titularDocumento: "",
                    salvarComoPreferencialComissao: false,
                    formaPagamento: conta.chavePix ? "PIX" : "TRANSFERENCIA",
                };
            }),
        );
    }

    function marcarSalvarPreferencia(index: number, marcado: boolean) {
        setItens((atuais) =>
            atuais.map((item, itemIndex) => ({
                ...item,
                salvarComoPreferencialComissao:
                    itemIndex === index ? marcado : false,
            })),
        );
    }

    async function copiarChavePix(chave: string, index: number) {
        if (!chave) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(chave);
            } else {
                const campo = document.createElement("textarea");
                campo.value = chave;
                campo.style.position = "fixed";
                campo.style.opacity = "0";
                document.body.appendChild(campo);
                campo.select();
                document.execCommand("copy");
                campo.remove();
            }

            setPixCopiadoIndex(index);
            window.setTimeout(() => setPixCopiadoIndex(null), 2200);
        } catch {
            setErro(t("errorCopy"));
        }
    }

    function validarItens() {
        if (!preparacao) return t("errorNotLoaded");
        if (itens.length === 0) return t("errorNoItems");

        if (Math.abs(totalItens - preparacao.holerite.valorLiquido) > 0.009) {
            return t("errorTotal", { amount: formatMoney(preparacao.holerite.valorLiquido) });
        }

        for (let index = 0; index < itens.length; index += 1) {
            const item = itens[index];
            const numeroItem = index + 1;

            if (numero(item.valorPago) <= 0) {
                return t("errorAmount", { number: numeroItem });
            }

            const data = new Date(item.pagoEm);
            if (!item.pagoEm || Number.isNaN(data.getTime())) {
                return t("errorDate", { number: numeroItem });
            }

            if (
                FORMAS_QUE_EXIGEM_TRANSACAO.has(item.formaPagamento) &&
                !item.identificadorTransacao.trim()
            ) {
                return t("errorProof", { number: numeroItem });
            }

            if (
                FORMAS_BANCARIAS.has(item.formaPagamento) &&
                !item.bancoOrigemNome.trim() &&
                !item.bancoOrigemTexto.trim()
            ) {
                return t("errorPayingBank", { number: numeroItem });
            }

            if (
                item.formaPagamento === "PIX" &&
                !item.chavePixDestino.trim()
            ) {
                return t("errorRecipientPix", { number: numeroItem });
            }

            if (
                FORMAS_QUE_EXIGEM_CONTA_DESTINO.has(item.formaPagamento) &&
                (!item.bancoDestinoNome.trim() || !item.contaDestino.trim())
            ) {
                return t("errorRecipientAccount", { number: numeroItem });
            }
        }

        return "";
    }

    async function registrarPagamento() {
        const erroValidacao = validarItens();

        if (erroValidacao) {
            setErro(erroValidacao);
            return;
        }

        try {
            setSalvando(true);
            setErro("");

            const resposta = await fetch(
                `/api/admin/rh/holerites/${holerite.id}/pagamento`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        observacoes: observacoesGerais.trim(),
                        itensPagamento: itens.map((item) => ({
                            tipoItem: item.tipoItem,
                            origemConta: item.origemConta,
                            contaBancariaFuncionarioId:
                                item.contaBancariaFuncionarioId,
                            formaPagamento: item.formaPagamento,
                            valorPago: numero(item.valorPago),
                            pagoEm: new Date(item.pagoEm).toISOString(),
                            identificadorTransacao:
                                item.identificadorTransacao.trim(),
                            bancoOrigemCodigo: item.bancoOrigemCodigo.trim(),
                            bancoOrigemNome:
                                item.bancoOrigemNome.trim() ||
                                item.bancoOrigemTexto.trim(),
                            agenciaOrigem: item.agenciaOrigem.trim(),
                            contaOrigem: item.contaOrigem.trim(),
                            bancoDestinoCodigo: item.bancoDestinoCodigo.trim(),
                            bancoDestinoNome:
                                item.bancoDestinoNome.trim() ||
                                item.bancoDestinoTexto.trim(),
                            agenciaDestino: item.agenciaDestino.trim(),
                            contaDestino: item.contaDestino.trim(),
                            tipoContaDestino: item.tipoContaDestino || null,
                            tipoChavePixDestino:
                                item.tipoChavePixDestino || null,
                            chavePixDestino: item.chavePixDestino.trim(),
                            titularDestino: item.titularDestino.trim(),
                            titularDocumento: item.titularDocumento.trim(),
                            salvarComoPreferencialComissao:
                                item.salvarComoPreferencialComissao,
                            observacoes: item.observacoes.trim(),
                        })),
                    }),
                },
            );

            const dados = await resposta.json().catch(() => null);

            if (!resposta.ok) {
                throw new Error(
                    t("errorGenerate"),
                );
            }

            const mensagem = [
                t("success"),
                dados?.reciboNumero ? t("receiptNumber", { number: dados.reciboNumero }) : null,
            ]
                .filter(Boolean)
                .join(" ");

            await onConcluido(mensagem);
            onFechar();
        } catch (error: any) {
            setErro(error?.message || t("errorRegister"));
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/70 p-4">
            <div className="my-4 max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold">{t("title")}</h2>
                        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{t("intro")}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onFechar}
                        disabled={salvando}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >{t("close")}</button>
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
                    <p>
                        <strong>{t("employeeColon")}</strong>
                        <span className="mt-1 block">
                            {holerite.funcionario?.nome || t("employee")}
                        </span>
                    </p>

                    <p>
                        <strong>{t("periodColon")}</strong>
                        <span className="mt-1 block">
                            {String(holerite.competenciaMes).padStart(2, "0")}/
                            {holerite.competenciaAno}
                        </span>
                    </p>

                    <p>
                        <strong>{t("netAmountColon")}</strong>
                        <span className="mt-1 block font-bold text-emerald-700 dark:text-emerald-300">
                            {formatMoney(numero(holerite.valorLiquido))}
                        </span>
                    </p>
                </div>

                {carregando && (
                    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">{t("loading")}</div>
                )}

                {!carregando && erro && itens.length === 0 && (
                    <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {erro}
                    </div>
                )}

                {!carregando && preparacao && (
                    <>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t("salary")}</p>
                                <p className="mt-2 text-xl font-black">
                                    {formatMoney(preparacao.composicao.salarioEDemais)}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t("commission")}</p>
                                <p className="mt-2 text-xl font-black">
                                    {formatMoney(preparacao.composicao.comissao)}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t("variable")}</p>
                                <p className="mt-2 text-xl font-black">
                                    {formatMoney(preparacao.composicao.remuneracaoVariavel)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-5">
                            {itens.map((item, index) => {
                                const contaAutomatica = item.origemConta !== "MANUAL";
                                const podeSalvarPreferencia =
                                    item.origemConta === "MANUAL" &&
                                    (item.tipoItem === "COMISSAO" ||
                                        item.tipoItem === "REMUNERACAO_VARIAVEL");

                                return (
                                    <section
                                        key={`${item.tipoItem}-${index}`}
                                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    {t("paymentN", { number: index + 1 })}
                                                </p>
                                                <h3 className="mt-1 text-lg font-black">
                                                    {item.titulo}
                                                </h3>
                                            </div>

                                            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                                                {formatMoney(numero(item.valorPago))}
                                            </span>
                                        </div>

                                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("receivingAccount")}</label>

                                                <select
                                                    value={item.origemConta}
                                                    onChange={(event) =>
                                                        trocarOrigemConta(
                                                            index,
                                                            event.target.value as OrigemContaPagamento,
                                                        )
                                                    }
                                                    disabled={salvando}
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                                >
                                                    {item.tipoItem === "SALARIO_E_DEMAIS" &&
                                                        preparacao.contas.salario && (
                                                            <option value="CONTA_SALARIO">{t("salaryDefault")}</option>
                                                        )}

                                                    {item.tipoItem !== "SALARIO_E_DEMAIS" &&
                                                        preparacao.contas.comissao && (
                                                            <option value="CONTA_COMISSAO">{t("commissionPreferred")}</option>
                                                        )}

                                                    {item.tipoItem !== "SALARIO_E_DEMAIS" &&
                                                        preparacao.contas.salario && (
                                                            <option value="CONTA_SALARIO">{t("useSalaryDefault")}</option>
                                                        )}

                                                    <option value="MANUAL">{t("manualAccount")}</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("method")}</label>

                                                <select
                                                    value={item.formaPagamento}
                                                    onChange={(event) =>
                                                        atualizarItem(
                                                            index,
                                                            "formaPagamento",
                                                            event.target.value as FormaPagamentoHolerite,
                                                        )
                                                    }
                                                    disabled={salvando}
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                                >
                                                    <option value="FOLHA_BANCARIA">{t("payroll")}</option>
                                                    <option value="PIX">PIX</option>
                                                    <option value="TRANSFERENCIA">{t("transfer")}</option>
                                                    <option value="CONTA_SALARIO">{t("salaryAccount")}</option>
                                                    <option value="DINHEIRO">{t("cash")}</option>
                                                    <option value="CHEQUE">{t("cheque")}</option>
                                                    <option value="OUTRO">{t("other")}</option>
                                                </select>
                                            </div>
                                        </div>

                                        {contaAutomatica ? (
                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
                                                <p className="font-black text-slate-900 dark:text-white">{t("savedRecipient")}</p>

                                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                    <p>
                                                        <strong>{t("bankColon")}</strong>{" "}
                                                        {item.bancoDestinoTexto || t("notInformedMasc")}
                                                    </p>
                                                    <p>
                                                        <strong>{t("agencyColon")}</strong>{" "}
                                                        {item.agenciaDestino || t("notInformedFem")}
                                                    </p>
                                                    <p>
                                                        <strong>{t("accountColon")}</strong>{" "}
                                                        {item.contaDestino || t("notInformedFem")}
                                                    </p>
                                                    <p>
                                                        <strong>{t("holderColon")}</strong>{" "}
                                                        {item.titularDestino || t("notInformedMasc")}
                                                    </p>
                                                </div>

                                                {item.chavePixDestino && (
                                                    <div className="mt-4 rounded-xl border border-blue-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                                                        <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t("pixKeyForPayment")}</p>
                                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                                            <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 text-sm text-slate-900 dark:bg-slate-950 dark:text-white">
                                                                {item.chavePixDestino}
                                                            </code>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    copiarChavePix(item.chavePixDestino, index)
                                                                }
                                                                className="rounded-xl border border-blue-500 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
                                                            >
                                                                {pixCopiadoIndex === index ? t("copied") : t("copyKey")}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {item.formaPagamento === "PIX" &&
                                                    !item.chavePixDestino && (
                                                        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{t("missingPix")}</div>
                                                    )}
                                            </div>
                                        ) : (
                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                                                <h4 className="font-black">{t("manualRecipient")}</h4>

                                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("receivingBank")}</label>
                                                        <BuscaBanco
                                                            value={item.bancoDestinoTexto}
                                                            onChange={(
                                                                valor: string,
                                                                banco?: BancoSelecionado | null,
                                                            ) => {
                                                                atualizarItem(
                                                                    index,
                                                                    "bancoDestinoTexto",
                                                                    valor,
                                                                );
                                                                atualizarItem(
                                                                    index,
                                                                    "bancoDestinoCodigo",
                                                                    banco?.codigo || "",
                                                                );
                                                                atualizarItem(
                                                                    index,
                                                                    "bancoDestinoNome",
                                                                    banco?.nome || valor,
                                                                );
                                                            }}
                                                            disabled={salvando}
                                                            placeholder={t("bankCodeOrName")}
                                                            ariaLabel={t("searchRecipientBank")}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("accountType")}</label>
                                                        <select
                                                            value={item.tipoContaDestino}
                                                            onChange={(event) =>
                                                                atualizarItem(
                                                                    index,
                                                                    "tipoContaDestino",
                                                                    event.target.value as TipoContaBancaria,
                                                                )
                                                            }
                                                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                        >
                                                            <option value="">{t("select")}</option>
                                                            <option value="CORRENTE">{t("checkingAccount")}</option>
                                                            <option value="POUPANCA">{t("savings")}</option>
                                                            <option value="SALARIO">{t("salaryAccount")}</option>
                                                            <option value="PAGAMENTO">{t("paymentAccount")}</option>
                                                            <option value="OUTRA">{t("otherF")}</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("agency")}</label>
                                                        <input
                                                            value={item.agenciaDestino}
                                                            onChange={(event) =>
                                                                atualizarItem(
                                                                    index,
                                                                    "agenciaDestino",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                            placeholder={t("agency")}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("account")}</label>
                                                        <input
                                                            value={item.contaDestino}
                                                            onChange={(event) =>
                                                                atualizarItem(
                                                                    index,
                                                                    "contaDestino",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                            placeholder={t("accountWithDigit")}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("pixKeyType")}</label>
                                                        <select
                                                            value={item.tipoChavePixDestino}
                                                            onChange={(event) =>
                                                                atualizarItem(
                                                                    index,
                                                                    "tipoChavePixDestino",
                                                                    event.target.value as TipoChavePix,
                                                                )
                                                            }
                                                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                        >
                                                            <option value="">{t("select")}</option>
                                                            <option value="CPF">CPF</option>
                                                            <option value="CNPJ">CNPJ</option>
                                                            <option value="EMAIL">{t("email")}</option>
                                                            <option value="TELEFONE">{t("phone")}</option>
                                                            <option value="ALEATORIA">{t("randomKey")}</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("pixKey")}</label>
                                                        <input
                                                            value={item.chavePixDestino}
                                                            onChange={(event) =>
                                                                atualizarItem(
                                                                    index,
                                                                    "chavePixDestino",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                            placeholder={t("employeePixKey")}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("holder")}</label>
                                                        <input
                                                            value={item.titularDestino}
                                                            onChange={(event) =>
                                                                atualizarItem(
                                                                    index,
                                                                    "titularDestino",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                            placeholder={t("holderName")}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("holderDocument")}</label>
                                                        <input
                                                            value={item.titularDocumento}
                                                            onChange={(event) =>
                                                                atualizarItem(
                                                                    index,
                                                                    "titularDocumento",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                            placeholder={t("holderDocumentPlaceholder")}
                                                        />
                                                    </div>
                                                </div>

                                                {podeSalvarPreferencia && (
                                                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                item.salvarComoPreferencialComissao
                                                            }
                                                            onChange={(event) =>
                                                                marcarSalvarPreferencia(
                                                                    index,
                                                                    event.target.checked,
                                                                )
                                                            }
                                                            className="mt-1 h-4 w-4"
                                                        />
                                                        <span>
                                                            <strong className="block">{t("savePreferred")}</strong>{t("salaryUnchanged")}</span>
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("paymentDate")}</label>
                                                <input
                                                    type="datetime-local"
                                                    value={item.pagoEm}
                                                    onChange={(event) =>
                                                        atualizarItem(
                                                            index,
                                                            "pagoEm",
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={salvando}
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("partialValue")}</label>
                                                <input
                                                    value={item.valorPago}
                                                    readOnly
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("proof")}</label>
                                                <input
                                                    value={item.identificadorTransacao}
                                                    onChange={(event) =>
                                                        atualizarItem(
                                                            index,
                                                            "identificadorTransacao",
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={salvando}
                                                    placeholder={
                                                        item.formaPagamento === "PIX"
                                                            ? t("idE2e")
                                                            : t("numberCodeReference")
                                                    }
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                />
                                                {item.formaPagamento === "PIX" && (
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("idE2eHelp")}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("payingBank")}</label>
                                                <BuscaBanco
                                                    value={item.bancoOrigemTexto}
                                                    onChange={(
                                                        valor: string,
                                                        banco?: BancoSelecionado | null,
                                                    ) => {
                                                        atualizarItem(index, "bancoOrigemTexto", valor);
                                                        atualizarItem(
                                                            index,
                                                            "bancoOrigemCodigo",
                                                            banco?.codigo || "",
                                                        );
                                                        atualizarItem(
                                                            index,
                                                            "bancoOrigemNome",
                                                            banco?.nome || valor,
                                                        );
                                                    }}
                                                    disabled={salvando}
                                                    placeholder={t("payingBankCode")}
                                                    ariaLabel={t("searchPayingBank")}
                                                />
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("payingBankHelp")}</p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("sourceAgency")}</label>
                                                <input
                                                    value={item.agenciaOrigem}
                                                    onChange={(event) =>
                                                        atualizarItem(
                                                            index,
                                                            "agenciaOrigem",
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={salvando}
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                    placeholder={t("sourceAgencyPlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("sourceAccount")}</label>
                                                <input
                                                    value={item.contaOrigem}
                                                    onChange={(event) =>
                                                        atualizarItem(
                                                            index,
                                                            "contaOrigem",
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={salvando}
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                    placeholder={t("sourceAccountPlaceholder")}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("partNotes")}</label>
                                            <textarea
                                                value={item.observacoes}
                                                onChange={(event) =>
                                                    atualizarItem(
                                                        index,
                                                        "observacoes",
                                                        event.target.value,
                                                    )
                                                }
                                                rows={2}
                                                maxLength={3000}
                                                className="mt-2 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                placeholder={t("partNotesPlaceholder")}
                                            />
                                        </div>
                                    </section>
                                );
                            })}
                        </div>

                        <div className="mt-5">
                            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{t("receiptNotes")}</label>
                            <textarea
                                value={observacoesGerais}
                                onChange={(event) =>
                                    setObservacoesGerais(event.target.value)
                                }
                                rows={3}
                                maxLength={3000}
                                disabled={salvando}
                                className="mt-2 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                placeholder={t("receiptNotesPlaceholder")}
                            />
                        </div>

                        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{t("immutableNotice")}</div>

                        {erro && (
                            <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                                {erro}
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {t("totalPrepared", { amount: formatMoney(totalItens) })}
                            </p>

                            <div className="flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={salvando}
                                    onClick={onFechar}
                                    className="rounded-2xl border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                >{t("cancel")}</button>

                                <button
                                    type="button"
                                    disabled={salvando}
                                    onClick={registrarPagamento}
                                    className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {salvando
                                        ? t("generating")
                                        : t("generate")}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
