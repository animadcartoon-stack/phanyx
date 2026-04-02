"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Erro</h1>
      <pre>{error.message}</pre>
      <button onClick={() => reset()}>Tentar novamente</button>
    </div>
  );
}