import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err.response?.status, err.message);
    return Promise.reject(err);
  }
);

export default api;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DataPoint {
  date: string;
  normalizedScore: number;
  rawScore: number;
  newsMentionCount: number;
}

export interface Statistics {
  max: number;
  min: number;
  average: number;
  peakDate: string | null;
}

export interface TimeSeriesDto {
  keyword: string;
  platform: string;
  dataPoints: DataPoint[];
  statistics: Statistics;
}

export interface RankItem {
  rank: number;
  keyword: string;
  rankChange: number;
  score?: number;
}

export interface RankingDto {
  platform: string;
  rankDate: string;
  rankings: RankItem[];
}

export interface ComparisonDto {
  keywords: string[];
  platform: string;
  timeframe: string;
  chartData: Record<string, number | string>[];
  statistics: Record<string, Statistics>;
}

export interface DashboardDto {
  googleRanking: RankingDto;
  naverRanking: RankingDto;
  recentTrends: TimeSeriesDto[];
  lastUpdated: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const trendApi = {
  getDashboard: (): Promise<DashboardDto> =>
    api.get('/api/v1/trends/dashboard').then((r) => r.data),

  getTimeSeries: (keyword: string, platform = 'GOOGLE', days = 30): Promise<TimeSeriesDto> =>
    api.get('/api/v1/trends/timeseries', { params: { keyword, platform, days } }).then((r) => r.data),

  compareKeywords: (keywords: string[], platform = 'GOOGLE', days = 30): Promise<ComparisonDto> =>
    api.get('/api/v1/trends/compare', { params: { keywords, platform, days } }).then((r) => r.data),

  getRanking: (platform = 'GOOGLE'): Promise<RankingDto> =>
    api.get('/api/v1/trends/ranking', { params: { platform } }).then((r) => r.data),

  addKeyword: (name: string, category?: string) =>
    api.post('/api/v1/trends/keywords', { name, category }).then((r) => r.data),

  getKeywords: () =>
    api.get('/api/v1/trends/keywords').then((r) => r.data),
};
