import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    "common": {
      "search": "Buscar",
      "type": "Tipo",
      "status": "Situação",
      "availability": "Disponibilidade",
      "channel": "Canal",
      "campaign": "Campanha",
      "form": "Formulário",
      "clear": "Limpar",
      "filter": "Filtrar",
      "refresh": "↻ Atualizar",
      "refreshing": "Atualizando...",
      "cancel": "Cancelar",
      "never": "Nunca",
      "notInformed": "Não informado",
      "noLink": "Sem vínculo",
      "notLinkedMasculine": "Não vinculado",
      "notLinkedFeminine": "Não vinculada",
      "viewDetails": "Ver detalhes",
      "integrationName": "Nome da integração",
      "lastSuccess": "Último sucesso",
      "lastError": "Último erro",
      "lastUpdate": "Última atualização",
      "createdAt": "Criada em",
      "whatHappened": "O que aconteceu",
      "copy": "Copiar",
      "close": "Fechar",
      "allFeminine": "Todas",
      "wait": "Aguarde...",
      "saveChanges": "Salvar alterações",
      "saving": "Salvando...",
      "creating": "Criando...",
      "previous": "Anterior",
      "next": "Próxima",
      "notYet": "Ainda não"
    },
    "list": {
      "loading": "Carregando integrações...",
      "back": "← Central de Captação",
      "title": "Integrações da Captação",
      "description": "Conecte o PHANYX a anúncios, sites e outros sistemas para receber ou enviar dados automaticamente.",
      "newIntegration": "+ Nova integração",
      "summary": {
        "total": "Total",
        "totalHelp": "Integrações cadastradas",
        "active": "Ativas",
        "activeHelp": "Funcionando normalmente",
        "paused": "Pausadas",
        "pausedHelp": "Temporariamente interrompidas",
        "error": "Com problema",
        "errorHelp": "Exigem atenção",
        "revoked": "Revogadas",
        "revokedHelp": "Credenciais encerradas"
      },
      "filters": {
        "searchPlaceholder": "Nome ou endereço da integração...",
        "allTypes": "Todos os tipos",
        "enabled": "Habilitadas",
        "disabled": "Desabilitadas"
      },
      "types": {
        "webhookIn": "Receber dados por webhook",
        "webhookOut": "Enviar dados por webhook",
        "metaLeadAds": "Meta Lead Ads",
        "googleLeadForm": "Google Lead Forms",
        "api": "Integração por API",
        "import": "Importação de dados",
        "other": "Outra integração"
      },
      "typeDescriptions": {
        "webhookIn": "Receba automaticamente contatos enviados por outro sistema.",
        "webhookOut": "Envie eventos e dados da captação para outro sistema.",
        "metaLeadAds": "Receba interessados captados em formulários de anúncios da Meta.",
        "googleLeadForm": "Receba interessados captados em formulários de anúncios do Google.",
        "api": "Permita que outro sistema envie dados diretamente ao PHANYX.",
        "import": "Identifique integrações usadas em processos de importação.",
        "other": "Use para integrações que não se enquadram nas opções anteriores."
      },
      "statuses": {
        "inactive": "Inativa",
        "active": "Ativa",
        "paused": "Pausada",
        "error": "Com problema",
        "revoked": "Revogada"
      },
      "configured": {
        "title": "Integrações configuradas",
        "results": "{count, plural, =0 {Nenhuma integração encontrada} one {# integração encontrada} other {# integrações encontradas}}.",
        "emptyTitle": "Nenhuma integração encontrada",
        "emptyDescription": "Crie uma integração para conectar anúncios, sites ou outros sistemas ao PHANYX."
      },
      "card": {
        "receipts": "Recebimentos",
        "credentialConfigured": "🔐 Credencial configurada",
        "credentialNotRequired": "Credencial não necessária"
      },
      "modal": {
        "title": "Nova integração",
        "description": "Informe apenas o necessário. O PHANYX cuidará automaticamente das credenciais técnicas quando elas forem exigidas.",
        "namePlaceholder": "Ex.: Meta - Vestibular 2027",
        "integrationMethod": "Como os dados serão integrados?",
        "destinationAddress": "Para qual endereço o PHANYX deverá enviar?",
        "captureOrganization": "Organização da captação",
        "captureOrganizationHelp": "Estes vínculos ajudam o PHANYX a saber de onde os interessados chegaram.",
        "activateNow": "Ativar integração agora",
        "activateHelp": "Se deixar desmarcado, a integração será salva como inativa para você concluir a configuração depois.",
        "create": "Criar integração"
      }
    },
    "credentials": {
      "saveNow": "Guarde estas informações agora",
      "secretWarning": "Por segurança, o segredo desta integração não poderá ser exibido novamente.",
      "publicKey": "Chave pública",
      "secret": "Segredo",
      "saved": "Já guardei as informações"
    },
    "detail": {
      "loading": "Carregando integração...",
      "notFound": {
        "title": "Integração não encontrada",
        "description": "Não foi possível localizar esta integração.",
        "back": "← Voltar para integrações"
      },
      "back": "← Integrações da Captação",
      "heroDescription": "Acompanhe a conexão, os recebimentos e o histórico desta integração.",
      "actions": {
        "pause": "Pausar integração",
        "activate": "Ativar integração"
      },
      "summary": {
        "receipts": "Recebimentos",
        "receiptsHelp": "Submissões vinculadas",
        "events": "Eventos",
        "eventsHelp": "Registros da integração",
        "lastSuccessHelp": "Último processamento concluído",
        "activeHelp": "Funcionando normalmente",
        "revokedHelp": "Credencial encerrada",
        "inactiveHelp": "Não está recebendo normalmente"
      },
      "attention": "O que precisa de atenção",
      "config": {
        "eyebrow": "CONFIGURAÇÃO",
        "title": "Dados da integração",
        "descriptionOut": "Configure como o PHANYX enviará os dados para o sistema externo.",
        "descriptionIn": "Estas informações organizam como os contatos entram no PHANYX.",
        "method": "Como os dados são integrados?",
        "captureOrganization": "Organização da captação",
        "captureOrganizationHelp": "Vincule a origem para identificar de onde cada interessado chegou.",
        "destinationAddress": "Endereço de destino",
        "destinationHelp": "Endereço do sistema que receberá os dados enviados pelo PHANYX."
      },
      "history": {
        "eyebrow": "HISTÓRICO",
        "title": "Eventos da integração",
        "description": "Veja as entradas, processamentos e possíveis falhas desta conexão.",
        "searchPlaceholder": "Evento, tipo ou erro...",
        "direction": "Direção",
        "loading": "Carregando eventos...",
        "emptyTitle": "Nenhum evento encontrado",
        "emptyDescription": "Os eventos desta integração aparecerão aqui conforme os dados forem recebidos ou enviados.",
        "attempts": "Tentativas",
        "submission": "Submissão",
        "processed": "Processado",
        "openLead": "Abrir lead →",
        "eventNumber": "Evento #{id}",
        "unnamedProspect": "Interessado sem nome",
        "opening": "Abrindo...",
        "pagination": "Página {page} de {pages} · {total, plural, one {# evento} other {# eventos}}"
      },
      "credential": {
        "eyebrow": "CREDENCIAL",
        "titleOut": "Autenticação do envio",
        "titleIn": "Conexão com o PHANYX",
        "descriptionOut": "Use estas informações para identificar e autenticar os dados enviados pelo PHANYX.",
        "descriptionIn": "Use estas informações para conectar o sistema externo ao PHANYX.",
        "receiveAddress": "Endereço para receber dados",
        "copyAddress": "Copiar endereço",
        "secretConfigured": "Segredo configurado",
        "secretNotConfigured": "Segredo não configurado",
        "secretHelp": "O segredo atual nunca é exibido novamente depois de criado.",
        "generateSecret": "Gerar novo segredo",
        "generating": "Gerando..."
      },
      "links": {
        "eyebrow": "VÍNCULOS",
        "title": "Origem da captação"
      },
      "record": {
        "eyebrow": "REGISTRO",
        "title": "Informações da integração"
      },
      "security": {
        "eyebrow": "SEGURANÇA",
        "title": "Credencial da integração",
        "revokedTitle": "Credencial revogada",
        "revokedDescription": "Esta integração não pode ser reativada. Para voltar a utilizá-la, crie uma nova integração.",
        "description": "Revogue somente quando esta conexão não puder mais ser utilizada.",
        "revoke": "Revogar credencial"
      },
      "eventStatuses": {
        "received": "Recebido",
        "pending": "Pendente",
        "processing": "Processando",
        "processed": "Processado",
        "delivered": "Entregue",
        "discarded": "Descartado"
      },
      "directions": {
        "in": "Entrada",
        "out": "Saída"
      },
      "eventModal": {
        "eyebrow": "EVENTO DA INTEGRAÇÃO",
        "description": "Informações sobre o recebimento e processamento deste evento.",
        "closeAria": "Fechar detalhes do evento",
        "loading": "Carregando detalhes do evento...",
        "dateTime": "Data e hora",
        "direction": "Entrada ou saída",
        "attemptCount": "Número de tentativas",
        "processedAt": "Processado em",
        "lead": "Lead",
        "prospect": "Interessado",
        "notGenerated": "Não gerado",
        "openLead": "Abrir lead",
        "nameNotInformed": "Nome não informado",
        "contactNotInformed": "Contato não informado",
        "pendingMessage": "O evento foi recebido e ainda está aguardando a conclusão do processamento.",
        "successMessage": "O evento foi concluído sem falhas registradas.",
        "nextAttempt": "Próxima tentativa:",
        "canRetryTitle": "O processamento pode ser tentado novamente",
        "canRetryDescription": "O PHANYX usará novamente os dados já recebidos nesta submissão.",
        "retrying": "Tentando novamente...",
        "retry": "Tentar novamente",
        "technicalDetails": "Detalhes técnicos",
        "identification": "Identificação",
        "event": "Evento",
        "identifier": "Identificador",
        "integration": "Integração",
        "headers": "Headers",
        "payload": "Payload recebido",
        "response": "Resposta",
        "integrationConfig": "Configuração da integração",
        "originalData": "Dados originais",
        "normalizedData": "Dados normalizados",
        "trackingAudit": "Rastreamento e auditoria",
        "cannotDisplay": "Não foi possível exibir este evento."
      },
      "revokeModal": {
        "title": "Revogar esta credencial?",
        "description": "A integração deixará de funcionar imediatamente. Uma credencial revogada não poderá ser reativada.",
        "revoking": "Revogando...",
        "confirm": "Sim, revogar"
      },
      "secretModal": {
        "warning": "Por segurança, o novo segredo não poderá ser exibido novamente.",
        "newSecret": "Novo segredo",
        "copyKey": "Copiar chave",
        "copySecret": "Copiar segredo"
      }
    },
    "errors": {
      "load": "Não foi possível consultar as integrações.",
      "nameRequired": "Informe um nome para a integração.",
      "endpointRequired": "Informe para qual endereço o PHANYX deverá enviar os dados.",
      "create": "Não foi possível criar a integração.",
      "invalidResponse": "O servidor retornou uma resposta inválida.",
      "invalidIntegration": "Integração inválida.",
      "loadIntegration": "Não foi possível carregar a integração.",
      "loadEvents": "Não foi possível carregar os eventos.",
      "noEditPermission": "Você não possui permissão para editar esta integração.",
      "saveIntegration": "Não foi possível salvar a integração.",
      "changeStatus": "Não foi possível alterar a situação da integração.",
      "generateSecret": "Não foi possível gerar uma nova credencial.",
      "secretMissing": "O servidor não retornou o novo segredo.",
      "revoke": "Não foi possível revogar a integração.",
      "copy": "Não foi possível copiar automaticamente.",
      "noAuditPermission": "Você não possui permissão para consultar os detalhes técnicos deste evento.",
      "loadEventDetail": "Não foi possível carregar os detalhes do evento.",
      "cannotReprocess": "Esta submissão não pode ser processada novamente.",
      "reprocess": "Não foi possível tentar o processamento novamente."
    },
    "success": {
      "created": "Integração criada com sucesso.",
      "updated": "Integração atualizada com sucesso.",
      "paused": "Integração pausada.",
      "activated": "Integração ativada.",
      "revoked": "Credencial revogada.",
      "reprocessed": "Submissão processada novamente com sucesso.",
      "publicKeyCopied": "Chave pública copiada.",
      "addressCopied": "Endereço copiado.",
      "secretCopied": "Segredo copiado."
    }
  },
  "pt-PT": {
    "common": {
      "search": "Pesquisar",
      "type": "Tipo",
      "status": "Situação",
      "availability": "Disponibilidade",
      "channel": "Canal",
      "campaign": "Campanha",
      "form": "Formulário",
      "clear": "Limpar",
      "filter": "Filtrar",
      "refresh": "↻ Atualizar",
      "refreshing": "A atualizar...",
      "cancel": "Cancelar",
      "never": "Nunca",
      "notInformed": "Não informado",
      "noLink": "Sem vínculo",
      "notLinkedMasculine": "Não vinculado",
      "notLinkedFeminine": "Não vinculada",
      "viewDetails": "Ver detalhes",
      "integrationName": "Nome da integração",
      "lastSuccess": "Último sucesso",
      "lastError": "Último erro",
      "lastUpdate": "Última atualização",
      "createdAt": "Criada em",
      "whatHappened": "O que aconteceu",
      "copy": "Copiar",
      "close": "Fechar",
      "allFeminine": "Todas",
      "wait": "Aguarde...",
      "saveChanges": "Guardar alterações",
      "saving": "A guardar...",
      "creating": "A criar...",
      "previous": "Anterior",
      "next": "Próxima",
      "notYet": "Ainda não"
    },
    "list": {
      "loading": "A carregar integrações...",
      "back": "← Central de Captação",
      "title": "Integrações da Captação",
      "description": "Ligue o PHANYX a anúncios, sites e outros sistemas para receber ou enviar dados automaticamente.",
      "newIntegration": "+ Nova integração",
      "summary": {
        "total": "Total",
        "totalHelp": "Integrações registadas",
        "active": "Ativas",
        "activeHelp": "A funcionar normalmente",
        "paused": "Pausadas",
        "pausedHelp": "Temporariamente interrompidas",
        "error": "Com problema",
        "errorHelp": "Requerem atenção",
        "revoked": "Revogadas",
        "revokedHelp": "Credenciais encerradas"
      },
      "filters": {
        "searchPlaceholder": "Nome ou endereço da integração...",
        "allTypes": "Todos os tipos",
        "enabled": "Ativadas",
        "disabled": "Desativadas"
      },
      "types": {
        "webhookIn": "Receber dados por webhook",
        "webhookOut": "Enviar dados por webhook",
        "metaLeadAds": "Meta Lead Ads",
        "googleLeadForm": "Google Lead Forms",
        "api": "Integração por API",
        "import": "Importação de dados",
        "other": "Outra integração"
      },
      "typeDescriptions": {
        "webhookIn": "Receba automaticamente contactos enviados por outro sistema.",
        "webhookOut": "Envie eventos e dados da captação para outro sistema.",
        "metaLeadAds": "Receba interessados captados em formulários de anúncios da Meta.",
        "googleLeadForm": "Receba interessados captados em formulários de anúncios do Google.",
        "api": "Permita que outro sistema envie dados diretamente para o PHANYX.",
        "import": "Identifique integrações utilizadas em processos de importação.",
        "other": "Utilize para integrações que não se enquadram nas opções anteriores."
      },
      "statuses": {
        "inactive": "Inativa",
        "active": "Ativa",
        "paused": "Pausada",
        "error": "Com problema",
        "revoked": "Revogada"
      },
      "configured": {
        "title": "Integrações configuradas",
        "results": "{count, plural, =0 {Nenhuma integração encontrada} one {# integração encontrada} other {# integrações encontradas}}.",
        "emptyTitle": "Nenhuma integração encontrada",
        "emptyDescription": "Crie uma integração para ligar anúncios, sites ou outros sistemas ao PHANYX."
      },
      "card": {
        "receipts": "Recebimentos",
        "credentialConfigured": "🔐 Credencial configurada",
        "credentialNotRequired": "Credencial não necessária"
      },
      "modal": {
        "title": "Nova integração",
        "description": "Indique apenas o necessário. O PHANYX tratará automaticamente das credenciais técnicas quando forem necessárias.",
        "namePlaceholder": "Ex.: Meta - Vestibular 2027",
        "integrationMethod": "Como serão integrados os dados?",
        "destinationAddress": "Para que endereço deverá o PHANYX enviar?",
        "captureOrganization": "Organização da captação",
        "captureOrganizationHelp": "Estas ligações ajudam o PHANYX a saber de onde chegaram os interessados.",
        "activateNow": "Ativar integração agora",
        "activateHelp": "Se deixar desmarcado, a integração será guardada como inativa para concluir a configuração mais tarde.",
        "create": "Criar integração"
      }
    },
    "credentials": {
      "saveNow": "Guarde estas informações agora",
      "secretWarning": "Por segurança, o segredo desta integração não poderá ser exibido novamente.",
      "publicKey": "Chave pública",
      "secret": "Segredo",
      "saved": "Já guardei as informações"
    },
    "detail": {
      "loading": "A carregar integração...",
      "notFound": {
        "title": "Integração não encontrada",
        "description": "Não foi possível localizar esta integração.",
        "back": "← Voltar às integrações"
      },
      "back": "← Integrações da Captação",
      "heroDescription": "Acompanhe a ligação, as receções e o histórico desta integração.",
      "actions": {
        "pause": "Pausar integração",
        "activate": "Ativar integração"
      },
      "summary": {
        "receipts": "Receções",
        "receiptsHelp": "Submissões associadas",
        "events": "Eventos",
        "eventsHelp": "Registos da integração",
        "lastSuccessHelp": "Último processamento concluído",
        "activeHelp": "A funcionar normalmente",
        "revokedHelp": "Credencial encerrada",
        "inactiveHelp": "Não está a receber normalmente"
      },
      "attention": "O que precisa de atenção",
      "config": {
        "eyebrow": "CONFIGURAÇÃO",
        "title": "Dados da integração",
        "descriptionOut": "Configure como o PHANYX enviará os dados para o sistema externo.",
        "descriptionIn": "Estas informações organizam a forma como os contactos entram no PHANYX.",
        "method": "Como são integrados os dados?",
        "captureOrganization": "Organização da captação",
        "captureOrganizationHelp": "Associe a origem para identificar de onde chegou cada interessado.",
        "destinationAddress": "Endereço de destino",
        "destinationHelp": "Endereço do sistema que receberá os dados enviados pelo PHANYX."
      },
      "history": {
        "eyebrow": "HISTÓRICO",
        "title": "Eventos da integração",
        "description": "Consulte as entradas, processamentos e possíveis falhas desta ligação.",
        "searchPlaceholder": "Evento, tipo ou erro...",
        "direction": "Direção",
        "loading": "A carregar eventos...",
        "emptyTitle": "Nenhum evento encontrado",
        "emptyDescription": "Os eventos desta integração aparecerão aqui conforme os dados forem recebidos ou enviados.",
        "attempts": "Tentativas",
        "submission": "Submissão",
        "processed": "Processado",
        "openLead": "Abrir lead →",
        "eventNumber": "Evento #{id}",
        "unnamedProspect": "Interessado sem nome",
        "opening": "A abrir...",
        "pagination": "Página {page} de {pages} · {total, plural, one {# evento} other {# eventos}}"
      },
      "credential": {
        "eyebrow": "CREDENCIAL",
        "titleOut": "Autenticação do envio",
        "titleIn": "Ligação ao PHANYX",
        "descriptionOut": "Use estas informações para identificar e autenticar os dados enviados pelo PHANYX.",
        "descriptionIn": "Utilize estas informações para ligar o sistema externo ao PHANYX.",
        "receiveAddress": "Endereço para receber dados",
        "copyAddress": "Copiar endereço",
        "secretConfigured": "Segredo configurado",
        "secretNotConfigured": "Segredo não configurado",
        "secretHelp": "O segredo atual nunca é exibido novamente depois de criado.",
        "generateSecret": "Gerar novo segredo",
        "generating": "A gerar..."
      },
      "links": {
        "eyebrow": "VÍNCULOS",
        "title": "Origem da captação"
      },
      "record": {
        "eyebrow": "REGISTRO",
        "title": "Informações da integração"
      },
      "security": {
        "eyebrow": "SEGURANÇA",
        "title": "Credencial da integração",
        "revokedTitle": "Credencial revogada",
        "revokedDescription": "Esta integração não pode ser reativada. Para voltar a utilizá-la, crie uma nova integração.",
        "description": "Revogue apenas quando esta ligação já não puder ser utilizada.",
        "revoke": "Revogar credencial"
      },
      "eventStatuses": {
        "received": "Recebido",
        "pending": "Pendente",
        "processing": "Processando",
        "processed": "Processado",
        "delivered": "Entregue",
        "discarded": "Descartado"
      },
      "directions": {
        "in": "Entrada",
        "out": "Saída"
      },
      "eventModal": {
        "eyebrow": "EVENTO DA INTEGRAÇÃO",
        "description": "Informações sobre o recebimento e processamento deste evento.",
        "closeAria": "Fechar detalhes do evento",
        "loading": "A carregar detalhes do evento...",
        "dateTime": "Data e hora",
        "direction": "Entrada ou saída",
        "attemptCount": "Número de tentativas",
        "processedAt": "Processado em",
        "lead": "Lead",
        "prospect": "Interessado",
        "notGenerated": "Não gerado",
        "openLead": "Abrir lead",
        "nameNotInformed": "Nome não informado",
        "contactNotInformed": "Contacto não informado",
        "pendingMessage": "O evento foi recebido e ainda aguarda a conclusão do processamento.",
        "successMessage": "O evento foi concluído sem falhas registradas.",
        "nextAttempt": "Próxima tentativa:",
        "canRetryTitle": "O processamento pode ser tentado novamente",
        "canRetryDescription": "O PHANYX voltará a utilizar os dados já recebidos nesta submissão.",
        "retrying": "A tentar novamente...",
        "retry": "Tentar novamente",
        "technicalDetails": "Detalhes técnicos",
        "identification": "Identificação",
        "event": "Evento",
        "identifier": "Identificador",
        "integration": "Integração",
        "headers": "Headers",
        "payload": "Payload recebido",
        "response": "Resposta",
        "integrationConfig": "Configuração da integração",
        "originalData": "Dados originais",
        "normalizedData": "Dados normalizados",
        "trackingAudit": "Rastreamento e auditoria",
        "cannotDisplay": "Não foi possível exibir este evento."
      },
      "revokeModal": {
        "title": "Revogar esta credencial?",
        "description": "A integração deixará de funcionar imediatamente. Uma credencial revogada não poderá ser reativada.",
        "revoking": "A revogar...",
        "confirm": "Sim, revogar"
      },
      "secretModal": {
        "warning": "Por segurança, o novo segredo não poderá ser exibido novamente.",
        "newSecret": "Novo segredo",
        "copyKey": "Copiar chave",
        "copySecret": "Copiar segredo"
      }
    },
    "errors": {
      "load": "Não foi possível consultar as integrações.",
      "nameRequired": "Informe um nome para a integração.",
      "endpointRequired": "Informe para qual endereço o PHANYX deverá enviar os dados.",
      "create": "Não foi possível criar a integração.",
      "invalidResponse": "O servidor retornou uma resposta inválida.",
      "invalidIntegration": "Integração inválida.",
      "loadIntegration": "Não foi possível carregar a integração.",
      "loadEvents": "Não foi possível carregar os eventos.",
      "noEditPermission": "Você não possui permissão para editar esta integração.",
      "saveIntegration": "Não foi possível guardar a integração.",
      "changeStatus": "Não foi possível alterar a situação da integração.",
      "generateSecret": "Não foi possível gerar uma nova credencial.",
      "secretMissing": "O servidor não retornou o novo segredo.",
      "revoke": "Não foi possível revogar a integração.",
      "copy": "Não foi possível copiar automaticamente.",
      "noAuditPermission": "Você não possui permissão para consultar os detalhes técnicos deste evento.",
      "loadEventDetail": "Não foi possível carregar os detalhes do evento.",
      "cannotReprocess": "Esta submissão não pode ser processada novamente.",
      "reprocess": "Não foi possível tentar o processamento novamente."
    },
    "success": {
      "created": "Integração criada com sucesso.",
      "updated": "Integração atualizada com sucesso.",
      "paused": "Integração pausada.",
      "activated": "Integração ativada.",
      "revoked": "Credencial revogada.",
      "reprocessed": "Submissão processada novamente com sucesso.",
      "publicKeyCopied": "Chave pública copiada.",
      "addressCopied": "Endereço copiado.",
      "secretCopied": "Segredo copiado."
    }
  },
  "en-US": {
    "common": {
      "search": "Search",
      "type": "Type",
      "status": "Status",
      "availability": "Availability",
      "channel": "Channel",
      "campaign": "Campaign",
      "form": "Form",
      "clear": "Clear",
      "filter": "Filter",
      "refresh": "↻ Refresh",
      "refreshing": "Refreshing...",
      "cancel": "Cancel",
      "never": "Never",
      "notInformed": "Not provided",
      "noLink": "No link",
      "notLinkedMasculine": "Not linked",
      "notLinkedFeminine": "Not linked",
      "viewDetails": "View details",
      "integrationName": "Integration name",
      "lastSuccess": "Last success",
      "lastError": "Last error",
      "lastUpdate": "Last update",
      "createdAt": "Created on",
      "whatHappened": "What happened",
      "copy": "Copy",
      "close": "Close",
      "allFeminine": "All",
      "wait": "Please wait...",
      "saveChanges": "Save changes",
      "saving": "Saving...",
      "creating": "Creating...",
      "previous": "Previous",
      "next": "Next",
      "notYet": "Not yet"
    },
    "list": {
      "loading": "Loading integrations...",
      "back": "← Lead Generation Center",
      "title": "Lead generation integrations",
      "description": "Connect PHANYX to ads, websites, and other systems to automatically receive or send data.",
      "newIntegration": "+ New integration",
      "summary": {
        "total": "Total",
        "totalHelp": "Registered integrations",
        "active": "Active",
        "activeHelp": "Working normally",
        "paused": "Paused",
        "pausedHelp": "Temporarily interrupted",
        "error": "With issues",
        "errorHelp": "Require attention",
        "revoked": "Revoked",
        "revokedHelp": "Closed credentials"
      },
      "filters": {
        "searchPlaceholder": "Integration name or address...",
        "allTypes": "All types",
        "enabled": "Enabled",
        "disabled": "Disabled"
      },
      "types": {
        "webhookIn": "Receive data by webhook",
        "webhookOut": "Send data by webhook",
        "metaLeadAds": "Meta Lead Ads",
        "googleLeadForm": "Google Lead Forms",
        "api": "API integration",
        "import": "Data import",
        "other": "Other integration"
      },
      "typeDescriptions": {
        "webhookIn": "Automatically receive contacts sent by another system.",
        "webhookOut": "Send lead-generation events and data to another system.",
        "metaLeadAds": "Receive prospects captured through Meta ad forms.",
        "googleLeadForm": "Receive prospects captured through Google ad forms.",
        "api": "Allow another system to send data directly to PHANYX.",
        "import": "Identify integrations used in import processes.",
        "other": "Use this for integrations that do not fit the previous options."
      },
      "statuses": {
        "inactive": "Inactive",
        "active": "Active",
        "paused": "Paused",
        "error": "With issues",
        "revoked": "Revoked"
      },
      "configured": {
        "title": "Configured integrations",
        "results": "{count, plural, =0 {No integrations found} one {# integration found} other {# integrations found}}.",
        "emptyTitle": "No integrations found",
        "emptyDescription": "Create an integration to connect ads, websites, or other systems to PHANYX."
      },
      "card": {
        "receipts": "Receipts",
        "credentialConfigured": "🔐 Credential configured",
        "credentialNotRequired": "Credential not required"
      },
      "modal": {
        "title": "New integration",
        "description": "Provide only what is needed. PHANYX will automatically handle technical credentials when required.",
        "namePlaceholder": "Example: Meta - 2027 Admissions",
        "integrationMethod": "How will the data be integrated?",
        "destinationAddress": "Where should PHANYX send the data?",
        "captureOrganization": "Lead source organization",
        "captureOrganizationHelp": "These links help PHANYX identify where prospects came from.",
        "activateNow": "Activate integration now",
        "activateHelp": "If left unchecked, the integration will be saved as inactive so you can finish configuring it later.",
        "create": "Create integration"
      }
    },
    "credentials": {
      "saveNow": "Save this information now",
      "secretWarning": "For security, this integration secret cannot be displayed again.",
      "publicKey": "Public key",
      "secret": "Secret",
      "saved": "I saved the information"
    },
    "detail": {
      "loading": "Loading integration...",
      "notFound": {
        "title": "Integration not found",
        "description": "This integration could not be located.",
        "back": "← Back to integrations"
      },
      "back": "← Lead generation integrations",
      "heroDescription": "Monitor the connection, receipts, and history for this integration.",
      "actions": {
        "pause": "Pause integration",
        "activate": "Activate integration"
      },
      "summary": {
        "receipts": "Receipts",
        "receiptsHelp": "Linked submissions",
        "events": "Events",
        "eventsHelp": "Integration records",
        "lastSuccessHelp": "Last completed processing",
        "activeHelp": "Working normally",
        "revokedHelp": "Credential closed",
        "inactiveHelp": "Not receiving normally"
      },
      "attention": "What needs attention",
      "config": {
        "eyebrow": "CONFIGURATION",
        "title": "Integration data",
        "descriptionOut": "Configure how PHANYX will send data to the external system.",
        "descriptionIn": "This information organizes how contacts enter PHANYX.",
        "method": "How is the data integrated?",
        "captureOrganization": "Lead source organization",
        "captureOrganizationHelp": "Link the source to identify where each prospect came from.",
        "destinationAddress": "Destination address",
        "destinationHelp": "Address of the system that will receive data sent by PHANYX."
      },
      "history": {
        "eyebrow": "HISTORY",
        "title": "Integration events",
        "description": "View incoming events, processing activity, and possible connection failures.",
        "searchPlaceholder": "Event, type, or error...",
        "direction": "Direction",
        "loading": "Loading events...",
        "emptyTitle": "No events found",
        "emptyDescription": "Events for this integration will appear here as data is received or sent.",
        "attempts": "Attempts",
        "submission": "Submission",
        "processed": "Processed",
        "openLead": "Open lead →",
        "eventNumber": "Event #{id}",
        "unnamedProspect": "Unnamed prospect",
        "opening": "Opening...",
        "pagination": "Page {page} of {pages} · {total, plural, one {# event} other {# events}}"
      },
      "credential": {
        "eyebrow": "CREDENTIAL",
        "titleOut": "Sending authentication",
        "titleIn": "Connection to PHANYX",
        "descriptionOut": "Use this information to identify and authenticate data sent by PHANYX.",
        "descriptionIn": "Use this information to connect the external system to PHANYX.",
        "receiveAddress": "Data receiving endpoint",
        "copyAddress": "Copy address",
        "secretConfigured": "Secret configured",
        "secretNotConfigured": "Secret not configured",
        "secretHelp": "The current secret is never displayed again after it is created.",
        "generateSecret": "Generate new secret",
        "generating": "Generating..."
      },
      "links": {
        "eyebrow": "LINKS",
        "title": "Lead source"
      },
      "record": {
        "eyebrow": "RECORD",
        "title": "Integration information"
      },
      "security": {
        "eyebrow": "SECURITY",
        "title": "Integration credential",
        "revokedTitle": "Credential revoked",
        "revokedDescription": "This integration cannot be reactivated. To use it again, create a new integration.",
        "description": "Revoke only when this connection must no longer be used.",
        "revoke": "Revoke credential"
      },
      "eventStatuses": {
        "received": "Received",
        "pending": "Pending",
        "processing": "Processing",
        "processed": "Processed",
        "delivered": "Delivered",
        "discarded": "Discarded"
      },
      "directions": {
        "in": "Inbound",
        "out": "Outbound"
      },
      "eventModal": {
        "eyebrow": "INTEGRATION EVENT",
        "description": "Information about receiving and processing this event.",
        "closeAria": "Close event details",
        "loading": "Loading event details...",
        "dateTime": "Date and time",
        "direction": "Inbound or outbound",
        "attemptCount": "Number of attempts",
        "processedAt": "Processed at",
        "lead": "Lead",
        "prospect": "Prospect",
        "notGenerated": "Not generated",
        "openLead": "Open lead",
        "nameNotInformed": "Name not provided",
        "contactNotInformed": "Contact not provided",
        "pendingMessage": "The event was received and is still waiting for processing to complete.",
        "successMessage": "The event completed with no recorded failures.",
        "nextAttempt": "Next attempt:",
        "canRetryTitle": "Processing can be attempted again",
        "canRetryDescription": "PHANYX will reuse the data already received in this submission.",
        "retrying": "Trying again...",
        "retry": "Try again",
        "technicalDetails": "Technical details",
        "identification": "Identification",
        "event": "Event",
        "identifier": "Identifier",
        "integration": "Integration",
        "headers": "Headers",
        "payload": "Received payload",
        "response": "Response",
        "integrationConfig": "Integration configuration",
        "originalData": "Original data",
        "normalizedData": "Normalized data",
        "trackingAudit": "Tracking and audit",
        "cannotDisplay": "This event cannot be displayed."
      },
      "revokeModal": {
        "title": "Revoke this credential?",
        "description": "The integration will stop working immediately. A revoked credential cannot be reactivated.",
        "revoking": "Revoking...",
        "confirm": "Yes, revoke"
      },
      "secretModal": {
        "warning": "For security, the new secret cannot be displayed again.",
        "newSecret": "New secret",
        "copyKey": "Copy key",
        "copySecret": "Copy secret"
      }
    },
    "errors": {
      "load": "Could not retrieve integrations.",
      "nameRequired": "Enter a name for the integration.",
      "endpointRequired": "Enter the address where PHANYX should send the data.",
      "create": "Could not create the integration.",
      "invalidResponse": "The server returned an invalid response.",
      "invalidIntegration": "Invalid integration.",
      "loadIntegration": "Could not load the integration.",
      "loadEvents": "Could not load events.",
      "noEditPermission": "You do not have permission to edit this integration.",
      "saveIntegration": "Could not save the integration.",
      "changeStatus": "Could not change the integration status.",
      "generateSecret": "Could not generate a new credential.",
      "secretMissing": "The server did not return the new secret.",
      "revoke": "Could not revoke the integration.",
      "copy": "Could not copy automatically.",
      "noAuditPermission": "You do not have permission to view the technical details of this event.",
      "loadEventDetail": "Could not load event details.",
      "cannotReprocess": "This submission cannot be processed again.",
      "reprocess": "Could not retry processing."
    },
    "success": {
      "created": "Integration created successfully.",
      "updated": "Integration updated successfully.",
      "paused": "Integration paused.",
      "activated": "Integration activated.",
      "revoked": "Credential revoked.",
      "reprocessed": "Submission processed again successfully.",
      "publicKeyCopied": "Public key copied.",
      "addressCopied": "Address copied.",
      "secretCopied": "Secret copied."
    }
  },
  "es-ES": {
    "common": {
      "search": "Buscar",
      "type": "Tipo",
      "status": "Estado",
      "availability": "Disponibilidad",
      "channel": "Canal",
      "campaign": "Campaña",
      "form": "Formulario",
      "clear": "Limpiar",
      "filter": "Filtrar",
      "refresh": "↻ Actualizar",
      "refreshing": "Actualizando...",
      "cancel": "Cancelar",
      "never": "Nunca",
      "notInformed": "No informado",
      "noLink": "Sin vínculo",
      "notLinkedMasculine": "No vinculado",
      "notLinkedFeminine": "No vinculada",
      "viewDetails": "Ver detalles",
      "integrationName": "Nombre de la integración",
      "lastSuccess": "Último éxito",
      "lastError": "Último error",
      "lastUpdate": "Última actualización",
      "createdAt": "Creada el",
      "whatHappened": "Qué ocurrió",
      "copy": "Copiar",
      "close": "Cerrar",
      "allFeminine": "Todas",
      "wait": "Espere...",
      "saveChanges": "Guardar cambios",
      "saving": "Guardando...",
      "creating": "Creando...",
      "previous": "Anterior",
      "next": "Siguiente",
      "notYet": "Aún no"
    },
    "list": {
      "loading": "Cargando integraciones...",
      "back": "← Centro de Captación",
      "title": "Integraciones de captación",
      "description": "Conecta PHANYX con anuncios, sitios web y otros sistemas para recibir o enviar datos automáticamente.",
      "newIntegration": "+ Nueva integración",
      "summary": {
        "total": "Total",
        "totalHelp": "Integraciones registradas",
        "active": "Activas",
        "activeHelp": "Funcionando normalmente",
        "paused": "Pausadas",
        "pausedHelp": "Interrumpidas temporalmente",
        "error": "Con problemas",
        "errorHelp": "Requieren atención",
        "revoked": "Revocadas",
        "revokedHelp": "Credenciales cerradas"
      },
      "filters": {
        "searchPlaceholder": "Nombre o dirección de la integración...",
        "allTypes": "Todos los tipos",
        "enabled": "Habilitadas",
        "disabled": "Deshabilitadas"
      },
      "types": {
        "webhookIn": "Recibir datos por webhook",
        "webhookOut": "Enviar datos por webhook",
        "metaLeadAds": "Meta Lead Ads",
        "googleLeadForm": "Google Lead Forms",
        "api": "Integración por API",
        "import": "Importación de datos",
        "other": "Otra integración"
      },
      "typeDescriptions": {
        "webhookIn": "Recibe automáticamente contactos enviados por otro sistema.",
        "webhookOut": "Envía eventos y datos de captación a otro sistema.",
        "metaLeadAds": "Recibe interesados captados en formularios publicitarios de Meta.",
        "googleLeadForm": "Recibe interesados captados en formularios publicitarios de Google.",
        "api": "Permite que otro sistema envíe datos directamente a PHANYX.",
        "import": "Identifica integraciones utilizadas en procesos de importación.",
        "other": "Úsala para integraciones que no encajan en las opciones anteriores."
      },
      "statuses": {
        "inactive": "Inactiva",
        "active": "Activa",
        "paused": "Pausada",
        "error": "Con problemas",
        "revoked": "Revocada"
      },
      "configured": {
        "title": "Integraciones configuradas",
        "results": "{count, plural, =0 {No se encontraron integraciones} one {# integración encontrada} other {# integraciones encontradas}}.",
        "emptyTitle": "No se encontraron integraciones",
        "emptyDescription": "Crea una integración para conectar anuncios, sitios web u otros sistemas con PHANYX."
      },
      "card": {
        "receipts": "Recepciones",
        "credentialConfigured": "🔐 Credencial configurada",
        "credentialNotRequired": "Credencial no necesaria"
      },
      "modal": {
        "title": "Nueva integración",
        "description": "Indica solo lo necesario. PHANYX gestionará automáticamente las credenciales técnicas cuando sean necesarias.",
        "namePlaceholder": "Ej.: Meta - Admisiones 2027",
        "integrationMethod": "¿Cómo se integrarán los datos?",
        "destinationAddress": "¿A qué dirección debe enviar PHANYX los datos?",
        "captureOrganization": "Organización de la captación",
        "captureOrganizationHelp": "Estos vínculos ayudan a PHANYX a saber de dónde llegaron los interesados.",
        "activateNow": "Activar la integración ahora",
        "activateHelp": "Si lo dejas desmarcado, la integración se guardará como inactiva para que termines la configuración después.",
        "create": "Crear integración"
      }
    },
    "credentials": {
      "saveNow": "Guarda esta información ahora",
      "secretWarning": "Por seguridad, el secreto de esta integración no podrá mostrarse de nuevo.",
      "publicKey": "Clave pública",
      "secret": "Secreto",
      "saved": "Ya guardé la información"
    },
    "detail": {
      "loading": "Cargando integración...",
      "notFound": {
        "title": "Integración no encontrada",
        "description": "No se pudo localizar esta integración.",
        "back": "← Volver a integraciones"
      },
      "back": "← Integraciones de captación",
      "heroDescription": "Supervisa la conexión, las recepciones y el historial de esta integración.",
      "actions": {
        "pause": "Pausar integración",
        "activate": "Activar integración"
      },
      "summary": {
        "receipts": "Recepciones",
        "receiptsHelp": "Envíos vinculados",
        "events": "Eventos",
        "eventsHelp": "Registros de la integración",
        "lastSuccessHelp": "Último procesamiento completado",
        "activeHelp": "Funcionando normalmente",
        "revokedHelp": "Credencial cerrada",
        "inactiveHelp": "No está recibiendo normalmente"
      },
      "attention": "Qué requiere atención",
      "config": {
        "eyebrow": "CONFIGURACIÓN",
        "title": "Datos de la integración",
        "descriptionOut": "Configura cómo PHANYX enviará los datos al sistema externo.",
        "descriptionIn": "Esta información organiza cómo entran los contactos en PHANYX.",
        "method": "¿Cómo se integran los datos?",
        "captureOrganization": "Organización de la captación",
        "captureOrganizationHelp": "Vincula el origen para identificar de dónde llegó cada interesado.",
        "destinationAddress": "Dirección de destino",
        "destinationHelp": "Dirección del sistema que recibirá los datos enviados por PHANYX."
      },
      "history": {
        "eyebrow": "HISTORIAL",
        "title": "Eventos de la integración",
        "description": "Consulta entradas, procesamientos y posibles fallos de esta conexión.",
        "searchPlaceholder": "Evento, tipo o error...",
        "direction": "Dirección",
        "loading": "Cargando eventos...",
        "emptyTitle": "No se encontraron eventos",
        "emptyDescription": "Los eventos de esta integración aparecerán aquí a medida que se reciban o envíen datos.",
        "attempts": "Intentos",
        "submission": "Envío",
        "processed": "Procesado",
        "openLead": "Abrir lead →",
        "eventNumber": "Evento #{id}",
        "unnamedProspect": "Interesado sin nombre",
        "opening": "Abriendo...",
        "pagination": "Página {page} de {pages} · {total, plural, one {# evento} other {# eventos}}"
      },
      "credential": {
        "eyebrow": "CREDENCIAL",
        "titleOut": "Autenticación del envío",
        "titleIn": "Conexión con PHANYX",
        "descriptionOut": "Usa esta información para identificar y autenticar los datos enviados por PHANYX.",
        "descriptionIn": "Usa esta información para conectar el sistema externo con PHANYX.",
        "receiveAddress": "Dirección para recibir datos",
        "copyAddress": "Copiar dirección",
        "secretConfigured": "Secreto configurado",
        "secretNotConfigured": "Secreto no configurado",
        "secretHelp": "El secreto actual nunca vuelve a mostrarse después de crearlo.",
        "generateSecret": "Generar nuevo secreto",
        "generating": "Generando..."
      },
      "links": {
        "eyebrow": "VÍNCULOS",
        "title": "Origen de la captación"
      },
      "record": {
        "eyebrow": "REGISTRO",
        "title": "Información de la integración"
      },
      "security": {
        "eyebrow": "SEGURIDAD",
        "title": "Credencial de la integración",
        "revokedTitle": "Credencial revocada",
        "revokedDescription": "Esta integración no puede reactivarse. Para volver a utilizarla, crea una nueva integración.",
        "description": "Revoca solo cuando esta conexión ya no pueda utilizarse.",
        "revoke": "Revocar credencial"
      },
      "eventStatuses": {
        "received": "Recibido",
        "pending": "Pendiente",
        "processing": "Procesando",
        "processed": "Procesado",
        "delivered": "Entregado",
        "discarded": "Descartado"
      },
      "directions": {
        "in": "Entrada",
        "out": "Salida"
      },
      "eventModal": {
        "eyebrow": "EVENTO DE LA INTEGRACIÓN",
        "description": "Información sobre la recepción y el procesamiento de este evento.",
        "closeAria": "Cerrar detalles del evento",
        "loading": "Cargando detalles del evento...",
        "dateTime": "Fecha y hora",
        "direction": "Entrada o salida",
        "attemptCount": "Número de intentos",
        "processedAt": "Procesado el",
        "lead": "Lead",
        "prospect": "Interesado",
        "notGenerated": "No generado",
        "openLead": "Abrir lead",
        "nameNotInformed": "Nombre no informado",
        "contactNotInformed": "Contacto no informado",
        "pendingMessage": "El evento fue recibido y todavía espera que finalice el procesamiento.",
        "successMessage": "El evento se completó sin fallos registrados.",
        "nextAttempt": "Próximo intento:",
        "canRetryTitle": "Se puede volver a intentar el procesamiento",
        "canRetryDescription": "PHANYX volverá a utilizar los datos ya recibidos en este envío.",
        "retrying": "Intentando de nuevo...",
        "retry": "Intentar de nuevo",
        "technicalDetails": "Detalles técnicos",
        "identification": "Identificación",
        "event": "Evento",
        "identifier": "Identificador",
        "integration": "Integración",
        "headers": "Headers",
        "payload": "Payload recibido",
        "response": "Respuesta",
        "integrationConfig": "Configuración de la integración",
        "originalData": "Datos originales",
        "normalizedData": "Datos normalizados",
        "trackingAudit": "Seguimiento y auditoría",
        "cannotDisplay": "No se puede mostrar este evento."
      },
      "revokeModal": {
        "title": "¿Revocar esta credencial?",
        "description": "La integración dejará de funcionar inmediatamente. Una credencial revocada no podrá reactivarse.",
        "revoking": "Revocando...",
        "confirm": "Sí, revocar"
      },
      "secretModal": {
        "warning": "Por seguridad, el nuevo secreto no podrá mostrarse de nuevo.",
        "newSecret": "Nuevo secreto",
        "copyKey": "Copiar clave",
        "copySecret": "Copiar secreto"
      }
    },
    "errors": {
      "load": "No se pudieron consultar las integraciones.",
      "nameRequired": "Introduce un nombre para la integración.",
      "endpointRequired": "Introduce la dirección a la que PHANYX debe enviar los datos.",
      "create": "No se pudo crear la integración.",
      "invalidResponse": "El servidor devolvió una respuesta no válida.",
      "invalidIntegration": "Integración no válida.",
      "loadIntegration": "No se pudo cargar la integración.",
      "loadEvents": "No se pudieron cargar los eventos.",
      "noEditPermission": "No tienes permiso para editar esta integración.",
      "saveIntegration": "No se pudo guardar la integración.",
      "changeStatus": "No se pudo cambiar el estado de la integración.",
      "generateSecret": "No se pudo generar una nueva credencial.",
      "secretMissing": "El servidor no devolvió el nuevo secreto.",
      "revoke": "No se pudo revocar la integración.",
      "copy": "No se pudo copiar automáticamente.",
      "noAuditPermission": "No tienes permiso para consultar los detalles técnicos de este evento.",
      "loadEventDetail": "No se pudieron cargar los detalles del evento.",
      "cannotReprocess": "Este envío no puede procesarse de nuevo.",
      "reprocess": "No se pudo volver a intentar el procesamiento."
    },
    "success": {
      "created": "Integración creada correctamente.",
      "updated": "Integración actualizada correctamente.",
      "paused": "Integración pausada.",
      "activated": "Integración activada.",
      "revoked": "Credencial revocada.",
      "reprocessed": "Envío procesado de nuevo correctamente.",
      "publicKeyCopied": "Clave pública copiada.",
      "addressCopied": "Dirección copiada.",
      "secretCopied": "Secreto copiado."
    }
  },
  "fr-FR": {
    "common": {
      "search": "Rechercher",
      "type": "Type",
      "status": "Statut",
      "availability": "Disponibilité",
      "channel": "Canal",
      "campaign": "Campagne",
      "form": "Formulaire",
      "clear": "Effacer",
      "filter": "Filtrer",
      "refresh": "↻ Actualiser",
      "refreshing": "Actualisation...",
      "cancel": "Annuler",
      "never": "Jamais",
      "notInformed": "Non renseigné",
      "noLink": "Aucun lien",
      "notLinkedMasculine": "Non lié",
      "notLinkedFeminine": "Non liée",
      "viewDetails": "Voir les détails",
      "integrationName": "Nom de l’intégration",
      "lastSuccess": "Dernier succès",
      "lastError": "Dernière erreur",
      "lastUpdate": "Dernière mise à jour",
      "createdAt": "Créée le",
      "whatHappened": "Ce qui s’est passé",
      "copy": "Copier",
      "close": "Fermer",
      "allFeminine": "Toutes",
      "wait": "Veuillez patienter...",
      "saveChanges": "Enregistrer les modifications",
      "saving": "Enregistrement...",
      "creating": "Création...",
      "previous": "Précédente",
      "next": "Suivante",
      "notYet": "Pas encore"
    },
    "list": {
      "loading": "Chargement des intégrations...",
      "back": "← Centre d’acquisition",
      "title": "Intégrations d’acquisition",
      "description": "Connectez PHANYX aux publicités, sites web et autres systèmes pour recevoir ou envoyer automatiquement des données.",
      "newIntegration": "+ Nouvelle intégration",
      "summary": {
        "total": "Total",
        "totalHelp": "Intégrations enregistrées",
        "active": "Actives",
        "activeHelp": "Fonctionnement normal",
        "paused": "En pause",
        "pausedHelp": "Temporairement interrompues",
        "error": "Avec problème",
        "errorHelp": "Nécessitent une attention",
        "revoked": "Révoquées",
        "revokedHelp": "Identifiants clôturés"
      },
      "filters": {
        "searchPlaceholder": "Nom ou adresse de l’intégration...",
        "allTypes": "Tous les types",
        "enabled": "Activées",
        "disabled": "Désactivées"
      },
      "types": {
        "webhookIn": "Recevoir des données par webhook",
        "webhookOut": "Envoyer des données par webhook",
        "metaLeadAds": "Meta Lead Ads",
        "googleLeadForm": "Google Lead Forms",
        "api": "Intégration par API",
        "import": "Importation de données",
        "other": "Autre intégration"
      },
      "typeDescriptions": {
        "webhookIn": "Recevez automatiquement les contacts envoyés par un autre système.",
        "webhookOut": "Envoyez les événements et données d’acquisition vers un autre système.",
        "metaLeadAds": "Recevez les prospects captés via les formulaires publicitaires Meta.",
        "googleLeadForm": "Recevez les prospects captés via les formulaires publicitaires Google.",
        "api": "Autorisez un autre système à envoyer directement des données à PHANYX.",
        "import": "Identifiez les intégrations utilisées dans les processus d’importation.",
        "other": "Utilisez cette option pour les intégrations qui ne correspondent pas aux choix précédents."
      },
      "statuses": {
        "inactive": "Inactive",
        "active": "Active",
        "paused": "En pause",
        "error": "Avec problème",
        "revoked": "Révoquée"
      },
      "configured": {
        "title": "Intégrations configurées",
        "results": "{count, plural, =0 {Aucune intégration trouvée} one {# intégration trouvée} other {# intégrations trouvées}}.",
        "emptyTitle": "Aucune intégration trouvée",
        "emptyDescription": "Créez une intégration pour connecter des publicités, sites web ou autres systèmes à PHANYX."
      },
      "card": {
        "receipts": "Réceptions",
        "credentialConfigured": "🔐 Identifiant configuré",
        "credentialNotRequired": "Identifiant non requis"
      },
      "modal": {
        "title": "Nouvelle intégration",
        "description": "Renseignez uniquement le nécessaire. PHANYX gérera automatiquement les identifiants techniques lorsqu’ils seront requis.",
        "namePlaceholder": "Ex. : Meta - Admissions 2027",
        "integrationMethod": "Comment les données seront-elles intégrées ?",
        "destinationAddress": "À quelle adresse PHANYX doit-il envoyer les données ?",
        "captureOrganization": "Organisation de l’acquisition",
        "captureOrganizationHelp": "Ces liens aident PHANYX à identifier l’origine des prospects.",
        "activateNow": "Activer l’intégration maintenant",
        "activateHelp": "Si cette option reste décochée, l’intégration sera enregistrée comme inactive afin que vous puissiez terminer la configuration plus tard.",
        "create": "Créer l’intégration"
      }
    },
    "credentials": {
      "saveNow": "Enregistrez ces informations maintenant",
      "secretWarning": "Pour des raisons de sécurité, le secret de cette intégration ne pourra plus être affiché.",
      "publicKey": "Clé publique",
      "secret": "Secret",
      "saved": "J’ai enregistré les informations"
    },
    "detail": {
      "loading": "Chargement de l’intégration...",
      "notFound": {
        "title": "Intégration introuvable",
        "description": "Cette intégration n’a pas pu être trouvée.",
        "back": "← Retour aux intégrations"
      },
      "back": "← Intégrations d’acquisition",
      "heroDescription": "Suivez la connexion, les réceptions et l’historique de cette intégration.",
      "actions": {
        "pause": "Mettre l’intégration en pause",
        "activate": "Activer l’intégration"
      },
      "summary": {
        "receipts": "Réceptions",
        "receiptsHelp": "Soumissions liées",
        "events": "Événements",
        "eventsHelp": "Enregistrements de l’intégration",
        "lastSuccessHelp": "Dernier traitement terminé",
        "activeHelp": "Fonctionnement normal",
        "revokedHelp": "Identifiant clôturé",
        "inactiveHelp": "Ne reçoit pas normalement"
      },
      "attention": "Ce qui nécessite votre attention",
      "config": {
        "eyebrow": "CONFIGURATION",
        "title": "Données de l’intégration",
        "descriptionOut": "Configurez la manière dont PHANYX enverra les données au système externe.",
        "descriptionIn": "Ces informations organisent la façon dont les contacts entrent dans PHANYX.",
        "method": "Comment les données sont-elles intégrées ?",
        "captureOrganization": "Organisation de l’acquisition",
        "captureOrganizationHelp": "Associez l’origine afin d’identifier la provenance de chaque prospect.",
        "destinationAddress": "Adresse de destination",
        "destinationHelp": "Adresse du système qui recevra les données envoyées par PHANYX."
      },
      "history": {
        "eyebrow": "HISTORIQUE",
        "title": "Événements de l’intégration",
        "description": "Consultez les entrées, traitements et éventuelles erreurs de cette connexion.",
        "searchPlaceholder": "Événement, type ou erreur...",
        "direction": "Direction",
        "loading": "Chargement des événements...",
        "emptyTitle": "Aucun événement trouvé",
        "emptyDescription": "Les événements de cette intégration apparaîtront ici au fur et à mesure que les données seront reçues ou envoyées.",
        "attempts": "Tentatives",
        "submission": "Soumission",
        "processed": "Traité",
        "openLead": "Ouvrir le lead →",
        "eventNumber": "Événement #{id}",
        "unnamedProspect": "Prospect sans nom",
        "opening": "Ouverture...",
        "pagination": "Page {page} sur {pages} · {total, plural, one {# événement} other {# événements}}"
      },
      "credential": {
        "eyebrow": "IDENTIFIANT",
        "titleOut": "Authentification de l’envoi",
        "titleIn": "Connexion à PHANYX",
        "descriptionOut": "Utilisez ces informations pour identifier et authentifier les données envoyées par PHANYX.",
        "descriptionIn": "Utilisez ces informations pour connecter le système externe à PHANYX.",
        "receiveAddress": "Adresse de réception des données",
        "copyAddress": "Copier l’adresse",
        "secretConfigured": "Secret configuré",
        "secretNotConfigured": "Secret non configuré",
        "secretHelp": "Le secret actuel n’est plus jamais affiché après sa création.",
        "generateSecret": "Générer un nouveau secret",
        "generating": "Génération..."
      },
      "links": {
        "eyebrow": "LIENS",
        "title": "Origine de l’acquisition"
      },
      "record": {
        "eyebrow": "ENREGISTREMENT",
        "title": "Informations sur l’intégration"
      },
      "security": {
        "eyebrow": "SÉCURITÉ",
        "title": "Identifiant de l’intégration",
        "revokedTitle": "Identifiant révoqué",
        "revokedDescription": "Cette intégration ne peut pas être réactivée. Pour l’utiliser à nouveau, créez une nouvelle intégration.",
        "description": "Révoquez uniquement lorsque cette connexion ne doit plus être utilisée.",
        "revoke": "Révoquer l’identifiant"
      },
      "eventStatuses": {
        "received": "Reçu",
        "pending": "En attente",
        "processing": "En cours",
        "processed": "Traité",
        "delivered": "Livré",
        "discarded": "Écarté"
      },
      "directions": {
        "in": "Entrée",
        "out": "Sortie"
      },
      "eventModal": {
        "eyebrow": "ÉVÉNEMENT DE L’INTÉGRATION",
        "description": "Informations sur la réception et le traitement de cet événement.",
        "closeAria": "Fermer les détails de l’événement",
        "loading": "Chargement des détails de l’événement...",
        "dateTime": "Date et heure",
        "direction": "Entrée ou sortie",
        "attemptCount": "Nombre de tentatives",
        "processedAt": "Traité le",
        "lead": "Lead",
        "prospect": "Prospect",
        "notGenerated": "Non généré",
        "openLead": "Ouvrir le lead",
        "nameNotInformed": "Nom non renseigné",
        "contactNotInformed": "Contact non renseigné",
        "pendingMessage": "L’événement a été reçu et attend encore la fin du traitement.",
        "successMessage": "L’événement a été terminé sans erreur enregistrée.",
        "nextAttempt": "Prochaine tentative :",
        "canRetryTitle": "Le traitement peut être tenté à nouveau",
        "canRetryDescription": "PHANYX réutilisera les données déjà reçues dans cette soumission.",
        "retrying": "Nouvelle tentative...",
        "retry": "Réessayer",
        "technicalDetails": "Détails techniques",
        "identification": "Identification",
        "event": "Événement",
        "identifier": "Identifiant",
        "integration": "Intégration",
        "headers": "Headers",
        "payload": "Payload reçu",
        "response": "Réponse",
        "integrationConfig": "Configuration de l’intégration",
        "originalData": "Données d’origine",
        "normalizedData": "Données normalisées",
        "trackingAudit": "Suivi et audit",
        "cannotDisplay": "Impossible d’afficher cet événement."
      },
      "revokeModal": {
        "title": "Révoquer cet identifiant ?",
        "description": "L’intégration cessera immédiatement de fonctionner. Un identifiant révoqué ne peut pas être réactivé.",
        "revoking": "Révocation...",
        "confirm": "Oui, révoquer"
      },
      "secretModal": {
        "warning": "Pour des raisons de sécurité, le nouveau secret ne pourra plus être affiché.",
        "newSecret": "Nouveau secret",
        "copyKey": "Copier la clé",
        "copySecret": "Copier le secret"
      }
    },
    "errors": {
      "load": "Impossible de consulter les intégrations.",
      "nameRequired": "Saisissez un nom pour l’intégration.",
      "endpointRequired": "Saisissez l’adresse à laquelle PHANYX doit envoyer les données.",
      "create": "Impossible de créer l’intégration.",
      "invalidResponse": "Le serveur a renvoyé une réponse invalide.",
      "invalidIntegration": "Intégration invalide.",
      "loadIntegration": "Impossible de charger l’intégration.",
      "loadEvents": "Impossible de charger les événements.",
      "noEditPermission": "Vous n’avez pas l’autorisation de modifier cette intégration.",
      "saveIntegration": "Impossible d’enregistrer l’intégration.",
      "changeStatus": "Impossible de modifier le statut de l’intégration.",
      "generateSecret": "Impossible de générer un nouvel identifiant.",
      "secretMissing": "Le serveur n’a pas renvoyé le nouveau secret.",
      "revoke": "Impossible de révoquer l’intégration.",
      "copy": "Impossible de copier automatiquement.",
      "noAuditPermission": "Vous n’avez pas l’autorisation de consulter les détails techniques de cet événement.",
      "loadEventDetail": "Impossible de charger les détails de l’événement.",
      "cannotReprocess": "Cette soumission ne peut pas être traitée à nouveau.",
      "reprocess": "Impossible de relancer le traitement."
    },
    "success": {
      "created": "Intégration créée avec succès.",
      "updated": "Intégration mise à jour avec succès.",
      "paused": "Intégration mise en pause.",
      "activated": "Intégration activée.",
      "revoked": "Identifiant révoqué.",
      "reprocessed": "Soumission traitée à nouveau avec succès.",
      "publicKeyCopied": "Clé publique copiée.",
      "addressCopied": "Adresse copiée.",
      "secretCopied": "Secret copié."
    }
  }
};

const namespace = "AdminCommercialIntegrations";
const raiz = process.cwd();

for (const [locale, bloco] of Object.entries(traducoes)) {
  const arquivo = path.join(
    raiz,
    "messages",
    `${locale}.json`
  );

  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Arquivo não encontrado: ${arquivo}`
    );
  }

  const textoOriginal =
    fs.readFileSync(
      arquivo,
      "utf8"
    );

  const mensagens =
    JSON.parse(
      textoOriginal
    );

  const backup =
    `${arquivo}.bak-admin-commercial-integrations`;

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(
      arquivo,
      backup
    );
  }

  mensagens[namespace] =
    bloco;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(
      mensagens,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    `✓ ${locale}: ${namespace} atualizado`
  );
}

console.log(
  "\nConcluído. Os cinco arquivos de idioma foram atualizados."
);
