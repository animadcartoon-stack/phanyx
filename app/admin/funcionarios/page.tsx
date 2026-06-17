"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import Link from "next/link";

interface Departamento {
  id: number;
  nome: string;
}

interface Funcionario {
  id: number;
  nome: string;
  cpf?: string | null;
  rg?: string | null;
  telefone?: string | null;
  cargo?: string | null;
  setor?: string | null;
  codigoFuncionario?: string | null;
  fotoPerfil?: string | null;
  statusFuncionario?: string;
  motivoStatus?: string;

  user: {
    email: string;
    role: string;
    ativo?: boolean;
  };

  departamento?: {
    id: number;
    nome: string;
  } | null;
}

function formatarCpf(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function traduzirRole(role?: string) {
  switch (String(role || "").toUpperCase()) {
    case "ADMIN":
      return "Administrador";
    case "SECRETARIA":
      return "Secretaria";
    case "COORDENADOR":
      return "Coordenação";
    case "FINANCEIRO":
      return "Financeiro";
    case "SUPORTE":
      return "Suporte";
    default:
      return role || "-";
  }
}

function AdminFuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [codigoFuncionario, setCodigoFuncionario] = useState("");
  const [statusFuncionario, setStatusFuncionario] = useState("ATIVO");
  const [motivoStatus, setMotivoStatus] = useState("");

  const [documentosFuncionario, setDocumentosFuncionario] = useState<
  { tipo: string; titulo: string; arquivo: File | null }[]
>([
  { tipo: "RG", titulo: "RG", arquivo: null },
  { tipo: "CPF", titulo: "CPF", arquivo: null },
  { tipo: "CNH", titulo: "CNH", arquivo: null },
  { tipo: "COMPROVANTE_RESIDENCIA", titulo: "Comprovante de residência", arquivo: null },
  { tipo: "CURRICULO", titulo: "Currículo", arquivo: null },
  { tipo: "PORTFOLIO", titulo: "Portfólio", arquivo: null },
  { tipo: "CERTIFICADOS", titulo: "Certificados", arquivo: null },
]);

  const [linksPortfolio, setLinksPortfolio] = useState([
  { tipo: "LinkedIn", url: "" },
]);

  const [departamentoId, setDepartamentoId] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [confirmModalAberto, setConfirmModalAberto] = useState(false);

  const [confirmTitulo, setConfirmTitulo] = useState("");

  const [confirmMensagem, setConfirmMensagem] = useState("");

  const [confirmAcao, setConfirmAcao] = useState<(() => void) | null>(null);

  async function carregarFuncionarios() {
  const res = await fetch("/api/funcionario", {
    credentials: "include",
    cache: "no-store",
  });
  const data = await res.json();
  setFuncionarios(Array.isArray(data) ? data : []);
}

  async function carregarDepartamentos() {
    const res = await fetch("/api/departamento", {
      credentials: "include",
    });
    const data = await res.json();
    setDepartamentos(Array.isArray(data) ? data : []);
  }

  function preencherFormularioParaEdicao(f: Funcionario) {
    setEditandoId(f.id);
    setNome(f.nome || "");
    setEmail(f.user?.email || "");
    setRole(String(f.user?.role || "").toUpperCase());
    setCpf(f.cpf || "");
    setRg(f.rg || "");
    setTelefone(f.telefone || "");
    setCargo(f.cargo || "");
    setCodigoFuncionario(f.codigoFuncionario || "");
    setDepartamentoId(f.departamento?.id ? String(f.departamento.id) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setEmail("");
    setRole("");
    setCpf("");
    setRg("");
    setTelefone("");
    setCargo("");
    setCodigoFuncionario("");
    setDepartamentoId("");
  }

  async function salvarEdicaoFuncionario(e: React.FormEvent) {
    e.preventDefault();

    if (!editandoId) {
      return;
    }

    if (!nome.trim()) {
      setErro("Informe o nome do funcionário antes de continuar.");
      return;
    }

    if (!email.trim()) {
      setErro("Informe o email do funcionário antes de continuar.");
      return;
    }

    if (!role) {
      setErro("Selecione o perfil de acesso do funcionário antes de continuar.");
      return;
    }

    try {
      setCarregando(true);

      const res = await fetch(`/api/funcionario/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          email,
          role,
          cpf,
          rg,
          telefone,
          cargo,
          codigoFuncionario,
          departamentoId: departamentoId || null,
          statusFuncionario,
          motivoStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao criar funcionário.");
        return;
      }

      setSucesso("Funcionário atualizado com sucesso.");
      limparFormulario();
      await carregarFuncionarios();
    } finally {
      setCarregando(false);
    }
  }

 async function alterarAcessoFuncionario(
  id: number,
  acao: "bloquear" | "desbloquear",
  nome: string
) {
  const mensagem =
    acao === "bloquear"
      ? `Deseja bloquear o acesso de "${nome}"?`
      : `Deseja desbloquear o acesso de "${nome}"?`;

  setConfirmTitulo(
    acao === "bloquear"
      ? "Bloquear acesso"
      : "Desbloquear acesso"
  );

  setConfirmMensagem(mensagem);

  setConfirmAcao(() => async () => {
    try {
      const res = await fetch(`/api/funcionario/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ acao }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(
          data.error || "Erro ao alterar acesso do funcionário."
        );
        return;
      }

      setSucesso(
        data.message || "Acesso alterado com sucesso."
      );

      await carregarFuncionarios();
    } catch {
      setErro(
        "Erro de comunicação ao alterar acesso do funcionário."
      );
    } finally {
      setConfirmModalAberto(false);
    }
  });

  setConfirmModalAberto(true);
}

  async function criarFuncionario(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      setErro("Informe o nome do funcionário.");
      return;
    }

    if (!email.trim()) {
      setErro("Informe o email do funcionário.");
      return;
    }

    if (!role) {
      setErro("Selecione o perfil de acesso.");
      return;
    }

    try {
      setCarregando(true);

      const res = await fetch("/api/funcionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          email,
          role,
          cpf,
          rg,
          telefone,
          cargo,
          codigoFuncionario,
          departamentoId: departamentoId || null,
          statusFuncionario,
          motivoStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao atualizar funcionário.");
        return;
      }

const funcionarioIdCriado = Number(data?.id);

if (funcionarioIdCriado) {
  // DOCUMENTOS
  for (const doc of documentosFuncionario) {
    if (!doc.arquivo) continue;

    const formData = new FormData();

    formData.append("titulo", doc.titulo);
    formData.append("tipo", doc.tipo);
    formData.append("arquivo", doc.arquivo);

    await fetch(
      `/api/admin/funcionarios/${funcionarioIdCriado}/documentos`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );
  }

  // LINKS DE PORTFÓLIO
  for (const link of linksPortfolio) {
    if (!link.url.trim()) continue;

    await fetch(
      `/api/admin/funcionarios/${funcionarioIdCriado}/documentos`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: link.tipo.toUpperCase(),
          titulo: link.tipo,
          url: link.url,
        }),
      }
    );
  }
}

      setNome("");
      setEmail("");
      setRole("");
      setCpf("");
      setRg("");
      setTelefone("");
      setCargo("");
      setCodigoFuncionario("");
      setDepartamentoId("");

      await carregarFuncionarios();

      if (data?.avisoEmail) {
        setErro(data.avisoEmail);
        return;
      }

      setSucesso("Funcionário criado com sucesso e email de acesso enviado.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFuncionarios();
    carregarDepartamentos();
  }, []);

  const funcionariosFiltrados = useMemo(() => {
    const termoTexto = busca.trim().toLowerCase();
    const termoNumerico = busca.replace(/\D/g, "");

    if (!termoTexto) return funcionarios;

    return funcionarios.filter((funcionario) => {
      const nome = String(funcionario.nome || "").toLowerCase().trim();
      const email = String(funcionario.user?.email || "")
        .toLowerCase()
        .trim();
      const role = String(funcionario.user?.role || "").toLowerCase().trim();
      const cpf = String(funcionario.cpf || "").toLowerCase().trim();
      const rg = String(funcionario.rg || "").toLowerCase().trim();
      const telefone = String(funcionario.telefone || "").toLowerCase().trim();
      const cargo = String(funcionario.cargo || "").toLowerCase().trim();
      const codigoFuncionario = String(funcionario.codigoFuncionario || "")
        .toLowerCase()
        .trim();
      const departamento = String(funcionario.departamento?.nome || "")
        .toLowerCase()
        .trim();

      const cpfNumerico = cpf.replace(/\D/g, "");
      const rgNumerico = rg.replace(/\D/g, "");
      const telefoneNumerico = telefone.replace(/\D/g, "");
      const codigoNumerico = codigoFuncionario.replace(/\D/g, "");

      return (
        nome.includes(termoTexto) ||
        email.includes(termoTexto) ||
        role.includes(termoTexto) ||
        cpf.includes(termoTexto) ||
        rg.includes(termoTexto) ||
        telefone.includes(termoTexto) ||
        cargo.includes(termoTexto) ||
        codigoFuncionario.includes(termoTexto) ||
        departamento.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (cpfNumerico.includes(termoNumerico) ||
            rgNumerico.includes(termoNumerico) ||
            telefoneNumerico.includes(termoNumerico) ||
            codigoNumerico.includes(termoNumerico)))
      );
    });
  }, [funcionarios, busca]);

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">🧑‍💼 Funcionários</h1>

{erro && (
  <PhanyxToast
    tipo="erro"
    titulo="Não foi possível concluir"
    mensagem={erro}
    onClose={() => setErro("")}
  />
)}

{sucesso && (
  <PhanyxToast
    tipo="sucesso"
    titulo="Tudo certo"
    mensagem={sucesso}
    onClose={() => setSucesso("")}
  />
)}

<form
  className="
  rounded-lg
  border
  border-slate-200
  bg-white
  p-6
  space-y-4
  dark:border-slate-700
  dark:bg-slate-900
  "
>
        <h2 className="font-semibold">
  {editandoId ? "Editar funcionário" : "Novo funcionário"}
</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Perfil de acesso ao sistema
            </label>

            <select
  value={role}
  onChange={(e) => setRole(e.target.value)}
  className="
w-full
rounded-lg
border
border-slate-300
bg-white
p-2
text-slate-900
dark:border-slate-700
dark:bg-slate-900
dark:text-white
"
  required
>
              <option value="" className="bg-slate-900 text-white">
  Selecione o perfil
</option>

<option value="ADMIN" className="bg-slate-900 text-white">
  Administrador
</option>

<option value="SECRETARIA" className="bg-slate-900 text-white">
  Funcionário
</option>
              
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Departamento
            </label>

            <select
  value={departamentoId}
  onChange={(e) => setDepartamentoId(e.target.value)}
  className="
w-full
rounded-lg
border
border-slate-300
bg-white
p-2
text-slate-900
dark:border-slate-700
dark:bg-slate-900
dark:text-white
"
>
  <option
    value=""
    className="bg-slate-900 text-white"
  >
    Selecione um departamento
  </option>

  {departamentos.map((d) => (
    <option
      key={d.id}
      value={d.id}
      className="bg-slate-900 text-white"
    >
      {d.nome}
    </option>
  ))}
</select>
          </div>

          <input
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
            className="w-full border rounded-lg p-2"
            inputMode="numeric"
          />

          <input
            placeholder="RG"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            className="w-full border rounded-lg p-2"
            inputMode="numeric"
          />

          <input
            placeholder="Cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <input
            placeholder="Código do funcionário (opcional)"
            value={codigoFuncionario}
            onChange={(e) => setCodigoFuncionario(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

<div className="space-y-1">
  <label className="text-sm font-medium">Status</label>

  <select
  value={statusFuncionario}
  onChange={(e) => setStatusFuncionario(e.target.value)}
  className="
w-full
rounded-lg
border
border-slate-300
bg-white
p-2
text-slate-900
dark:border-slate-700
dark:bg-slate-900
dark:text-white
"
>
  <option value="ATIVO" className="bg-slate-900 text-white">
    Ativo
  </option>

  <option value="DEMITIDO" className="bg-slate-900 text-white">
    Demitido
  </option>

  <option value="AFASTADO" className="bg-slate-900 text-white">
    Afastado
  </option>

  <option value="ADVERTENCIA" className="bg-slate-900 text-white">
    Advertência
  </option>

  <option value="FERIAS" className="bg-slate-900 text-white">
    Férias
  </option>

  <option value="READMITIDO" className="bg-slate-900 text-white">
    Readmitido
  </option>
</select>
</div>

<input
  placeholder="Motivo (opcional)"
  value={motivoStatus}
  onChange={(e) => setMotivoStatus(e.target.value)}
  className="w-full border rounded-lg p-2"
/>

<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
  <div className="mb-4">
    <h3 className="text-base font-bold text-slate-800 dark:text-white">
  Documentos do funcionário
</h3>
    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
      Envie documentos, currículo, portfólio e links profissionais.
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-2">
    {documentosFuncionario.map((doc, index) => (
      <div
        key={doc.tipo}
        className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950"
      >
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-white">
          {doc.titulo}
        </label>

        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.psd,.ai,.eps,.svg,.blend,.fbx,.obj,.glb,.gltf,.ma,.mb,.max,.zip,.rar"
          onChange={(e) => {
            const arquivo = e.target.files?.[0] || null;

            setDocumentosFuncionario((prev) =>
              prev.map((item, i) =>
                i === index ? { ...item, arquivo } : item
              )
            );
          }}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />

        {doc.tipo === "PORTFOLIO" && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-slate-100 p-3 dark:border-blue-900/60 dark:bg-slate-800">
            <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
              Links do portfólio
            </h4>

            <div className="space-y-3">
              {linksPortfolio.map((link, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[150px_1fr_auto]">
                  <select
                    value={link.tipo}
                    onChange={(e) =>
                      setLinksPortfolio((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, tipo: e.target.value } : item
                        )
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Behance">Behance</option>
                    <option value="ArtStation">ArtStation</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Vimeo">Vimeo</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Site">Site pessoal</option>
                    <option value="Outro">Outro</option>
                  </select>

                  <input
                    type="url"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) =>
                      setLinksPortfolio((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item
                        )
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setLinksPortfolio((prev) =>
                        prev.length === 1
                          ? prev
                          : prev.filter((_, i) => i !== index)
                      )
                    }
                    className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-800 dark:bg-slate-900 dark:text-red-300"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setLinksPortfolio((prev) => [
                  ...prev,
                  { tipo: "LinkedIn", url: "" },
                ])
              }
              className="mt-3 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
            >
              + Adicionar link
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
</div>

        <div className="flex flex-wrap gap-2">
  <button
    type="submit"
    disabled={carregando}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
  >
    {carregando
      ? editandoId
        ? "Salvando..."
        : "Criando..."
      : editandoId
      ? "Salvar alterações"
      : "Criar funcionário"}
  </button>

  {editandoId ? (
    <button
      type="button"
      onClick={limparFormulario}
      className="px-4 py-2 border rounded-lg"
    >
      Cancelar edição
    </button>
  ) : null}
</div>
      </form>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">Lista de funcionários</h2>

          <input
            type="text"
            placeholder="Buscar por nome, email, CPF, telefone, cargo, código ou departamento"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full md:w-[500px] border rounded-lg p-2"
          />
        </div>

                {funcionariosFiltrados.length === 0 ? (
          <div className="bg-white border rounded-lg p-4 text-sm text-gray-600">
            Nenhum funcionário encontrado para essa busca.
          </div>
        ) : (
          funcionariosFiltrados.map((f) => (
            <div key={f.id} className="
border
border-slate-200
bg-white
rounded-lg
p-4
space-y-3
dark:border-slate-700
dark:bg-slate-900
">
              <div className="flex items-start gap-4">
  <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-slate-100 flex-shrink-0">
    {f.fotoPerfil ? (
      <img
        src={f.fotoPerfil}
        alt={f.nome}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-700">
        {f.nome?.charAt(0)?.toUpperCase() || "F"}
      </div>
    )}
  </div>

  <div>
    <p className="font-medium">{f.nome}</p>
    <p className="text-sm text-gray-600">{f.user?.email}</p>

    <p className="text-sm text-gray-600">
      Perfil de acesso ao sistema: {traduzirRole(f.user?.role)}
    </p>

    <p className="text-sm text-gray-600">
      Acesso: {f.user?.ativo === false ? "Bloqueado" : "Ativo"}
    </p>

    <p className="text-sm text-gray-600">
      Status: {f.statusFuncionario || "ATIVO"}
    </p>

    {f.motivoStatus && (
      <p className="text-sm text-gray-600">
        Motivo: {f.motivoStatus}
      </p>
    )}

    <p className="text-sm text-gray-600">
      CPF: {f.cpf || "-"}
    </p>

    <p className="text-sm text-gray-600">
      RG: {f.rg || "-"}
    </p>

    <p className="text-sm text-gray-600">
      Telefone: {f.telefone || "-"}
    </p>

    <p className="text-sm text-gray-600">
      Cargo: {f.cargo || "-"}
    </p>

    <p className="text-sm text-gray-600">
      Código: {f.codigoFuncionario || "-"}
    </p>

    <p className="text-sm text-gray-600">
      Departamento: {f.departamento?.nome || "-"}
    </p>
  </div>
</div>
  
              <div className="flex flex-wrap gap-2">
                <Link
  href={`/admin/funcionarios/${f.id}`}
  className="px-3 py-1.5 rounded-lg border text-sm inline-flex items-center"
>
  Editar
</Link>

                <button
  type="button"
  onClick={() => alterarAcessoFuncionario(f.id, "bloquear", f.nome)}
  className="px-3 py-1.5 rounded-lg border border-yellow-500 text-yellow-700 text-sm"
>
  Bloquear acesso
</button>

                <button
    type="button"
    onClick={() => alterarAcessoFuncionario(f.id, "desbloquear", f.nome)}
    className="px-3 py-1.5 rounded-lg border border-green-600 text-green-700 text-sm"
  >
    Desbloquear acesso
  </button>

              </div>
            </div>
          ))
        )}
      </div>
      <PhanyxConfirmModal
  aberto={confirmModalAberto}
  titulo={confirmTitulo}
  mensagem={confirmMensagem}
  textoConfirmar="Confirmar"
  textoCancelar="Cancelar"
  onCancelar={() => {
    setConfirmModalAberto(false);
    setConfirmAcao(null);
  }}
  onConfirmar={() => {
    if (confirmAcao) {
      confirmAcao();
    }
  }}
/>
    </div>  
  ); 
}

export default withAuth(AdminFuncionariosPage, ["admin"]);