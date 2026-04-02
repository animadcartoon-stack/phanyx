import MaterialViewer from "@/components/material/MaterialViewer";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

type Material = {
  id: number;
  titulo: string;
  tipo: string;
  url: string;
  arquivoNome?: string | null;
  mimeType?: string | null;
  tamanho?: number | null;
};

async function getMateriais(aulaId: string): Promise<Material[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/aluno/materiais?aulaId=${aulaId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

async function getStatusMatriculaAluno() {
  const user =  await getUserFromToken();

  if (!user || user.role !== "ALUNO") {
    return {
      status: null,
      acessoAulasLiberado: false,
    };
  }

  const aluno = await prisma.aluno.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
  });

  if (!aluno) {
    return {
      status: null,
      acessoAulasLiberado: false,
    };
  }

  const matricula = await prisma.matricula.findFirst({
    where: {
      alunoId: aluno.id,
      instituicaoId: user.instituicaoId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return {
    status: matricula?.status ?? null,
    acessoAulasLiberado: matricula?.status === "ATIVA",
  };
}

export default async function AulaPage({
  params,
}: {
  params: { aulaId: string };
}) {
  const statusMatricula = await getStatusMatriculaAluno();

  if (!statusMatricula.acessoAulasLiberado) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-orange-900">
            Acesso à aula indisponível
          </h1>

          <p className="mt-3 text-orange-800">
            Sua matrícula está com status{" "}
            <strong>{statusMatricula.status ?? "indisponível"}</strong>.
          </p>

          <p className="mt-2 text-orange-800">
            Por isso, o acesso ao conteúdo da aula está temporariamente
            bloqueado.
          </p>

          <p className="mt-2 text-orange-800">
            Você ainda pode acessar a área do aluno, consultar status, boletim e
            demais informações acadêmicas.
          </p>
        </div>
      </div>
    );
  }

  const materiais = await getMateriais(params.aulaId);
  const materialPrincipal = materiais[0] || null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Aula {params.aulaId}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Visualize os materiais e acompanhe o conteúdo da aula.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            {materialPrincipal ? (
              <>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  {materialPrincipal.titulo}
                </h2>
                <MaterialViewer material={materialPrincipal} />
              </>
            ) : (
              <div className="text-sm text-gray-500">
                Nenhum material disponível para esta aula.
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Materiais da aula
            </h2>

            {materiais.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhum material cadastrado.
              </p>
            ) : (
              <div className="space-y-3">
                {materiais.map((material) => (
                  <div
                    key={material.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {material.titulo}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Tipo: {material.tipo}
                        </p>
                      </div>

                      {material.url && (
                        <a
                          href={material.url}
                          target="_blank"
                          className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                        >
                          Abrir
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Progresso
            </h2>
            <div className="mt-4 h-3 w-full rounded-full bg-gray-200">
              <div className="h-3 w-1/3 rounded-full bg-blue-600" />
            </div>
            <p className="mt-2 text-sm text-gray-500">33% concluído</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Próximos passos
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Assistir ao conteúdo principal</li>
              <li>• Abrir os materiais complementares</li>
              <li>• Marcar aula como concluída</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}