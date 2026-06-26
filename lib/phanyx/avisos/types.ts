import type { BannerPhanyxCor } from "@/components/phanyx/BannerPhanyx";

export type AvisoPhanyxOrigem =
  | "SISTEMA"
  | "FERIADO"
  | "CAMPANHA"
  | "RH"
  | "FINANCEIRO"
  | "ACADEMICO"
  | "INSTITUICAO";

export type AvisoPhanyxPublico =
  | "ADMIN"
  | "FUNCIONARIO"
  | "PROFESSOR"
  | "ALUNO"
  | "TODOS";

export type AvisoPhanyx = {
  id: string;
  origem: AvisoPhanyxOrigem;
  prioridade: number;
  publico: AvisoPhanyxPublico[];

  titulo: string;
  descricao: string;
  frase?: string;

  icone: string;
  categoria: string;
  cor: BannerPhanyxCor;

  textoBotao?: string;
  link?: string;

  expiracao?: Date;
};