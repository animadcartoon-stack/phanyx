"use client";
import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import type { PreviaConversao } from "@/lib/academico/converter-cadastro-avulso";
import type { HorarioAvulso } from "@/lib/academico/validar-turma-avulsa";

type Base = { id: number; onConcluido: () => void | Promise<void> };
type Props = Base & ({ tipo: "curso" } | { tipo: "turma";
  cursoAtual?: { id: number; nome: string; matriculaDiretaTurma?: boolean };
  cursos: { id: number; nome: string; matriculaDiretaTurma?: boolean }[];
  horariosIniciais?: HorarioAvulso[];
  dadosTurma: { nome: string; codigo: string; periodoLetivo: string; turno: string;
    capacidadeMaxima: string; capacidadeMinima: string; professorId: string };
});
const pt = {
  titleCourse: "Converter este curso para matrícula sem disciplinas", titleClass: "Vincular esta turma a um curso avulso",
  helpCourse: "A revisão utiliza o cadastro já salvo. Guarde outras alterações antes. A conversão só será permitida se a estrutura estiver sem uso acadêmico.",
  helpClass: "Escolha um curso avulso de destino para mudar somente esta turma. Para manter o curso atual e sua grade, use “Editar turma no curso atual”. Um curso pode ter várias turmas, inclusive no mesmo horário com professores diferentes.",
  destination: "Curso avulso de destino", choose: "Selecione o curso...", noCourse: "Habilite primeiro a matrícula direta no cadastro do curso de destino.",
  hours: "Dias e horários após a conversão", add: "Adicionar horário", remove: "Remover horário", start: "Início", end: "Fim", day: "Dia da semana",
  review: "Revisar conversão", reviewing: "Conferindo vínculos...", confirm: "Confirmar conversão", cancel: "Cancelar", processing: "Convertendo...",
  structure: "Alterar também a estrutura do curso atual", structureHelp: "Converter também o curso “{nome}” para avulso. Esta opção solicita retirar sua grade e etapas após revisão; não é necessária para editar a turma.",  coursePlan: "O curso passará a receber matrículas diretamente em turmas. Serão retiradas as etapas e as associações curriculares abaixo. As disciplinas continuarão no catálogo e nas grades dos demais cursos.",
  classPlan: "A turma será vinculada ao curso indicado e ficará inativa. Serão retiradas apenas suas ofertas e etapas antigas, sem excluir as disciplinas do catálogo ou alterar outras turmas. Os horários informados substituirão os horários dessas ofertas.",
  stages: "Etapas a retirar", links: "Associações de disciplinas a retirar", catalog: "Disciplinas mantidas no catálogo", meetings: "Encontros semanais", success: "Conversão concluída.",
  error: "Não foi possível converter. Há dados inválidos, vínculos ou registros que precisam de revisão.", refresh: "O cadastro foi convertido. Recarregue a página para atualizar a lista.",
};
const textos: Record<string, typeof pt> = {
  "pt-BR": pt, "pt-PT": { ...pt, helpCourse: "A revisão utiliza o registo já guardado. Guarde outras alterações antes. A conversão só será permitida se a estrutura estiver sem utilização académica." },
  "en-US": { titleCourse: "Convert this course to enrollment without subjects", titleClass: "Reuse this class for a standalone course",
    helpCourse: "This review uses the saved course. Save other changes first. Conversion is allowed only when the structure has no academic use.", helpClass: "Choose a destination standalone course to move only this class. To keep its current course and curriculum, use “Edit class in current course”. A course can have multiple classes, including at the same time with different teachers.",
    destination: "Destination standalone course", choose: "Select a course...", noCourse: "First enable direct enrollment in the destination course settings.", hours: "Days and times after conversion", add: "Add time", remove: "Remove time", start: "Start", end: "End", day: "Day of week", review: "Review conversion", reviewing: "Checking links...", confirm: "Confirm conversion", cancel: "Cancel", processing: "Converting...",
    structure: "Also change the current course structure", structureHelp: "Also convert course “{nome}” to standalone enrollment. This requests removal of its curriculum and stages after review; it is not needed to edit the class.",    coursePlan: "The course will enroll students directly into classes. The stages and curriculum links below will be removed. Subjects will remain in the catalog and in other courses' curricula.", classPlan: "The class will move to the selected course and become inactive. Only its old subject offerings and stages will be removed. Catalog subjects and other classes will be preserved. The entered times will replace the old offerings' times.", stages: "Stages to remove", links: "Subject links to remove", catalog: "Subjects kept in the catalog", meetings: "Weekly meetings", success: "Conversion completed.", error: "Conversion could not be completed. Invalid data, linked records or history need review.", refresh: "The record was converted. Reload the page to update the list." },
  "es-ES": { titleCourse: "Convertir este curso a matrícula sin asignaturas", titleClass: "Reutilizar esta clase en un curso independiente", helpCourse: "La revisión utiliza el curso guardado. Guarde primero los demás cambios. Solo se permite convertir una estructura sin uso académico.", helpClass: "Elija un curso independiente de destino para mover solo esta clase. Para conservar el curso actual y su plan, use «Editar clase en el curso actual». Un curso puede tener varias clases, incluso a la misma hora con docentes diferentes.", destination: "Curso independiente de destino", choose: "Seleccione el curso...", noCourse: "Habilite primero la matrícula directa en el curso de destino.", hours: "Días y horarios después de convertir", add: "Añadir horario", remove: "Quitar horario", start: "Inicio", end: "Fin", day: "Día de la semana", review: "Revisar conversión", reviewing: "Comprobando vínculos...", confirm: "Confirmar conversión", cancel: "Cancelar", processing: "Convirtiendo...", structure: "Cambiar también la estructura del curso actual", structureHelp: "Convertir también el curso «{nome}» a matrícula independiente. Solicita retirar su plan y etapas tras la revisión; no es necesario para editar la clase.", coursePlan: "El curso recibirá matrículas directamente en clases. Se retirarán las etapas y asociaciones curriculares indicadas. Las asignaturas seguirán en el catálogo y en los planes de los demás cursos.", classPlan: "La clase se vinculará al curso indicado y quedará inactiva. Solo se retirarán sus ofertas y etapas antiguas. Se conservarán las asignaturas del catálogo y las demás clases. Los horarios indicados sustituirán los de las ofertas antiguas.", stages: "Etapas que se retirarán", links: "Asociaciones que se retirarán", catalog: "Asignaturas conservadas en el catálogo", meetings: "Encuentros semanales", success: "Conversión completada.", error: "No se pudo convertir. Hay datos, vínculos o registros que requieren revisión.", refresh: "El registro se convirtió. Recargue la página para actualizar la lista." },
  "fr-FR": { titleCourse: "Convertir ce cursus en inscription sans matières", titleClass: "Réutiliser cette classe pour un cours indépendant", helpCourse: "La vérification utilise le cursus enregistré. Enregistrez les autres modifications auparavant. Seule une structure sans utilisation académique peut être convertie.", helpClass: "Choisissez un cours indépendant de destination pour déplacer uniquement cette classe. Pour garder le cursus actuel et son programme, utilisez «Modifier la classe dans le cursus actuel». Un cursus peut avoir plusieurs classes, y compris à la même heure avec des enseignants différents.", destination: "Cours indépendant de destination", choose: "Sélectionnez le cours...", noCourse: "Activez d’abord l’inscription directe dans le cursus de destination.", hours: "Jours et horaires après conversion", add: "Ajouter un horaire", remove: "Retirer l’horaire", start: "Début", end: "Fin", day: "Jour de la semaine", review: "Vérifier la conversion", reviewing: "Vérification des liens...", confirm: "Confirmer la conversion", cancel: "Annuler", processing: "Conversion...", structure: "Modifier aussi la structure du cursus actuel", structureHelp: "Convertir aussi le cursus « {nome} » en inscription indépendante. Cette option demande le retrait de son programme et de ses étapes après vérification ; elle est inutile pour modifier la classe.", coursePlan: "Les inscriptions se feront directement dans les classes. Les étapes et liens du programme indiqués seront retirés. Les matières resteront au catalogue et dans les programmes des autres cursus.", classPlan: "La classe sera rattachée au cursus choisi et désactivée. Seules ses anciennes matières proposées et étapes seront retirées. Le catalogue et les autres classes seront conservés. Les horaires saisis remplaceront ceux des anciennes propositions.", stages: "Étapes à retirer", links: "Liens de matières à retirer", catalog: "Matières conservées au catalogue", meetings: "Séances hebdomadaires", success: "Conversion terminée.", error: "Conversion impossible. Des données, liens ou historiques doivent être vérifiés.", refresh: "La fiche a été convertie. Rechargez la page pour actualiser la liste." },
};
const dias = ["classesSun", "classesMon", "classesTue", "classesWed", "classesThu", "classesFri", "classesSat"] as const;
const entrada = "rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";
export default function ConverterCadastroAvulso(props: Props) {
  const locale = useLocale(), t = useTranslations("AdminOperations"), texto = textos[locale] || textos["en-US"];
  const [destino, setDestino] = useState(props.tipo === "turma" && props.cursoAtual?.matriculaDiretaTurma ? String(props.cursoAtual.id) : "");
  const [converterCursoAtual, setConverterCursoAtual] = useState(false);
  const [horarios, setHorarios] = useState<HorarioAvulso[]>(() => {
    const existentes = props.tipo === "turma" ? (props.horariosIniciais || []).filter(h => h.horaInicio && h.horaFim) : [];
    const unicos = [...new Map(existentes.map(h => [`${h.diaSemana}|${h.horaInicio}|${h.horaFim}`, h])).values()];
    return unicos.length ? unicos : [{ diaSemana: 1, horaInicio: "", horaFim: "" }];
  });
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(""), [sucesso, setSucesso] = useState("");
  const [plano, setPlano] = useState<{ previa: PreviaConversao; entrada: Record<string, unknown> } | null>(null);
  const cursos = props.tipo === "turma" ? [...new Map([
    ...(converterCursoAtual && props.cursoAtual ? [props.cursoAtual] : []), ...props.cursos.filter(c => c.matriculaDiretaTurma),
  ].map(c => [c.id, c])).values()] : [];
  async function solicitar(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/avulsos/converter", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(locale.startsWith("pt") ? (dados.error || texto.error) : texto.error);
    return dados;
  }
  async function revisar() {
    setOcupado(true); setErro(""); setSucesso("");
    try {
      const body = { tipo: props.tipo, id: props.id, ...(props.tipo === "turma" ? { cursoDestinoId: Number(destino), dadosTurma: { ...props.dadosTurma, horarios } } : {}) };
      const dados = await solicitar({ ...body, confirmar: false });
      setPlano({ previa: dados.previa, entrada: body });
    } catch (e) { setErro(e instanceof Error ? e.message : texto.error); }
    finally { setOcupado(false); }
  }
  async function confirmar() {
    if (!plano || ocupado) return;
    setOcupado(true); setErro("");
    try {
      await solicitar({ ...plano.entrada, confirmar: true, chave: plano.previa.chave });
      setPlano(null); setSucesso(texto.success);
      try { await props.onConcluido(); } catch { setErro(texto.refresh); }
    } catch (e) { setPlano(null); setErro(e instanceof Error ? e.message : texto.error); }
    finally { setOcupado(false); }
  }
  const resumo = plano ? `${plano.previa.nome} → ${plano.previa.cursoDestino}. ${props.tipo === "curso" ? texto.coursePlan : texto.classPlan} ${plano.previa.converteCurso ? texto.coursePlan : ""} ${texto.stages}: ${plano.previa.etapas}. ${texto.links}: ${plano.previa.vinculosDisciplinas}. ${texto.catalog}: ${plano.previa.disciplinasCatalogo.join(", ") || "—"}. ${props.tipo === "turma" ? `${texto.meetings}: ${plano.previa.horarios}.` : ""}` : "";
  return <section className="phanyx-turma-horarios-card space-y-3 rounded-xl border p-4">
    <h3 className="phanyx-turma-horarios-titulo font-semibold">{props.tipo === "curso" ? texto.titleCourse : texto.titleClass}</h3>
    <p className="phanyx-turma-horarios-texto text-sm">{props.tipo === "curso" ? texto.helpCourse : texto.helpClass}</p>
    {props.tipo === "turma" ? <fieldset disabled={ocupado || plano !== null} className="space-y-3">
      {props.cursoAtual && !props.cursoAtual.matriculaDiretaTurma ? <details className="rounded-lg border border-slate-300 p-3 dark:border-slate-700">
        <summary className="phanyx-turma-horarios-texto cursor-pointer text-sm font-semibold">{texto.structure}</summary>
        <label className="phanyx-turma-horarios-texto mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={converterCursoAtual} onChange={e => {
            setConverterCursoAtual(e.target.checked);
            setDestino(e.target.checked ? String(props.cursoAtual!.id) : "");
            setErro("");
          }} />
          {texto.structureHelp.replace("{nome}", props.cursoAtual.nome)}
        </label>
      </details> : null}
      <label className="phanyx-turma-horarios-texto block text-sm">{texto.destination}
        <select aria-label={texto.destination} value={destino} onChange={e => setDestino(e.target.value)} className={`${entrada} mt-1 w-full`}>
          <option value="">{texto.choose}</option>{cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </label>
      {cursos.length === 0 ? <p className="phanyx-turma-horarios-texto text-sm">{texto.noCourse}</p> : null}
      <p className="phanyx-turma-horarios-texto text-sm font-semibold">{texto.hours}</p>
      {horarios.map((h, i) => <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_110px_auto]">
        <select aria-label={`${texto.day} ${i + 1}`} value={h.diaSemana} onChange={e => setHorarios(antes => antes.map((v, j) => j === i ? { ...v, diaSemana: Number(e.target.value) } : v))} className={entrada}>{dias.map((d, n) => <option key={n} value={n}>{t(d)}</option>)}</select>
        <input aria-label={`${texto.start} ${i + 1}`} type="time" value={h.horaInicio} onChange={e => setHorarios(antes => antes.map((v, j) => j === i ? { ...v, horaInicio: e.target.value } : v))} className={entrada}/>
        <input aria-label={`${texto.end} ${i + 1}`} type="time" value={h.horaFim} onChange={e => setHorarios(antes => antes.map((v, j) => j === i ? { ...v, horaFim: e.target.value } : v))} className={entrada}/>
        <button type="button" disabled={horarios.length === 1} onClick={() => setHorarios(antes => antes.filter((_, j) => j !== i))} className="rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{texto.remove}</button>
      </div>)}
      <button type="button" disabled={horarios.length >= 30} onClick={() => setHorarios(antes => [...antes, { diaSemana: 1, horaInicio: "", horaFim: "" }])} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">{texto.add}</button>
    </fieldset> : null}
    {erro ? <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{erro}</p> : null}
    {sucesso ? <p role="status" className="phanyx-turma-horarios-texto text-sm">{sucesso}</p> : null}
    <button type="button" onClick={() => void revisar()} disabled={ocupado || plano !== null || (props.tipo === "turma" && !destino)} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{ocupado ? texto.reviewing : texto.review}</button>
    <PhanyxConfirmModal aberto={plano !== null} titulo={texto.confirm} mensagem={resumo} tipo="perigo" textoConfirmar={texto.confirm} textoCancelar={texto.cancel} textoCarregando={texto.processing} carregando={ocupado} onConfirmar={() => void confirmar()} onCancelar={() => { if (!ocupado) setPlano(null); }}/>
  </section>;
}

export function ModoEdicaoTurma({ semDisciplinas, onChange }: { semDisciplinas: boolean; onChange: (valor: boolean) => void }) {
  const locale = useLocale();
  const grupo = useId();
  const labels = ({
    "pt-BR": ["Ação nesta turma", "Editar turma no curso atual", "Vincular turma a um curso avulso"],
    "pt-PT": ["Ação nesta turma", "Editar turma no curso atual", "Vincular turma a um curso avulso"],
    "en-US": ["Class action", "Edit class in current course", "Move class to a standalone course"],
    "es-ES": ["Acción en esta clase", "Editar clase en el curso actual", "Vincular clase a un curso independiente"],
    "fr-FR": ["Action sur cette classe", "Modifier la classe dans le cursus actuel", "Rattacher la classe à un cours indépendant"],
  } as Record<string, string[]>)[locale] || ["Class action", "Edit class in current course", "Move class to a standalone course"];
  return <fieldset className="phanyx-turma-horarios-card rounded-xl border p-3">
    <legend className="phanyx-turma-horarios-titulo px-1 text-sm font-semibold">{labels[0]}</legend>
    <div className="flex flex-wrap gap-4">
      <label className="phanyx-turma-horarios-texto flex items-center gap-2 text-sm"><input type="radio" name={grupo} checked={!semDisciplinas} onChange={() => onChange(false)}/>{labels[1]}</label>
      <label className="phanyx-turma-horarios-texto flex items-center gap-2 text-sm"><input type="radio" name={grupo} checked={semDisciplinas} onChange={() => onChange(true)}/>{labels[2]}</label>
    </div>
  </fieldset>;
}
