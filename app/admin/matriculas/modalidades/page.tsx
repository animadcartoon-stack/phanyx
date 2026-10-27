"use client";

import MatriculaModalidadesForm from "@/components/admin/MatriculaModalidadesForm";
import withAuth from "@/lib/withAuth";

function ModalidadesPage() {
  return <MatriculaModalidadesForm />;
}

export default withAuth(ModalidadesPage, ["admin"]);
