'use client';

import { useQuery } from '@tanstack/react-query';
import { trendApi, DashboardDto } from '@/lib/api';
import RankingGrid from '@/components/charts/RankingGrid';
import TrendLineChart from '@/components/charts/TrendLineChart';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardDto>({
    queryKey: ['dashboard'],
    queryFn: trendApi.getDashboard,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="대시보드 데이터를 불러오지 못했습니다." />;
  if (!data) return null;

  const recentTrends = data.recentTrends ?? [];
  const chartData = mergeTimeSeriesForChart(recentTrends);
  const chartKeywords = recentTrends.map((t) => t.keyword);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">대시보드</h2>
        <p className="text-sm text-gray-500 mt-1">
          마지막 업데이트: {new Date(data.lastUpdated).toLocaleString('ko-KR')}
        </p>
      </div>

      {/* 순위 AG Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.googleRanking && <RankingGrid ranking={data.googleRanking} />}
        {data.naverRanking && <RankingGrid ranking={data.naverRanking} />}
      </div>

      {/* 트렌드 라인 차트 */}
      {chartKeywords.length > 0 && (
        <TrendLineChart
          data={chartData}
          keywords={chartKeywords}
          title="상위 키워드 최근 7일 트렌드"
        />
      )}

      {/* 키워드별 통계 카드 */}
      {recentTrends.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentTrends.map((trend) => (
            <div key={trend.keyword} className="card">
              <p className="text-xs text-gray-500 mb-1">{trend.platform}</p>
              <h4 className="text-base font-semibold text-white mb-3 truncate">{trend.keyword}</h4>
              {trend.statistics && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <StatItem label="최고" value={trend.statistics.max?.toFixed(1)} />
                  <StatItem label="평균" value={trend.statistics.average?.toFixed(1)} />
                  <StatItem label="최저" value={trend.statistics.min?.toFixed(1)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-indigo-400">{value ?? '-'}</p>
    </div>
  );
}

function mergeTimeSeriesForChart(trends: DashboardDto['recentTrends']) {
  const map = new Map<string, Record<string, number | string>>();
  for (const trend of trends) {
    for (const point of trend.dataPoints) {
      const existing = map.get(point.date) ?? { date: point.date };
      existing[trend.keyword] = point.normalizedScore;
      map.set(point.date, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-40" />
      <div className="grid grid-cols-2 gap-5">
        {[0, 1].map((i) => <div key={i} className="h-64 bg-gray-900 rounded-xl" />)}
      </div>
      <div className="h-80 bg-gray-900 rounded-xl" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-rose-400 font-semibold">{message}</p>
        <p className="text-gray-600 text-sm mt-1">백엔드 서버 상태를 확인해 주세요.</p>
      </div>
    </div>
  );
}
