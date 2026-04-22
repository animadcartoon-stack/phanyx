"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";

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
  user: {
    email: string;
    role: string;
  };
  departamento?: {
    id: number;
    nome: string;
  } | null;
}

function AdminFuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SECRETARIA");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [codigoFuncionario, setCodigoFuncionario] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");

  async function carregarFuncionarios() {
    const res = await fetch("/api/funcionario", {
      credentials: "include",
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

 async function criarFuncionario(e: React.FormEvent) {
  e.preventDefault();

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
      setor,
      codigoFuncionario,
      departamentoId: departamentoId || null,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Erro ao criar funcionário");
    return;
  }

  setNome("");
  setEmail("");
  setRole("SECRETARIA");
  setCpf("");
  setRg("");
  setTelefone("");
  setCargo("");
  setSetor("");
  setCodigoFuncionario("");
  setDepartamentoId("");

  await carregarFuncionarios();

  if (data?.avisoEmail) {
    alert(data.avisoEmail);
    return;
  }

  alert("Funcionário criado com sucesso e email de acesso enviado.");
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
      const setor = String(funcionario.setor || "").toLowerCase().trim();
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
        setor.includes(termoTexto) ||
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

      <form
        onSubmit={criarFuncionario}
        className="bg-white border rounded-lg p-6 space-y-4"
      >
        <h2 className="font-semibold">Novo funcionário</h2>

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

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="ADMIN">Admin</option>
            <option value="SECRETARIA">Secretaria</option>
            <option value="COORDENADOR">Coordenador</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="SUPORTE">Suporte</option>
            <option value="GERENCIA">Gerência</option>
          </select>

          <select
            value={departamentoId}
            onChange={(e) => setDepartamentoId(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Selecione um departamento</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>

          <input
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full border rounded-lg p-2"
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
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <input
            placeholder="Cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <input
            placeholder="Setor"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <input
            placeholder="Código do funcionário"
            value={codigoFuncionario}
            onChange={(e) => setCodigoFuncionario(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Criar funcionário
        </button>
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
            <div key={f.id} className="bg-white border rounded-lg p-4">
              <p className="font-medium">{f.nome}</p>
              <p className="text-sm text-gray-600">{f.user?.email}</p>
              <p className="text-sm text-gray-600">Role: {f.user?.role}</p>
              <p className="text-sm text-gray-600">CPF: {f.cpf || "-"}</p>
              <p className="text-sm text-gray-600">RG: {f.rg || "-"}</p>
              <p className="text-sm text-gray-600">
                Telefone: {f.telefone || "-"}
              </p>
              <p className="text-sm text-gray-600">Cargo: {f.cargo || "-"}</p>
              <p className="text-sm text-gray-600">Setor: {f.setor || "-"}</p>
              <p className="text-sm text-gray-600">
                Código: {f.codigoFuncionario || "-"}
              </p>
              <p className="text-sm text-gray-600">
                Departamento: {f.departamento?.nome || "-"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminFuncionariosPage, ["admin"]);