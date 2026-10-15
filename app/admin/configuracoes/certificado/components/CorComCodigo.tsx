import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

export function normalizarCodigoCor(valor: string) {
  const limpo = valor.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(limpo)) return "#" + [...limpo].map((c) => c + c).join("").toUpperCase();
  return /^[0-9a-f]{6}$/i.test(limpo) ? "#" + limpo.toUpperCase() : null;
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onValueChange?: (cor: string) => void;
};

export default function CorComCodigo({ value, onValueChange, className, ...props }: Props) {
  const cor = normalizarCodigoCor(String(value || "#000000")) || "#000000";
  const [codigo, setCodigo] = useState(cor);
  const [invalido, setInvalido] = useState(false);
  const editandoRef = useRef(false);
  useEffect(() => {
    if (!editandoRef.current) { setCodigo(cor); setInvalido(false); }
  }, [cor]);

  const aplicar = (valor: string) => {
    const normalizado = normalizarCodigoCor(valor);
    if (!normalizado) { setInvalido(true); return false; }
    setCodigo(normalizado);
    setInvalido(false);
    if (normalizado.toLowerCase() !== cor.toLowerCase()) onValueChange?.(normalizado.toLowerCase());
    return true;
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-cor-com-codigo>
      <input {...props} type="color" value={cor.toLowerCase()}
        className={className}
        aria-label={props["aria-label"] || "HEX"}
        onChange={(evento) => aplicar(evento.currentTarget.value)} />
      <div className="flex min-w-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-600 dark:bg-slate-900">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">HEX</span>
        <input type="text" value={codigo} spellCheck={false} autoComplete="off" disabled={props.disabled} readOnly={props.readOnly}
          aria-label="HEX" aria-invalid={invalido} maxLength={16}
          className={`min-w-0 w-full bg-transparent py-1.5 font-mono text-xs text-slate-900 outline-none dark:text-white ${invalido ? "ring-2 ring-red-500" : ""}`}
          onFocus={(evento) => { editandoRef.current = true; evento.currentTarget.select(); }}
          onChange={(evento) => { setCodigo(evento.currentTarget.value); setInvalido(false); }}
          onPaste={(evento) => {
            const texto = evento.clipboardData.getData("text/plain");
            if (normalizarCodigoCor(texto)) { evento.preventDefault(); aplicar(texto); }
          }}
          onBlur={() => { editandoRef.current = false; aplicar(codigo); }}
          onKeyDown={(evento) => {
            evento.stopPropagation();
            if (evento.key === "Enter") { evento.preventDefault(); evento.currentTarget.blur(); }
            if (evento.key === "Escape") { setCodigo(cor); setInvalido(false); editandoRef.current = false; }
          }} />
      </div>
    </div>
  );
}
