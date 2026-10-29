"use client";

import { useLocale, useTranslations } from "next-intl";

import BannerPhanyx from "@/components/phanyx/BannerPhanyx";
import BandeiraPais from "@/components/internacionalizacao/BandeiraPais";
import estilos from "@/components/phanyx/DestaquesPainel.module.css";

export type FeriadoAtivoPhanyx = {
  id: number;
  paisCodigo: string;
  dataFeriado: string;
  diasRestantes: number;
  inicioExibicao: string;
  fimExibicao: string;
  prioridade: number;
  emoji: string | null;
  locale: string;
  nome: string;
  titulo: string;
  mensagem: string;
};

type Props = {
  feriado: FeriadoAtivoPhanyx;
};

function formatarDataCivil(
  valor: string,
  locale: string
) {
  const partes =
    String(valor || "")
      .split("-")
      .map(Number);

  const [ano, mes, dia] =
    partes;

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return valor;
  }

  const data =
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia
      )
    );

  try {
    return new Intl.DateTimeFormat(
      locale,
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }
    ).format(data);
  } catch {
    return valor;
  }
}

export default function PhanyxFeriadoAviso({
  feriado,
}: Props) {
  const locale = useLocale();

  const t =
    useTranslations(
      "PublicHolidayBanner"
    );

  const dataTexto =
    formatarDataCivil(
      feriado.dataFeriado,
      locale
    );

  const tituloInteligente =
    feriado.diasRestantes === 0
      ? t(
          "titleToday",
          {
            name:
              feriado.nome,
          }
        )
      : feriado.diasRestantes === 1
      ? t(
          "titleTomorrow",
          {
            name:
              feriado.nome,
          }
        )
      : feriado.diasRestantes > 1
      ? t(
          "titleUpcoming",
          {
            name:
              feriado.nome,
          }
        )
      : feriado.titulo;

  const fraseInteligente =
    feriado.diasRestantes === 0
      ? t(
          "messageToday",
          {
            name:
              feriado.nome,
            message:
              feriado.mensagem,
          }
        )
      : feriado.diasRestantes === 1
      ? t(
          "messageTomorrow",
          {
            name:
              feriado.nome,
            message:
              feriado.mensagem,
          }
        )
      : feriado.diasRestantes > 1
      ? t(
          "messageUpcoming",
          {
            name:
              feriado.nome,
            date:
              dataTexto,
            message:
              feriado.mensagem,
          }
        )
      : feriado.mensagem;

  const icone =
    feriado.emoji ? (
      feriado.emoji
    ) : (
      <BandeiraPais
        codigo={
          feriado.paisCodigo
        }
        nome={
          feriado.nome
        }
        className="h-7 w-10 rounded-md object-cover"
      />
    );

  return (
    <div className={`${estilos.feriado} mb-6`}>
      <BannerPhanyx
        aviso={{
          id:
            `feriado-global-${feriado.id}`,
          titulo:
            tituloInteligente,
          descricao:
            dataTexto,
          origem:
            t("origin"),
          frase:
            fraseInteligente,
          icone,
          categoria:
            t("category"),
          cor: "amarelo",
          prioridade:
            feriado.prioridade,
        }}
      />
    </div>
  );
}
