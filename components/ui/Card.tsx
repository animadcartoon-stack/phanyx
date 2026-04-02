import React from "react";

type CardProps = {
  children: React.ReactNode;
};

export function Card({ children }: CardProps) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
      {children}
    </div>
  );
}
