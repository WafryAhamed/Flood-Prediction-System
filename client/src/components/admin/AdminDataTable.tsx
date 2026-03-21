import React from 'react';

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface Row {
  [key: string]: React.ReactNode;
}

interface AdminDataTableProps {
  columns: Column[];
  rows: Row[];
  striped?: boolean;
  hover?: boolean;
  emptyMessage?: string;
}

export function AdminDataTable({
  columns,
  rows,
  striped = true,
  hover = true,
  emptyMessage = 'No data available',
}: AdminDataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 border-b border-gray-700">
          <tr className="text-xs font-bold text-gray-400 uppercase">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`${
                striped && rowIdx % 2 === 1 ? 'bg-gray-800/50' : ''
              } ${hover ? 'hover:bg-gray-700/50 transition-colors' : ''}`}
            >
              {columns.map((col) => (
                <td key={`${rowIdx}-${col.key}`} className="px-6 py-4 text-gray-300">
                  {row[col.key] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
