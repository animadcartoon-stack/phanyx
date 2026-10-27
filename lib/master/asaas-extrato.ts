import "server-only";
import { getAsaasConfig } from "@/lib/asaas";
import { centavosAsaas, dataCivilValida, resumirMovimentos, type ExtratoAsaas, type MovimentoAsaas, type PeriodoExtrato } from "./asaas-extrato-model";

export class ErroExtratoAsaas extends Error {
  constructor(public codigo: string, mensagem: string, public status = 502) { super(mensagem); }
}
const invalido = () => new ErroExtratoAsaas("RESPOSTA_INVALIDA", "O Asaas retornou dados incompletos ou inconsistentes. Atualize a consulta.");
const texto = (v: unknown, limite = 2000) => typeof v === "string" ? v.slice(0, limite) : "";
const REFERENCIAS = { paymentId: "Cobrança", transferId: "Transferência", anticipationId: "Antecipação", billId: "Conta paga", splitId: "Split", invoiceId: "Nota fiscal", paymentDunningId: "Negativação", creditBureauReportId: "Consulta Serasa" };

function movimento(raw: unknown, periodo: PeriodoExtrato): MovimentoAsaas {
  const r = raw as Record<string, unknown>;
  if (!r || typeof r.id !== "string" || !r.id || r.id.length > 150 || !dataCivilValida(r.date) || r.date < periodo.inicio || r.date > periodo.fim || typeof r.type !== "string" || !r.type) throw invalido();
  try {
    return { id: r.id, data: r.date, tipo: texto(r.type, 150), descricao: texto(r.description) || texto(r.type, 150),
      valorCentavos: centavosAsaas(r.value), saldoAposCentavos: r.balance == null ? null : centavosAsaas(r.balance),
      referencias: Object.entries(REFERENCIAS).flatMap(([chave, tipo]) => typeof r[chave] === "string" && r[chave] ? [{ tipo, id: texto(r[chave], 150) }] : []) };
  } catch { throw invalido(); }
}

// Consulta somente a conta da chave principal, a mesma usada pela integração global.
// Não consulta contas institucionais nem executa operações de cobrança/transferência.
export async function consultarExtratoAsaas(periodo: PeriodoExtrato): Promise<ExtratoAsaas> {
  let config: ReturnType<typeof getAsaasConfig>;
  try { config = getAsaasConfig(); }
  catch { throw new ErroExtratoAsaas("NAO_CONFIGURADO", "A conexão principal do Asaas não está configurada no servidor. Confira ASAAS_API_KEY e o ambiente da integração na Vercel.", 503); }
  const bases: Record<string, "PRODUCAO" | "SANDBOX"> = {
    "https://api.asaas.com/v3": "PRODUCAO", "https://www.asaas.com/api/v3": "PRODUCAO",
    "https://api-sandbox.asaas.com/v3": "SANDBOX", "https://sandbox.asaas.com/api/v3": "SANDBOX",
  };
  const ambiente = bases[config.baseUrl];
  if (!ambiente) throw new ErroExtratoAsaas("URL_INVALIDA", "O endereço configurado para a conexão principal não é um endereço oficial da API Asaas.", 503);
  const prazo = Date.now() + 25000;
  async function ler(path: string): Promise<any> {
    const restante = prazo - Date.now();
    if (restante <= 0) throw new ErroExtratoAsaas("TEMPO_EXCEDIDO", "O Asaas demorou para responder. Reduza o período ou tente novamente.", 504);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(8000, restante));
    try {
      const res = await fetch(`${config.baseUrl}${path}`, { method: "GET", cache: "no-store", redirect: "error", signal: controller.signal,
        headers: { accept: "application/json", "User-Agent": "PHANYX-Master", access_token: config.apiKey } });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new ErroExtratoAsaas("ACESSO_NEGADO", "O Asaas recusou a consulta. Verifique a chave e as permissões de saldo e extrato da conexão principal.", 502);
        if (res.status === 429) throw new ErroExtratoAsaas("LIMITE_ASAAS", "O limite de consultas do Asaas foi atingido. Aguarde um momento e atualize.", 503);
        throw new ErroExtratoAsaas("ASAAS_INDISPONIVEL", "Não foi possível consultar o Asaas agora. Nenhum valor foi substituído por zero.");
      }
      return await res.json();
    } catch (e) {
      if (e instanceof ErroExtratoAsaas) throw e;
      throw new ErroExtratoAsaas("ASAAS_INDISPONIVEL", "Não foi possível concluir a consulta ao Asaas. Tente novamente ou reduza o período.");
    } finally { clearTimeout(timer); }
  }

  async function listar() {
    const unicos = new Map<string, MovimentoAsaas>();
    let offset = 0, totalInformado: number | null = null, completo = false;
    for (let pagina = 0; pagina < 50; pagina++) {
      // Se o orçamento acabar, mantém a lista parcial sem publicar totais incompletos.
      if (pagina > 0 && Date.now() >= prazo - 1000) break;
      const params = new URLSearchParams({ startDate: periodo.inicio, finishDate: periodo.fim, offset: String(offset), limit: "100", order: "asc" });
      const resposta = await ler(`/financialTransactions?${params}`);
      if (!resposta || !Array.isArray(resposta.data) || resposta.data.length > 100 || typeof resposta.hasMore !== "boolean" || (resposta.offset != null && resposta.offset !== offset)) throw invalido();
      if (resposta.totalCount != null) {
        if (!Number.isSafeInteger(resposta.totalCount) || resposta.totalCount < 0) throw invalido();
        totalInformado = resposta.totalCount;
      }
      const antes = unicos.size;
      for (const item of resposta.data) {
        const m = movimento(item, periodo), anterior = unicos.get(m.id);
        if (anterior && JSON.stringify(anterior) !== JSON.stringify(m)) throw invalido();
        unicos.set(m.id, m);
      }
      offset += resposta.data.length;
      if (!resposta.hasMore) { completo = true; break; }
      if (unicos.size === antes) throw invalido();
    }
    if (completo && totalInformado !== null && totalInformado !== unicos.size) throw invalido();
    return { movimentos: [...unicos.values()], totalInformado, completo };
  }
  const [saldo, extrato, identificacao] = await Promise.all([
    ler("/finance/balance").then(r => ({ valor: centavosAsaas(r?.balance), consultadoEm: new Date().toISOString() })),
    listar(),
    ler("/myAccount/accountNumber").catch(() => null),
  ]);
  const conta = identificacao && typeof identificacao.account === "string" && identificacao.account
    ? { agencia: texto(identificacao.agency, 30), numero: texto(identificacao.account, 50), digito: texto(identificacao.accountDigit, 5) } : null;
  return { fonte: "ASAAS", ambiente, periodo, consultadoEm: new Date().toISOString(), saldoConsultadoEm: saldo.consultadoEm,
    conta, saldoAtualCentavos: saldo.valor, ...extrato, resumo: extrato.completo ? resumirMovimentos(extrato.movimentos) : null };
}
