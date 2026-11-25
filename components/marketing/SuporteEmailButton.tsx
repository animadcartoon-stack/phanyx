import { linkSuportePhanyx } from "@/lib/contatos-phanyx";

export default function SuporteEmailButton() {
  return (
    <a
      href={linkSuportePhanyx}
      className="fixed bottom-6 right-6 z-50 hidden items-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:bg-blue-600 md:inline-flex"
    >
      <span aria-hidden="true">✉</span> Suporte por e-mail
    </a>
  );
}
