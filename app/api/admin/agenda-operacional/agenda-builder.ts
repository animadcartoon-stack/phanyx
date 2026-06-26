import { TIPOS_AGENDA, TipoAgenda } from "@/lib/agenda/tiposAgenda";

interface CriarEventoAgendaParams {
  id: number | string;
  tipo: TipoAgenda;
  data: Date | string;

  hora?: string;
  curso?: string;
  turma?: string;
  disciplina?: string;
  professor?: string;
  funcionario?: string;
  departamento?: string;
  polo?: string;

  titulo?: string;
  evento?: string;
  descricao?: string;
  responsavel?: string;
  local?: string;
  observacoes?: string;
  status?: string;
}

export function criarEventoAgenda({
  id,
  tipo,
  data,
  hora = "",
  curso = "",
  turma = "",
  disciplina = "",
  professor = "",
  funcionario = "",
  departamento = "",
  polo = "",
  titulo = "",
  evento = "",
  descricao = "",
  responsavel = "",
  local = "",
  observacoes = "",
  status = "",
}: CriarEventoAgendaParams) {
  return {
    id,
    tipo,
    data,
    hora,
    curso,
    turma,
    disciplina,
    professor,
    funcionario,
    departamento,
    polo,
    titulo,
    evento: evento || titulo,
    descricao,
    responsavel,
    local,
    observacoes,
    status,
  };
}