import Link from "next/link";

export default function ConfiguracoesDocumentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          CONFIGURAÇÕES
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          📄 Documentos institucionais
        </h1>
        <p className="mt-1 text-slate-600">
          Configure papel timbrado, contratos, templates, assinaturas e regras
          dos documentos da instituição em um único lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/admin/configuracoes/instituicao"
          className="rounded-2xl border bg-white p-5 shadow-sm hover:border-blue-500"
        >
          <h2 className="text-lg font-bold">🏛️ Identidade e papel timbrado</h2>
          <p className="mt-2 text-sm text-slate-600">
            Dados da instituição, cabeçalho, rodapé, endereço, responsável legal
            e modelo visual dos documentos.
          </p>
        </Link>

        <Link
          href="/admin/documentos/templates"
          className="rounded-2xl border bg-white p-5 shadow-sm hover:border-blue-500"
        >
          <h2 className="text-lg font-bold">📝 Templates de documentos</h2>
          <p className="mt-2 text-sm text-slate-600">
            Contratos, declarações, recibos, comprovantes, trancamentos e outros
            modelos com variáveis dinâmicas.
          </p>
        </Link>

        <Link
          href="/admin/contratos"
          className="rounded-2xl border bg-white p-5 shadow-sm hover:border-blue-500"
        >
          <h2 className="text-lg font-bold">📑 Contratos</h2>
          <p className="mt-2 text-sm text-slate-600">
            Gere, visualize e acompanhe contratos de matrícula com assinatura do
            aluno, diretor e secretaria.
          </p>
        </Link>

        <Link
          href="/admin/configuracoes/certificado"
          className="rounded-2xl border bg-white p-5 shadow-sm hover:border-blue-500"
        >
          <h2 className="text-lg font-bold">🏅 Certificados</h2>
          <p className="mt-2 text-sm text-slate-600">
            Configure modelos, campos, assinaturas e emissão de certificados.
          </p>
        </Link>
      </div>
    </div>
  );
}