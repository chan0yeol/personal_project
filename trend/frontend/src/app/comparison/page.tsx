'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trendApi, ComparisonDto, Statistics } from '@/lib/api';
import TrendLineChart from '@/components/charts/TrendLineChart';
import TrendGrid from '@/components/ui/TrendGrid';
import { ColDef } from 'ag-grid-community';

const PLATFORMS = ['GOOGLE', 'NAVER'];
const DAY_OPTIONS = [7, 14, 30, 90];

interface StatsRow {
  keyword: string;
  max: number;
  min: number;
  average: number;
  peakDate: string;
}

export default function ComparisonPage() {
  const [inputValue, setInputValue] = useState('');
  const [keywords, setKeywords] = useState<string[]>(['AI', '챗GPT']);
  const [platform, setPlatform] = useState('GOOGLE');
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = useQuery<ComparisonDto>({
    queryKey: ['compare', keywords, platform, days],
    queryFn: () => trendApi.compareKeywords(keywords, platform, days),
    enabled: keywords.length >= 2,
  });

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || keywords.includes(trimmed) || keywords.length >= 5) return;
    setKeywords([...keywords, trimmed]);
    setInputValue('');
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const statsColumnDefs = useMemo<ColDef<StatsRow>[]>(() => [
    { field: 'keyword', headerName: '키워드', flex: 2 },
    {
      field: 'max', headerName: '최고점', flex: 1,
      valueFormatter: ({ value }) => value?.toFixed(1) ?? '-',
      cellStyle: { color: '#818cf8' },
    },
    {
      field: 'min', headerName: '최저점', flex: 1,
      valueFormatter: ({ value }) => value?.toFixed(1) ?? '-',
      cellStyle: { color: '#6b7280' },
    },
    {
      field: 'average', headerName: '평균', flex: 1,
      valueFormatter: ({ value }) => value?.toFixed(1) ?? '-',
      cellStyle: { color: '#22d3ee' },
    },
    { field: 'peakDate', headerName: '최고 날짜', flex: 1 },
  ], []);

  const statsRowData = useMemo<StatsRow[]>(() => {
    if (!data?.statistics) return [];
    return (data.keywords ?? []).map((kw) => {
      const s: Statistics = data.statistics[kw] ?? {};
      return {
        keyword: kw,
        max: s.max ?? 0,
        min: s.min ?? 0,
        average: s.average ?? 0,
        peakDate: s.peakDate ?? '-',
      };
    });
  }, [data]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">키워드 비교</h2>
        <p className="text-sm text-gray-500 mt-1">최대 5개 키워드의 트렌드를 비교합니다.</p>
      </div>

      {/* 설정 패널 */}
      <div className="card space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-2">키워드 추가</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="키워드 입력 후 Enter"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={addKeyword}
              disabled={keywords.length >= 5}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              추가
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-900/50 border border-indigo-700 rounded-full text-sm text-indigo-300"
              >
                {kw}
                <button onClick={() => removeKeyword(kw)} className="text-indigo-500 hover:text-rose-400 transition-colors">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-gray-400 mb-2">플랫폼</label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    platform === p ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">기간</label>
            <div className="flex gap-2">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    days === d ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {d}일
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading && <div className="h-72 bg-gray-900 rounded-xl animate-pulse" />}
      {error && (
        <div className="card text-rose-400 text-sm">데이터를 불러오지 못했습니다. 키워드를 확인하거나 잠시 후 다시 시도하세요.</div>
      )}

      {data && data.chartData.length > 0 && (
        <>
          <TrendLineChart
            data={data.chartData as Record<string, number | string>[]}
            keywords={data.keywords}
            title={`${data.keywords.join(' vs ')} — 최근 ${days}일 비교`}
          />

          <TrendGrid
            rowData={statsRowData}
            columnDefs={statsColumnDefs}
            height={200}
            title="키워드별 통계"
            gridOptions={{ pagination: false }}
          />
        </>
      )}

      {data && data.chartData.length === 0 && (
        <div className="card text-center py-10 text-gray-500">
          해당 키워드의 수집된 데이터가 없습니다. 스케줄러가 실행된 후 다시 확인하세요.
        </div>
      )}
    </div>
  );
}
