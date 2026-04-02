"use client";

import { useEffect, useState } from "react";

export default function PagamentoPage() {
  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagamentoId, setPagamentoId] = useState<number | null>(null);

async function confirmarPagamento() {
  if (!pagamentoId) return;

  try {
    const res = await fetch("/api/pagamentos/confirmar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: pagamentoId }),
    });

    const data = await res.json();

    if (!res.ok || !data?.success) {
      console.error("Erro ao confirmar pagamento:", data);
      alert("Não foi possível confirmar o pagamento.");
      return;
    }

    const email = data?.user?.email;
    const senha = "123456";

    if (!email) {
      alert("Usuário criado sem email. Não foi possível entrar automaticamente.");
      return;
    }

    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      console.error("Erro no login automático:", loginData);
      alert("Pagamento confirmado, mas o login automático falhou.");
      return;
    }

    window.location.href = "/aluno";
  } catch (error) {
    console.error("Erro ao confirmar pagamento", error);
    alert("Erro ao concluir o acesso do aluno.");
  }
}

  useEffect(() => {
    async function gerarPagamento() {
      try {
        const res = await fetch("/api/pagamentos/criar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: "Cliente PHANYX",
            email: "cliente@email.com",
            cpfCnpj: "12345678909",
            valor: 99,
          }),
        });

        const data = await res.json();
console.log("RESPOSTA PAGAMENTO:", data);

if (!res.ok) {
  console.error("Erro da API:", data);
}

setPixCode(data?.pagamento?.pixCode || "");
setPagamentoId(data?.pagamento?.id || null);
      } catch (error) {
        console.error("Erro ao gerar pagamento", error);
      } finally {
        setLoading(false);
      }
    }


    gerarPagamento();
  }, []);

  function copiarPix() {
    navigator.clipboard.writeText(pixCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-800">
        <h1 className="text-2xl font-bold mb-2 text-center">
          Finalizar pagamento
        </h1>

        <p className="text-gray-400 text-center mb-6">
          Escaneie o QR Code ou copie o código Pix
        </p>

        {/* QR CODE (simulado visualmente) */}
        <div className="bg-white p-4 rounded-xl mb-6 flex justify-center">
          <div className="w-48 h-48 bg-gray-300 flex items-center justify-center text-black text-sm">
            QR CODE PIX
          </div>
        </div>

        {/* VALOR */}
        <div className="text-center mb-6">
          <p className="text-gray-400">Valor</p>
          <p className="text-3xl font-bold">R$ 99,00</p>
        </div>

        {/* PIX */}
        {loading ? (
          <p className="text-center text-gray-400">Gerando pagamento...</p>
        ) : (
          <>
            <div className="bg-gray-800 p-3 rounded-lg text-sm break-all mb-4">
              {pixCode || "Erro ao gerar código Pix"}
            </div>

            <button
              onClick={copiarPix}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition mb-4"
            >
              {copiado ? "Copiado!" : "Copiar código Pix"}
            </button>
          </>
        )}

        <button
  onClick={confirmarPagamento}
  className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold transition"
>
  Já paguei
</button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Após o pagamento, a confirmação pode levar alguns segundos.
        </p>
      </div>
    </div>
  );
}