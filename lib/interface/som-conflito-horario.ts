// Um único contexto por aba, preparado durante a interação com o formulário.
// O aviso visual continua disponível quando o dispositivo não permite áudio.
let contexto: AudioContext | null = null;

export function prepararSomConflito() {
  if (typeof window === "undefined") return;
  try {
    const Audio = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    if (!contexto || contexto.state === "closed") contexto = new Audio();
    if (contexto.state === "suspended") void contexto.resume().catch(() => {});
  } catch { /* A matrícula não depende da disponibilidade do áudio. */ }
}

export function tocarSomConflito() {
  if (!contexto || contexto.state !== "running") return;
  try {
    const oscilador = contexto.createOscillator();
    const volume = contexto.createGain();
    const agora = contexto.currentTime;
    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(660, agora);
    oscilador.frequency.setValueAtTime(520, agora + 0.12);
    volume.gain.setValueAtTime(0.0001, agora);
    volume.gain.linearRampToValueAtTime(0.09, agora + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, agora + 0.28);
    oscilador.connect(volume);
    volume.connect(contexto.destination);
    oscilador.onended = () => { oscilador.disconnect(); volume.disconnect(); };
    oscilador.start(agora);
    oscilador.stop(agora + 0.29);
  } catch { /* O modal permanece visível se o som estiver bloqueado. */ }
}
