export default function RHPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          👥 Recursos Humanos
        </h1>

        <p className="mt-2 text-slate-500">
          Gestão completa de funcionários, departamentos,
          admissões, desligamentos, documentos e histórico funcional.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-3xl border p-5">
          <h3 className="font-semibold">
            Funcionários
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Cadastro e gestão de colaboradores.
          </p>
        </div>

        <div className="rounded-3xl border p-5">
          <h3 className="font-semibold">
            Departamentos
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Setores e permissões.
          </p>
        </div>

        <div className="rounded-3xl border p-5">
          <h3 className="font-semibold">
            Documentos RH
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Contratos, advertências e férias.
          </p>
        </div>

        <div className="rounded-3xl border p-5">
          <h3 className="font-semibold">
            Histórico Funcional
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Toda trajetória do colaborador.
          </p>
        </div>

      </div>

    </div>
  );
}