import type { Prisma } from "@prisma/client";

export function prepararCamposCertificado(
  camposRecebidos: unknown[],
  instituicaoId: number,
  versaoId: number | null,
): Prisma.CertificadoCampoCreateManyInput[] {
  const camposValidos = camposRecebidos.filter(
    (campo: any) => {
      if (!campo) return false;
      if (campo.id === -999999) return false;
      if (campo.arrayPreview === true || campo.arrayVirtual === true) return false;
      if (campo.idOriginalArray) return false;
      if (!String(campo?.tipo || "").trim()) return false;

      return true;
    }
  );

  return camposValidos.map(
    (campo: any, index: number) => {
      const {
        id: _id,
        bancoId: _bancoId,
        tempId: _tempId,
        arrayPreview: _arrayPreview,
        arrayVirtual: _arrayVirtual,
        instituicaoId: _instituicaoId,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        idOriginalArray: _idOriginalArray,

        versaoId: _versaoId,
        modeloId: _modeloId,
        versao: _versao,
        certificadoModeloVersaoId:
          _certificadoModeloVersaoId,

        dadosJson: dadosJsonRecebido,
        ...campoSemControle
      } = campo;

      const dadosJson: any = {
        ...(dadosJsonRecebido || {}),
        ...campoSemControle,
      };

      delete dadosJson.id;
      delete dadosJson.bancoId;
      delete dadosJson.tempId;
      delete dadosJson.arrayPreview;
      delete dadosJson.arrayVirtual;
      delete dadosJson.instituicaoId;
      delete dadosJson.createdAt;
      delete dadosJson.updatedAt;
      delete dadosJson.idOriginalArray;

      delete dadosJson.versaoId;
      delete dadosJson.modeloId;
      delete dadosJson.versao;
      delete dadosJson.certificadoModeloVersaoId;

      return {
        instituicaoId,
        certificadoModeloVersaoId: versaoId,

        tipo: String(campo?.tipo || "").trim(),

        x: Number(campo?.x ?? 100),
        y: Number(campo?.y ?? 100),
        largura: Number(campo?.largura ?? 220),
        altura: Number(campo?.altura ?? 40),

        fonte: String(campo?.fonte || "Helvetica"),
        tamanho: Number(campo?.tamanho ?? 18),
        cor: String(campo?.cor || "#1e3a8a"),
        alinhamento: String(
          campo?.alinhamento || "left"
        ),

        pagina: Number(campo?.pagina ?? 1),
        ordem: Number(campo?.ordem ?? index + 1),

        lineHeight:
          campo?.lineHeight !== undefined &&
          campo?.lineHeight !== null
            ? Number(campo.lineHeight)
            : null,

        marcador:
          typeof campo?.marcador === "string"
            ? campo.marcador
            : null,

        dadosJson,
      };
    }
  );
}
