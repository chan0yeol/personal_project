'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import 'bytemd/dist/index.css';
import 'highlight.js/styles/github.css';

const plugins = [gfm(), highlight(), mermaid()];

interface Post {
    filename: string;
    title: string;
    date: string;
    categories: string[];
    tags: string[];
    draft: boolean;
}

export default function EditorPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categories, setCategories] = useState('');
    const [tags, setTags] = useState('');
    const [draft, setDraft] = useState(false);
    const [date, setDate] = useState(() => {
        const today = new Date().toISOString().split('T')[0];
        return `${today}T21:00`;
    });
    const [status, setStatus] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [editingFilename, setEditingFilename] = useState<string | null>(null);

    const fetchPosts = async () => {
        const res = await fetch('/api/posts');
        const data = await res.json();
        setPosts(data.posts);
    };

    useEffect(() => {
        const loadPosts = async () => {
            const res = await fetch('/api/posts');
            const data = await res.json();
            setPosts(data.posts);
        };
        loadPosts();
    }, []);

    const handleEdit = async (filename: string) => {
        const res = await fetch(`/api/posts/${filename}`);
        const data = await res.json();
        setTitle(data.title ?? '');
        setContent(data.content ?? '');
        setCategories(data.categories ?? '');
        setTags(data.tags ?? '');
        setDraft(data.draft ?? false);
        setDate(data.date ?? `${new Date().toISOString().split('T')[0]}T21:00`);
        setEditingFilename(filename);
        setStatus('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNew = () => {
        setTitle('');
        setContent('');
        setCategories('');
        setTags('');
        setDraft(false);
        setDate(`${new Date().toISOString().split('T')[0]}T21:00`);
        setEditingFilename(null);
        setStatus('');
    };

    const handleSave = async () => {
        if (!title || !content) {
            setStatus('❌ 제목과 내용을 입력해주세요.');
            return;
        }
        setStatus('저장 중...');

        try {
            let res;
            if (editingFilename) {
                res = await fetch(`/api/posts/${editingFilename}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content, categories, tags, draft, date }),
                });
            } else {
                res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content, categories, tags, draft, date }),
                });
            }

            const data = await res.json();

            if (data.success) {
                setStatus(`✅ 저장 완료: ${data.filename}`);
                setEditingFilename(data.filename);
                fetchPosts();
            } else {
                setStatus(`❌ 저장 실패: ${data.error}`);
            }
        } catch {
            setStatus('❌ 서버 오류');
        }
    };

    // 이미지 업로드 핸들러
    const handleUploadImages = async (files: File[]) => {
        const results = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            results.push({ title: file.name, url: data.url });
        }
        return results;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-800">📝 블로그 에디터</h1>
                <button
                    onClick={handleNew}
                    className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition"
                >
                    + 새 글 작성
                </button>
            </header>

            <div className="max-w-7xl mx-auto p-6 flex gap-6">
                {/* 에디터 영역 */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">
                            {editingFilename ? '✏️ 글 수정' : '🆕 새 글 작성'}
                        </h2>

                        {/* 제목 */}
                        <input
                            type="text"
                            placeholder="제목을 입력하세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />

                        {/* 발행일 + draft */}
                        <div className="flex items-end gap-4 mb-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500 font-medium">발행일</label>
                                <input
                                    type="datetime-local"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer pb-2">
                                <input
                                    type="checkbox"
                                    checked={draft}
                                    onChange={(e) => setDraft(e.target.checked)}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-sm text-gray-600">임시저장 (draft)</span>
                            </label>
                        </div>

                        {/* categories / tags */}
                        <div className="flex gap-3 mb-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 font-medium block mb-1">Categories</label>
                                <input
                                    type="text"
                                    placeholder="Spring Boot, Backend"
                                    value={categories}
                                    onChange={(e) => setCategories(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 font-medium block mb-1">Tags</label>
                                <input
                                    type="text"
                                    placeholder="Java, API, Clean Code"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                        </div>

                        {/* ByteMD 에디터 */}
                        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                            <Editor
                                mode="split"
                                value={content}
                                plugins={plugins}
                                onChange={(v) => setContent(v)}
                                uploadImages={handleUploadImages}
                            />
                        </div>

                        {/* 저장 버튼 */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                                {editingFilename ? '✅ 수정 저장' : '💾 저장'}
                            </button>
                            {status && <p className="text-sm text-gray-500">{status}</p>}
                        </div>
                    </div>
                </div>

                {/* 글 목록 사이드바 */}
                <div className="w-72 shrink-0">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">
                            글 목록 ({posts.length})
                        </h2>
                        <div className="flex flex-col gap-2 max-h-[75vh] overflow-y-auto">
                            {posts.map((post) => (
                                <div
                                    key={post.filename}
                                    onClick={() => handleEdit(post.filename)}
                                    className={`rounded-lg p-3 cursor-pointer transition border ${
                                        editingFilename === post.filename
                                            ? 'border-blue-400 bg-blue-50'
                                            : 'border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
                      {post.title}
                    </span>
                                        {post.draft && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded shrink-0">
                        draft
                      </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mb-1.5">
                                        {post.date
                                            ? new Date(post.date).toLocaleDateString('ko-KR')
                                            : '날짜 없음'}
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                        {post.categories.map((c) => (
                                            <span key={c} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {c}
                      </span>
                                        ))}
                                        {post.tags.slice(0, 2).map((t) => (
                                            <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        #{t}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}