import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getLogUrl } from '../api';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedLine({ line, query }) {
  if (!query) return <>{line}</>;
  const parts = line.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="log-mark">{part}</mark>
          : part
      )}
    </>
  );
}

export default function LogViewer({ containerId, containerName, onClose }) {
  const [lines, setLines]         = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const bottomRef                 = useRef(null);

  useEffect(() => {
    const es = new EventSource(getLogUrl(containerId));

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      setLines((prev) => {
        const next = [...prev, e.data];
        return next.length > 2000 ? next.slice(-2000) : next;
      });
    };

    es.onerror = () => {
      setConnected(false);
      setError('Connection lost. The container may have stopped or the stream ended.');
      es.close();
    };

    return () => es.close();
  }, [containerId]);

  // 검색 없을 때만 자동 스크롤
  useEffect(() => {
    if (!search) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return lines;
    const q = search.toLowerCase();
    return lines.filter((l) => l.toLowerCase().includes(q));
  }, [lines, search]);

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <span className={`conn-dot ${connected ? 'conn-dot--on' : 'conn-dot--off'}`} />
            <span>Logs — {containerName}</span>
            {search && <span className="log-match-count">{filtered.length} / {lines.length}</span>}
          </div>
          <div className="modal-header-actions">
            <input
              className="log-search"
              type="text"
              placeholder="Filter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-ghost" onClick={() => setLines([])}>Clear</button>
            <button className="btn btn-ghost" onClick={onClose}>✕</button>
          </div>
        </div>

        {error && <div className="log-error">{error}</div>}

        <div className="log-body">
          {filtered.length === 0 && !error && (
            <span className="log-waiting">
              {lines.length === 0 ? 'Waiting for log data…' : 'No lines match.'}
            </span>
          )}
          {filtered.map((line, i) => (
            <div key={i} className="log-line">
              <HighlightedLine line={line} query={search.trim()} />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
