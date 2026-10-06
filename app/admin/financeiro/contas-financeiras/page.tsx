import { redirect } from "next/navigation";

export default function ContasFinanceirasRedirect() {
  redirect("/admin/configuracoes/contas-financeiras");
}