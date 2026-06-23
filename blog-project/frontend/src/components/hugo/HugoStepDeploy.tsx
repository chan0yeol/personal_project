'use client';

import { useState } from 'react';
import type { HugoDraft } from '@/app/hugo/page';

type Props = {
  draft: HugoDraft;
  coverUrl: string;
  bodyUrl: string;
  onBack: () => void;
  onDone: () => void;
};

type DeployResult = {
  github_url: string;
  blog_url: string;
  oci_status: string;
};

export default function HugoStepDeploy({ draft, coverUrl, bodyUrl, onBack, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [error, setError] = useState('');

  const handleDeploy = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/hugo/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: draft.slug,
          full_md: `${draft.front_matter}\n\n${draft.content}`,
          title: draft.title,
          cover_url: coverUrl,
          body_url: bodyUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '배포 실패');
      }
      const data: DeployResult = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '배포 실패');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div className="bg-emerald-900/30 border border-emerald-700 rounded p-4 space-y-3">
          <p className="text-emerald-400 font-medium">배포 완료</p>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">GitHub: </span>
              <a href={result.github_url} target="_blank" rel="noreferrer"
                className="text-emerald-400 hover:underline break-all">{result.github_url}</a>
            </div>
            {result.blog_url && (
              <div>
                <span className="text-gray-400">블로그: </span>
                <a href={result.blog_url} target="_blank" rel="noreferrer"
                  className="text-emerald-400 hover:underline break-all">{result.blog_url}</a>
              </div>
            )}
            <div>
              <span className="text-gray-400">OCI 빌드: </span>
              <span className={result.oci_status.startsWith('success') ? 'text-emerald-400' : 'text-yellow-400'}>
                {result.oci_status}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDone}
          className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 rounded font-medium transition-colors"
        >
          새 글 작성
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-700 rounded p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">파일명</span>
          <span className="text-gray-200 font-mono">{draft.slug}.md</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">제목</span>
          <span className="text-gray-200">{draft.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">카테고리</span>
          <span className="text-gray-200">{draft.categories.join(', ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">글자 수</span>
          <span className="text-gray-200">{draft.content.length.toLocaleString()}자</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded p-3">
        <p className="text-xs text-gray-500 mb-1">Front Matter 미리보기</p>
        <pre className="text-xs text-emerald-300 overflow-x-auto">{draft.front_matter}</pre>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={handleDeploy}
          disabled={loading}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 rounded font-medium transition-colors"
        >
          {loading ? 'GitHub 커밋 중...' : 'GitHub 커밋 + OCI 빌드'}
        </button>
      </div>
    </div>
  );
}
