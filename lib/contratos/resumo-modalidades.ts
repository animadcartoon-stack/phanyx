import { getTranslations } from "next-intl/server";
import { nomeContratacaoModalidades } from "@/lib/matriculas/combos";

const escapar = (texto: unknown) =>
  String(texto ?? "").replace(
    /[&<>"']/g,
    (caractere) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        caractere
      ]!,
  );

// O quadro contratual usa o snapshot da matrícula, inclusive ao reemitir o
// contrato depois de uma alteração na tabela de preços ou nos horários.
export async function anexarResumoModalidades(
  html: string,
  snapshot: unknown,
  locale = "pt-BR",
) {
  const nome = nomeContratacaoModalidades(snapshot);
  if (!nome) return html;
  const s = snapshot as {
    ofertas?: Array<{
      cursoNome: string;
      turmaNome: string;
      horarios: Array<{
        diaSemana: number;
        horaInicio: string;
        horaFim: string | null;
        dataInicio: string | null;
        dataFim: string | null;
      }>;
    }>;
    finais?: {
      matriculaCentavos: number;
      mensalidadeCentavos: number;
      quantidadeParcelas: number;
    };
  };
  const t = await getTranslations({ locale, namespace: "EnrollmentCombos" });
  const moeda = (valor: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(valor / 100);
  const dia = (valor: number) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2023, 0, 1 + valor)));
  const linhas = (s.ofertas || [])
    .map(
      (o) =>
        `<tr><td style="border:1px solid #cbd5e1;padding:6px">${escapar(o.cursoNome)}</td><td style="border:1px solid #cbd5e1;padding:6px">${escapar(o.turmaNome)}</td><td style="border:1px solid #cbd5e1;padding:6px">${o.horarios.length ? o.horarios.map((h) => escapar(`${dia(h.diaSemana)} ${h.horaInicio}–${h.horaFim || ""}${h.dataInicio ? ` (${h.dataInicio} – ${h.dataFim || "…"})` : ""}`)).join("<br>") : escapar(t("freeEad"))}</td></tr>`,
    )
    .join("");
  const quadro = `<section data-phanyx-modalidades="1" style="margin-top:20px;color:#0f172a"><h2>${escapar(t("summary"))}: ${escapar(nome)}</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th>${escapar(t("courses"))}</th><th>${escapar(t("class"))}</th><th>${escapar(t("selectedSchedule"))}</th></tr></thead><tbody>${linhas}</tbody></table>${s.finais ? `<p>${escapar(t("enrollmentFee"))}: ${escapar(moeda(s.finais.matriculaCentavos))}<br>${escapar(t("monthly"))}: ${escapar(moeda(s.finais.mensalidadeCentavos))}<br>${escapar(t("installments"))}: ${s.finais.quantidadeParcelas}<br>${escapar(t("total"))}: ${escapar(moeda(s.finais.matriculaCentavos + s.finais.mensalidadeCentavos * s.finais.quantidadeParcelas))}</p>` : ""}</section>`;
  return /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${quadro}</body>`)
    : html + quadro;
}
