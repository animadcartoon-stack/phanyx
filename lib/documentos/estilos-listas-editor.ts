// Only allow explicitly supported list styles; never serialize arbitrary CSS.
export const ESTILOS_LISTA = [
  {
    "tipo": "bullet",
    "valor": "disc",
    "amostra": "●"
  },
  {
    "tipo": "bullet",
    "valor": "circle",
    "amostra": "○"
  },
  {
    "tipo": "bullet",
    "valor": "square",
    "amostra": "▪"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-square-open",
    "amostra": "□"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-diamond",
    "amostra": "◆"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-diamond-open",
    "amostra": "◇"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-arrow",
    "amostra": "➜"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-arrow-solid",
    "amostra": "➤"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-triangle",
    "amostra": "▸"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-check",
    "amostra": "✓"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-star",
    "amostra": "★"
  },
  {
    "tipo": "bullet",
    "valor": "phanyx-sparkle",
    "amostra": "✦"
  },
  {
    "tipo": "ordered",
    "valor": "decimal",
    "amostra": "1. 2. 3."
  },
  {
    "tipo": "ordered",
    "valor": "phanyx-decimal-paren",
    "amostra": "1) 2) 3)"
  },
  {
    "tipo": "ordered",
    "valor": "decimal-leading-zero",
    "amostra": "01. 02. 03."
  },
  {
    "tipo": "ordered",
    "valor": "upper-alpha",
    "amostra": "A. B. C."
  },
  {
    "tipo": "ordered",
    "valor": "phanyx-alpha-paren",
    "amostra": "a) b) c)"
  },
  {
    "tipo": "ordered",
    "valor": "phanyx-upper-paren",
    "amostra": "(A) (B) (C)"
  },
  {
    "tipo": "ordered",
    "valor": "upper-roman",
    "amostra": "I. II. III."
  },
  {
    "tipo": "ordered",
    "valor": "lower-roman",
    "amostra": "i. ii. iii."
  },
  {
    "tipo": "ordered",
    "valor": "phanyx-circled",
    "amostra": "① ② ③"
  },
  {
    "tipo": "ordered",
    "valor": "hierarchical",
    "amostra": "1. 1.1. 1.2."
  }
] as const;
export type EstiloLista = (typeof ESTILOS_LISTA)[number];
export function estiloListaValido(valor: unknown, tipo?: EstiloLista["tipo"]) {
  return ESTILOS_LISTA.find(e => e.valor === valor && (!tipo || e.tipo === tipo));
}
export function nomeFonteValido(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const nome = valor.trim().replace(/^["']|["']$/g, "").trim();
  return nome.length <= 100 && /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(nome) ? nome : null;
}
export const CSS_LISTAS_PHANYX = `
@counter-style phanyx-square-open { system: cyclic; symbols: "□"; suffix: " "; }
@counter-style phanyx-diamond { system: cyclic; symbols: "◆"; suffix: " "; }
@counter-style phanyx-diamond-open { system: cyclic; symbols: "◇"; suffix: " "; }
@counter-style phanyx-arrow { system: cyclic; symbols: "➜"; suffix: " "; }
@counter-style phanyx-arrow-solid { system: cyclic; symbols: "➤"; suffix: " "; }
@counter-style phanyx-triangle { system: cyclic; symbols: "▸"; suffix: " "; }
@counter-style phanyx-check { system: cyclic; symbols: "✓"; suffix: " "; }
@counter-style phanyx-star { system: cyclic; symbols: "★"; suffix: " "; }
@counter-style phanyx-sparkle { system: cyclic; symbols: "✦"; suffix: " "; }
@counter-style phanyx-decimal-paren { system: extends decimal; suffix: ") "; }
@counter-style phanyx-alpha-paren { system: extends lower-alpha; suffix: ") "; }
@counter-style phanyx-upper-paren { system: extends upper-alpha; prefix: "("; suffix: ") "; }
@counter-style phanyx-circled { system: fixed; symbols: "①" "②" "③" "④" "⑤" "⑥" "⑦" "⑧" "⑨" "⑩" "⑪" "⑫" "⑬" "⑭" "⑮" "⑯" "⑰" "⑱" "⑲" "⑳"; suffix: " "; fallback: decimal; }
ol[data-phanyx-list="hierarchical"], ol[data-phanyx-list="hierarchical"] ol { counter-reset: phanyxOutline; }
ol[data-phanyx-list="hierarchical"] > li, ol[data-phanyx-list="hierarchical"] ol > li { counter-increment: phanyxOutline; }
ol[data-phanyx-list="hierarchical"] > li::marker, ol[data-phanyx-list="hierarchical"] ol > li::marker { content: counters(phanyxOutline, ".") ". "; }
`;
