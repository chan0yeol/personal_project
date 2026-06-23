'use client';

import { useState } from 'react';
import type { Outline } from '@/app/page';

interface Props {
  onNext: (keyword: string, tone: string, outline: Outline) => void;
}

export default function StepInput({ onNext }: Props) {
  const [keyword, setKeyword] = useState('');
  const [subKeywords, setSubKeywords] = useState<string[]>(['', '', '', '', '']);
  const [urls, setUrls] = useState('');
  const [tone, setTone] = useState('informative');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestingMain, setSuggestingMain] = useState(false);
  const [mainReason, setMainReason] = useState('');
  const [error, setError] = useState('');

  async function handleSuggestMain() {
    setSuggestingMain(true);
    setError('');
    setMainReason('');
    try {
      const res = await fetch('/api/suggest-main-keyword', { method: 'POST' });
      if (!res.ok) throw new Error('메인 키워드 추천 실패');
      const data = await res.json();
      if (data.keyword) {
        setKeyword(data.keyword);
        setMainReason(data.reason || '');
        setSubKeywords(['', '', '', '', '']);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSuggestingMain(false);
    }
  }

  async function handleSuggest() {
    if (!keyword.trim()) { setError('메인 키워드를 먼저 입력해주세요.'); return; }
    setSuggesting(true);
    setError('');
    try {
      const res = await fetch('/api/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      if (!res.ok) throw new Error('추천 실패');
      const data = await res.json();
      const suggested = data.sub_keywords || [];
      setSubKeywords([
        suggested[0] ?? '',
        suggested[1] ?? '',
        suggested[2] ?? '',
        suggested[3] ?? '',
        suggested[4] ?? '',
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSubmit() {
    if (!keyword.trim()) { setError('메인 키워드를 입력해주세요.'); return; }
    const filledSubs = subKeywords.filter(k => k.trim());
    if (filledSubs.length === 0) { setError('서브키워드를 최소 1개 이상 입력해주세요.'); return; }
    setError('');
    setLoading(true);

    try {
      const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
      let references: string[] = [];

      if (urlList.length > 0) {
        const fetchRes = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: urlList }),
        });
        if (fetchRes.ok) {
          const fetched: { success: boolean; content: string; title: string }[] = await fetchRes.json();
          references = fetched.filter(f => f.success && f.content).map(f => `[${f.title}]\n${f.content}`);
        }
      }

      const outlineRes = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, sub_keywords: filledSubs, references, tone }),
      });

      if (!outlineRes.ok) {
        const err = await outlineRes.json();
        throw new Error(err.detail || '개요 생성 실패');
      }

      const outline: Outline = await outlineRes.json();
      onNext(keyword, tone, outline);
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 메인 키워드 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          메인 키워드 <span className="text-rose-400">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="예: 마그네슘 영양제"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSuggestMain}
            disabled={suggestingMain}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            title="건강·영양 분야의 메인 키워드를 AI가 자동 생성"
          >
            {suggestingMain ? '생성 중...' : '🎲 메인 키워드 추천'}
          </button>
          <button
            onClick={handleSuggest}
            disabled={suggesting}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {suggesting ? '추천 중...' : '서브키워드 추천'}
          </button>
        </div>
        {mainReason && (
          <p className="text-xs text-emerald-400 mt-2">💡 {mainReason}</p>
        )}
      </div>

      {/* 서브키워드 5개 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          서브키워드 <span className="text-gray-500 font-normal">(각 섹션 제목으로 활용)</span>
        </label>
        <div className="space-y-2">
          {subKeywords.map((kw, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-4">{i + 1}</span>
              <input
                type="text"
                value={kw}
                onChange={e => {
                  const next = [...subKeywords];
                  next[i] = e.target.value;
                  setSubKeywords(next);
                }}
                placeholder={`서브키워드 ${i + 1}`}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 참고 URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          참고 URL <span className="text-gray-500 font-normal">(한 줄에 하나, 선택)</span>
        </label>
        <textarea
          value={urls}
          onChange={e => setUrls(e.target.value)}
          rows={3}
          placeholder={"https://example.com/article1\nhttps://example.com/article2"}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
        />
      </div>

      {/* 톤 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">톤</label>
        <div className="flex gap-3">
          {[
            { value: 'informative', label: '정보형' },
            { value: 'casual', label: '친근한' },
            { value: 'professional', label: '전문적' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTone(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${tone === opt.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? '개요 생성 중...' : '개요 생성 →'}
      </button>
    </div>
  );
}
