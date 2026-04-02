import MaterialViewer from "@/components/material/MaterialViewer"

type Material = {
  id: number
  titulo: string
  tipo: string
  url: string
}

async function getMateriais(aulaId: string): Promise<Material[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/aluno/materiais?aulaId=${aulaId}`,
    {
      cache: "no-store",
    }
  )

  if (!res.ok) {
    return []
  }

  return res.json()
}

export default async function AulaMaterialPage({
  params,
}: {
  params: { aulaId: string }
}) {
  const materiais = await getMateriais(params.aulaId)

  return (
    <div style={{ padding: 40 }}>
      <h1>Materiais da Aula</h1>

      {materiais.length === 0 && <p>Nenhum material disponível.</p>}

      {materiais.map((material) => (
        <div
          key={material.id}
          style={{
            marginTop: 30,
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h3>{material.titulo}</h3>

          <MaterialViewer material={material} />
        </div>
      ))}
    </div>
  )
}