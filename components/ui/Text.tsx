type Props = {
  children: React.ReactNode;
  type?: "success" | "warning" | "error";
};

export function Title({ children }: Props) {
  return (
    <h1 className="text-2xl font-bold text-gray-900">
      {children}
    </h1>
  );
}

export function Text({ children }: Props) {
  return (
    <p className="text-gray-800">
      {children}
    </p>
  );
}

export function Label({ children }: Props) {
  return (
    <span className="font-semibold text-gray-900">
      {children}
    </span>
  );
}

export function Status({ children, type = "success" }: Props) {
  const colors = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-3 py-1 rounded ${colors[type]}`}>
      {children}
    </span>
  );
}
