"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h1>Erro global</h1>
          <pre>{error.message}</pre>
          <button onClick={() => reset()}>Tentar novamente</button>
        </div>
      </body>
    </html>
  );
}