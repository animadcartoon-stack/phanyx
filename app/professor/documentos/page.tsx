import CentralDocentes from "@/components/documentos-docentes/CentralDocentes";

export default function DocumentosDocentesProfessorPage({
  searchParams,
}: {
  searchParams: { documento?: string | string[] };
}) {
  const valor = searchParams.documento;
  const id = typeof valor === "string" ? Number(valor) : NaN;
  const documentoInicial = Number.isSafeInteger(id) && id > 0 ? id : null;

  return <CentralDocentes key={documentoInicial ?? "lista"} papel="PROFESSOR" documentoInicial={documentoInicial} />;
}
