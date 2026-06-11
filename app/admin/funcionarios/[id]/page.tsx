"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";

type Beneficio = {
  id: number;
  nome: string;
  tipo: string;
  valorPadrao?: any;
  percentual?: any;
  descontaFolha: boolean;
};

type Vinculo = {
  id: number;
  valor?: any;
  percentual?: any;
  descontaFolha: boolean;
  ativo: boolean;
  beneficio: Beneficio;
};

type RegistroPonto = {
  id: number;
  data: string;
  horasExtras?: string | number | null;
  horasAtraso?: string | number | null;
};

function moeda(v: any) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(v: any) {
  return Number(v || 0);
}

function formatarHoras(v: number) {
  const sinal = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sinal}${Math.abs(v).toFixed(2)}h`;
}

function FuncionarioFichaPage() {
  const params = useParams();
  const funcionarioId = Number(params.id);

  const [funcionario, setFuncionario] = useState<any>(null);

  const [editandoTrabalhista, setEditandoTrabalhista] = useState(false);

  const [editandoGeral, setEditandoGeral] = useState(false);

const [formGeral, setFormGeral] = useState({
  nome: "",
  cpf: "",
  rg: "",
  telefone: "",
  cargo: "",
  codigoFuncionario: "",
  email: "",
  statusFuncionario: "",
});

const [formTrabalhista, setFormTrabalhista] = useState({
  dataAdmissao: "",
  dataDesligamento: "",
  salarioBase: "",
  salario: "",
  tipoContrato: "",
  jornadaTrabalho: "",
  cargaHorariaMensal: "",
  codigoPonto: "",
  pisPasep: "",
  banco: "",
  agencia: "",
  conta: "",
  pix: "",
});

  const [beneficiosDisponiveis, setBeneficiosDisponiveis] = useState<Beneficio[]>([]);
  const [beneficiosVinculados, setBeneficiosVinculados] = useState<Vinculo[]>([]);

  const [pontosFuncionario, setPontosFuncionario] = useState<RegistroPonto[]>([]);

  const [beneficioId, setBeneficioId] = useState("");
  const [valor, setValor] = useState("");
  const [percentual, setPercentual] = useState("");
  const [descontaFolha, setDescontaFolha] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [buscaBanco, setBuscaBanco] = useState("");

  const BANCOS_BRASIL = [
  { codigo: "001", nome: "Banco do Brasil" },
  { codigo: "033", nome: "Santander" },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "237", nome: "Bradesco" },
  { codigo: "341", nome: "Itaú" },
  { codigo: "745", nome: "Citibank" },
  { codigo: "399", nome: "HSBC" },
  { codigo: "041", nome: "Banrisul" },
  { codigo: "748", nome: "Sicredi" },
  { codigo: "756", nome: "Sicoob" },
  { codigo: "422", nome: "Safra" },
  { codigo: "655", nome: "Votorantim" },
  { codigo: "633", nome: "Rendimento" },
  { codigo: "707", nome: "Daycoval" },
  { codigo: "121", nome: "Agibank" },
  { codigo: "077", nome: "Banco Inter" },
  { codigo: "212", nome: "Banco Original" },
  { codigo: "218", nome: "BS2" },
  { codigo: "290", nome: "PagBank" },
  { codigo: "336", nome: "C6 Bank" },
  { codigo: "260", nome: "Nubank" },
  { codigo: "323", nome: "Mercado Pago" },
  { codigo: "380", nome: "PicPay Bank" },
  { codigo: "197", nome: "Stone" },
  { codigo: "274", nome: "Gerencianet / Efí" },
  { codigo: "403", nome: "Cora" },
  { codigo: "461", nome: "Asaas Money" },
  { codigo: "085", nome: "Ailos" },
  { codigo: "097", nome: "Credisis" },
  { codigo: "136", nome: "Unicred" },
  { codigo: "364", nome: "Gerencianet" },
  { codigo: "637", nome: "Sofisa Direto" },
  { codigo: "654", nome: "Renner" },
  { codigo: "746", nome: "Modal" },
  { codigo: "735", nome: "Neon" },
];

  async function carregarFuncionario() {
  try {
    const res = await fetch(`/api/funcionario/${funcionarioId}`, {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao carregar funcionário.");
    }

    setFuncionario(data.funcionario);
    setFormGeral({
  nome: data.funcionario.nome || "",
  cpf: data.funcionario.cpf || "",
  rg: data.funcionario.rg || "",
  telefone: data.funcionario.telefone || "",
  cargo: data.funcionario.cargo || "",
  codigoFuncionario: data.funcionario.codigoFuncionario || "",
  email: data.funcionario.user?.email || "",
  statusFuncionario: data.funcionario.statusFuncionario || "ATIVO",
});
    preencherFormTrabalhista(data.funcionario);
  } catch (e: any) {
    setErro(e.message || "Erro ao carregar funcionário.");
  }
}

function dataInput(v: any) {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

function preencherFormTrabalhista(f: any) {
  setFormTrabalhista({
    dataAdmissao: dataInput(f.dataAdmissao),
    dataDesligamento: dataInput(f.dataDesligamento),
    salarioBase: f.salarioBase ? String(f.salarioBase) : "",
    salario: f.salario ? String(f.salario) : "",
    tipoContrato: f.tipoContrato || "",
    jornadaTrabalho: f.jornadaTrabalho || "",
    cargaHorariaMensal: f.cargaHorariaMensal ? String(f.cargaHorariaMensal) : "",
    codigoPonto: f.codigoPonto || "",
    pisPasep: f.pisPasep || "",
    banco: f.banco || "",
    agencia: f.agencia || "",
    conta: f.conta || "",
    pix: f.pix || "",
  });
}

  async function carregarBeneficios() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch(`/api/admin/funcionarios/${funcionarioId}/beneficios`, {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar benefícios.");
      }

      setBeneficiosDisponiveis(data.beneficiosDisponiveis || []);
      setBeneficiosVinculados(data.beneficiosVinculados || []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar benefícios.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarBancoHorasFuncionario() {
  try {
    const res = await fetch("/api/admin/rh/ponto", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) return;

    const todos = Array.isArray(data) ? data : [];

    const filtrados = todos.filter(
      (p: any) => Number(p.funcionario?.id) === funcionarioId
    );

    setPontosFuncionario(filtrados);
  } catch {
    setPontosFuncionario([]);
  }
}

  useEffect(() => {
  if (!funcionarioId) return;

    carregarFuncionario();
    carregarBeneficios();
    carregarBancoHorasFuncionario();
}, [funcionarioId]);

  async function vincularBeneficio(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch(`/api/admin/funcionarios/${funcionarioId}/beneficios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          beneficioId,
          valor,
          percentual,
          descontaFolha,
          ativo: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao vincular benefício.");
      }

      setSucesso("Benefício vinculado ao funcionário.");
      setBeneficioId("");
      setValor("");
      setPercentual("");
      setDescontaFolha(true);

      await carregarBeneficios();
    } catch (e: any) {
      setErro(e.message || "Erro ao vincular benefício.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarDadosGerais(e: React.FormEvent) {
  e.preventDefault();

  try {
    setSalvando(true);
    setErro("");
    setSucesso("");

    const res = await fetch(`/api/funcionario/${funcionarioId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        ...funcionario,
        ...formGeral,
        email: formGeral.email,
        role: funcionario?.user?.role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao salvar.");
    }

    setSucesso("Dados gerais atualizados.");
    setEditandoGeral(false);

    await carregarFuncionario();
  } catch (e: any) {
    setErro(e.message || "Erro ao salvar.");
  } finally {
    setSalvando(false);
  }
}

  async function salvarDadosTrabalhistas(e: React.FormEvent) {
  e.preventDefault();

  try {
    setSalvando(true);
    setErro("");
    setSucesso("");

    const res = await fetch(`/api/funcionario/${funcionarioId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...funcionario,
        email: funcionario?.user?.email,
        role: funcionario?.user?.role,
        ...formTrabalhista,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao salvar dados trabalhistas.");
    }

    setSucesso("Dados trabalhistas atualizados com sucesso.");
    setEditandoTrabalhista(false);
    await carregarFuncionario();
  } catch (e: any) {
    setErro(e.message || "Erro ao salvar dados trabalhistas.");
  } finally {
    setSalvando(false);
  }
}

const resumoBancoHoras = pontosFuncionario.reduce(
  (acc, p) => {
    const credito = numero(p.horasExtras);
    const debito = numero(p.horasAtraso);

    acc.creditos += credito;
    acc.debitos += debito;
    acc.saldo += credito - debito;
    acc.registros += 1;

    if (!acc.ultimaData || new Date(p.data) > new Date(acc.ultimaData)) {
      acc.ultimaData = p.data;
    }

    return acc;
  },
  {
    creditos: 0,
    debitos: 0,
    saldo: 0,
    registros: 0,
    ultimaData: "",
  }
);

  return (
    <main
  className="
min-h-screen
bg-slate-50 dark:bg-slate-950
text-slate-900 dark:text-slate-100
p-6
"
>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Link href="/admin/funcionarios" className="text-sm text-blue-300 hover:text-blue-200">
            ← Voltar para funcionários
          </Link>

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold">Ficha do Funcionário</h1>

          {funcionario && (
  <form
    onSubmit={salvarDadosGerais}
    className="mt-6 rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5"
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold">👤 Dados Gerais</h2>

      {!editandoGeral ? (
        <button
          type="button"
          onClick={() => setEditandoGeral(true)}
          className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/10"
        >
          Editar dados gerais
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            onClick={() => {
              setFormGeral({
                nome: funcionario.nome || "",
                cpf: funcionario.cpf || "",
                rg: funcionario.rg || "",
                telefone: funcionario.telefone || "",
                cargo: funcionario.cargo || "",
                codigoFuncionario: funcionario.codigoFuncionario || "",
                email: funcionario.user?.email || "",
                statusFuncionario: funcionario.statusFuncionario || "ATIVO",
              });
              setEditandoGeral(false);
            }}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>

    {!editandoGeral ? (
      <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
        <div><p className="text-slate-400">Nome</p><p>{funcionario.nome || "-"}</p></div>
        <div><p className="text-slate-400">CPF</p><p>{funcionario.cpf || "-"}</p></div>
        <div><p className="text-slate-400">RG</p><p>{funcionario.rg || "-"}</p></div>
        <div><p className="text-slate-400">Telefone</p><p>{funcionario.telefone || "-"}</p></div>
        <div><p className="text-slate-400">Cargo</p><p>{funcionario.cargo || "-"}</p></div>
        <div><p className="text-slate-400">Departamento</p><p>{funcionario.departamento?.nome || "-"}</p></div>
        <div><p className="text-slate-400">Código</p><p>{funcionario.codigoFuncionario || "-"}</p></div>
        <div><p className="text-slate-400">Status</p><p>{funcionario.statusFuncionario || "-"}</p></div>
        <div><p className="text-slate-400">Email</p><p>{funcionario.user?.email || "-"}</p></div>
      </div>
    ) : (
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-300">Nome</span>
          <input
            value={formGeral.nome}
            onChange={(e) => setFormGeral((p) => ({ ...p, nome: e.target.value }))}
            className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-300">CPF</span>
          <input
            value={formGeral.cpf}
            onChange={(e) => setFormGeral((p) => ({ ...p, cpf: e.target.value }))}
            className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-300">RG</span>
          <input
            value={formGeral.rg}
            onChange={(e) => setFormGeral((p) => ({ ...p, rg: e.target.value }))}
            className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-300">Telefone</span>
          <input
            value={formGeral.telefone}
            onChange={(e) => setFormGeral((p) => ({ ...p, telefone: e.target.value }))}
            className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-300">Cargo</span>
          <input
            value={formGeral.cargo}
            onChange={(e) => setFormGeral((p) => ({ ...p, cargo: e.target.value }))}
            className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-300">Código</span>
          <input
            value={formGeral.codigoFuncionario}
            onChange={(e) =>
              setFormGeral((p) => ({ ...p, codigoFuncionario: e.target.value }))
            }
            className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-300">Email</span>
          <input
            type="email"
            value={formGeral.email}
            onChange={(e) => setFormGeral((p) => ({ ...p, email: e.target.value }))}
            className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-300">Status</span>
          <select
            value={formGeral.statusFuncionario}
            onChange={(e) =>
              setFormGeral((p) => ({ ...p, statusFuncionario: e.target.value }))
            }
            
          >
            <option value="ATIVO">Ativo</option>
            <option value="DEMITIDO">Demitido</option>
            <option value="AFASTADO">Afastado</option>
            <option value="FERIAS">Férias</option>
            <option value="READMITIDO">Readmitido</option>
          </select>
        </label>
      </div>
    )}
  </form>
)}

          <p className="mt-2 text-sm text-slate-400">
            Área central do Departamento Pessoal. Primeiro módulo ativo: benefícios vinculados ao funcionário.
          </p>
        </div>

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

{funcionario && (
  <form
    onSubmit={salvarDadosTrabalhistas}
    className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5"
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold">💼 Dados Trabalhistas</h2>

      {!editandoTrabalhista ? (
        <button
          type="button"
          onClick={() => setEditandoTrabalhista(true)}
          className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/10"
        >
          Editar dados trabalhistas
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            onClick={() => {
              preencherFormTrabalhista(funcionario);
              setEditandoTrabalhista(false);
            }}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>

    {!editandoTrabalhista ? (
      <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
        <div><p className="text-slate-400">Data de Admissão</p><p>{funcionario.dataAdmissao ? new Date(funcionario.dataAdmissao).toLocaleDateString("pt-BR") : "-"}</p></div>
        <div><p className="text-slate-400">Data de Desligamento</p><p>{funcionario.dataDesligamento ? new Date(funcionario.dataDesligamento).toLocaleDateString("pt-BR") : "-"}</p></div>
        <div><p className="text-slate-400">Salário Base</p><p>{funcionario.salarioBase ? moeda(funcionario.salarioBase) : "-"}</p></div>
        <div><p className="text-slate-400">Salário Atual</p><p>{funcionario.salario ? moeda(funcionario.salario) : "-"}</p></div>
        <div><p className="text-slate-400">Tipo de Contrato</p><p>{funcionario.tipoContrato || "-"}</p></div>
        <div><p className="text-slate-400">Jornada</p><p>{funcionario.jornadaTrabalho || "-"}</p></div>
        <div><p className="text-slate-400">Carga Horária Mensal</p><p>{funcionario.cargaHorariaMensal ? `${funcionario.cargaHorariaMensal}h` : "-"}</p></div>
        <div><p className="text-slate-400">Código do Ponto</p><p>{funcionario.codigoPonto || "-"}</p></div>
        <div><p className="text-slate-400">PIS / PASEP</p><p>{funcionario.pisPasep || "-"}</p></div>
        <div><p className="text-slate-400">Banco</p><p>{funcionario.banco || "-"}</p></div>
        <div><p className="text-slate-400">Agência</p><p>{funcionario.agencia || "-"}</p></div>
        <div><p className="text-slate-400">Conta</p><p>{funcionario.conta || "-"}</p></div>
        <div className="md:col-span-2"><p className="text-slate-400">PIX</p><p>{funcionario.pix || "-"}</p></div>
      </div>
    ) : (
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {[
  ["dataAdmissao", "Data de Admissão", "date"],
  ["dataDesligamento", "Data de Desligamento", "date"],
  ["salarioBase", "Salário Base", "text"],
  ["salario", "Salário Atual", "text"],
  ["tipoContrato", "Tipo de Contrato", "text"],
  ["jornadaTrabalho", "Jornada", "text"],
  ["cargaHorariaMensal", "Carga Horária Mensal", "number"],
  ["codigoPonto", "Código do Ponto", "text"],
  ["pisPasep", "PIS / PASEP", "text"],
].map(([campo, label, tipo]) => (
          <label key={campo} className="space-y-1">
            <span className="text-xs font-semibold text-slate-300">{label}</span>
            <input
              type={tipo}
              value={(formTrabalhista as any)[campo]}
              onChange={(e) =>
                setFormTrabalhista((p) => ({
                  ...p,
                  [campo]: e.target.value,
                }))
              }
              
            />
          </label>
        ))}

<label className="relative space-y-1">
  <span className="text-xs font-semibold text-slate-300">Banco</span>

  <input
    value={buscaBanco || formTrabalhista.banco}
    onChange={(e) => {
      setBuscaBanco(e.target.value);
      setFormTrabalhista((p) => ({ ...p, banco: "" }));
    }}
    placeholder="Digite nome ou código do banco"
    
  />

  {buscaBanco && (
    <div className="
absolute z-50 mt-2 max-h-64 w-full overflow-y-auto
rounded-2xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
shadow-xl
">
      {BANCOS_BRASIL.filter((banco) => {
        const termo = buscaBanco.toLowerCase();
        return (
          banco.nome.toLowerCase().includes(termo) ||
          banco.codigo.includes(termo)
        );
      }).map((banco) => (
        <button
          key={banco.codigo}
          type="button"
          onClick={() => {
            const valorBanco = `${banco.codigo} - ${banco.nome}`;
            setFormTrabalhista((p) => ({ ...p, banco: valorBanco }));
            setBuscaBanco("");
          }}
          className="
block w-full px-4 py-3 text-left text-sm
text-slate-900 dark:text-white
hover:bg-blue-100 dark:hover:bg-blue-600
"
        >
          {banco.codigo} - {banco.nome}
        </button>
      ))}
    </div>
  )}
</label>

{[
  ["agencia", "Agência", "text"],
  ["conta", "Conta", "text"],
  ["pix", "PIX", "text"],
].map(([campo, label, tipo]) => (
  <label key={campo} className="space-y-1">
    <span className="text-xs font-semibold text-slate-300">
      {label}
    </span>

    <input
      type={tipo}
      value={(formTrabalhista as any)[campo]}
      onChange={(e) =>
        setFormTrabalhista((p) => ({
          ...p,
          [campo]: e.target.value,
        }))
      }
      className="
w-full rounded-xl
border border-slate-300 dark:border-slate-700
bg-white dark:bg-slate-950
px-3 py-2 text-sm
text-slate-900 dark:text-white
"
    />
  </label>
))}

</div>
    )}
  </form>
)}

{funcionario && (
  <section className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold">📊 Banco de Horas</h2>

      <Link
        href="/admin/rh/banco-horas"
        className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/10"
      >
        Ver banco geral
      </Link>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
        <p className="text-sm text-emerald-200">Créditos</p>
        <p className="mt-2 text-2xl font-bold text-emerald-300">
          {formatarHoras(resumoBancoHoras.creditos)}
        </p>
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
        <p className="text-sm text-red-200">Débitos</p>
        <p className="mt-2 text-2xl font-bold text-red-300">
          {formatarHoras(-resumoBancoHoras.debitos)}
        </p>
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4">
        <p className="text-sm text-blue-200">Saldo Atual</p>
        <p
          className={`mt-2 text-2xl font-bold ${
            resumoBancoHoras.saldo >= 0
              ? "text-emerald-300"
              : "text-red-300"
          }`}
        >
          {formatarHoras(resumoBancoHoras.saldo)}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
        <p className="text-sm text-slate-400">Registros</p>
        <p className="mt-2 text-2xl font-bold">
          {resumoBancoHoras.registros}
        </p>
      </div>
    </div>

    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
      <p>
        Último ponto:{" "}
        <strong>
          {resumoBancoHoras.ultimaData
            ? new Date(resumoBancoHoras.ultimaData).toLocaleDateString("pt-BR")
            : "-"}
        </strong>
      </p>
    </div>
  </section>
)}

        <section className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80 p-5">
          <h2 className="text-lg font-bold">🎁 Benefícios</h2>

          <form onSubmit={vincularBeneficio} className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-300">Benefício</span>
              <select
                value={beneficioId}
                onChange={(e) => setBeneficioId(e.target.value)}
                
                required
              >
                <option value="">Selecione</option>
                {beneficiosDisponiveis.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">Valor (R$)</span>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex.: 120,00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">Percentual (%)</span>
              <input
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                placeholder="Ex.: 6"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-4">
              <input
                type="checkbox"
                checked={descontaFolha}
                onChange={(e) => setDescontaFolha(e.target.checked)}
              />
              Desconta na folha
            </label>

            <div className="md:col-span-4">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {salvando ? "Vinculando..." : "Vincular benefício"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-white dark:bg-slate-900/80">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-bold">Benefícios vinculados</h2>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-400">Carregando...</div>
          ) : beneficiosVinculados.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">
              Nenhum benefício vinculado a este funcionário.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Benefício</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Percentual</th>
                    <th className="p-3">Folha</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiosVinculados.map((v) => (
                    <tr key={v.id} className="border-t border-slate-800">
                      <td className="p-3 font-semibold">{v.beneficio?.nome}</td>
                      <td className="p-3 text-slate-300">
                        {v.beneficio?.tipo?.replaceAll("_", " ")}
                      </td>
                      <td className="p-3 text-slate-300">
                        {v.valor ? moeda(v.valor) : "-"}
                      </td>
                      <td className="p-3 text-slate-300">
                        {v.percentual ? `${v.percentual}%` : "-"}
                      </td>
                      <td className="p-3">
                        {v.descontaFolha ? "Desconta" : "Não desconta"}
                      </td>
                      <td className="p-3">
                        {v.ativo ? "Ativo" : "Inativo"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default withAuth(FuncionarioFichaPage, ["admin"]);