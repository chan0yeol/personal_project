'use client';

import { RankingDto } from '@/lib/api';
import clsx from 'clsx';

interface Props {
  ranking: RankingDto;
}

export default function RankingCard({ ranking }: Props) {
  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300">
          {ranking.platform === 'GOOGLE' ? '🔍 Google' : '🟢 Naver'} 실시간 순위
        </h3>
        <span className="text-xs text-gray-600">{ranking.rankDate}</span>
      </div>

      <ol className="space-y-2">
        {ranking.rankings.slice(0, 10).map((item) => (
          <li key={item.keyword} className="flex items-center gap-3">
            <span className="w-5 text-right text-xs text-gray-500 font-mono">{item.rank}</span>
            <span className="flex-1 text-sm text-gray-200 truncate">{item.keyword}</span>
            <RankChangeBadge change={item.rankChange} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function RankChangeBadge({ change }: { change: number }) {
  if (change === 0) return <span className="text-xs text-gray-600">-</span>;
  if (change > 0)
    return <span className="badge-up">▲{change}</span>;
  return <span className="badge-down">▼{Math.abs(change)}</span>;
}
