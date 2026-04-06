export default function SuportePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Suporte PHANYX
        </h1>

        <p className="text-slate-300 mb-10">
          Precisa de ajuda? Nossa equipe está pronta para atender sua instituição.
        </p>

        <div className="space-y-4">

          <a
            href="https://wa.me/5548988101240"
            target="_blank"
            className="block bg-green-600 hover:bg-green-500 p-4 rounded-xl"
          >
            💬 Falar no WhatsApp
          </a>

          <a
            href="mailto:atendimento@institutobatista.com"
            className="block bg-blue-600 hover:bg-blue-500 p-4 rounded-xl"
          >
            📧 Enviar email
          </a>

          <div className="bg-white/5 p-4 rounded-xl">
            📞 Comercial: (48) 98810-1240  
            <br />
            📞 Fixo: (48) 3208-1353
          </div>

        </div>
      </div>
    </div>
  );
}