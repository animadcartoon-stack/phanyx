const pt = {
  excluir: "Excluir",
  excluidos: "Excluídos",
  excluido: "Excluído",
  confirmarExclusao: "Excluir documento",
  efeitoExclusao: "O documento sairá da lista ativa e da área do professor. A administração poderá consultar o histórico pelo filtro Excluídos.",
  exclusaoConcluida: "Documento movido para Excluídos.",
  enviarPdf: "Enviar PDF por e-mail",
  enviar: "Enviar",
  enviando: "Enviando...",
  modo: "Destinatário",
  email: "Digitar e-mail",
  usuario: "Usuário (ID)",
  departamento: "Departamento",
  buscarUsuario: "Buscar por nome ou ID do usuário",
  buscarDepartamento: "Buscar departamento",
  selecionar: "Selecione um destinatário",
  carregando: "Buscando destinatários...",
  vazio: "Nenhum destinatário encontrado.",
  falha: "Não foi possível concluir a solicitação.",
  versao: "Versão",
  cancelar: "Cancelar",
  fechar: "Fechar",
  departamentoAjuda: "O PDF será enviado aos integrantes ativos do departamento com e-mail cadastrado.",
  pdfAjuda: "O e-mail inclui o PDF desta versão. Os arquivos vinculados ficam disponíveis na Central.",
  aceitos: "Destinatários aceitos pelo servidor de e-mail",
  recusados: "Destinatários recusados",
  processando: "O envio está em processamento. Consulte o histórico para acompanhar o resultado.",
  incerto: "O servidor de e-mail não confirmou o envio. Verifique com o destinatário antes de reenviar.",
  registrado: "Envio de PDF por e-mail",
};

const en: typeof pt = {
  excluir: "Delete", excluidos: "Deleted", excluido: "Deleted", confirmarExclusao: "Delete document",
  efeitoExclusao: "The document will be removed from the active list and the teacher portal. Administrators can view its history using the Deleted filter.",
  exclusaoConcluida: "Document moved to Deleted.", enviarPdf: "Email PDF", enviar: "Send", enviando: "Sending...",
  modo: "Recipient", email: "Enter email address", usuario: "User (ID)", departamento: "Department",
  buscarUsuario: "Search by name or user ID", buscarDepartamento: "Search departments", selecionar: "Select a recipient",
  carregando: "Searching for recipients...", vazio: "No recipients found.", falha: "The request could not be completed.",
  versao: "Version", cancelar: "Cancel", fechar: "Close",
  departamentoAjuda: "The PDF will be sent to active department members with a registered email address.",
  pdfAjuda: "The email includes this version's PDF. Linked files are available in the document center.",
  aceitos: "Recipients accepted by the mail server", recusados: "Recipients rejected",
  processando: "The email is being processed. Check the history for the result.",
  incerto: "The mail server could not confirm the send. Check with the recipient before sending again.",
  registrado: "PDF sent by email",
};

const es: typeof pt = {
  excluir: "Eliminar", excluidos: "Eliminados", excluido: "Eliminado", confirmarExclusao: "Eliminar documento",
  efeitoExclusao: "El documento saldrá de la lista activa y del portal docente. La administración podrá consultar su historial con el filtro Eliminados.",
  exclusaoConcluida: "Documento movido a Eliminados.", enviarPdf: "Enviar PDF por correo", enviar: "Enviar", enviando: "Enviando...",
  modo: "Destinatario", email: "Escribir correo", usuario: "Usuario (ID)", departamento: "Departamento",
  buscarUsuario: "Buscar por nombre o ID de usuario", buscarDepartamento: "Buscar departamento", selecionar: "Seleccione un destinatario",
  carregando: "Buscando destinatarios...", vazio: "No se encontraron destinatarios.", falha: "No se pudo completar la solicitud.",
  versao: "Versión", cancelar: "Cancelar", fechar: "Cerrar",
  departamentoAjuda: "El PDF se enviará a los miembros activos del departamento con correo registrado.",
  pdfAjuda: "El correo incluye el PDF de esta versión. Los archivos vinculados están disponibles en la central.",
  aceitos: "Destinatarios aceptados por el servidor de correo", recusados: "Destinatarios rechazados",
  processando: "El envío se está procesando. Consulte el historial para ver el resultado.",
  incerto: "El servidor de correo no confirmó el envío. Consulte al destinatario antes de volver a enviar.",
  registrado: "Envío de PDF por correo",
};

const fr: typeof pt = {
  excluir: "Supprimer", excluidos: "Supprimés", excluido: "Supprimé", confirmarExclusao: "Supprimer le document",
  efeitoExclusao: "Le document sera retiré de la liste active et du portail enseignant. L’administration pourra consulter son historique avec le filtre Supprimés.",
  exclusaoConcluida: "Document déplacé dans les éléments supprimés.", enviarPdf: "Envoyer le PDF par e-mail", enviar: "Envoyer", enviando: "Envoi en cours...",
  modo: "Destinataire", email: "Saisir une adresse e-mail", usuario: "Utilisateur (ID)", departamento: "Département",
  buscarUsuario: "Rechercher par nom ou ID utilisateur", buscarDepartamento: "Rechercher un département", selecionar: "Sélectionner un destinataire",
  carregando: "Recherche de destinataires...", vazio: "Aucun destinataire trouvé.", falha: "La demande n’a pas abouti.",
  versao: "Version", cancelar: "Annuler", fechar: "Fermer",
  departamentoAjuda: "Le PDF sera envoyé aux membres actifs du département qui ont une adresse e-mail enregistrée.",
  pdfAjuda: "L’e-mail contient le PDF de cette version. Les fichiers liés restent disponibles dans le centre de documents.",
  aceitos: "Destinataires acceptés par le serveur de messagerie", recusados: "Destinataires refusés",
  processando: "L’envoi est en cours. Consultez l’historique pour voir le résultat.",
  incerto: "Le serveur de messagerie n’a pas confirmé l’envoi. Vérifiez auprès du destinataire avant de renvoyer.",
  registrado: "Envoi du PDF par e-mail",
};

const idiomas: Record<string, typeof pt> = { pt, en, es, fr };

export function textosGestaoDocente(locale: string) {
  return idiomas[locale.split("-")[0].toLowerCase()] ?? pt;
}
