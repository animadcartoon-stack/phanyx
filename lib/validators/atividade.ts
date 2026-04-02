import { z } from "zod";

const atividadeAnexoSchema = z.object({
  nomeOriginal: z.string().min(1, "Nome do arquivo é obrigatório"),
  key: z.string().min(1, "Key do arquivo é obrigatória"),
  url: z.string().min(1, "URL do arquivo é obrigatória"),
  mimeType: z.string().optional().or(z.literal("")),
  tamanho: z.number().nonnegative().optional(),
});

export const createAtividadeSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").trim(),
  descricao: z.string().trim().optional().or(z.literal("")),
  prazo: z.string().datetime().optional().or(z.literal("")),
  notaMaxima: z.number().positive("Nota máxima deve ser maior que zero").optional(),
  disciplinaId: z.number().int().positive("Disciplina inválida"),
  turmaId: z.number().int().positive("Turma inválida").optional().nullable(),
  anexo: atividadeAnexoSchema.optional().nullable(),
});

export const updateAtividadeSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").trim().optional(),
  descricao: z.string().trim().optional().or(z.literal("")),
  prazo: z.string().datetime().optional().or(z.literal("")),
  notaMaxima: z.number().positive("Nota máxima deve ser maior que zero").optional(),
  turmaId: z.number().int().positive("Turma inválida").optional().nullable(),
});

export const entregarAtividadeSchema = z.object({
  texto: z.string().trim().optional().or(z.literal("")),
  link: z.string().url("Link inválido").optional().or(z.literal("")),
  arquivoUrl: z.string().url("Arquivo inválido").optional().or(z.literal("")),
});

export const corrigirEntregaSchema = z.object({
  nota: z.number().min(0, "Nota não pode ser negativa"),
  feedback: z.string().trim().optional().or(z.literal("")),
});