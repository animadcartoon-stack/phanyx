import { descriptografarTokenWhatsapp } from "@/lib/whatsapp/crypto";

const META_GRAPH_VERSION =
  process.env.META_GRAPH_VERSION || "v23.0";

type EnviarTemplateWhatsappParams = {
  phoneNumberId: string;
  tokenCriptografado: string;
  telefoneDestino: string;
  templateNome: string;
  idioma?: string;
  componentes?: Array<{
    type: "header" | "body" | "button";
    sub_type?: string;
    index?: string;
    parameters?: Array<Record<string, unknown>>;
  }>;
};

type RespostaMetaWhatsapp = {
  messaging_product?: string;
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id?: string;
    message_status?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export class ErroMetaWhatsapp extends Error {
  statusHttp: number;
  codigoMeta?: number;
  subcodigoMeta?: number;
  tipoMeta?: string;
  fbtraceId?: string;

  constructor(params: {
    message: string;
    statusHttp: number;
    codigoMeta?: number;
    subcodigoMeta?: number;
    tipoMeta?: string;
    fbtraceId?: string;
  }) {
    super(params.message);

    this.name = "ErroMetaWhatsapp";
    this.statusHttp = params.statusHttp;
    this.codigoMeta = params.codigoMeta;
    this.subcodigoMeta = params.subcodigoMeta;
    this.tipoMeta = params.tipoMeta;
    this.fbtraceId = params.fbtraceId;
  }
}

function obterUrlMensagens(phoneNumberId: string) {
  if (!phoneNumberId) {
    throw new Error(
      "phoneNumberId do WhatsApp não informado."
    );
  }

  return `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;
}

export async function enviarTemplateWhatsappMeta(
  params: EnviarTemplateWhatsappParams
): Promise<{
  metaMessageId: string;
  waId?: string;
  statusInicial?: string;
}> {
  const {
    phoneNumberId,
    tokenCriptografado,
    telefoneDestino,
    templateNome,
    idioma = "pt_BR",
    componentes = [],
  } = params;

  if (!telefoneDestino) {
    throw new Error(
      "Telefone de destino do WhatsApp não informado."
    );
  }

  if (!templateNome) {
    throw new Error(
      "Nome do template do WhatsApp não informado."
    );
  }

  const accessToken =
    descriptografarTokenWhatsapp(tokenCriptografado);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: telefoneDestino,
    type: "template",
    template: {
      name: templateNome,
      language: {
        code: idioma,
      },
      ...(componentes.length > 0
        ? {
            components: componentes,
          }
        : {}),
    },
  };

  const response = await fetch(
    obterUrlMensagens(phoneNumberId),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  let data: RespostaMetaWhatsapp;

  try {
    data = (await response.json()) as RespostaMetaWhatsapp;
  } catch {
    throw new ErroMetaWhatsapp({
      message:
        "A Meta retornou uma resposta inválida ao enviar a mensagem.",
      statusHttp: response.status,
    });
  }

  if (!response.ok || data.error) {
    throw new ErroMetaWhatsapp({
      message:
        data.error?.message ||
        "Não foi possível enviar a mensagem pelo WhatsApp.",
      statusHttp: response.status,
      codigoMeta: data.error?.code,
      subcodigoMeta: data.error?.error_subcode,
      tipoMeta: data.error?.type,
      fbtraceId: data.error?.fbtrace_id,
    });
  }

  const metaMessageId = data.messages?.[0]?.id;

  if (!metaMessageId) {
    throw new ErroMetaWhatsapp({
      message:
        "A Meta aceitou a requisição, mas não retornou o ID da mensagem.",
      statusHttp: response.status,
    });
  }

  return {
    metaMessageId,
    waId: data.contacts?.[0]?.wa_id,
    statusInicial:
      data.messages?.[0]?.message_status,
  };
}

type RespostaAssinaturaWabaMeta = {
  success?: boolean | string;

  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function obterUrlAssinaturaWaba(
  whatsappBusinessId: string
) {
  if (!whatsappBusinessId) {
    throw new Error(
      "WhatsApp Business Account ID não informado."
    );
  }

  return `https://graph.facebook.com/${META_GRAPH_VERSION}/${whatsappBusinessId}/subscribed_apps`;
}

export async function assinarWebhookWabaMeta(params: {
  whatsappBusinessId: string;
  tokenCriptografado: string;
}): Promise<{
  sucesso: true;
}> {
  const {
    whatsappBusinessId,
    tokenCriptografado,
  } = params;

  if (!tokenCriptografado) {
    throw new Error(
      "Credencial do WhatsApp não informada."
    );
  }

  const accessToken =
    descriptografarTokenWhatsapp(
      tokenCriptografado
    );

  const response = await fetch(
    obterUrlAssinaturaWaba(
      whatsappBusinessId
    ),
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      cache: "no-store",
    }
  );

  let data: RespostaAssinaturaWabaMeta;

  try {
    data =
      (await response.json()) as RespostaAssinaturaWabaMeta;
  } catch {
    throw new ErroMetaWhatsapp({
      message:
        "A Meta retornou uma resposta inválida ao assinar o webhook da conta WhatsApp Business.",
      statusHttp: response.status,
    });
  }

  if (!response.ok || data.error) {
    throw new ErroMetaWhatsapp({
      message:
        data.error?.message ||
        "Não foi possível assinar o webhook da conta WhatsApp Business.",
      statusHttp: response.status,
      codigoMeta: data.error?.code,
      subcodigoMeta:
        data.error?.error_subcode,
      tipoMeta: data.error?.type,
      fbtraceId:
        data.error?.fbtrace_id,
    });
  }

  const sucesso =
    data.success === true ||
    data.success === "true";

  if (!sucesso) {
    throw new ErroMetaWhatsapp({
      message:
        "A Meta não confirmou a assinatura do webhook da conta WhatsApp Business.",
      statusHttp: response.status,
    });
  }

  return {
    sucesso: true,
  };
}

type TemplateWabaMeta = {
  id: string;
  nome: string;
  idioma: string;
  categoria: string;
  status: string;
};

type RespostaTemplatesWabaMeta = {
  data?: Array<{
    id?: string;
    name?: string;
    language?: string;
    category?: string;
    status?: string;
  }>;

  paging?: {
    cursors?: {
      after?: string;
    };
    next?: string;
  };

  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export async function listarTemplatesWabaMeta(params: {
  whatsappBusinessId: string;
  tokenCriptografado: string;
}): Promise<TemplateWabaMeta[]> {
  const {
    whatsappBusinessId,
    tokenCriptografado,
  } = params;

  if (!whatsappBusinessId) {
    throw new Error(
      "WhatsApp Business Account ID não informado."
    );
  }

  if (!tokenCriptografado) {
    throw new Error(
      "Credencial do WhatsApp não informada."
    );
  }

  const accessToken =
    descriptografarTokenWhatsapp(
      tokenCriptografado
    );

  const templates: TemplateWabaMeta[] = [];
  let cursor: string | null = null;

  do {
    const parametros = new URLSearchParams({
      fields:
        "id,name,language,category,status",
      limit: "100",
    });

    if (cursor) {
      parametros.set("after", cursor);
    }

    const url =
      `https://graph.facebook.com/${META_GRAPH_VERSION}` +
      `/${whatsappBusinessId}/message_templates` +
      `?${parametros.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    let data: RespostaTemplatesWabaMeta;

    try {
      data =
        (await response.json()) as RespostaTemplatesWabaMeta;
    } catch {
      throw new ErroMetaWhatsapp({
        message:
          "A Meta retornou uma resposta inválida ao consultar os templates do WhatsApp.",
        statusHttp: response.status,
      });
    }

    if (!response.ok || data.error) {
      throw new ErroMetaWhatsapp({
        message:
          data.error?.message ||
          "Não foi possível consultar os templates do WhatsApp na Meta.",
        statusHttp: response.status,
        codigoMeta: data.error?.code,
        subcodigoMeta:
          data.error?.error_subcode,
        tipoMeta: data.error?.type,
        fbtraceId:
          data.error?.fbtrace_id,
      });
    }

    for (const template of data.data || []) {
      if (
        !template.id ||
        !template.name ||
        !template.language ||
        !template.status
      ) {
        continue;
      }

      templates.push({
        id: template.id,
        nome: template.name,
        idioma: template.language,
        categoria:
          template.category || "",
        status: template.status,
      });
    }

    cursor =
      data.paging?.cursors?.after || null;
  } while (cursor);

  return templates;
}