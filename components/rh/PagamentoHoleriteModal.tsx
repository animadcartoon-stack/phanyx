"use client";

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

function moeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function valorInput(valor: number) {
    return valor.toFixed(2).replace(".", ",");
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
): ItemPagamentoForm {
    const possuiPix = Boolean(conta?.chavePix);

    return {
        tipoItem,
        titulo,
        origemConta: conta ? origemConta : "MANUAL",
        contaBancariaFuncionarioId: conta?.id ?? null,
        formaPagamento: possuiPix ? "PIX" : "TRANSFERENCIA",
        valorPago: valorInput(valor),
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
): ItemPagamentoForm[] {
    const itens: ItemPagamentoForm[] = [];

    if (preparacao.composicao.salarioEDemais > 0.009) {
        itens.push(
            criarItemPagamento(
                "SALARIO_E_DEMAIS",
                "Salário e demais valores",
                preparacao.composicao.salarioEDemais,
                preparacao.contas.salario,
                "CONTA_SALARIO",
            ),
        );
    }

    if (preparacao.composicao.comissao > 0.009) {
        itens.push(
            criarItemPagamento(
                "COMISSAO",
                "Comissão",
                preparacao.composicao.comissao,
                preparacao.contas.destinoPreferencialComissao,
                preparacao.contas.origemPreferencialComissao,
            ),
        );
    }

    if (preparacao.composicao.remuneracaoVariavel > 0.009) {
        itens.push(
            criarItemPagamento(
                "REMUNERACAO_VARIAVEL",
                "Remuneração variável",
                preparacao.composicao.remuneracaoVariavel,
                preparacao.contas.destinoPreferencialComissao,
                preparacao.contas.origemPreferencialComissao,
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
                        dados?.error || "Não foi possível preparar o pagamento.",
                    );
                }

                const preparacaoRecebida = dados as PreparacaoPagamento;

                setPreparacao(preparacaoRecebida);
                setItens(montarItensPagamento(preparacaoRecebida));
            } catch (error: any) {
                if (error?.name === "AbortError") return;

                setErro(
                    error?.message || "Não foi possível carregar os dados bancários.",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setCarregando(false);
                }
            }
        }

        carregarPreparacao();

        return () => controller.abort();
    }, [holerite.id]);

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
            setErro("Não foi possível copiar a chave Pix automaticamente.");
        }
    }

    function validarItens() {
        if (!preparacao) return "Os dados do pagamento ainda não foram carregados.";
        if (itens.length === 0) return "Nenhum item de pagamento foi preparado.";

        if (Math.abs(totalItens - preparacao.holerite.valorLiquido) > 0.009) {
            return `A soma dos pagamentos deve ser ${moeda(
                preparacao.holerite.valorLiquido,
            )}.`;
        }

        for (let index = 0; index < itens.length; index += 1) {
            const item = itens[index];
            const numeroItem = index + 1;

            if (numero(item.valorPago) <= 0) {
                return `Informe um valor válido no item ${numeroItem}.`;
            }

            const data = new Date(item.pagoEm);
            if (!item.pagoEm || Number.isNaN(data.getTime())) {
                return `Informe a data e o horário do item ${numeroItem}.`;
            }

            if (
                FORMAS_QUE_EXIGEM_TRANSACAO.has(item.formaPagamento) &&
                !item.identificadorTransacao.trim()
            ) {
                return `Informe o comprovante ou referência do item ${numeroItem}.`;
            }

            if (
                FORMAS_BANCARIAS.has(item.formaPagamento) &&
                !item.bancoOrigemNome.trim() &&
                !item.bancoOrigemTexto.trim()
            ) {
                return `Informe o banco pagador/origem do item ${numeroItem}.`;
            }

            if (
                item.formaPagamento === "PIX" &&
                !item.chavePixDestino.trim()
            ) {
                return `Informe a chave Pix do destinatário no item ${numeroItem}.`;
            }

            if (
                FORMAS_QUE_EXIGEM_CONTA_DESTINO.has(item.formaPagamento) &&
                (!item.bancoDestinoNome.trim() || !item.contaDestino.trim())
            ) {
                return `Informe o banco e a conta de destino no item ${numeroItem}.`;
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
                    dados?.error || "Não foi possível gerar o recibo de pagamento.",
                );
            }

            const mensagem = [
                dados?.message || "Recibo de pagamento gerado.",
                dados?.reciboNumero ? `Número: ${dados.reciboNumero}.` : null,
            ]
                .filter(Boolean)
                .join(" ");

            await onConcluido(mensagem);
            onFechar();
        } catch (error: any) {
            setErro(error?.message || "Erro ao registrar o pagamento.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/70 p-4">
            <div className="my-4 max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold">Registrar pagamento</h2>
                        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                            Confira a conta salarial e a conta preferencial de comissão. Cada
                            transferência deve ter seu próprio comprovante ou referência.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onFechar}
                        disabled={salvando}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Fechar
                    </button>
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
                    <p>
                        <strong>Funcionário:</strong>
                        <span className="mt-1 block">
                            {holerite.funcionario?.nome || "Funcionário"}
                        </span>
                    </p>

                    <p>
                        <strong>Competência:</strong>
                        <span className="mt-1 block">
                            {String(holerite.competenciaMes).padStart(2, "0")}/
                            {holerite.competenciaAno}
                        </span>
                    </p>

                    <p>
                        <strong>Valor líquido:</strong>
                        <span className="mt-1 block font-bold text-emerald-700 dark:text-emerald-300">
                            {moeda(numero(holerite.valorLiquido))}
                        </span>
                    </p>
                </div>

                {carregando && (
                    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                        Carregando contas bancárias e composição do holerite...
                    </div>
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
                                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                                    Salário e demais valores
                                </p>
                                <p className="mt-2 text-xl font-black">
                                    {moeda(preparacao.composicao.salarioEDemais)}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                                    Comissão
                                </p>
                                <p className="mt-2 text-xl font-black">
                                    {moeda(preparacao.composicao.comissao)}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                                    Remuneração variável
                                </p>
                                <p className="mt-2 text-xl font-black">
                                    {moeda(preparacao.composicao.remuneracaoVariavel)}
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
                                                    Pagamento {index + 1}
                                                </p>
                                                <h3 className="mt-1 text-lg font-black">
                                                    {item.titulo}
                                                </h3>
                                            </div>

                                            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                                                {moeda(numero(item.valorPago))}
                                            </span>
                                        </div>

                                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                    Conta recebedora
                                                </label>

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
                                                            <option value="CONTA_SALARIO">
                                                                Conta padrão de salário
                                                            </option>
                                                        )}

                                                    {item.tipoItem !== "SALARIO_E_DEMAIS" &&
                                                        preparacao.contas.comissao && (
                                                            <option value="CONTA_COMISSAO">
                                                                Conta preferencial de comissão
                                                            </option>
                                                        )}

                                                    {item.tipoItem !== "SALARIO_E_DEMAIS" &&
                                                        preparacao.contas.salario && (
                                                            <option value="CONTA_SALARIO">
                                                                Usar conta padrão de salário
                                                            </option>
                                                        )}

                                                    <option value="MANUAL">
                                                        Informar outra conta manualmente
                                                    </option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                    Forma de pagamento
                                                </label>

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
                                                    <option value="FOLHA_BANCARIA">Folha bancária</option>
                                                    <option value="PIX">PIX</option>
                                                    <option value="TRANSFERENCIA">
                                                        Transferência bancária
                                                    </option>
                                                    <option value="CONTA_SALARIO">Conta-salário</option>
                                                    <option value="DINHEIRO">Dinheiro</option>
                                                    <option value="CHEQUE">Cheque</option>
                                                    <option value="OUTRO">Outro</option>
                                                </select>
                                            </div>
                                        </div>

                                        {contaAutomatica ? (
                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
                                                <p className="font-black text-slate-900 dark:text-white">
                                                    Dados cadastrados do destinatário
                                                </p>

                                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                    <p>
                                                        <strong>Banco:</strong>{" "}
                                                        {item.bancoDestinoTexto || "Não informado"}
                                                    </p>
                                                    <p>
                                                        <strong>Agência:</strong>{" "}
                                                        {item.agenciaDestino || "Não informada"}
                                                    </p>
                                                    <p>
                                                        <strong>Conta:</strong>{" "}
                                                        {item.contaDestino || "Não informada"}
                                                    </p>
                                                    <p>
                                                        <strong>Titular:</strong>{" "}
                                                        {item.titularDestino || "Não informado"}
                                                    </p>
                                                </div>

                                                {item.chavePixDestino && (
                                                    <div className="mt-4 rounded-xl border border-blue-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                                                        <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                                                            Chave Pix para realizar o pagamento
                                                        </p>
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
                                                                {pixCopiadoIndex === index
                                                                    ? "Chave copiada"
                                                                    : "Copiar chave"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {item.formaPagamento === "PIX" &&
                                                    !item.chavePixDestino && (
                                                        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                                                            Esta conta não possui chave Pix cadastrada. Altere
                                                            a forma para transferência ou escolha uma conta
                                                            manual.
                                                        </div>
                                                    )}
                                            </div>
                                        ) : (
                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                                                <h4 className="font-black">Dados manuais do destino</h4>

                                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            Banco recebedor/destino
                                                        </label>
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
                                                            placeholder="Código ou nome do banco"
                                                            ariaLabel="Buscar banco recebedor"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            Tipo de conta
                                                        </label>
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
                                                            <option value="">Selecione</option>
                                                            <option value="CORRENTE">Conta corrente</option>
                                                            <option value="POUPANCA">Poupança</option>
                                                            <option value="SALARIO">Conta-salário</option>
                                                            <option value="PAGAMENTO">Conta de pagamento</option>
                                                            <option value="OUTRA">Outra</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            Agência
                                                        </label>
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
                                                            placeholder="Agência"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            Conta
                                                        </label>
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
                                                            placeholder="Conta com dígito"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            Tipo de chave Pix
                                                        </label>
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
                                                            <option value="">Selecione</option>
                                                            <option value="CPF">CPF</option>
                                                            <option value="CNPJ">CNPJ</option>
                                                            <option value="EMAIL">E-mail</option>
                                                            <option value="TELEFONE">Telefone</option>
                                                            <option value="ALEATORIA">Chave aleatória</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            Chave Pix
                                                        </label>
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
                                                            placeholder="Chave Pix do funcionário"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            Titular
                                                        </label>
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
                                                            placeholder="Nome do titular"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            CPF/CNPJ do titular
                                                        </label>
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
                                                            placeholder="Documento do titular"
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
                                                            <strong className="block">
                                                                Salvar esta conta como preferencial para futuras
                                                                comissões
                                                            </strong>
                                                            A conta salarial não será substituída.
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                    Data e horário do pagamento
                                                </label>
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
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                    Valor desta parte
                                                </label>
                                                <input
                                                    value={item.valorPago}
                                                    readOnly
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                    Comprovante ou referência da transação
                                                </label>
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
                                                            ? "ID/E2E exibido no comprovante"
                                                            : "Número, código ou referência"
                                                    }
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                />
                                                {item.formaPagamento === "PIX" && (
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        O ID/E2E identifica o Pix já realizado. Ele não
                                                        substitui a chave Pix do destinatário.
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                    Banco pagador/origem
                                                </label>
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
                                                    placeholder="Código ou nome do banco pagador"
                                                    ariaLabel="Buscar banco pagador"
                                                />
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Banco da instituição de onde o valor saiu.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                    Agência de origem, se aplicável
                                                </label>
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
                                                    placeholder="Agência da instituição"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                    Conta de origem, se aplicável
                                                </label>
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
                                                    placeholder="Conta da instituição"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                Observações desta parte
                                            </label>
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
                                                placeholder="Informações específicas deste pagamento."
                                            />
                                        </div>
                                    </section>
                                );
                            })}
                        </div>

                        <div className="mt-5">
                            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                Observações gerais do recibo
                            </label>
                            <textarea
                                value={observacoesGerais}
                                onChange={(event) =>
                                    setObservacoesGerais(event.target.value)
                                }
                                rows={3}
                                maxLength={3000}
                                disabled={salvando}
                                className="mt-2 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                placeholder="Informações gerais sobre o pagamento."
                            />
                        </div>

                        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                            O recibo preservará o destino, os valores e as referências usados
                            em cada pagamento. Alterações futuras nas contas do funcionário
                            não modificarão os registros antigos.
                        </div>

                        {erro && (
                            <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                                {erro}
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                Total preparado: {moeda(totalItens)}
                            </p>

                            <div className="flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={salvando}
                                    onClick={onFechar}
                                    className="rounded-2xl border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    disabled={salvando}
                                    onClick={registrarPagamento}
                                    className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {salvando
                                        ? "Gerando recibo..."
                                        : "Gerar recibo de pagamento"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}