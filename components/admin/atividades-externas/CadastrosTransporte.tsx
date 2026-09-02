"use client";

import {
  useEffect,
  useState,
} from "react";

import { useTranslations } from "next-intl";

type AbaCadastro =
  | "prestadores"
  | "veiculos"
  | "condutores";

type Prestador = {
  id: number;
  nome: string;
  nomeFantasia?: string | null;
  tipo: string;
  ativo: boolean;
};

type Veiculo = {
  id: number;
  nomeIdentificacao?: string | null;
  tipo: string;
  marca?: string | null;
  modelo?: string | null;
  placa?: string | null;
  capacidadePassageiros?: number | null;
  ativo: boolean;

  prestadorTransporte?: {
    id: number;
    nome: string;
    nomeFantasia?: string | null;
  } | null;
};

type Condutor = {
  id: number;
  nome: string;
  tipo: string;
  telefone?: string | null;
  numeroLicenca?: string | null;
  ativo: boolean;

  prestadorTransporte?: {
    id: number;
    nome: string;
    nomeFantasia?: string | null;
  } | null;
};

export default function CadastrosTransporte({
  onFechar,
}: {
  onFechar: () => void;
}) {
  const t =
    useTranslations(
      "AdminExternalActivityTransport"
    );

  const [
    abaAtiva,
    setAbaAtiva,
  ] =
    useState<AbaCadastro>(
      "prestadores"
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] = useState(false);

  const [
    prestadores,
    setPrestadores,
  ] = useState<Prestador[]>([]);

  const [
    veiculos,
    setVeiculos,
  ] = useState<Veiculo[]>([]);

  const [
    condutores,
    setCondutores,
  ] = useState<Condutor[]>([]);

  const [erro, setErro] =
    useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const [
        respostaPrestadores,
        respostaVeiculos,
        respostaCondutores,
      ] = await Promise.all([
        fetch(
          "/api/admin/transportes/prestadores",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/admin/transportes/veiculos",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/admin/transportes/condutores",
          {
            cache: "no-store",
          }
        ),
      ]);

      const [
        dadosPrestadores,
        dadosVeiculos,
        dadosCondutores,
      ] = await Promise.all([
        respostaPrestadores.json(),
        respostaVeiculos.json(),
        respostaCondutores.json(),
      ]);

      if (
        !respostaPrestadores.ok ||
        !dadosPrestadores?.ok
      ) {
        throw new Error(
          dadosPrestadores?.error ||
            "ERRO_PRESTADORES"
        );
      }

      if (
        !respostaVeiculos.ok ||
        !dadosVeiculos?.ok
      ) {
        throw new Error(
          dadosVeiculos?.error ||
            "ERRO_VEICULOS"
        );
      }

      if (
        !respostaCondutores.ok ||
        !dadosCondutores?.ok
      ) {
        throw new Error(
          dadosCondutores?.error ||
            "ERRO_CONDUTORES"
        );
      }

      setPodeGerenciar(
        Boolean(
          dadosPrestadores
            .podeGerenciar &&
            dadosVeiculos
              .podeGerenciar &&
            dadosCondutores
              .podeGerenciar
        )
      );

      setPrestadores(
        dadosPrestadores
          .prestadores || []
      );

      setVeiculos(
        dadosVeiculos
          .veiculos || []
      );

      setCondutores(
        dadosCondutores
          .condutores || []
      );
    } catch (error) {
      console.error(
        "[CADASTROS_TRANSPORTE_CARREGAR]",
        error
      );

      setErro(
        t(
          "registrations.errors.load"
        )
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <div className="phanyx-transporte-cadastros rounded-2xl border p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black">
            ⚙️{" "}
            {t(
              "registrations.title"
            )}
          </h3>

          <p className="mt-1 text-sm opacity-75">
            {t(
              "registrations.description"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="rounded-xl border px-4 py-2.5 text-sm font-extrabold"
        >
          {t(
            "registrations.close"
          )}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <BotaoAba
          ativo={
            abaAtiva ===
            "prestadores"
          }
          onClick={() =>
            setAbaAtiva(
              "prestadores"
            )
          }
        >
          🏢{" "}
          {t(
            "registrations.tabs.providers"
          )}{" "}
          ({prestadores.length})
        </BotaoAba>

        <BotaoAba
          ativo={
            abaAtiva ===
            "veiculos"
          }
          onClick={() =>
            setAbaAtiva(
              "veiculos"
            )
          }
        >
          🚐{" "}
          {t(
            "registrations.tabs.vehicles"
          )}{" "}
          ({veiculos.length})
        </BotaoAba>

        <BotaoAba
          ativo={
            abaAtiva ===
            "condutores"
          }
          onClick={() =>
            setAbaAtiva(
              "condutores"
            )
          }
        >
          🧑‍✈️{" "}
          {t(
            "registrations.tabs.drivers"
          )}{" "}
          ({condutores.length})
        </BotaoAba>
      </div>

      {erro ? (
        <div className="phanyx-transporte-error mt-4 rounded-xl border p-3 text-sm font-semibold">
          {erro}
        </div>
      ) : null}

      {carregando ? (
        <div className="phanyx-transporte-empty mt-4 rounded-xl border p-6 text-sm">
          {t(
            "registrations.loading"
          )}
        </div>
      ) : abaAtiva ===
        "prestadores" ? (
        <ListaPrestadores
          itens={prestadores}
          vazio={t(
            "registrations.empty.providers"
          )}
        />
      ) : abaAtiva ===
        "veiculos" ? (
        <ListaVeiculos
          itens={veiculos}
          vazio={t(
            "registrations.empty.vehicles"
          )}
        />
      ) : (
        <ListaCondutores
          itens={condutores}
          vazio={t(
            "registrations.empty.drivers"
          )}
        />
      )}

      {podeGerenciar ? (
        <div className="mt-4 text-xs font-semibold opacity-60">
          {t(
            "registrations.managementAvailable"
          )}
        </div>
      ) : null}
    </div>
  );
}

function BotaoAba({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-2.5 text-sm font-extrabold transition",
        ativo
          ? "bg-blue-700 text-white"
          : "phanyx-transporte-tab",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ListaPrestadores({
  itens,
  vazio,
}: {
  itens: Prestador[];
  vazio: string;
}) {
  if (!itens.length) {
    return (
      <EstadoVazio
        texto={vazio}
      />
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {itens.map((item) => (
        <div
          key={item.id}
          className="phanyx-transporte-registration-item rounded-xl border p-3"
        >
          <div className="font-extrabold">
            {item.nomeFantasia ||
              item.nome}
          </div>

          <div className="mt-1 text-xs opacity-70">
            {item.tipo}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaVeiculos({
  itens,
  vazio,
}: {
  itens: Veiculo[];
  vazio: string;
}) {
  if (!itens.length) {
    return (
      <EstadoVazio
        texto={vazio}
      />
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {itens.map((item) => (
        <div
          key={item.id}
          className="phanyx-transporte-registration-item rounded-xl border p-3"
        >
          <div className="font-extrabold">
            {item.nomeIdentificacao ||
              item.placa ||
              item.tipo}
          </div>

          <div className="mt-1 text-xs opacity-70">
            {[
              item.marca,
              item.modelo,
              item.placa,
            ]
              .filter(Boolean)
              .join(" • ")}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaCondutores({
  itens,
  vazio,
}: {
  itens: Condutor[];
  vazio: string;
}) {
  if (!itens.length) {
    return (
      <EstadoVazio
        texto={vazio}
      />
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {itens.map((item) => (
        <div
          key={item.id}
          className="phanyx-transporte-registration-item rounded-xl border p-3"
        >
          <div className="font-extrabold">
            {item.nome}
          </div>

          <div className="mt-1 text-xs opacity-70">
            {item.tipo}
          </div>
        </div>
      ))}
    </div>
  );
}

function EstadoVazio({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="phanyx-transporte-empty mt-4 rounded-xl border p-8 text-center">
      <div className="text-3xl">
        📭
      </div>

      <div className="mt-2 text-sm font-bold opacity-75">
        {texto}
      </div>
    </div>
  );
}