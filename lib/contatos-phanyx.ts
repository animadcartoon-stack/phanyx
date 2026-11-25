export const emailContatoPhanyx = "contato@phanyx.com.br";
export const emailSuportePhanyx = "suporte@phanyx.com.br";

export function linkContatoPhanyx(assunto = "Contato comercial — PHANYX") {
  return `mailto:${emailContatoPhanyx}?subject=${encodeURIComponent(assunto)}`;
}

export const linkSuportePhanyx = `mailto:${emailSuportePhanyx}?subject=${encodeURIComponent("Suporte técnico — PHANYX")}`;
