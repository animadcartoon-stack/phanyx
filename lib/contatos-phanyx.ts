export const emailContatoPhanyx = "contato@phanyx.com.br";
export const emailSuportePhanyx = "suporte@phanyx.com.br";

export const canaisEmailPhanyx = {
  comercial: {
    email: emailContatoPhanyx,
    assunto: "Contato comercial — PHANYX",
    pagina: "/contato#email-comercial",
  },
  suporte: {
    email: emailSuportePhanyx,
    assunto: "Suporte técnico — PHANYX",
    pagina: "/suporte#email-suporte",
  },
} as const;

export type CanalEmailPhanyx = keyof typeof canaisEmailPhanyx;

export function linksEmailPhanyx(canal: CanalEmailPhanyx, assunto: string = canaisEmailPhanyx[canal].assunto) {
  const email = canaisEmailPhanyx[canal].email;
  const destinatario = encodeURIComponent(email);
  const titulo = encodeURIComponent(assunto);

  return {
    aplicativo: `mailto:${email}?subject=${titulo}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${destinatario}&su=${titulo}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${destinatario}&subject=${titulo}`,
  };
}
