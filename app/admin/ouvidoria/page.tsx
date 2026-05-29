"use client";

import { useState } from "react";

const chamados = [
  {
    nome: "Mariana Silva",
    perfil: "Aluno",
    tipo: "Reclamação",
    setor: "Secretaria",
    prioridade: "Alta",
    status: "Pendente",
    sentimento: "Crítico",
    mensagem:
      "Enviei uma solicitação há alguns dias e ainda não recebi retorno.",
  },
  {
    nome: "Carlos Mendes",
    perfil: "Professor",
    tipo: "Sugestão",
    setor: "Acadêmico",
    prioridade: "Média",
    status: "Em análise",
    sentimento: "Neutro",
    mensagem:
      "Seria interessante melhorar a visualização das entregas dos alunos.",
  },
  {
    nome: "Ana Paula",
    perfil: "Aluno",
    tipo: "Elogio",
    setor: "Curso",
    prioridade: "Baixa",
    status: "Resolvido",
    sentimento: "Positivo",
    mensagem:
      "Gostei muito da organização das aulas e do suporte recebido.",
  },
];

export default function OuvidoriaAdminPage() {
  const [filtro, setFiltro] = useState("Todos");

  const chamadosFiltrados = chamados.filter((item) => {
    if (filtro === "Todos") return true;
    return item.status === filtro || item.sentimento === filtro || item.perfil === filtro;
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          PHANYX IA
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Ouvidoria inteligente
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600">
          Centralize sugestões, reclamações, elogios e relatos internos de
          alunos e professores com análise automática da IA PHANYX.
        </p>
      </div>

      <div className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          Painel executivo
        </p>

        <h2 className="mt-4 text-4xl font-black">
          Ouvidoria conectada à Reputação IA
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Reclamações internas, sugestões e elogios passam a alimentar o módulo
          reputacional da instituição, ajudando a IA a identificar riscos,
          gargalos e oportunidades de melhoria.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500">Total</p>
          <h3 className="mt-2 text-3xl font-black">{chamados.length}</h3>
        </div>

        <div className="rounded-2xl border bg-red-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-red-700">Críticos</p>
          <h3 className="mt-2 text-3xl font-black text-red-900">1</h3>
        </div>

        <div className="rounded-2xl border bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-amber-700">Em análise</p>
          <h3 className="mt-2 text-3xl font-black text-amber-900">1</h3>
        </div>

        <div className="rounded-2xl border bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-emerald-700">Resolvidos</p>
          <h3 className="mt-2 text-3xl font-black text-emerald-900">1</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Todos", "Aluno", "Professor", "Crítico", "Neutro", "Positivo", "Pendente", "Em análise", "Resolvido"].map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFiltro(item)}
              className={`rounded-full px-4 py-2 text-xs font-black ${
                filtro === item
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>

      <div className="space-y-4">
        {chamadosFiltrados.map((item) => (
          <div
            key={`${item.nome}-${item.mensagem}`}
            className="rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-slate-900">
                  {item.nome}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {item.perfil} • {item.setor} • {item.tipo}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {item.status}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {item.sentimento}
                </span>

                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  {item.prioridade}
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              “{item.mensagem}”
            </p>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase text-blue-700">
                Sugestão da IA PHANYX
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                Responder com empatia, reconhecer o relato, explicar que a
                instituição irá verificar o caso e encaminhar ao setor
                responsável.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Ver detalhes
              </button>

              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                Responder com IA
              </button>

              <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                Marcar como resolvido
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}