"use client";
import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import { mensagemConflitoHorario } from "@/lib/matriculas/resumo-conflito-horario";
import { prepararSomConflito, tocarSomConflito } from "@/lib/interface/som-conflito-horario";

type Aviso = { detalhes: unknown } | null;
export function useAvisoConflitoHorario() {
  const [aviso, setAviso] = useState<Aviso>(null);
  const avisarSeConflito = useCallback((resposta: unknown) => {
    if (!resposta || typeof resposta !== "object" ||
        !("codigo" in resposta) || resposta.codigo !== "CONFLITO_HORARIO") return false;
    setAviso({ detalhes: "detalhes" in resposta ? resposta.detalhes : null });
    tocarSomConflito();
    return true;
  }, []);
  const fechar = useCallback(() => setAviso(null), []);
  return { aviso, avisarSeConflito, fechar, prepararSomConflito };
}

export default function AvisoConflitoHorarioMatricula({ aviso, onFechar }: { aviso: Aviso; onFechar: () => void }) {
  const locale = useLocale();
  const t = useTranslations("EnrollmentCombos");
  return <PhanyxConfirmModal aberto={aviso !== null} titulo={t("scheduleConflict")}
    mensagem={mensagemConflitoHorario(aviso?.detalhes, locale)} textoConfirmar={t("close")}
    mostrarCancelar={false} onConfirmar={onFechar} onCancelar={onFechar} />;
}
