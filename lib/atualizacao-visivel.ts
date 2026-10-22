// Poll only while the information can be seen. A slow request never overlaps
// the next tick; closing the view cancels the pending request.
export function iniciarAtualizacaoVisivel(
  atualizar: (signal: AbortSignal) => Promise<void>,
  intervaloMs: number,
  ambiente: {
    documento: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
    agendar: typeof setInterval;
    cancelar: typeof clearInterval;
  } = { documento: document, agendar: setInterval, cancelar: clearInterval },
) {
  const controller = new AbortController();
  let emAndamento = false;
  const executar = async () => {
    if (controller.signal.aborted || emAndamento || ambiente.documento.visibilityState !== "visible") return;
    emAndamento = true;
    try {
      await atualizar(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) console.error("Erro ao atualizar a visualização", error);
    } finally {
      emAndamento = false;
    }
  };

  void executar();
  const timer = ambiente.agendar(() => { void executar(); }, intervaloMs);
  const aoRetomar = () => { void executar(); };
  ambiente.documento.addEventListener("visibilitychange", aoRetomar);
  return () => {
    controller.abort();
    ambiente.cancelar(timer);
    ambiente.documento.removeEventListener("visibilitychange", aoRetomar);
  };
}
