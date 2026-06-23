'use client';

import { useState } from 'react';
import type { HugoOutline } from '@/app/hugo/page';

const CATEGORY_OPTIONS = ['Docker', 'Kubernetes', 'Python', 'FastAPI', 'Linux', 'CI/CD', 'Git', 'AWS', 'Nginx', 'Database', '기타'];
const POST_TYPES = [
  { value: 'tutorial', label: '튜토리얼' },
  { value: 'troubleshooting', label: '트러블슈팅' },
];

type Props = {
  onNext: (topic: string, categories: string[], postType: string, outline: HugoOutline) => void;
};

export default function HugoStepInput({ onNext }: Props) {
  const [topic, setTopic] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [postType, setPostType] = useState('tutorial');
  const [refUrl, setRefUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<{ keyword: string; post_type: string }[]>([]);

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSuggest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/hugo/suggest-keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), category: categories[0] || '' }),
      });
      const data = await res.json();
      setSuggestions(data.keywords || []);
    } catch {
      setError('키워드 추천 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!topic.trim()) { setError('주제를 입력하세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const references: string[] = [];
      if (refUrl.trim()) {
        const r = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: [refUrl.trim()] }),
        });
        const d = await r.json();
        if (d.results?.[0]?.content) references.push(d.results[0].content);
      }

      const res = await fetch('/api/hugo/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, categories, post_type: postType, references }),
      });
      if (!res.ok) throw new Error(await res.text());
      const outline: HugoOutline = await res.json();
      onNext(topic, categories, postType, outline);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '개요 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-1">주제 *</label>
        <input
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          placeholder="예: Docker Compose 네트워크 설정"
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setTopic(s.keyword); setPostType(s.post_type); }}
              className="px-3 py-1 bg-gray-800 hover:bg-emerald-900 border border-gray-700 rounded text-sm text-gray-300"
            >
              {s.keyword} <span className="text-gray-500 text-xs ml-1">{s.post_type}</span>
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-gray-400">카테고리</label>
          <button
            onClick={handleSuggest}
            disabled={loading}
            className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            키워드 추천
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded text-sm border transition-colors ${
                categories.includes(cat)
                  ? 'bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">글 유형</label>
        <div className="flex gap-3">
          {POST_TYPES.map(pt => (
            <button
              key={pt.value}
              onClick={() => setPostType(pt.value)}
              className={`px-4 py-2 rounded border text-sm transition-colors ${
                postType === pt.value
                  ? 'bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">참고 URL (선택)</label>
        <input
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          placeholder="https://..."
          value={refUrl}
          onChange={e => setRefUrl(e.target.value)}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleNext}
        disabled={loading}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 rounded font-medium transition-colors"
      >
        {loading ? '생성 중...' : '개요 생성 →'}
      </button>
    </div>
  );
}
