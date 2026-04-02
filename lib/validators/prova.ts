import { z } from "zod";

export const createQuestaoSchema = z.object({
  enunciado: z.string().min(1, "Enunciado é obrigatório"),
  pergunta: z.string().trim().optional().or(z.literal("")),
  tipo: z.enum(["MULTIPLA_ESCOLHA", "DISCURSIVA"]),
  valor: z.number().min(0, "Valor não pode ser negativo").optional(),
});

export const createAlternativaSchema = z.object({
  texto: z
    .string()
    .min(1, "Texto da alternativa é obrigatório")
    .trim(),

  correta: z
    .boolean()
    .optional(),
});


export const updateQuestaoSchema = z.object({
  enunciado: z.string().min(1, "Enunciado é obrigatório").optional(),
  pergunta: z.string().trim().optional().or(z.literal("")),
  tipo: z.enum(["MULTIPLA_ESCOLHA", "DISCURSIVA"]).optional(),
  valor: z.number().min(0, "Valor não pode ser negativo").optional(),
});

export const updateProvaSchema = z.object({
  titulo: z
    .string()
    .min(1, "Título é obrigatório")
    .trim()
    .optional(),

  notaMaxima: z
    .number()
    .positive("Nota máxima deve ser maior que zero")
    .optional(),

  tempoMin: z
    .number()
    .int("Tempo deve ser inteiro")
    .positive("Tempo deve ser maior que zero")
    .optional(),

  turmaId: z
    .number()
    .int("Turma inválida")
    .positive("Turma inválida")
    .optional()
    .nullable(),

  ativa: z
    .boolean()
    .optional(),
});

export const corrigirDiscursivasSchema = z.object({
  respostas: z.array(
    z.object({
      respostaId: z.number().int().positive("Resposta inválida"),
      nota: z.number().min(0, "Nota não pode ser negativa"),
      feedback: z.string().trim().optional().or(z.literal("")),
    })
  ).min(1, "Envie ao menos uma resposta para corrigir"),
});