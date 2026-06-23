'use client';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useMemo, useState, useEffect } from 'react';

interface Props<T> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  height?: number;
  title?: string;
  gridOptions?: GridOptions<T>;
}

export default function TrendGrid<T>({ rowData, columnDefs, height = 400, title, gridOptions }: Props<T>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    flex: 1,
    minWidth: 80,
  }), []);

  if (!mounted) {
    return (
      <div className="card">
        {title && <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>}
        <div style={{ height }} className="bg-gray-900 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>}
      <div
        className="ag-theme-quartz-dark"
        style={{
          height,
          '--ag-background-color': '#111827',
          '--ag-header-background-color': '#1f2937',
          '--ag-odd-row-background-color': '#111827',
          '--ag-row-hover-color': '#1f2937',
          '--ag-border-color': '#374151',
          '--ag-foreground-color': '#e5e7eb',
          '--ag-header-foreground-color': '#9ca3af',
          '--ag-font-size': '13px',
          '--ag-row-height': '44px',
          '--ag-header-height': '40px',
        } as React.CSSProperties}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows
          pagination
          paginationPageSize={20}
          {...gridOptions}
        />
      </div>
    </div>
  );
}
