import fs from "node:fs";
import path from "node:path";

const namespace = "AdminCommercialForms";

const traducoes = {
  "pt-BR": {
    "common": {
      "all": "Todos",
      "availability": "Situação",
      "back": "Voltar",
      "backToLeadGenerationCenter": "← Central de Captação",
      "campaign": "Campanha",
      "cancel": "Cancelar",
      "channel": "Canal",
      "clear": "Limpar",
      "close": "Fechar",
      "creating": "Criando...",
      "description": "Descrição",
      "edit": "Editar",
      "filter": "Filtrar",
      "optional": "Opcional",
      "refresh": "↻ Atualizar",
      "refreshing": "Atualizando...",
      "saveChanges": "Salvar alterações",
      "saving": "Salvando...",
      "search": "Buscar",
      "status": "Status",
      "tryAgain": "Tentar novamente"
    },
    "shared": {
      "required": "Obrigatório",
      "statuses": {
        "activePlural": "Ativos",
        "archived": "Arquivado",
        "draft": "Rascunho",
        "inactive": "Inativo",
        "inactivePlural": "Inativos",
        "paused": "Pausado",
        "published": "Publicado"
      },
      "widths": {
        "custom": "Tamanho personalizado",
        "full": "Linha inteira",
        "half": "Metade da linha",
        "quarter": "Um quarto",
        "third": "Um terço"
      },
      "fieldTypes": {
        "shortText": "Texto curto",
        "longText": "Texto longo",
        "email": "E-mail",
        "phone": "Telefone / WhatsApp",
        "number": "Número",
        "date": "Data",
        "singleSelect": "Seleção única",
        "multiSelect": "Seleção múltipla",
        "checkbox": "Caixa de seleção",
        "consent": "Consentimento",
        "hidden": "Campo oculto"
      },
      "mappings": {
        "name": "Nome do interessado",
        "email": "E-mail",
        "phone": "Telefone / WhatsApp",
        "organization": "Instituição / empresa",
        "role": "Cargo / função",
        "interest": "Interesse",
        "notes": "Observações",
        "courseInterest": "Curso de interesse",
        "unitInterest": "Polo de interesse",
        "consent": "Consentimento LGPD",
        "custom": "Campo personalizado"
      }
    },
    "list": {
      "header": {
        "title": "Formulários de captação",
        "description": "Crie formulários públicos para receber interessados e encaminhá-los automaticamente ao processo comercial.",
        "newForm": "+ Novo formulário"
      },
      "summary": {
        "total": "Total",
        "published": "Publicados",
        "drafts": "Rascunhos",
        "paused": "Pausados"
      },
      "filters": {
        "searchPlaceholder": "Nome, título ou identificador"
      },
      "registered": {
        "title": "Formulários cadastrados",
        "results": "{count, plural, =0 {Nenhum resultado nesta consulta.} one {# resultado nesta consulta.} other {# resultados nesta consulta.}}"
      },
      "empty": {
        "title": "Nenhum formulário encontrado",
        "description": "Crie o primeiro formulário de captação ou altere os filtros.",
        "create": "+ Criar formulário"
      },
      "item": {
        "configure": "Configurar formulário",
        "internalName": "Nome interno",
        "noChannel": "Sem canal",
        "noCampaign": "Sem campanha",
        "identifier": "Identificador",
        "version": "Versão",
        "lgpdRequired": "LGPD exigida",
        "lgpdNotRequired": "LGPD não exigida",
        "updatedAt": "Atualizado em",
        "counters": {
          "fields": "Campos",
          "submissions": "Submissões",
          "rules": "Regras",
          "integrations": "Integrações"
        }
      },
      "loadError": {
        "title": "Não foi possível carregar os formulários"
      },
      "errors": {
        "load": "Não foi possível carregar os formulários de captação.",
        "create": "Não foi possível criar o formulário."
      },
      "validation": {
        "internalName": "Informe o nome interno do formulário.",
        "publicTitle": "Informe o título que será exibido para o interessado."
      },
      "success": {
        "createdDraft": "Formulário criado como rascunho."
      },
      "modal": {
        "title": "Novo formulário de captação",
        "description": "Comece pelas informações básicas. O formulário será salvo como rascunho.",
        "draftNoticePrefix": "Este formulário será criado como",
        "draftNoticeSuffix": ". Depois vamos configurar campos, LGPD, automações e publicação.",
        "internalName": "Nome interno",
        "internalNameHelp": "Nome utilizado pela equipe para identificar o formulário.",
        "internalNamePlaceholder": "Ex.: Formulário Vestibular 2027",
        "publicTitle": "Título exibido para o interessado",
        "publicTitleHelp": "Este é o título que a pessoa verá ao abrir o formulário.",
        "publicTitlePlaceholder": "Ex.: Inscreva-se para o Vestibular 2027",
        "noSpecificChannel": "Sem canal específico",
        "noSpecificCampaign": "Sem campanha específica",
        "identifier": "Identificador",
        "identifierPlaceholder": "Opcional — gerado pelo nome",
        "identifierHelp": "Se ficar vazio, o PHANYX gera automaticamente.",
        "descriptionPlaceholder": "Explique brevemente o objetivo deste formulário.",
        "createDraft": "Criar rascunho"
      }
    },
    "config": {
      "header": {
        "back": "← Formulários de captação",
        "title": "Configurar formulário",
        "version": "Versão"
      },
      "actions": {
        "preview": "Pré-visualizar",
        "publish": "Publicar formulário",
        "openPublic": "Abrir formulário",
        "copyLink": "Copiar link",
        "addField": "Adicionar campo"
      },
      "summary": {
        "total": "Total de campos",
        "active": "Campos ativos",
        "required": "Obrigatórios"
      },
      "fields": {
        "title": "Campos do formulário",
        "description": "Os campos aparecem para o interessado na ordem abaixo.",
        "emptyTitle": "Nenhum campo configurado",
        "emptyDescription": "Adicione os campos que o interessado deverá preencher.",
        "addFirst": "Adicionar primeiro campo",
        "moveUp": "Mover para cima",
        "moveDown": "Mover para baixo",
        "moveUpAria": "Mover {name} para cima",
        "moveDownAria": "Mover {name} para baixo"
      },
      "loadError": {
        "title": "Não foi possível abrir o formulário"
      },
      "errors": {
        "invalidForm": "Formulário inválido.",
        "loadFields": "Não foi possível carregar os campos.",
        "publish": "Não foi possível publicar o formulário.",
        "copyLink": "Não foi possível copiar o link. Tente novamente.",
        "reorder": "Não foi possível alterar a ordem dos campos.",
        "saveField": "Não foi possível salvar o campo.",
        "addField": "Não foi possível adicionar o campo."
      },
      "success": {
        "published": "Formulário publicado com sucesso.",
        "linkCopied": "Link do formulário copiado.",
        "reordered": "Ordem dos campos atualizada.",
        "fieldUpdated": "Campo atualizado com sucesso.",
        "fieldAdded": "Campo adicionado com sucesso."
      },
      "publish": {
        "title": "Publicar formulário?",
        "description": "Depois de publicar, pessoas com o link poderão preencher e enviar seus dados.",
        "reviewItems": "Antes de publicar, revise os itens abaixo.",
        "publishing": "Publicando...",
        "publishNow": "Publicar agora"
      },
      "validation": {
        "fieldLabel": "Informe o nome exibido para este campo.",
        "optionRequired": "Informe pelo menos uma opção para este campo."
      },
      "fieldModal": {
        "editTitle": "Editar campo",
        "addTitle": "Adicionar campo",
        "editDescription": "Ajuste como esta informação será solicitada ao interessado.",
        "addDescription": "Defina o que o interessado deverá informar.",
        "mappingLabel": "Qual informação você quer pedir?",
        "mappingHelp": "Escolha a informação que deseja solicitar. O PHANYX configura automaticamente como ela será usada.",
        "previewTitle": "Como aparecerá para o interessado",
        "previewHelp": "O PHANYX preparou este campo automaticamente.",
        "autoUnit": "Unidade selecionada automaticamente",
        "previewNotSaved": "Pré-visualização. A escolha feita aqui não será salva.",
        "customizeAppearance": "Personalizar como aparece",
        "displayLabel": "Pergunta ou nome exibido",
        "width": "Tamanho na tela",
        "placeholderLabel": "Exemplo mostrado no campo",
        "placeholderHelp": "Exemplo para ajudar no preenchimento",
        "helpLabel": "Orientação para quem vai preencher",
        "answerType": "Que tipo de resposta deseja receber?",
        "autoListTitle": "Lista atualizada automaticamente",
        "autoCourseDescription": "O PHANYX exibirá automaticamente os cursos ativos da instituição. Você não precisa cadastrar as opções manualmente.",
        "autoUnitDescription": "O PHANYX verificará as unidades disponíveis automaticamente. Se houver apenas uma, ela será selecionada sem perguntar ao interessado. Se houver várias, o formulário mostrará as opções para escolha.",
        "options": "Opções",
        "optionsHelp": "Digite uma opção por linha.",
        "optionsPlaceholder": "Opção 1\nOpção 2\nOpção 3",
        "requiredTitle": "Preenchimento obrigatório",
        "requiredHelp": "O interessado não poderá enviar o formulário sem preencher este campo.",
        "technicalSettings": "Configurações técnicas",
        "technicalHelp": "Esta área normalmente não precisa ser alterada.",
        "internalKey": "Identificador interno",
        "internalKeyPlaceholder": "Gerada automaticamente",
        "internalKeyHelp": "O PHANYX usa este identificador internamente. Evite alterá-lo depois que o formulário começar a receber respostas.",
        "customQuestionPlaceholder": "Ex.: Como podemos ajudar?",
        "fillHere": "Preencha aqui",
        "noUnits": "Nenhuma unidade ativa está disponível no momento.",
        "adding": "Adicionando..."
      },
      "defaults": {
        "name": {
          "label": "Nome completo",
          "placeholder": "Digite seu nome completo"
        },
        "email": {
          "help": "Informe um e-mail válido para receber nosso contato."
        },
        "phone": {
          "placeholder": "(11) 98765-4321",
          "help": "Informe seu número com DDD. Ex.: (11) 98765-4321"
        },
        "organization": {
          "placeholder": "Digite o nome da instituição ou empresa"
        },
        "role": {
          "placeholder": "Ex.: Diretor, coordenador, professor"
        },
        "interest": {
          "label": "O que você procura?",
          "placeholder": "Conte brevemente o que você procura"
        },
        "notes": {
          "label": "Mensagem ou observações",
          "placeholder": "Escreva aqui se quiser acrescentar alguma informação"
        },
        "course": {
          "placeholder": "Selecione um curso",
          "help": "Escolha o curso sobre o qual deseja receber informações."
        },
        "unit": {
          "label": "Onde você prefere estudar?",
          "placeholder": "Selecione uma unidade",
          "help": "Escolha a unidade ou polo de sua preferência."
        },
        "consent": {
          "label": "Li e concordo com a Política de Privacidade",
          "help": "O consentimento é necessário para o tratamento dos dados informados."
        }
      }
    },
    "protection": {
      "title": "Proteção de dados",
      "description": "Defina como o interessado será informado sobre o uso dos dados enviados.",
      "configured": "✓ Configurado",
      "needsReview": "Precisa revisar",
      "loading": "Carregando proteção de dados...",
      "requireConsent": {
        "title": "Pedir autorização para usar os dados e entrar em contato",
        "description": "O interessado precisará marcar uma opção de concordância antes de enviar o formulário."
      },
      "preview": {
        "title": "Como aparecerá para o interessado",
        "privacyAvailable": "Política de Privacidade disponível para consulta"
      },
      "consentMessage": {
        "label": "Mensagem de autorização",
        "help": "O PHANYX já preparou uma mensagem inicial. Altere somente se a instituição precisar de outro texto."
      },
      "privacyUrl": {
        "label": "Link da Política de Privacidade",
        "help": "Se a instituição possuir uma página de privacidade, informe o endereço aqui."
      },
      "auditNotice": "Quando o interessado enviar o formulário, o PHANYX guardará a autorização junto com o envio.",
      "disabledNotice": "A autorização não será mostrada ao interessado. Desative esta opção somente quando a instituição já tiver definido internamente como fará o tratamento desses dados.",
      "archivedNotice": "Este formulário está arquivado e não pode mais ser alterado.",
      "save": "Salvar proteção de dados",
      "errors": {
        "invalidForm": "Formulário inválido.",
        "load": "Não foi possível carregar a proteção de dados.",
        "save": "Não foi possível salvar a proteção de dados."
      },
      "validation": {
        "consentText": "Informe a mensagem de autorização que será mostrada ao interessado."
      },
      "success": {
        "saved": "Proteção de dados atualizada com sucesso."
      }
    },
    "preview": {
      "loading": "Carregando pré-visualização...",
      "errors": {
        "invalidForm": "Formulário inválido.",
        "load": "Não foi possível carregar a pré-visualização.",
        "notFound": "Formulário não encontrado."
      },
      "banner": {
        "title": "Pré-visualização",
        "description": "Você está vendo como este formulário aparecerá para o interessado. Nenhuma resposta será enviada.",
        "backToConfig": "Voltar à configuração"
      },
      "simulation": {
        "title": "Simulação concluída",
        "notice": "Esta foi apenas uma pré-visualização. Nenhum lead foi criado."
      },
      "defaultSuccess": "Seus dados foram recebidos com sucesso.",
      "selectOption": "Selecione uma opção",
      "phonePlaceholder": "Digite seu telefone",
      "phoneHelp": "Informe seu telefone com DDD.",
      "defaultConsent": "Autorizo o uso dos dados informados neste formulário para atendimento relacionado ao meu interesse.",
      "privacyPolicy": "Consultar Política de Privacidade",
      "submit": "Enviar formulário",
      "footer": "Pré-visualização administrativa — nenhum dado será enviado."
    }
  },
  "pt-PT": {
    "common": {
      "all": "Todos",
      "availability": "Situação",
      "back": "Voltar",
      "backToLeadGenerationCenter": "← Central de Captação",
      "campaign": "Campanha",
      "cancel": "Cancelar",
      "channel": "Canal",
      "clear": "Limpar",
      "close": "Fechar",
      "creating": "A criar...",
      "description": "Descrição",
      "edit": "Editar",
      "filter": "Filtrar",
      "optional": "Opcional",
      "refresh": "↻ Atualizar",
      "refreshing": "A atualizar...",
      "saveChanges": "Guardar alterações",
      "saving": "A guardar...",
      "search": "Pesquisar",
      "status": "Status",
      "tryAgain": "Tentar novamente"
    },
    "shared": {
      "required": "Obrigatório",
      "statuses": {
        "activePlural": "Ativos",
        "archived": "Arquivado",
        "draft": "Rascunho",
        "inactive": "Inativo",
        "inactivePlural": "Inativos",
        "paused": "Pausado",
        "published": "Publicado"
      },
      "widths": {
        "custom": "Tamanho personalizado",
        "full": "Linha inteira",
        "half": "Metade da linha",
        "quarter": "Um quarto",
        "third": "Um terço"
      },
      "fieldTypes": {
        "shortText": "Texto curto",
        "longText": "Texto longo",
        "email": "E-mail",
        "phone": "Telefone / WhatsApp",
        "number": "Número",
        "date": "Data",
        "singleSelect": "Seleção única",
        "multiSelect": "Seleção múltipla",
        "checkbox": "Caixa de seleção",
        "consent": "Consentimento",
        "hidden": "Campo oculto"
      },
      "mappings": {
        "name": "Nome do interessado",
        "email": "E-mail",
        "phone": "Telefone / WhatsApp",
        "organization": "Instituição / empresa",
        "role": "Cargo / função",
        "interest": "Interesse",
        "notes": "Observações",
        "courseInterest": "Curso de interesse",
        "unitInterest": "Polo de interesse",
        "consent": "Consentimento LGPD",
        "custom": "Campo personalizado"
      }
    },
    "list": {
      "header": {
        "title": "Formulários de captação",
        "description": "Crie formulários públicos para receber interessados e encaminhá-los automaticamente para o processo comercial.",
        "newForm": "+ Novo formulário"
      },
      "summary": {
        "total": "Total",
        "published": "Publicados",
        "drafts": "Rascunhos",
        "paused": "Em pausa"
      },
      "filters": {
        "searchPlaceholder": "Nome, título ou identificador"
      },
      "registered": {
        "title": "Formulários registados",
        "results": "{count, plural, =0 {Nenhum resultado nesta pesquisa.} one {# resultado nesta pesquisa.} other {# resultados nesta pesquisa.}}"
      },
      "empty": {
        "title": "Nenhum formulário encontrado",
        "description": "Crie o primeiro formulário de captação ou altere os filtros.",
        "create": "+ Criar formulário"
      },
      "item": {
        "configure": "Configurar formulário",
        "internalName": "Nome interno",
        "noChannel": "Sem canal",
        "noCampaign": "Sem campanha",
        "identifier": "Identificador",
        "version": "Versão",
        "lgpdRequired": "LGPD exigida",
        "lgpdNotRequired": "LGPD não exigida",
        "updatedAt": "Atualizado em",
        "counters": {
          "fields": "Campos",
          "submissions": "Submissões",
          "rules": "Regras",
          "integrations": "Integrações"
        }
      },
      "loadError": {
        "title": "Não foi possível carregar os formulários"
      },
      "errors": {
        "load": "Não foi possível carregar os formulários de captação.",
        "create": "Não foi possível criar o formulário."
      },
      "validation": {
        "internalName": "Indique o nome interno do formulário.",
        "publicTitle": "Indique o título que será apresentado ao interessado."
      },
      "success": {
        "createdDraft": "Formulário criado como rascunho."
      },
      "modal": {
        "title": "Novo formulário de captação",
        "description": "Comece pelas informações básicas. O formulário será guardado como rascunho.",
        "draftNoticePrefix": "Este formulário será criado como",
        "draftNoticeSuffix": ". Depois poderá configurar campos, proteção de dados, automatizações e publicação.",
        "internalName": "Nome interno",
        "internalNameHelp": "Nome utilizado pela equipa para identificar o formulário.",
        "internalNamePlaceholder": "Ex.: Formulário Candidaturas 2027",
        "publicTitle": "Título apresentado ao interessado",
        "publicTitleHelp": "Este é o título que a pessoa verá ao abrir o formulário.",
        "publicTitlePlaceholder": "Ex.: Inscreva-se para as Candidaturas 2027",
        "noSpecificChannel": "Sem canal específico",
        "noSpecificCampaign": "Sem campanha específica",
        "identifier": "Identificador",
        "identifierPlaceholder": "Opcional — gerado a partir do nome",
        "identifierHelp": "Se ficar vazio, o PHANYX gera-o automaticamente.",
        "descriptionPlaceholder": "Explique brevemente o objetivo deste formulário.",
        "createDraft": "Criar rascunho"
      }
    },
    "config": {
      "header": {
        "back": "← Formulários de captação",
        "title": "Configurar formulário",
        "version": "Versão"
      },
      "actions": {
        "preview": "Pré-visualizar",
        "publish": "Publicar formulário",
        "openPublic": "Abrir formulário",
        "copyLink": "Copiar ligação",
        "addField": "Adicionar campo"
      },
      "summary": {
        "total": "Total de campos",
        "active": "Campos ativos",
        "required": "Obrigatórios"
      },
      "fields": {
        "title": "Campos do formulário",
        "description": "Os campos são apresentados ao interessado pela ordem abaixo.",
        "emptyTitle": "Nenhum campo configurado",
        "emptyDescription": "Adicione os campos que o interessado deverá preencher.",
        "addFirst": "Adicionar primeiro campo",
        "moveUp": "Mover para cima",
        "moveDown": "Mover para baixo",
        "moveUpAria": "Mover {name} para cima",
        "moveDownAria": "Mover {name} para baixo"
      },
      "loadError": {
        "title": "Não foi possível abrir o formulário"
      },
      "errors": {
        "invalidForm": "Formulário inválido.",
        "loadFields": "Não foi possível carregar os campos.",
        "publish": "Não foi possível publicar o formulário.",
        "copyLink": "Não foi possível copiar a ligação. Tente novamente.",
        "reorder": "Não foi possível alterar a ordem dos campos.",
        "saveField": "Não foi possível guardar o campo.",
        "addField": "Não foi possível adicionar o campo."
      },
      "success": {
        "published": "Formulário publicado com sucesso.",
        "linkCopied": "Ligação do formulário copiada.",
        "reordered": "Ordem dos campos atualizada.",
        "fieldUpdated": "Campo atualizado com sucesso.",
        "fieldAdded": "Campo adicionado com sucesso."
      },
      "publish": {
        "title": "Publicar formulário?",
        "description": "Depois de publicar, as pessoas com a ligação poderão preencher e enviar os seus dados.",
        "reviewItems": "Antes de publicar, reveja os itens abaixo.",
        "publishing": "Publicando...",
        "publishNow": "Publicar agora"
      },
      "validation": {
        "fieldLabel": "Indique o nome apresentado para este campo.",
        "optionRequired": "Indique pelo menos uma opção para este campo."
      },
      "fieldModal": {
        "editTitle": "Editar campo",
        "addTitle": "Adicionar campo",
        "editDescription": "Ajuste a forma como esta informação será solicitada ao interessado.",
        "addDescription": "Defina o que o interessado deverá indicar.",
        "mappingLabel": "Que informação pretende pedir?",
        "mappingHelp": "Escolha a informação que pretende solicitar. O PHANYX configura automaticamente a forma como será utilizada.",
        "previewTitle": "Como será apresentado ao interessado",
        "previewHelp": "O PHANYX preparou este campo automaticamente.",
        "autoUnit": "Unidade selecionada automaticamente",
        "previewNotSaved": "Pré-visualização. A escolha feita aqui não será guardada.",
        "customizeAppearance": "Personalizar apresentação",
        "displayLabel": "Pergunta ou nome apresentado",
        "width": "Tamanho no ecrã",
        "placeholderLabel": "Exemplo apresentado no campo",
        "placeholderHelp": "Exemplo para ajudar no preenchimento",
        "helpLabel": "Orientação para quem vai preencher",
        "answerType": "Que tipo de resposta pretende receber?",
        "autoListTitle": "Lista atualizada automaticamente",
        "autoCourseDescription": "O PHANYX apresentará automaticamente os cursos ativos da instituição. Não precisa de registar as opções manualmente.",
        "autoUnitDescription": "O PHANYX verificará automaticamente as unidades disponíveis. Se existir apenas uma, será selecionada sem perguntar ao interessado. Se existirem várias, o formulário apresentará as opções para escolha.",
        "options": "Opções",
        "optionsHelp": "Introduza uma opção por linha.",
        "optionsPlaceholder": "Opção 1\nOpção 2\nOpção 3",
        "requiredTitle": "Preenchimento obrigatório",
        "requiredHelp": "O interessado não poderá enviar o formulário sem preencher este campo.",
        "technicalSettings": "Configurações técnicas",
        "technicalHelp": "Normalmente não é necessário alterar esta área.",
        "internalKey": "Identificador interno",
        "internalKeyPlaceholder": "Gerada automaticamente",
        "internalKeyHelp": "O PHANYX utiliza este identificador internamente. Evite alterá-lo depois de o formulário começar a receber respostas.",
        "customQuestionPlaceholder": "Ex.: Como podemos ajudar?",
        "fillHere": "Preencha aqui",
        "noUnits": "Não existem unidades ativas disponíveis neste momento.",
        "adding": "Adicionando..."
      },
      "defaults": {
        "name": {
          "label": "Nome completo",
          "placeholder": "Introduza o seu nome completo"
        },
        "email": {
          "help": "Indique um endereço de e-mail válido para receber o nosso contacto."
        },
        "phone": {
          "placeholder": "+351 912 345 678",
          "help": "Indique o seu número de telefone com indicativo."
        },
        "organization": {
          "placeholder": "Introduza o nome da instituição ou empresa"
        },
        "role": {
          "placeholder": "Ex.: Diretor, coordenador, professor"
        },
        "interest": {
          "label": "O que você procura?",
          "placeholder": "Indique brevemente o que procura"
        },
        "notes": {
          "label": "Mensagem ou observações",
          "placeholder": "Escreva aqui se pretender acrescentar alguma informação"
        },
        "course": {
          "placeholder": "Selecione um curso",
          "help": "Escolha o curso sobre o qual pretende receber informações."
        },
        "unit": {
          "label": "Onde prefere estudar?",
          "placeholder": "Selecione uma unidade",
          "help": "Escolha a unidade ou polo da sua preferência."
        },
        "consent": {
          "label": "Li e concordo com a Política de Privacidade",
          "help": "O consentimento é necessário para o tratamento dos dados informados."
        }
      }
    },
    "protection": {
      "title": "Proteção de dados",
      "description": "Defina como o interessado será informado sobre a utilização dos dados enviados.",
      "configured": "✓ Configurado",
      "needsReview": "Necessita de revisão",
      "loading": "A carregar proteção de dados...",
      "requireConsent": {
        "title": "Pedir autorização para utilizar os dados e entrar em contacto",
        "description": "O interessado terá de assinalar uma opção de concordância antes de enviar o formulário."
      },
      "preview": {
        "title": "Como será apresentado ao interessado",
        "privacyAvailable": "Política de Privacidade disponível para consulta"
      },
      "consentMessage": {
        "label": "Mensagem de autorização",
        "help": "O PHANYX já preparou uma mensagem inicial. Altere-a apenas se a instituição necessitar de outro texto."
      },
      "privacyUrl": {
        "label": "Link da Política de Privacidade",
        "help": "Se a instituição tiver uma página de privacidade, indique o endereço aqui."
      },
      "auditNotice": "Quando o interessado enviar o formulário, o PHANYX guardará a autorização juntamente com o envio.",
      "disabledNotice": "A autorização não será apresentada ao interessado. Desative esta opção apenas quando a instituição já tiver definido internamente como fará o tratamento destes dados.",
      "archivedNotice": "Este formulário está arquivado e já não pode ser alterado.",
      "save": "Guardar proteção de dados",
      "errors": {
        "invalidForm": "Formulário inválido.",
        "load": "Não foi possível carregar a proteção de dados.",
        "save": "Não foi possível guardar a proteção de dados."
      },
      "validation": {
        "consentText": "Indique a mensagem de autorização que será apresentada ao interessado."
      },
      "success": {
        "saved": "Proteção de dados atualizada com sucesso."
      }
    },
    "preview": {
      "loading": "A carregar pré-visualização...",
      "errors": {
        "invalidForm": "Formulário inválido.",
        "load": "Não foi possível carregar a pré-visualização.",
        "notFound": "Formulário não encontrado."
      },
      "banner": {
        "title": "Pré-visualização",
        "description": "Está a ver como este formulário será apresentado ao interessado. Nenhuma resposta será enviada.",
        "backToConfig": "Voltar à configuração"
      },
      "simulation": {
        "title": "Simulação concluída",
        "notice": "Esta foi apenas uma pré-visualização. Nenhum lead foi criado."
      },
      "defaultSuccess": "Os seus dados foram recebidos com sucesso.",
      "selectOption": "Selecione uma opção",
      "phonePlaceholder": "Introduza o seu telefone",
      "phoneHelp": "Indique o seu número de telefone com indicativo.",
      "defaultConsent": "Autorizo a utilização dos dados indicados neste formulário para atendimento relacionado com o meu interesse.",
      "privacyPolicy": "Consultar Política de Privacidade",
      "submit": "Enviar formulário",
      "footer": "Pré-visualização administrativa — nenhum dado será enviado."
    }
  },
  "en-US": {
    "common": {
      "all": "All",
      "availability": "Availability",
      "back": "Back",
      "backToLeadGenerationCenter": "← Lead Generation Center",
      "campaign": "Campaign",
      "cancel": "Cancel",
      "channel": "Channel",
      "clear": "Clear",
      "close": "Close",
      "creating": "Creating...",
      "description": "Description",
      "edit": "Edit",
      "filter": "Filter",
      "optional": "Optional",
      "refresh": "↻ Refresh",
      "refreshing": "Refreshing...",
      "saveChanges": "Save changes",
      "saving": "Saving...",
      "search": "Search",
      "status": "Status",
      "tryAgain": "Try again"
    },
    "shared": {
      "required": "Required",
      "statuses": {
        "activePlural": "Active",
        "archived": "Archived",
        "draft": "Draft",
        "inactive": "Inactive",
        "inactivePlural": "Inactive",
        "paused": "Paused",
        "published": "Published"
      },
      "widths": {
        "custom": "Custom size",
        "full": "Full row",
        "half": "Half row",
        "quarter": "Quarter row",
        "third": "One third"
      },
      "fieldTypes": {
        "shortText": "Short text",
        "longText": "Long text",
        "email": "Email",
        "phone": "Phone / WhatsApp",
        "number": "Number",
        "date": "Date",
        "singleSelect": "Single selection",
        "multiSelect": "Multiple selection",
        "checkbox": "Checkbox",
        "consent": "Consent",
        "hidden": "Hidden field"
      },
      "mappings": {
        "name": "Prospect name",
        "email": "Email",
        "phone": "Phone / WhatsApp",
        "organization": "Institution / company",
        "role": "Role / position",
        "interest": "Interest",
        "notes": "Notes",
        "courseInterest": "Course of interest",
        "unitInterest": "Campus of interest",
        "consent": "Privacy consent",
        "custom": "Custom field"
      }
    },
    "list": {
      "header": {
        "title": "Lead capture forms",
        "description": "Create public forms to receive prospects and automatically route them into the sales process.",
        "newForm": "+ New form"
      },
      "summary": {
        "total": "Total",
        "published": "Published",
        "drafts": "Drafts",
        "paused": "Paused"
      },
      "filters": {
        "searchPlaceholder": "Name, title, or identifier"
      },
      "registered": {
        "title": "Registered forms",
        "results": "{count, plural, =0 {No results in this search.} one {# result in this search.} other {# results in this search.}}"
      },
      "empty": {
        "title": "No forms found",
        "description": "Create the first lead capture form or change the filters.",
        "create": "+ Create form"
      },
      "item": {
        "configure": "Configure form",
        "internalName": "Internal name",
        "noChannel": "No channel",
        "noCampaign": "No campaign",
        "identifier": "Identifier",
        "version": "Version",
        "lgpdRequired": "Privacy consent required",
        "lgpdNotRequired": "Privacy consent not required",
        "updatedAt": "Updated at",
        "counters": {
          "fields": "Fields",
          "submissions": "Submissions",
          "rules": "Rules",
          "integrations": "Integrations"
        }
      },
      "loadError": {
        "title": "Could not load forms"
      },
      "errors": {
        "load": "Could not load lead capture forms.",
        "create": "Could not create the form."
      },
      "validation": {
        "internalName": "Enter the internal name of the form.",
        "publicTitle": "Enter the title that will be shown to the prospect."
      },
      "success": {
        "createdDraft": "Form created as a draft."
      },
      "modal": {
        "title": "New lead capture form",
        "description": "Start with the basic information. The form will be saved as a draft.",
        "draftNoticePrefix": "This form will be created as",
        "draftNoticeSuffix": ". Next, you can configure fields, privacy, automations, and publishing.",
        "internalName": "Internal name",
        "internalNameHelp": "Name used by your team to identify the form.",
        "internalNamePlaceholder": "Example: 2027 Admissions Form",
        "publicTitle": "Title shown to the prospect",
        "publicTitleHelp": "This is the title the person will see when opening the form.",
        "publicTitlePlaceholder": "Example: Apply for 2027 Admissions",
        "noSpecificChannel": "No specific channel",
        "noSpecificCampaign": "No specific campaign",
        "identifier": "Identifier",
        "identifierPlaceholder": "Optional — generated from the name",
        "identifierHelp": "If left blank, PHANYX generates it automatically.",
        "descriptionPlaceholder": "Briefly explain the purpose of this form.",
        "createDraft": "Create draft"
      }
    },
    "config": {
      "header": {
        "back": "← Lead capture forms",
        "title": "Configure form",
        "version": "Version"
      },
      "actions": {
        "preview": "Preview",
        "publish": "Publish form",
        "openPublic": "Open form",
        "copyLink": "Copy link",
        "addField": "Add field"
      },
      "summary": {
        "total": "Total fields",
        "active": "Active fields",
        "required": "Required"
      },
      "fields": {
        "title": "Form fields",
        "description": "Fields are shown to the prospect in the order below.",
        "emptyTitle": "No fields configured",
        "emptyDescription": "Add the fields the prospect should complete.",
        "addFirst": "Add first field",
        "moveUp": "Move up",
        "moveDown": "Move down",
        "moveUpAria": "Move {name} up",
        "moveDownAria": "Move {name} down"
      },
      "loadError": {
        "title": "Could not open the form"
      },
      "errors": {
        "invalidForm": "Invalid form.",
        "loadFields": "Could not load the fields.",
        "publish": "Could not publish the form.",
        "copyLink": "Could not copy the link. Try again.",
        "reorder": "Could not change the field order.",
        "saveField": "Could not save the field.",
        "addField": "Could not add the field."
      },
      "success": {
        "published": "Form published successfully.",
        "linkCopied": "Form link copied.",
        "reordered": "Field order updated.",
        "fieldUpdated": "Field updated successfully.",
        "fieldAdded": "Field added successfully."
      },
      "publish": {
        "title": "Publish form?",
        "description": "After publishing, anyone with the link will be able to fill out and submit the form.",
        "reviewItems": "Before publishing, review the items below.",
        "publishing": "Publishing...",
        "publishNow": "Publish now"
      },
      "validation": {
        "fieldLabel": "Enter the label shown for this field.",
        "optionRequired": "Enter at least one option for this field."
      },
      "fieldModal": {
        "editTitle": "Edit field",
        "addTitle": "Add field",
        "editDescription": "Adjust how this information will be requested from the prospect.",
        "addDescription": "Define what the prospect should provide.",
        "mappingLabel": "What information do you want to ask for?",
        "mappingHelp": "Choose the information you want to request. PHANYX automatically configures how it will be used.",
        "previewTitle": "How it will appear to the prospect",
        "previewHelp": "PHANYX prepared this field automatically.",
        "autoUnit": "Unit selected automatically",
        "previewNotSaved": "Preview only. The selection made here will not be saved.",
        "customizeAppearance": "Customize appearance",
        "displayLabel": "Question or displayed label",
        "width": "Width on screen",
        "placeholderLabel": "Example shown in the field",
        "placeholderHelp": "Example to help with completion",
        "helpLabel": "Guidance for the person filling it out",
        "answerType": "What type of answer do you want to receive?",
        "autoListTitle": "List updated automatically",
        "autoCourseDescription": "PHANYX will automatically show the institution's active courses. You do not need to enter the options manually.",
        "autoUnitDescription": "PHANYX will automatically check the available units. If there is only one, it will be selected without asking the prospect. If there are several, the form will show the options to choose from.",
        "options": "Options",
        "optionsHelp": "Enter one option per line.",
        "optionsPlaceholder": "Option 1\nOption 2\nOption 3",
        "requiredTitle": "Required field",
        "requiredHelp": "The prospect will not be able to submit the form without completing this field.",
        "technicalSettings": "Technical settings",
        "technicalHelp": "This area normally does not need to be changed.",
        "internalKey": "Internal identifier",
        "internalKeyPlaceholder": "Generated automatically",
        "internalKeyHelp": "PHANYX uses this identifier internally. Avoid changing it after the form starts receiving responses.",
        "customQuestionPlaceholder": "Example: How can we help?",
        "fillHere": "Fill in here",
        "noUnits": "No active units are currently available.",
        "adding": "Adding..."
      },
      "defaults": {
        "name": {
          "label": "Full name",
          "placeholder": "Enter your full name"
        },
        "email": {
          "help": "Enter a valid email address so we can contact you."
        },
        "phone": {
          "placeholder": "+1 555 123 4567",
          "help": "Enter your phone number including area code."
        },
        "organization": {
          "placeholder": "Enter the institution or company name"
        },
        "role": {
          "placeholder": "Example: Director, coordinator, teacher"
        },
        "interest": {
          "label": "What are you looking for?",
          "placeholder": "Briefly tell us what you are looking for"
        },
        "notes": {
          "label": "Message or notes",
          "placeholder": "Add any other information here"
        },
        "course": {
          "placeholder": "Select a course",
          "help": "Choose the course you would like information about."
        },
        "unit": {
          "label": "Where would you prefer to study?",
          "placeholder": "Select a unit",
          "help": "Choose your preferred unit or campus."
        },
        "consent": {
          "label": "I have read and agree to the Privacy Policy",
          "help": "Consent is required to process the information provided."
        }
      }
    },
    "protection": {
      "title": "Data protection",
      "description": "Define how prospects will be informed about the use of the data they submit.",
      "configured": "✓ Configured",
      "needsReview": "Needs review",
      "loading": "Loading data protection...",
      "requireConsent": {
        "title": "Request permission to use the data and make contact",
        "description": "The prospect must check a consent option before submitting the form."
      },
      "preview": {
        "title": "How it will appear to the prospect",
        "privacyAvailable": "Privacy Policy available for review"
      },
      "consentMessage": {
        "label": "Consent message",
        "help": "PHANYX has prepared an initial message. Change it only if the institution needs different wording."
      },
      "privacyUrl": {
        "label": "Privacy Policy link",
        "help": "If the institution has a privacy page, enter its address here."
      },
      "auditNotice": "When the prospect submits the form, PHANYX will store the consent together with the submission.",
      "disabledNotice": "The consent request will not be shown to the prospect. Disable this option only when the institution has already defined internally how these data will be processed.",
      "archivedNotice": "This form is archived and can no longer be changed.",
      "save": "Save data protection",
      "errors": {
        "invalidForm": "Invalid form.",
        "load": "Could not load data protection settings.",
        "save": "Could not save data protection settings."
      },
      "validation": {
        "consentText": "Enter the consent message that will be shown to the prospect."
      },
      "success": {
        "saved": "Data protection settings updated successfully."
      }
    },
    "preview": {
      "loading": "Loading preview...",
      "errors": {
        "invalidForm": "Invalid form.",
        "load": "Could not load the preview.",
        "notFound": "Form not found."
      },
      "banner": {
        "title": "Preview",
        "description": "You are seeing how this form will appear to the prospect. No response will be submitted.",
        "backToConfig": "Back to configuration"
      },
      "simulation": {
        "title": "Simulation completed",
        "notice": "This was only a preview. No lead was created."
      },
      "defaultSuccess": "Your information was received successfully.",
      "selectOption": "Select an option",
      "phonePlaceholder": "Enter your phone number",
      "phoneHelp": "Enter your phone number including area code.",
      "defaultConsent": "I authorize the use of the information provided in this form for service related to my interest.",
      "privacyPolicy": "View Privacy Policy",
      "submit": "Submit form",
      "footer": "Administrative preview — no data will be submitted."
    }
  },
  "es-ES": {
    "common": {
      "all": "Todos",
      "availability": "Situación",
      "back": "Volver",
      "backToLeadGenerationCenter": "← Centro de Captación",
      "campaign": "Campaña",
      "cancel": "Cancelar",
      "channel": "Canal",
      "clear": "Limpiar",
      "close": "Cerrar",
      "creating": "Creando...",
      "description": "Descripción",
      "edit": "Editar",
      "filter": "Filtrar",
      "optional": "Opcional",
      "refresh": "↻ Actualizar",
      "refreshing": "Actualizando...",
      "saveChanges": "Guardar cambios",
      "saving": "Guardando...",
      "search": "Buscar",
      "status": "Estado",
      "tryAgain": "Intentar de nuevo"
    },
    "shared": {
      "required": "Obligatorio",
      "statuses": {
        "activePlural": "Activos",
        "archived": "Archivado",
        "draft": "Borrador",
        "inactive": "Inactivo",
        "inactivePlural": "Inactivos",
        "paused": "Pausado",
        "published": "Publicado"
      },
      "widths": {
        "custom": "Tamaño personalizado",
        "full": "Fila completa",
        "half": "Media fila",
        "quarter": "Un cuarto",
        "third": "Un tercio"
      },
      "fieldTypes": {
        "shortText": "Texto corto",
        "longText": "Texto largo",
        "email": "Correo electrónico",
        "phone": "Teléfono / WhatsApp",
        "number": "Número",
        "date": "Fecha",
        "singleSelect": "Selección única",
        "multiSelect": "Selección múltiple",
        "checkbox": "Casilla de verificación",
        "consent": "Consentimiento",
        "hidden": "Campo oculto"
      },
      "mappings": {
        "name": "Nombre del interesado",
        "email": "Correo electrónico",
        "phone": "Teléfono / WhatsApp",
        "organization": "Institución / empresa",
        "role": "Cargo / función",
        "interest": "Interés",
        "notes": "Observaciones",
        "courseInterest": "Curso de interés",
        "unitInterest": "Sede de interés",
        "consent": "Consentimiento de privacidad",
        "custom": "Campo personalizado"
      }
    },
    "list": {
      "header": {
        "title": "Formularios de captación",
        "description": "Crea formularios públicos para recibir interesados y dirigirlos automáticamente al proceso comercial.",
        "newForm": "+ Nuevo formulario"
      },
      "summary": {
        "total": "Total",
        "published": "Publicados",
        "drafts": "Borradores",
        "paused": "Pausados"
      },
      "filters": {
        "searchPlaceholder": "Nombre, título o identificador"
      },
      "registered": {
        "title": "Formularios registrados",
        "results": "{count, plural, =0 {No hay resultados en esta consulta.} one {# resultado en esta consulta.} other {# resultados en esta consulta.}}"
      },
      "empty": {
        "title": "No se encontraron formularios",
        "description": "Crea el primer formulario de captación o cambia los filtros.",
        "create": "+ Crear formulario"
      },
      "item": {
        "configure": "Configurar formulario",
        "internalName": "Nombre interno",
        "noChannel": "Sin canal",
        "noCampaign": "Sin campaña",
        "identifier": "Identificador",
        "version": "Versión",
        "lgpdRequired": "Consentimiento de privacidad obligatorio",
        "lgpdNotRequired": "Consentimiento de privacidad no obligatorio",
        "updatedAt": "Actualizado el",
        "counters": {
          "fields": "Campos",
          "submissions": "Envíos",
          "rules": "Reglas",
          "integrations": "Integraciones"
        }
      },
      "loadError": {
        "title": "No se pudieron cargar los formularios"
      },
      "errors": {
        "load": "No se pudieron cargar los formularios de captación.",
        "create": "No se pudo crear el formulario."
      },
      "validation": {
        "internalName": "Indica el nombre interno del formulario.",
        "publicTitle": "Indica el título que se mostrará al interesado."
      },
      "success": {
        "createdDraft": "Formulario creado como borrador."
      },
      "modal": {
        "title": "Nuevo formulario de captación",
        "description": "Empieza por la información básica. El formulario se guardará como borrador.",
        "draftNoticePrefix": "Este formulario se creará como",
        "draftNoticeSuffix": ". Después podrás configurar campos, privacidad, automatizaciones y publicación.",
        "internalName": "Nombre interno",
        "internalNameHelp": "Nombre que utiliza el equipo para identificar el formulario.",
        "internalNamePlaceholder": "Ej.: Formulario Admisiones 2027",
        "publicTitle": "Título mostrado al interesado",
        "publicTitleHelp": "Este es el título que la persona verá al abrir el formulario.",
        "publicTitlePlaceholder": "Ej.: Inscríbete en Admisiones 2027",
        "noSpecificChannel": "Sin canal específico",
        "noSpecificCampaign": "Sin campaña específica",
        "identifier": "Identificador",
        "identifierPlaceholder": "Opcional — generado a partir del nombre",
        "identifierHelp": "Si se deja vacío, PHANYX lo genera automáticamente.",
        "descriptionPlaceholder": "Explica brevemente el objetivo de este formulario.",
        "createDraft": "Crear borrador"
      }
    },
    "config": {
      "header": {
        "back": "← Formularios de captación",
        "title": "Configurar formulario",
        "version": "Versión"
      },
      "actions": {
        "preview": "Vista previa",
        "publish": "Publicar formulario",
        "openPublic": "Abrir formulario",
        "copyLink": "Copiar enlace",
        "addField": "Añadir campo"
      },
      "summary": {
        "total": "Total de campos",
        "active": "Campos activos",
        "required": "Obligatorios"
      },
      "fields": {
        "title": "Campos del formulario",
        "description": "Los campos aparecen al interesado en el orden indicado abajo.",
        "emptyTitle": "No hay campos configurados",
        "emptyDescription": "Añade los campos que el interesado deberá completar.",
        "addFirst": "Añadir primer campo",
        "moveUp": "Mover arriba",
        "moveDown": "Mover abajo",
        "moveUpAria": "Mover {name} hacia arriba",
        "moveDownAria": "Mover {name} hacia abajo"
      },
      "loadError": {
        "title": "No se pudo abrir el formulario"
      },
      "errors": {
        "invalidForm": "Formulario no válido.",
        "loadFields": "No se pudieron cargar los campos.",
        "publish": "No se pudo publicar el formulario.",
        "copyLink": "No se pudo copiar el enlace. Inténtalo de nuevo.",
        "reorder": "No se pudo cambiar el orden de los campos.",
        "saveField": "No se pudo guardar el campo.",
        "addField": "No se pudo añadir el campo."
      },
      "success": {
        "published": "Formulario publicado correctamente.",
        "linkCopied": "Enlace del formulario copiado.",
        "reordered": "Orden de los campos actualizado.",
        "fieldUpdated": "Campo actualizado correctamente.",
        "fieldAdded": "Campo añadido correctamente."
      },
      "publish": {
        "title": "¿Publicar formulario?",
        "description": "Después de publicarlo, las personas con el enlace podrán completar y enviar sus datos.",
        "reviewItems": "Antes de publicar, revisa los elementos siguientes.",
        "publishing": "Publicando...",
        "publishNow": "Publicar ahora"
      },
      "validation": {
        "fieldLabel": "Indica el nombre mostrado para este campo.",
        "optionRequired": "Indica al menos una opción para este campo."
      },
      "fieldModal": {
        "editTitle": "Editar campo",
        "addTitle": "Añadir campo",
        "editDescription": "Ajusta cómo se solicitará esta información al interesado.",
        "addDescription": "Define qué deberá informar el interesado.",
        "mappingLabel": "¿Qué información quieres solicitar?",
        "mappingHelp": "Elige la información que quieres solicitar. PHANYX configura automáticamente cómo se utilizará.",
        "previewTitle": "Cómo aparecerá al interesado",
        "previewHelp": "PHANYX ha preparado este campo automáticamente.",
        "autoUnit": "Unidad seleccionada automáticamente",
        "previewNotSaved": "Vista previa. La selección realizada aquí no se guardará.",
        "customizeAppearance": "Personalizar apariencia",
        "displayLabel": "Pregunta o nombre mostrado",
        "width": "Tamaño en pantalla",
        "placeholderLabel": "Ejemplo mostrado en el campo",
        "placeholderHelp": "Ejemplo para ayudar a completar el campo",
        "helpLabel": "Orientación para quien lo complete",
        "answerType": "¿Qué tipo de respuesta quieres recibir?",
        "autoListTitle": "Lista actualizada automáticamente",
        "autoCourseDescription": "PHANYX mostrará automáticamente los cursos activos de la institución. No necesitas registrar las opciones manualmente.",
        "autoUnitDescription": "PHANYX comprobará automáticamente las unidades disponibles. Si solo hay una, se seleccionará sin preguntar al interesado. Si hay varias, el formulario mostrará las opciones para elegir.",
        "options": "Opciones",
        "optionsHelp": "Escribe una opción por línea.",
        "optionsPlaceholder": "Opción 1\nOpción 2\nOpción 3",
        "requiredTitle": "Campo obligatorio",
        "requiredHelp": "El interesado no podrá enviar el formulario sin completar este campo.",
        "technicalSettings": "Configuración técnica",
        "technicalHelp": "Normalmente no es necesario modificar esta área.",
        "internalKey": "Identificador interno",
        "internalKeyPlaceholder": "Generado automáticamente",
        "internalKeyHelp": "PHANYX utiliza este identificador internamente. Evita cambiarlo después de que el formulario empiece a recibir respuestas.",
        "customQuestionPlaceholder": "Ej.: ¿Cómo podemos ayudarte?",
        "fillHere": "Completa aquí",
        "noUnits": "No hay unidades activas disponibles en este momento.",
        "adding": "Añadiendo..."
      },
      "defaults": {
        "name": {
          "label": "Nombre completo",
          "placeholder": "Escribe tu nombre completo"
        },
        "email": {
          "help": "Indica un correo electrónico válido para que podamos contactarte."
        },
        "phone": {
          "placeholder": "+34 612 345 678",
          "help": "Indica tu número de teléfono con prefijo."
        },
        "organization": {
          "placeholder": "Escribe el nombre de la institución o empresa"
        },
        "role": {
          "placeholder": "Ej.: Director, coordinador, profesor"
        },
        "interest": {
          "label": "¿Qué estás buscando?",
          "placeholder": "Cuéntanos brevemente qué estás buscando"
        },
        "notes": {
          "label": "Mensaje u observaciones",
          "placeholder": "Escribe aquí cualquier información adicional"
        },
        "course": {
          "placeholder": "Selecciona un curso",
          "help": "Elige el curso sobre el que deseas recibir información."
        },
        "unit": {
          "label": "¿Dónde prefieres estudiar?",
          "placeholder": "Selecciona una unidad",
          "help": "Elige la unidad o sede de tu preferencia."
        },
        "consent": {
          "label": "He leído y acepto la Política de Privacidad",
          "help": "El consentimiento es necesario para tratar los datos proporcionados."
        }
      }
    },
    "protection": {
      "title": "Protección de datos",
      "description": "Define cómo se informará al interesado sobre el uso de los datos enviados.",
      "configured": "✓ Configurado",
      "needsReview": "Necesita revisión",
      "loading": "Cargando protección de datos...",
      "requireConsent": {
        "title": "Solicitar autorización para usar los datos y ponerse en contacto",
        "description": "El interesado deberá marcar una opción de consentimiento antes de enviar el formulario."
      },
      "preview": {
        "title": "Cómo aparecerá al interesado",
        "privacyAvailable": "Política de Privacidad disponible para consulta"
      },
      "consentMessage": {
        "label": "Mensaje de autorización",
        "help": "PHANYX ya ha preparado un mensaje inicial. Cámbialo solo si la institución necesita otro texto."
      },
      "privacyUrl": {
        "label": "Enlace de la Política de Privacidad",
        "help": "Si la institución dispone de una página de privacidad, indica aquí su dirección."
      },
      "auditNotice": "Cuando el interesado envíe el formulario, PHANYX guardará la autorización junto con el envío.",
      "disabledNotice": "La autorización no se mostrará al interesado. Desactiva esta opción solo cuando la institución ya haya definido internamente cómo tratará estos datos.",
      "archivedNotice": "Este formulario está archivado y ya no se puede modificar.",
      "save": "Guardar protección de datos",
      "errors": {
        "invalidForm": "Formulario no válido.",
        "load": "No se pudo cargar la protección de datos.",
        "save": "No se pudo guardar la protección de datos."
      },
      "validation": {
        "consentText": "Indica el mensaje de autorización que se mostrará al interesado."
      },
      "success": {
        "saved": "Protección de datos actualizada correctamente."
      }
    },
    "preview": {
      "loading": "Cargando vista previa...",
      "errors": {
        "invalidForm": "Formulario no válido.",
        "load": "No se pudo cargar la vista previa.",
        "notFound": "Formulario no encontrado."
      },
      "banner": {
        "title": "Vista previa",
        "description": "Estás viendo cómo aparecerá este formulario al interesado. No se enviará ninguna respuesta.",
        "backToConfig": "Volver a la configuración"
      },
      "simulation": {
        "title": "Simulación completada",
        "notice": "Esto ha sido solo una vista previa. No se ha creado ningún lead."
      },
      "defaultSuccess": "Tus datos se han recibido correctamente.",
      "selectOption": "Selecciona una opción",
      "phonePlaceholder": "Introduce tu teléfono",
      "phoneHelp": "Indica tu número de teléfono con prefijo.",
      "defaultConsent": "Autorizo el uso de los datos proporcionados en este formulario para atender asuntos relacionados con mi interés.",
      "privacyPolicy": "Consultar Política de Privacidad",
      "submit": "Enviar formulario",
      "footer": "Vista previa administrativa — no se enviará ningún dato."
    }
  },
  "fr-FR": {
    "common": {
      "all": "Tous",
      "availability": "Situation",
      "back": "Retour",
      "backToLeadGenerationCenter": "← Centre d’acquisition",
      "campaign": "Campagne",
      "cancel": "Annuler",
      "channel": "Canal",
      "clear": "Effacer",
      "close": "Fermer",
      "creating": "Création...",
      "description": "Description",
      "edit": "Modifier",
      "filter": "Filtrer",
      "optional": "Facultatif",
      "refresh": "↻ Actualiser",
      "refreshing": "Actualisation...",
      "saveChanges": "Enregistrer les modifications",
      "saving": "Enregistrement...",
      "search": "Rechercher",
      "status": "Statut",
      "tryAgain": "Réessayer"
    },
    "shared": {
      "required": "Obligatoire",
      "statuses": {
        "activePlural": "Actifs",
        "archived": "Archivé",
        "draft": "Brouillon",
        "inactive": "Inactif",
        "inactivePlural": "Inactifs",
        "paused": "En pause",
        "published": "Publié"
      },
      "widths": {
        "custom": "Taille personnalisée",
        "full": "Ligne entière",
        "half": "Demi-ligne",
        "quarter": "Un quart",
        "third": "Un tiers"
      },
      "fieldTypes": {
        "shortText": "Texte court",
        "longText": "Texte long",
        "email": "E-mail",
        "phone": "Téléphone / WhatsApp",
        "number": "Nombre",
        "date": "Date",
        "singleSelect": "Sélection unique",
        "multiSelect": "Sélection multiple",
        "checkbox": "Case à cocher",
        "consent": "Consentement",
        "hidden": "Champ masqué"
      },
      "mappings": {
        "name": "Nom du prospect",
        "email": "E-mail",
        "phone": "Téléphone / WhatsApp",
        "organization": "Établissement / entreprise",
        "role": "Poste / fonction",
        "interest": "Intérêt",
        "notes": "Observations",
        "courseInterest": "Formation d’intérêt",
        "unitInterest": "Site d’intérêt",
        "consent": "Consentement de confidentialité",
        "custom": "Champ personnalisé"
      }
    },
    "list": {
      "header": {
        "title": "Formulaires d’acquisition",
        "description": "Créez des formulaires publics pour recevoir des prospects et les orienter automatiquement vers le processus commercial.",
        "newForm": "+ Nouveau formulaire"
      },
      "summary": {
        "total": "Total",
        "published": "Publiés",
        "drafts": "Brouillons",
        "paused": "En pause"
      },
      "filters": {
        "searchPlaceholder": "Nom, titre ou identifiant"
      },
      "registered": {
        "title": "Formulaires enregistrés",
        "results": "{count, plural, =0 {Aucun résultat dans cette recherche.} one {# résultat dans cette recherche.} other {# résultats dans cette recherche.}}"
      },
      "empty": {
        "title": "Aucun formulaire trouvé",
        "description": "Créez le premier formulaire d’acquisition ou modifiez les filtres.",
        "create": "+ Créer un formulaire"
      },
      "item": {
        "configure": "Configurer le formulaire",
        "internalName": "Nom interne",
        "noChannel": "Aucun canal",
        "noCampaign": "Aucune campagne",
        "identifier": "Identifiant",
        "version": "Version",
        "lgpdRequired": "Consentement de confidentialité requis",
        "lgpdNotRequired": "Consentement de confidentialité non requis",
        "updatedAt": "Mis à jour le",
        "counters": {
          "fields": "Champs",
          "submissions": "Soumissions",
          "rules": "Règles",
          "integrations": "Intégrations"
        }
      },
      "loadError": {
        "title": "Impossible de charger les formulaires"
      },
      "errors": {
        "load": "Impossible de charger les formulaires d’acquisition.",
        "create": "Impossible de créer le formulaire."
      },
      "validation": {
        "internalName": "Saisissez le nom interne du formulaire.",
        "publicTitle": "Saisissez le titre qui sera affiché au prospect."
      },
      "success": {
        "createdDraft": "Formulaire créé comme brouillon."
      },
      "modal": {
        "title": "Nouveau formulaire d’acquisition",
        "description": "Commencez par les informations de base. Le formulaire sera enregistré comme brouillon.",
        "draftNoticePrefix": "Ce formulaire sera créé comme",
        "draftNoticeSuffix": ". Vous pourrez ensuite configurer les champs, la confidentialité, les automatisations et la publication.",
        "internalName": "Nom interne",
        "internalNameHelp": "Nom utilisé par l’équipe pour identifier le formulaire.",
        "internalNamePlaceholder": "Ex. : Formulaire Admissions 2027",
        "publicTitle": "Titre affiché au prospect",
        "publicTitleHelp": "Il s’agit du titre que la personne verra à l’ouverture du formulaire.",
        "publicTitlePlaceholder": "Ex. : Inscrivez-vous aux Admissions 2027",
        "noSpecificChannel": "Aucun canal spécifique",
        "noSpecificCampaign": "Aucune campagne spécifique",
        "identifier": "Identifiant",
        "identifierPlaceholder": "Facultatif — généré à partir du nom",
        "identifierHelp": "S’il est laissé vide, PHANYX le génère automatiquement.",
        "descriptionPlaceholder": "Expliquez brièvement l’objectif de ce formulaire.",
        "createDraft": "Créer le brouillon"
      }
    },
    "config": {
      "header": {
        "back": "← Formulaires d’acquisition",
        "title": "Configurer le formulaire",
        "version": "Version"
      },
      "actions": {
        "preview": "Prévisualiser",
        "publish": "Publier le formulaire",
        "openPublic": "Ouvrir le formulaire",
        "copyLink": "Copier le lien",
        "addField": "Ajouter un champ"
      },
      "summary": {
        "total": "Nombre total de champs",
        "active": "Champs actifs",
        "required": "Obligatoires"
      },
      "fields": {
        "title": "Champs du formulaire",
        "description": "Les champs sont présentés au prospect dans l’ordre ci-dessous.",
        "emptyTitle": "Aucun champ configuré",
        "emptyDescription": "Ajoutez les champs que le prospect devra renseigner.",
        "addFirst": "Ajouter le premier champ",
        "moveUp": "Monter",
        "moveDown": "Descendre",
        "moveUpAria": "Déplacer {name} vers le haut",
        "moveDownAria": "Déplacer {name} vers le bas"
      },
      "loadError": {
        "title": "Impossible d’ouvrir le formulaire"
      },
      "errors": {
        "invalidForm": "Formulaire non valide.",
        "loadFields": "Impossible de charger les champs.",
        "publish": "Impossible de publier le formulaire.",
        "copyLink": "Impossible de copier le lien. Réessayez.",
        "reorder": "Impossible de modifier l’ordre des champs.",
        "saveField": "Impossible d’enregistrer le champ.",
        "addField": "Impossible d’ajouter le champ."
      },
      "success": {
        "published": "Formulaire publié avec succès.",
        "linkCopied": "Lien du formulaire copié.",
        "reordered": "Ordre des champs mis à jour.",
        "fieldUpdated": "Champ mis à jour avec succès.",
        "fieldAdded": "Champ ajouté avec succès."
      },
      "publish": {
        "title": "Publier le formulaire ?",
        "description": "Après publication, les personnes disposant du lien pourront remplir et envoyer leurs données.",
        "reviewItems": "Avant de publier, vérifiez les éléments ci-dessous.",
        "publishing": "Publication...",
        "publishNow": "Publier maintenant"
      },
      "validation": {
        "fieldLabel": "Saisissez le nom affiché pour ce champ.",
        "optionRequired": "Saisissez au moins une option pour ce champ."
      },
      "fieldModal": {
        "editTitle": "Modifier le champ",
        "addTitle": "Ajouter un champ",
        "editDescription": "Ajustez la manière dont cette information sera demandée au prospect.",
        "addDescription": "Définissez ce que le prospect devra renseigner.",
        "mappingLabel": "Quelle information souhaitez-vous demander ?",
        "mappingHelp": "Choisissez l’information à demander. PHANYX configure automatiquement son utilisation.",
        "previewTitle": "Comment cela apparaîtra au prospect",
        "previewHelp": "PHANYX a préparé ce champ automatiquement.",
        "autoUnit": "Unité sélectionnée automatiquement",
        "previewNotSaved": "Prévisualisation uniquement. Le choix effectué ici ne sera pas enregistré.",
        "customizeAppearance": "Personnaliser l’affichage",
        "displayLabel": "Question ou libellé affiché",
        "width": "Largeur à l’écran",
        "placeholderLabel": "Exemple affiché dans le champ",
        "placeholderHelp": "Exemple pour aider à la saisie",
        "helpLabel": "Indication pour la personne qui remplit le formulaire",
        "answerType": "Quel type de réponse souhaitez-vous recevoir ?",
        "autoListTitle": "Liste mise à jour automatiquement",
        "autoCourseDescription": "PHANYX affichera automatiquement les formations actives de l’établissement. Vous n’avez pas besoin de saisir les options manuellement.",
        "autoUnitDescription": "PHANYX vérifiera automatiquement les unités disponibles. S’il n’y en a qu’une, elle sera sélectionnée sans question supplémentaire. S’il y en a plusieurs, le formulaire affichera les options disponibles.",
        "options": "Options",
        "optionsHelp": "Saisissez une option par ligne.",
        "optionsPlaceholder": "Option 1\nOption 2\nOption 3",
        "requiredTitle": "Champ obligatoire",
        "requiredHelp": "Le prospect ne pourra pas envoyer le formulaire sans remplir ce champ.",
        "technicalSettings": "Paramètres techniques",
        "technicalHelp": "Cette zone ne nécessite généralement aucune modification.",
        "internalKey": "Identifiant interne",
        "internalKeyPlaceholder": "Généré automatiquement",
        "internalKeyHelp": "PHANYX utilise cet identifiant en interne. Évitez de le modifier une fois que le formulaire commence à recevoir des réponses.",
        "customQuestionPlaceholder": "Ex. : Comment pouvons-nous vous aider ?",
        "fillHere": "Renseignez ici",
        "noUnits": "Aucune unité active n’est disponible pour le moment.",
        "adding": "Ajout..."
      },
      "defaults": {
        "name": {
          "label": "Nom complet",
          "placeholder": "Saisissez votre nom complet"
        },
        "email": {
          "help": "Saisissez une adresse e-mail valide afin que nous puissions vous contacter."
        },
        "phone": {
          "placeholder": "+33 6 12 34 56 78",
          "help": "Saisissez votre numéro de téléphone avec l’indicatif."
        },
        "organization": {
          "placeholder": "Saisissez le nom de l’établissement ou de l’entreprise"
        },
        "role": {
          "placeholder": "Ex. : Directeur, coordinateur, enseignant"
        },
        "interest": {
          "label": "Que recherchez-vous ?",
          "placeholder": "Indiquez brièvement ce que vous recherchez"
        },
        "notes": {
          "label": "Message ou observations",
          "placeholder": "Ajoutez ici toute information complémentaire"
        },
        "course": {
          "placeholder": "Sélectionnez une formation",
          "help": "Choisissez la formation sur laquelle vous souhaitez recevoir des informations."
        },
        "unit": {
          "label": "Où préférez-vous étudier ?",
          "placeholder": "Sélectionnez une unité",
          "help": "Choisissez l’unité ou le site de votre choix."
        },
        "consent": {
          "label": "J’ai lu et j’accepte la Politique de confidentialité",
          "help": "Le consentement est requis pour traiter les données fournies."
        }
      }
    },
    "protection": {
      "title": "Protection des données",
      "description": "Définissez comment le prospect sera informé de l’utilisation des données envoyées.",
      "configured": "✓ Configuré",
      "needsReview": "À vérifier",
      "loading": "Chargement de la protection des données...",
      "requireConsent": {
        "title": "Demander l’autorisation d’utiliser les données et de prendre contact",
        "description": "Le prospect devra cocher une option de consentement avant d’envoyer le formulaire."
      },
      "preview": {
        "title": "Comment cela apparaîtra au prospect",
        "privacyAvailable": "Politique de confidentialité disponible à la consultation"
      },
      "consentMessage": {
        "label": "Message de consentement",
        "help": "PHANYX a préparé un message initial. Modifiez-le uniquement si l’établissement a besoin d’un autre texte."
      },
      "privacyUrl": {
        "label": "Lien vers la Politique de confidentialité",
        "help": "Si l’établissement dispose d’une page de confidentialité, indiquez son adresse ici."
      },
      "auditNotice": "Lorsque le prospect enverra le formulaire, PHANYX enregistrera le consentement avec la soumission.",
      "disabledNotice": "La demande de consentement ne sera pas affichée au prospect. Désactivez cette option uniquement si l’établissement a déjà défini en interne la manière dont ces données seront traitées.",
      "archivedNotice": "Ce formulaire est archivé et ne peut plus être modifié.",
      "save": "Enregistrer la protection des données",
      "errors": {
        "invalidForm": "Formulaire non valide.",
        "load": "Impossible de charger les paramètres de protection des données.",
        "save": "Impossible d’enregistrer les paramètres de protection des données."
      },
      "validation": {
        "consentText": "Saisissez le message de consentement qui sera affiché au prospect."
      },
      "success": {
        "saved": "Protection des données mise à jour avec succès."
      }
    },
    "preview": {
      "loading": "Chargement de la prévisualisation...",
      "errors": {
        "invalidForm": "Formulaire non valide.",
        "load": "Impossible de charger la prévisualisation.",
        "notFound": "Formulaire introuvable."
      },
      "banner": {
        "title": "Prévisualisation",
        "description": "Vous voyez ici comment ce formulaire apparaîtra au prospect. Aucune réponse ne sera envoyée.",
        "backToConfig": "Retour à la configuration"
      },
      "simulation": {
        "title": "Simulation terminée",
        "notice": "Il s’agissait uniquement d’une prévisualisation. Aucun lead n’a été créé."
      },
      "defaultSuccess": "Vos données ont bien été reçues.",
      "selectOption": "Sélectionnez une option",
      "phonePlaceholder": "Saisissez votre numéro de téléphone",
      "phoneHelp": "Saisissez votre numéro de téléphone avec l’indicatif.",
      "defaultConsent": "J’autorise l’utilisation des données fournies dans ce formulaire afin de répondre à ma demande.",
      "privacyPolicy": "Consulter la Politique de confidentialité",
      "submit": "Envoyer le formulaire",
      "footer": "Prévisualisation administrative — aucune donnée ne sera envoyée."
    }
  }
};

for (const [locale, bloco] of Object.entries(traducoes)) {
  const arquivo = path.join(
    process.cwd(),
    "messages",
    `${locale}.json`
  );

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }

  const original = fs.readFileSync(arquivo, "utf8");
  const json = JSON.parse(original);

  const backup = `${arquivo}.bak-admin-commercial-forms`;

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(arquivo, backup);
  }

  json[namespace] = bloco;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}: ${namespace} atualizado`);
}

console.log("\nConcluído. Os cinco arquivos de idioma foram atualizados.");
