import type { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  rows: ReactNode[][];
}

export function Table({ headers, rows }: TableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--mxl-color-border)' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '0.5rem', borderBottom: '1px solid var(--mxl-color-border)' }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
