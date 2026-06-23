'use client';

import { useMemo } from 'react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import TrendGrid from '@/components/ui/TrendGrid';
import { RankingDto, RankItem } from '@/lib/api';

interface Props {
  ranking: RankingDto;
}

function RankChangeCellRenderer({ value }: ICellRendererParams) {
  if (value === 0 || value == null) return <span className="text-gray-500">-</span>;
  if (value > 0) return <span className="text-emerald-400 font-semibold">▲ {value}</span>;
  return <span className="text-rose-400 font-semibold">▼ {Math.abs(value)}</span>;
}

function RankCellRenderer({ value }: ICellRendererParams) {
  const colors: Record<number, string> = { 1: 'text-amber-400', 2: 'text-gray-300', 3: 'text-amber-600' };
  return (
    <span className={`font-bold ${colors[value] ?? 'text-gray-500'}`}>{value}</span>
  );
}

export default function RankingGrid({ ranking }: Props) {
  const columnDefs = useMemo<ColDef<RankItem>[]>(() => [
    {
      field: 'rank',
      headerName: '순위',
      width: 80,
      flex: 0,
      cellRenderer: RankCellRenderer,
    },
    {
      field: 'keyword',
      headerName: '키워드',
      flex: 2,
    },
    {
      field: 'rankChange',
      headerName: '변동',
      width: 100,
      flex: 0,
      cellRenderer: RankChangeCellRenderer,
    },
  ], []);

  const platform = ranking.platform === 'GOOGLE' ? '🔍 Google' : '🟢 Naver';

  return (
    <TrendGrid
      rowData={ranking.rankings}
      columnDefs={columnDefs}
      height={420}
      title={`${platform} 실시간 순위 — ${ranking.rankDate}`}
      gridOptions={{ pagination: false }}
    />
  );
}
