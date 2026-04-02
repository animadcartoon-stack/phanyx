import React from "react";

type TableProps = {
  headers: string[];
  children: React.ReactNode;
};

export function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y">
          {children}
        </tbody>
      </table>
    </div>
  );
}
