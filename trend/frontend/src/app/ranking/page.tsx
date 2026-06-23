'use client';

import { useQuery } from '@tanstack/react-query';
import { trendApi, RankingDto } from '@/lib/api';
import { useState } from 'react';
import RankingGrid from '@/components/charts/RankingGrid';

export default function RankingPage() {
  const [platform, setPlatform] = useState<'GOOGLE' | 'NAVER'>('GOOGLE');

  const { data, isLoading } = useQuery<RankingDto>({
    queryKey: ['ranking', platform],
    queryFn: () => trendApi.getRanking(platform),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">실시간 순위</h2>
          <p className="text-sm text-gray-500 mt-1">매 1시간 자동 업데이트</p>
        </div>
        <div className="flex gap-2">
          {(['GOOGLE', 'NAVER'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                platform === p ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {p === 'GOOGLE' ? '🔍 Google' : '🟢 Naver'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="h-96 bg-gray-900 rounded-xl animate-pulse" />}
      {data && <RankingGrid ranking={data} />}
    </div>
  );
}
