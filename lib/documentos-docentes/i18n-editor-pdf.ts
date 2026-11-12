const rotulos = {
  pt: {
    editor: "Editor de PDF", leitor: "Leitor de PDF", modoLeitura: "Modo leitura", copiaLocal: "Cópia local editada", habilitar: "Habilitar edição", voltarLeitura: "Voltar à leitura", leituraAssinado: "A versão assinada está disponível para leitura e download.", abrir: "Abrir arquivo PDF", arquivo: "Selecione um PDF de até 30 MB.",
    girar: "Girar 90°", antes: "Mover para antes", depois: "Mover para depois",
    excluir: "Remover página", mesclar: "Adicionar páginas de outro PDF",
    adicionar: "Aplicar texto", texto: "Texto a inserir", tamanho: "Tamanho (pt)",
    posicao: "Clique na página ou informe as coordenadas em pontos PDF.",
    baixar: "Baixar cópia", falha: "Não foi possível editar este PDF. Confira se o arquivo abre e se o texto usa caracteres compatíveis.",
    ajuda: "A edição acontece no navegador. Baixe a cópia ao terminar.",
    descartar: "Voltar e fechar o editor",
  },
  en: {
    editor: "PDF editor", leitor: "PDF reader", modoLeitura: "Reading mode", copiaLocal: "Edited local copy", habilitar: "Enable editing", voltarLeitura: "Return to reading", leituraAssinado: "The signed version is available for reading and download.", abrir: "Open PDF file", arquivo: "Select a PDF up to 30 MB.",
    girar: "Rotate 90°", antes: "Move earlier", depois: "Move later",
    excluir: "Remove page", mesclar: "Add pages from another PDF",
    adicionar: "Apply text", texto: "Text to insert", tamanho: "Size (pt)",
    posicao: "Click the page or enter coordinates in PDF points.",
    baixar: "Download copy", falha: "Unable to edit this PDF. Check that the file opens and the text uses supported characters.",
    ajuda: "Edits happen in your browser. Download the copy when finished.",
    descartar: "Go back and close editor",
  },
  es: {
    editor: "Editor de PDF", leitor: "Lector de PDF", modoLeitura: "Modo lectura", copiaLocal: "Copia local editada", habilitar: "Habilitar edición", voltarLeitura: "Volver a la lectura", leituraAssinado: "La versión firmada está disponible para lectura y descarga.", abrir: "Abrir archivo PDF", arquivo: "Selecciona un PDF de hasta 30 MB.",
    girar: "Girar 90°", antes: "Mover hacia atrás", depois: "Mover hacia delante",
    excluir: "Eliminar página", mesclar: "Añadir páginas de otro PDF",
    adicionar: "Aplicar texto", texto: "Texto para insertar", tamanho: "Tamaño (pt)",
    posicao: "Haz clic en la página o indica las coordenadas en puntos PDF.",
    baixar: "Descargar copia", falha: "No se pudo editar el PDF. Comprueba que el archivo se abre y el texto usa caracteres compatibles.",
    ajuda: "La edición se realiza en el navegador. Descarga la copia al terminar.",
    descartar: "Volver y cerrar el editor",
  },
  fr: {
    editor: "Éditeur PDF", leitor: "Lecteur PDF", modoLeitura: "Mode lecture", copiaLocal: "Copie locale modifiée", habilitar: "Activer la modification", voltarLeitura: "Revenir à la lecture", leituraAssinado: "La version signée est disponible en lecture et au téléchargement.", abrir: "Ouvrir un fichier PDF", arquivo: "Sélectionnez un PDF de 30 Mo maximum.",
    girar: "Pivoter de 90°", antes: "Déplacer vers l’avant", depois: "Déplacer vers l’arrière",
    excluir: "Supprimer la page", mesclar: "Ajouter les pages d’un autre PDF",
    adicionar: "Appliquer le texte", texto: "Texte à insérer", tamanho: "Taille (pt)",
    posicao: "Cliquez sur la page ou indiquez les coordonnées en points PDF.",
    baixar: "Télécharger la copie", falha: "Le PDF n’a pas pu être modifié. Vérifiez que le fichier s’ouvre et que les caractères sont compatibles.",
    ajuda: "La modification se fait dans le navigateur. Téléchargez la copie à la fin.",
    descartar: "Revenir et fermer l’éditeur",
  },
};

export function textosEditorPdf(locale: string) {
  return rotulos[locale.split("-")[0] as keyof typeof rotulos] ?? rotulos.pt;
}
