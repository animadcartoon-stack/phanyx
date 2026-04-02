"use client";

type ToastType = "success" | "error" | "info";

type ToastProps = {
  message: string;
  type?: ToastType;
};

export default function Toast({
  message,
  type = "info",
}: ToastProps) {
  function getStyle() {
    if (type === "success") {
      return "bg-green-600 text-white";
    }

    if (type === "error") {
      return "bg-red-600 text-white";
    }

    return "bg-gray-800 text-white";
  }

  return (
    <div className="pointer-events-none fixed right-6 top-6 z-50">
      <div
        className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${getStyle()}`}
      >
        {message}
      </div>
    </div>
  );
}