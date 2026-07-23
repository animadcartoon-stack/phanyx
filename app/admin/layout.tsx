import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import AdminShell from "./AdminShell";
import ImpersonacaoBanner from "@/components/suporte/ImpersonacaoBanner";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?portal=admin");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      role: string;
      email: string;
      instituicaoId: number;
    };

    const role = String(decoded.role || "").toUpperCase();

const podeEntrarNoPortalAdmin = [
  "ADMIN",
  "FUNCIONARIO",
  "SECRETARIA",
  "FINANCEIRO",
  "COORDENADOR",
  "SUPORTE",
  "GERENCIA",
].includes(role);

if (!podeEntrarNoPortalAdmin) {
  redirect("/login?portal=admin");
}

  } catch {
    redirect("/login?portal=admin");
  }

  return (
  <>
    <ImpersonacaoBanner />

    <AdminShell>
      {children}
    </AdminShell>
  </>
);
}