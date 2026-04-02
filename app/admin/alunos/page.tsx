"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";

type StatusAluno =
  | "ATIVO"
  | "TRANCADO"
  | "SUSPENSO"
  | "INADIMPLENTE"
  | "TRANSFERIDO"
  | "DESLIGADO"
  | "FORMADO"
  | "CANCELADO"
  | "PAUSA_MEDICA"
  | "FALTANTE";

interface Aluno {
  id: number;
  nome: string;
  nomeSocial?: string | null;
  genero?: string | null;
  matricula?: string | null;
  cpf?: string | null;
  rg?: string | null;
  telefone?: string | null;
  dataNascimento?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  documentoUrl?: string | null;
  nomeResponsavel?: string | null;
  cpfResponsavel?: string | null;
  telefoneResponsavel?: string | null;
  emailResponsavel?: string | null;
  parentescoResponsavel?: string | null;
  statusAluno?: StatusAluno;
  possuiNecessidadeEspecial?: boolean;
  descricaoNecessidadeEspecial?: string | null;
  observacoesAcessibilidade?: string | null;
  user: {
    email: string;
  };
}

function AdminAlunosPage() {
  const searchParams = useSearchParams();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [nomeSocial, setNomeSocial] = useState("");
  const [genero, setGenero] = useState("");
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");
  const [emailResponsavel, setEmailResponsavel] = useState("");
  const [parentescoResponsavel, setParentescoResponsavel] = useState("");
  const [statusAluno, setStatusAluno] = useState<StatusAluno>("ATIVO");
  const [possuiNecessidadeEspecial, setPossuiNecessidadeEspecial] =
    useState(false);
  const [descricaoNecessidadeEspecial, setDescricaoNecessidadeEspecial] =
    useState("");
  const [observacoesAcessibilidade, setObservacoesAcessibilidade] =
    useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editNomeSocial, setEditNomeSocial] = useState("");
  const [editGenero, setEditGenero] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMatricula, setEditMatricula] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editRg, setEditRg] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editDataNascimento, setEditDataNascimento] = useState("");
  const [editCep, setEditCep] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editNumero, setEditNumero] = useState("");
  const [editComplemento, setEditComplemento] = useState("");
  const [editBairro, setEditBairro] = useState("");
  const [editCidade, setEditCidade] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editDocumentoUrl, setEditDocumentoUrl] = useState("");
  const [editNomeResponsavel, setEditNomeResponsavel] = useState("");
  const [editCpfResponsavel, setEditCpfResponsavel] = useState("");
  const [editTelefoneResponsavel, setEditTelefoneResponsavel] = useState("");
  const [editEmailResponsavel, setEditEmailResponsavel] = useState("");
  const [editParentescoResponsavel, setEditParentescoResponsavel] =
    useState("");
  const [editStatusAluno, setEditStatusAluno] = useState<StatusAluno>("ATIVO");
  const [editPossuiNecessidadeEspecial, setEditPossuiNecessidadeEspecial] =
    useState(false);
  const [editDescricaoNecessidadeEspecial, setEditDescricaoNecessidadeEspecial] =
    useState("");
  const [editObservacoesAcessibilidade, setEditObservacoesAcessibilidade] =
    useState("");

  async function carregarAlunos() {
    const res = await fetch("/api/aluno", {
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Erro ao buscar alunos");
      return;
    }

    const data = await res.json();
    setAlunos(Array.isArray(data) ? data : []);
  }

  function iniciarEdicao(aluno: Aluno) {
    setEditandoId(aluno.id);
    setEditNome(aluno.nome || "");
    setEditNomeSocial(aluno.nomeSocial || "");
    setEditGenero(aluno.genero || "");
    setEditEmail(aluno.user?.email || "");
    setEditMatricula(aluno.matricula || "");
    setEditCpf(aluno.cpf || "");
    setEditRg(aluno.rg || "");
    setEditTelefone(aluno.telefone || "");
    setEditDataNascimento(
      aluno.dataNascimento
        ? new Date(aluno.dataNascimento).toISOString().slice(0, 10)
        : ""
    );
    setEditCep(aluno.cep || "");
    setEditEndereco(aluno.endereco || "");
    setEditNumero(aluno.numero || "");
    setEditComplemento(aluno.complemento || "");
    setEditBairro(aluno.bairro || "");
    setEditCidade(aluno.cidade || "");
    setEditEstado(aluno.estado || "");
    setEditDocumentoUrl(aluno.documentoUrl || "");
    setEditNomeResponsavel(aluno.nomeResponsavel || "");
    setEditCpfResponsavel(aluno.cpfResponsavel || "");
    setEditTelefoneResponsavel(aluno.telefoneResponsavel || "");
    setEditEmailResponsavel(aluno.emailResponsavel || "");
    setEditParentescoResponsavel(aluno.parentescoResponsavel || "");
    setEditStatusAluno(aluno.statusAluno || "ATIVO");
    setEditPossuiNecessidadeEspecial(!!aluno.possuiNecessidadeEspecial);
    setEditDescricaoNecessidadeEspecial(
      aluno.descricaoNecessidadeEspecial || ""
    );
    setEditObservacoesAcessibilidade(
      aluno.observacoesAcessibilidade || ""
    );
  }

  async function salvarEdicao(id: number) {
    const res = await fetch(`/api/aluno/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome: editNome,
        email: editEmail,
        nomeSocial: editNomeSocial,
        genero: editGenero,
        matricula: editMatricula,
        cpf: editCpf,
        rg: editRg,
        telefone: editTelefone,
        dataNascimento: editDataNascimento || null,
        cep: editCep,
        endereco: editEndereco,
        numero: editNumero,
        complemento: editComplemento,
        bairro: editBairro,
        cidade: editCidade,
        estado: editEstado,
        documentoUrl: editDocumentoUrl,
        nomeResponsavel: editNomeResponsavel,
        cpfResponsavel: editCpfResponsavel,
        telefoneResponsavel: editTelefoneResponsavel,
        emailResponsavel: editEmailResponsavel,
        parentescoResponsavel: editParentescoResponsavel,
        statusAluno: editStatusAluno,
        possuiNecessidadeEspecial: editPossuiNecessidadeEspecial,
        descricaoNecessidadeEspecial: editDescricaoNecessidadeEspecial,
        observacoesAcessibilidade: editObservacoesAcessibilidade,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao atualizar");
      return;
    }

    setEditandoId(null);
    carregarAlunos();
  }

  async function deletarAluno(id: number) {
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return;

    const res = await fetch(`/api/aluno/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao deletar aluno");
      return;
    }

    carregarAlunos();
  }

  async function handleCriarAluno(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/aluno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome,
        email,
        nomeSocial,
        genero,
        matricula,
        cpf,
        rg,
        telefone,
        dataNascimento: dataNascimento || null,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        documentoUrl,
        nomeResponsavel,
        cpfResponsavel,
        telefoneResponsavel,
        emailResponsavel,
        parentescoResponsavel,
        statusAluno,
        possuiNecessidadeEspecial,
        descricaoNecessidadeEspecial,
        observacoesAcessibilidade,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao criar aluno");
      return;
    }

    setNome("");
    setNomeSocial("");
    setGenero("");
    setEmail("");
    setMatricula("");
    setCpf("");
    setRg("");
    setTelefone("");
    setDataNascimento("");
    setCep("");
    setEndereco("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setDocumentoUrl("");
    setNomeResponsavel("");
    setCpfResponsavel("");
    setTelefoneResponsavel("");
    setEmailResponsavel("");
    setParentescoResponsavel("");
    setStatusAluno("ATIVO");
    setPossuiNecessidadeEspecial(false);
    setDescricaoNecessidadeEspecial("");
    setObservacoesAcessibilidade("");

    carregarAlunos();
  }

  useEffect(() => {
    carregarAlunos();
  }, []);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const alunosFiltrados = useMemo(() => {
    const termoTexto = busca.trim().toLowerCase();
    const termoNumerico = busca.replace(/\D/g, "");

    if (!termoTexto) return alunos;

    return alunos.filter((aluno) => {
      const nome = String(aluno.nome || "").toLowerCase().trim();
      const email = String(aluno.user?.email || "").toLowerCase().trim();
      const matricula = String(aluno.matricula || "").toLowerCase().trim();
      const cpf = String(aluno.cpf || "").toLowerCase().trim();
      const rg = String(aluno.rg || "").toLowerCase().trim();
      const telefone = String(aluno.telefone || "").toLowerCase().trim();
      const nomeResponsavel = String(aluno.nomeResponsavel || "")
        .toLowerCase()
        .trim();
      const cpfResponsavel = String(aluno.cpfResponsavel || "")
        .toLowerCase()
        .trim();
      const telefoneResponsavel = String(aluno.telefoneResponsavel || "")
        .toLowerCase()
        .trim();
      const emailResponsavel = String(aluno.emailResponsavel || "")
        .toLowerCase()
        .trim();
      const parentescoResponsavel = String(aluno.parentescoResponsavel || "")
        .toLowerCase()
        .trim();
      const statusAlunoTexto = String(aluno.statusAluno || "")
        .toLowerCase()
        .trim();
      const descricaoNecessidadeEspecial = String(
        aluno.descricaoNecessidadeEspecial || ""
      )
        .toLowerCase()
        .trim();
      const observacoesAcessibilidade = String(
        aluno.observacoesAcessibilidade || ""
      )
        .toLowerCase()
        .trim();

      const matriculaNumerica = matricula.replace(/\D/g, "");
      const cpfNumerico = cpf.replace(/\D/g, "");
      const rgNumerico = rg.replace(/\D/g, "");
      const telefoneNumerico = telefone.replace(/\D/g, "");
      const cpfResponsavelNumerico = cpfResponsavel.replace(/\D/g, "");
      const telefoneResponsavelNumerico = telefoneResponsavel.replace(/\D/g, "");

      return (
        nome.includes(termoTexto) ||
        email.includes(termoTexto) ||
        matricula.includes(termoTexto) ||
        cpf.includes(termoTexto) ||
        rg.includes(termoTexto) ||
        telefone.includes(termoTexto) ||
        nomeResponsavel.includes(termoTexto) ||
        cpfResponsavel.includes(termoTexto) ||
        telefoneResponsavel.includes(termoTexto) ||
        emailResponsavel.includes(termoTexto) ||
        parentescoResponsavel.includes(termoTexto) ||
        statusAlunoTexto.includes(termoTexto) ||
        descricaoNecessidadeEspecial.includes(termoTexto) ||
        observacoesAcessibilidade.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (matriculaNumerica.includes(termoNumerico) ||
            cpfNumerico.includes(termoNumerico) ||
            rgNumerico.includes(termoNumerico) ||
            telefoneNumerico.includes(termoNumerico) ||
            cpfResponsavelNumerico.includes(termoNumerico) ||
            telefoneResponsavelNumerico.includes(termoNumerico)))
      );
    });
  }, [alunos, busca]);

  function labelStatusAluno(status?: StatusAluno) {
    switch (status) {
      case "ATIVO":
        return "Ativo";
      case "TRANCADO":
        return "Trancado";
      case "SUSPENSO":
        return "Suspenso";
      case "INADIMPLENTE":
        return "Inadimplente";
      case "TRANSFERIDO":
        return "Transferido";
      case "DESLIGADO":
        return "Desligado";
      case "FORMADO":
        return "Formado";
      case "CANCELADO":
        return "Cancelado";
      case "PAUSA_MEDICA":
        return "Pausa médica";
      case "FALTANTE":
        return "Faltante";
      default:
        return "-";
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">👨‍🎓 Alunos</h1>

      <form
        onSubmit={handleCriarAluno}
        className="space-y-4 rounded-lg border bg-white p-6"
      >
        <h2 className="font-semibold">Novo aluno</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            placeholder="Nome do aluno"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border p-2"
            required
          />

          <input
            placeholder="Nome social"
            value={nomeSocial}
            onChange={(e) => setNomeSocial(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <select
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            className="w-full rounded-lg border p-2"
          >
            <option value="">Gênero</option>
            <option value="FEMININO">Feminino</option>
            <option value="MASCULINO">Masculino</option>
            <option value="NAO_BINARIO">Não binário</option>
            <option value="OUTRO">Outro</option>
            <option value="PREFIRO_NAO_INFORMAR">Prefiro não informar</option>
          </select>

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-2"
            required
          />

          <input
            placeholder="Matrícula"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="RG"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <select
            value={statusAluno}
            onChange={(e) => setStatusAluno(e.target.value as StatusAluno)}
            className="w-full rounded-lg border p-2"
          >
            <option value="ATIVO">Ativo</option>
            <option value="TRANCADO">Trancado</option>
            <option value="SUSPENSO">Suspenso</option>
            <option value="INADIMPLENTE">Inadimplente</option>
            <option value="TRANSFERIDO">Transferido</option>
            <option value="DESLIGADO">Desligado</option>
            <option value="FORMADO">Formado</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="PAUSA_MEDICA">Pausa médica</option>
            <option value="FALTANTE">Faltante</option>
          </select>

          <input
            placeholder="CEP"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Endereço"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Número"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Complemento"
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Bairro"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full rounded-lg border p-2"
          />

          <input
            placeholder="URL do documento"
            value={documentoUrl}
            onChange={(e) => setDocumentoUrl(e.target.value)}
            className="w-full rounded-lg border p-2 md:col-span-2"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 font-semibold">
            Necessidades especiais e acessibilidade
          </h3>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={possuiNecessidadeEspecial}
                onChange={(e) => setPossuiNecessidadeEspecial(e.target.checked)}
              />
              Possui necessidade especial
            </label>

            <div className="grid grid-cols-1 gap-4">
              <textarea
                placeholder="Descreva a necessidade especial do aluno"
                value={descricaoNecessidadeEspecial}
                onChange={(e) =>
                  setDescricaoNecessidadeEspecial(e.target.value)
                }
                className="min-h-[100px] w-full rounded-lg border p-2"
              />

              <textarea
                placeholder="Observações de acessibilidade, apoio pedagógico ou adaptações"
                value={observacoesAcessibilidade}
                onChange={(e) => setObservacoesAcessibilidade(e.target.value)}
                className="min-h-[100px] w-full rounded-lg border p-2"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 font-semibold">Dados do responsável</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              placeholder="Nome do responsável"
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <input
              placeholder="CPF do responsável"
              value={cpfResponsavel}
              onChange={(e) => setCpfResponsavel(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <input
              placeholder="Telefone do responsável"
              value={telefoneResponsavel}
              onChange={(e) => setTelefoneResponsavel(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <input
              placeholder="Email do responsável"
              type="email"
              value={emailResponsavel}
              onChange={(e) => setEmailResponsavel(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <input
              placeholder="Parentesco do responsável"
              value={parentescoResponsavel}
              onChange={(e) => setParentescoResponsavel(e.target.value)}
              className="w-full rounded-lg border p-2 md:col-span-2"
            />
          </div>
        </div>

        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">
          Criar aluno
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">Lista de alunos</h2>

          <input
            type="text"
            placeholder="Buscar por nome, CPF, email, telefone, responsável, status ou acessibilidade"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border p-2 md:w-[460px]"
          />
        </div>

        {alunosFiltrados.length === 0 ? (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            Nenhum aluno encontrado para essa busca.
          </div>
        ) : (
          alunosFiltrados.map((a) => (
            <div key={a.id} className="rounded-lg border bg-white p-4">
              {editandoId === a.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Nome"
                    />
                    <input
                      value={editNomeSocial}
                      onChange={(e) => setEditNomeSocial(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Nome social"
                    />
                    <select
                      value={editGenero}
                      onChange={(e) => setEditGenero(e.target.value)}
                      className="rounded border p-2"
                    >
                      <option value="">Gênero</option>
                      <option value="FEMININO">Feminino</option>
                      <option value="MASCULINO">Masculino</option>
                      <option value="NAO_BINARIO">Não binário</option>
                      <option value="OUTRO">Outro</option>
                      <option value="PREFIRO_NAO_INFORMAR">Prefiro não informar</option>
                    </select>
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Email"
                    />
                    <input
                      value={editMatricula}
                      onChange={(e) => setEditMatricula(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Matrícula"
                    />
                    <input
                      value={editCpf}
                      onChange={(e) => setEditCpf(e.target.value)}
                      className="rounded border p-2"
                      placeholder="CPF"
                    />
                    <input
                      value={editRg}
                      onChange={(e) => setEditRg(e.target.value)}
                      className="rounded border p-2"
                      placeholder="RG"
                    />
                    <input
                      value={editTelefone}
                      onChange={(e) => setEditTelefone(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Telefone"
                    />
                    <input
                      type="date"
                      value={editDataNascimento}
                      onChange={(e) => setEditDataNascimento(e.target.value)}
                      className="rounded border p-2"
                    />
                    <select
                      value={editStatusAluno}
                      onChange={(e) =>
                        setEditStatusAluno(e.target.value as StatusAluno)
                      }
                      className="rounded border p-2"
                    >
                      <option value="ATIVO">Ativo</option>
                      <option value="TRANCADO">Trancado</option>
                      <option value="SUSPENSO">Suspenso</option>
                      <option value="INADIMPLENTE">Inadimplente</option>
                      <option value="TRANSFERIDO">Transferido</option>
                      <option value="DESLIGADO">Desligado</option>
                      <option value="FORMADO">Formado</option>
                      <option value="CANCELADO">Cancelado</option>
                      <option value="PAUSA_MEDICA">Pausa médica</option>
                      <option value="FALTANTE">Faltante</option>
                    </select>
                    <input
                      value={editCep}
                      onChange={(e) => setEditCep(e.target.value)}
                      className="rounded border p-2"
                      placeholder="CEP"
                    />
                    <input
                      value={editEndereco}
                      onChange={(e) => setEditEndereco(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Endereço"
                    />
                    <input
                      value={editNumero}
                      onChange={(e) => setEditNumero(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Número"
                    />
                    <input
                      value={editComplemento}
                      onChange={(e) => setEditComplemento(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Complemento"
                    />
                    <input
                      value={editBairro}
                      onChange={(e) => setEditBairro(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Bairro"
                    />
                    <input
                      value={editCidade}
                      onChange={(e) => setEditCidade(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Cidade"
                    />
                    <input
                      value={editEstado}
                      onChange={(e) => setEditEstado(e.target.value)}
                      className="rounded border p-2"
                      placeholder="Estado"
                    />
                    <input
                      value={editDocumentoUrl}
                      onChange={(e) => setEditDocumentoUrl(e.target.value)}
                      className="rounded border p-2 md:col-span-2"
                      placeholder="URL do documento"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="mb-3 font-semibold">
                      Necessidades especiais e acessibilidade
                    </h3>

                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={editPossuiNecessidadeEspecial}
                          onChange={(e) =>
                            setEditPossuiNecessidadeEspecial(e.target.checked)
                          }
                        />
                        Possui necessidade especial
                      </label>

                      <div className="grid grid-cols-1 gap-4">
                        <textarea
                          value={editDescricaoNecessidadeEspecial}
                          onChange={(e) =>
                            setEditDescricaoNecessidadeEspecial(e.target.value)
                          }
                          className="min-h-[100px] rounded border p-2"
                          placeholder="Descreva a necessidade especial do aluno"
                        />

                        <textarea
                          value={editObservacoesAcessibilidade}
                          onChange={(e) =>
                            setEditObservacoesAcessibilidade(e.target.value)
                          }
                          className="min-h-[100px] rounded border p-2"
                          placeholder="Observações de acessibilidade, apoio pedagógico ou adaptações"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="mb-3 font-semibold">Dados do responsável</h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        value={editNomeResponsavel}
                        onChange={(e) => setEditNomeResponsavel(e.target.value)}
                        className="rounded border p-2"
                        placeholder="Nome do responsável"
                      />
                      <input
                        value={editCpfResponsavel}
                        onChange={(e) => setEditCpfResponsavel(e.target.value)}
                        className="rounded border p-2"
                        placeholder="CPF do responsável"
                      />
                      <input
                        value={editTelefoneResponsavel}
                        onChange={(e) =>
                          setEditTelefoneResponsavel(e.target.value)
                        }
                        className="rounded border p-2"
                        placeholder="Telefone do responsável"
                      />
                      <input
                        value={editEmailResponsavel}
                        onChange={(e) => setEditEmailResponsavel(e.target.value)}
                        className="rounded border p-2"
                        placeholder="Email do responsável"
                      />
                      <input
                        value={editParentescoResponsavel}
                        onChange={(e) =>
                          setEditParentescoResponsavel(e.target.value)
                        }
                        className="rounded border p-2 md:col-span-2"
                        placeholder="Parentesco do responsável"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium">{a.nome}</p>
                  <p className="text-sm text-gray-600">
                    Nome social: {a.nomeSocial || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Gênero: {a.genero || "-"}
                  </p>
                  <p className="text-sm text-gray-600">{a.user?.email}</p>
                  <p className="text-sm text-gray-600">
                    Status: {labelStatusAluno(a.statusAluno)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Matrícula: {a.matricula || "-"}
                  </p>
                  <p className="text-sm text-gray-600">CPF: {a.cpf || "-"}</p>
                  <p className="text-sm text-gray-600">RG: {a.rg || "-"}</p>
                  <p className="text-sm text-gray-600">
                    Telefone: {a.telefone || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Endereço: {a.endereco || "-"}, {a.numero || "-"} -{" "}
                    {a.bairro || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cidade/UF: {a.cidade || "-"} / {a.estado || "-"}
                  </p>
                  <p className="text-sm text-gray-600">CEP: {a.cep || "-"}</p>
                  <p className="text-sm text-gray-600">
                    Documento: {a.documentoUrl || "-"}
                  </p>

                  <div className="mt-3 border-t pt-3">
                    <p className="text-sm font-medium text-gray-700">
                      Necessidades especiais e acessibilidade
                    </p>
                    <p className="text-sm text-gray-600">
                      Possui necessidade especial:{" "}
                      {a.possuiNecessidadeEspecial ? "Sim" : "Não"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Descrição: {a.descricaoNecessidadeEspecial || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Observações: {a.observacoesAcessibilidade || "-"}
                    </p>
                  </div>

                  <div className="mt-3 border-t pt-3">
                    <p className="text-sm font-medium text-gray-700">
                      Responsável
                    </p>
                    <p className="text-sm text-gray-600">
                      Nome: {a.nomeResponsavel || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      CPF: {a.cpfResponsavel || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Telefone: {a.telefoneResponsavel || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Email: {a.emailResponsavel || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Parentesco: {a.parentescoResponsavel || "-"}
                    </p>
                  </div>
                </>
              )}

              <div className="mt-3 flex flex-wrap gap-4">
                {editandoId === a.id ? (
                  <>
                    <button
                      onClick={() => salvarEdicao(a.id)}
                      className="rounded bg-green-600 px-3 py-1 text-white"
                    >
                      Salvar
                    </button>

                    <button
                      onClick={() => setEditandoId(null)}
                      className="rounded bg-gray-400 px-3 py-1 text-white"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `/api/admin/contratos/pdf?alunoId=${a.id}`,
                          "_blank"
                        )
                      }
                      className="rounded bg-blue-600 px-3 py-1 text-white"
                    >
                      📄 Baixar contrato
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => iniciarEdicao(a)}
                      className="text-sm text-blue-600"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `/api/admin/contratos/pdf?alunoId=${a.id}`,
                          "_blank"
                        )
                      }
                      className="text-sm text-green-600"
                    >
                      📄 Baixar contrato
                    </button>

                    <button
                      onClick={() => deletarAluno(a.id)}
                      className="text-sm text-red-600"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminAlunosPage, ["admin"]);