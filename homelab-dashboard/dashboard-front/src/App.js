import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import ContainerCard from './components/ContainerCard';
import LogViewer from './components/LogViewer';
import { fetchContainers } from './api';

const POLL_INTERVAL = 5000;

export default function App() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logTarget, setLogTarget] = useState(null); // { id, name }
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const load = useCallback(async () => {
    try {
      const data = await fetchContainers();
      setContainers(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  const runningCount = containers.filter((c) => c.state?.toLowerCase() === 'running').length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-logo">⬡</span>
          <h1 className="app-title">Homelab Dashboard</h1>
        </div>
        <div className="app-header-right">
          {!loading && !error && (
            <span className="header-stat">
              <span className="stat-dot stat-dot--on" />
              {runningCount} / {containers.length} running
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="page-error">
            <strong>Failed to connect to backend:</strong> {error}
          </div>
        )}
        {loading && containers.length === 0 && (
          <div className="page-loading">Loading containers…</div>
        )}
        {!loading && !error && containers.length === 0 && (
          <div className="page-empty">No containers found.</div>
        )}

        <div className="card-grid">
          {containers.map((c) => (
            <ContainerCard
              key={c.id}
              container={c}
              onRefresh={load}
              onViewLogs={(id, name) => setLogTarget({ id, name })}
            />
          ))}
        </div>
      </main>

      {logTarget && (
        <LogViewer
          containerId={logTarget.id}
          containerName={logTarget.name}
          onClose={() => setLogTarget(null)}
        />
      )}
    </div>
  );
}
