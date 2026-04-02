type Material = {
  tipo: string;
  url: string;
};

export default function MaterialViewer({
  material,
}: {
  material: Material;
}) {
  if (!material?.url) {
    return (
      <div className="text-sm text-gray-500">
        Material sem URL disponível.
      </div>
    );
  }

  if (material.tipo === "video") {
    if (material.url.includes("youtube.com") || material.url.includes("youtu.be")) {
      let videoId = "";

      if (material.url.includes("youtube.com/watch?v=")) {
        videoId = material.url.split("v=")[1]?.split("&")[0] || "";
      } else if (material.url.includes("youtu.be/")) {
        videoId = material.url.split("youtu.be/")[1]?.split("?")[0] || "";
      }

      if (videoId) {
        return (
          <iframe
            className="w-full rounded-xl"
            height="480"
            src={`https://www.youtube.com/embed/${videoId}`}
            allowFullScreen
          />
        );
      }
    }

    return (
      <video controls className="w-full rounded-xl">
        <source src={material.url} />
        Seu navegador não suporta vídeo.
      </video>
    );
  }

  if (material.tipo === "pdf") {
    return (
      <iframe
        src={material.url}
        className="w-full rounded-xl border"
        height="700"
      />
    );
  }

  if (material.tipo === "ppt" || material.tipo === "doc" || material.tipo === "arquivo") {
    return (
      <div className="rounded-xl border border-gray-200 p-6">
        <p className="mb-4 text-sm text-gray-600">
          Este material pode ser baixado para visualização.
        </p>
        <a
          href={material.url}
          target="_blank"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Baixar material
        </a>
      </div>
    );
  }

  if (material.tipo === "link") {
    return (
      <div className="rounded-xl border border-gray-200 p-6">
        <a
          href={material.url}
          target="_blank"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Abrir link
        </a>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-500">
      Tipo de material não suportado.
    </div>
  );
}