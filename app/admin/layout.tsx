import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import AdminShell from "./AdminShell";


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

    if (decoded.role !== "ADMIN" && decoded.role !== "admin") {
      redirect("/login?portal=admin");
    }
  } catch {
    redirect("/login?portal=admin");
  }

  return <AdminShell>{children}</AdminShell>;
}