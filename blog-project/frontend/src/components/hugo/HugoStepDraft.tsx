'use client';

import { useState } from 'react';
import type { HugoDraft } from '@/app/hugo/page';

type Props = {
  draft: HugoDraft;
  onUpdate: (draft: HugoDraft) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function HugoStepDraft({ draft, onUpdate, onNext, onBack }: Props) {
  const [tab, setTab] = useState<'edit' | 'preview' | 'frontmatter'>('edit');


  const renderPreview = (md: string) => {
    return md
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-800 rounded p-3 overflow-x-auto text-sm text-green-300 my-3"><code>$2</code></pre>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-6 mb-2">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-200 mt-4 mb-1">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-emerald-500 pl-3 text-gray-400 italic my-2">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-300">• $1</li>')
      .replace(/\n\n/g, '<br/><br/>');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-gray-900 rounded p-1">
          {(['edit', 'preview', 'frontmatter'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                tab === t ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t === 'edit' ? '본문 편집' : t === 'preview' ? '미리보기' : '프론트매터'}
            </button>
          ))}
        </div>
        {draft.provider && (
          <span className="text-xs text-gray-500 ml-auto">via {draft.provider}</span>
        )}
      </div>

      {tab === 'edit' && (
        <textarea
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-3 text-sm text-gray-200 font-mono focus:outline-none focus:border-emerald-500 resize-none"
          rows={24}
          value={draft.content}
          onChange={e => onUpdate({ ...draft, content: e.target.value, full_md: `${draft.front_matter}\n\n${e.target.value}` })}
        />
      )}

      {tab === 'preview' && (
        <div
          className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 min-h-96 text-sm text-gray-300 leading-relaxed overflow-y-auto max-h-[600px]"
          dangerouslySetInnerHTML={{ __html: renderPreview(draft.content) }}
        />
      )}

      {tab === 'frontmatter' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">title</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                value={draft.title}
                onChange={e => {
                  const newFm = draft.front_matter.replace(/^title:.*$/m, `title: '${e.target.value}'`);
                  onUpdate({ ...draft, title: e.target.value, front_matter: newFm });
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">slug</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                value={draft.slug}
                onChange={e => {
                  const newFm = draft.front_matter.replace(/^slug:.*$/m, `slug: ${e.target.value}`);
                  onUpdate({ ...draft, slug: e.target.value, front_matter: newFm });
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">date</label>
            <input
              type="date"
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              value={draft.front_matter.match(/^date:\s*(.+)$/m)?.[1]?.trim() ?? ''}
              onChange={e => {
                const newFm = draft.front_matter.replace(/^date:.*$/m, `date: ${e.target.value}`);
                onUpdate({ ...draft, front_matter: newFm });
              }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">description</label>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              rows={2}
              value={draft.description}
              onChange={e => {
                const newFm = draft.front_matter.replace(/^description:.*$/m, `description: '${e.target.value}'`);
                onUpdate({ ...draft, description: e.target.value, front_matter: newFm });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">categories</label>
              <p className="text-xs text-gray-500">{draft.categories.join(', ')}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">tags</label>
              <p className="text-xs text-gray-500">{draft.tags.join(', ')}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">front_matter (raw)</label>
            <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-xs text-emerald-300 overflow-x-auto">{draft.front_matter}</pre>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>공백 포함 {draft.content.length.toLocaleString()}자</span>
        <span>파일명: {draft.slug}.md</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-medium transition-colors"
        >
          배포 →
        </button>
      </div>
    </div>
  );
}
