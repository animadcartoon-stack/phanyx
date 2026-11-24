// Persisted letterhead styles, with the same legacy aliases as institution settings.
export type ModeloPapelTimbrado = "PHANYX_MODERNO" | "PHANYX_ACADEMICO" | "PHANYX_CLASSICO" | "PERSONALIZADO_CLASSICO" | "PERSONALIZADO_MODERNO" | "PERSONALIZADO_MARCA" | "PAPEL_PROPRIO" | "SIMPLES";

export function normalizarModeloPapelTimbrado(estilo?: string | null): ModeloPapelTimbrado {
  switch (String(estilo || "").trim().toUpperCase()) {
    case "PHANYX_MODERNO": return "PHANYX_MODERNO";
    case "PHANYX_ACADEMICO": case "MINIMALISTA": return "PHANYX_ACADEMICO";
    case "PHANYX_CLASSICO": case "INSTITUCIONAL": case "CLASSICO": return "PHANYX_CLASSICO";
    case "PERSONALIZADO_CLASSICO": case "SEM_COR": return "PERSONALIZADO_CLASSICO";
    case "PERSONALIZADO_MODERNO": case "COLORIDO": return "PERSONALIZADO_MODERNO";
    case "PERSONALIZADO_MARCA": case "MARCA_DAGUA": return "PERSONALIZADO_MARCA";
    case "PAPEL_PROPRIO": return "PAPEL_PROPRIO";
    case "SIMPLES": return "SIMPLES";
    default: return "PERSONALIZADO_MODERNO";
  }
}

export function visualPapelTimbrado(estilo?: string | null) {
  const modelo = normalizarModeloPapelTimbrado(estilo);
  const classico = modelo === "PHANYX_CLASSICO";
  const moderno = modelo === "PHANYX_MODERNO";
  const academico = modelo === "PHANYX_ACADEMICO";
  const personalizadoClassico = modelo === "PERSONALIZADO_CLASSICO";
  const personalizadoModerno = modelo === "PERSONALIZADO_MODERNO";
  const marca = modelo === "PERSONALIZADO_MARCA";
  const escuro = classico || moderno;
  // The two dark variants follow the existing contract PDF's actual colors.
  const fundo = classico ? "#141414" : moderno ? "#244073" : "#ffffff";
  const cor = escuro ? "#ffffff" : "#0f172a";
  const borda = escuro ? "none" : academico ? "0.35mm solid #94a3b8" : personalizadoClassico ? "0.6mm solid #64748b" : personalizadoModerno ? "0.6mm solid #94a3b8" : "0.25mm solid #cbd5e1";
  const detalhe = moderno ? "border-left:7.76mm solid #172950;" : personalizadoClassico ? "border-top:2mm solid #94a3b8;" : personalizadoModerno ? "border-left:4mm solid #cbd5e1;" : "";
  return { modelo, classico, moderno, academico, personalizadoClassico, personalizadoModerno, marca, escuro, fundo, cor, borda, detalhe };
}
