import type { ReactNode } from "react";
import AcessoBibliotecaAdmin from "@/components/biblioteca/AcessoBibliotecaAdmin";

export default function BibliotecaLayout({ children }: { children: ReactNode }) {
  return <AcessoBibliotecaAdmin>{children}</AcessoBibliotecaAdmin>;
}
