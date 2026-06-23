import React, { useState } from 'react';
import { containerAction } from '../api';

const STATE_META = {
  running: { label: 'Running', color: '#22c55e' },
  exited:  { label: 'Exited',  color: '#ef4444' },
  paused:  { label: 'Paused',  color: '#f59e0b' },
  created: { label: 'Created', color: '#6b7280' },
  dead:    { label: 'Dead',    color: '#991b1b' },
};

export default function ContainerCard({ container, onRefresh, onViewLogs }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const id    = container.shortId ?? container.id ?? 'unknown';
  const name  = (container.names?.[0] ?? id).replace(/^\//, '');
  const state = (container.state ?? '').toLowerCase() || 'unknown';
  const meta  = STATE_META[state] ?? { label: state, color: '#6b7280' };
  const isRunning = state === 'running';

  const handleAction = async (action) => {
    setLoading(action);
    setError(null);
    try {
      await containerAction(container.id, action);
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-row">
          <span className="status-dot" style={{ background: meta.color }} />
          <span className="card-name" title={name}>{name}</span>
          <span className="status-badge" style={{ background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}66` }}>
            {meta.label}
          </span>
        </div>
        <div className="card-image" title={container.image}>{container.image}</div>
        <div className="card-status">{container.status}</div>
      </div>

      {error && <div className="card-error">{error}</div>}

      <div className="card-actions">
        <button
          className="btn btn-green"
          disabled={isRunning || loading !== null}
          onClick={() => handleAction('start')}
        >
          {loading === 'start' ? '…' : 'Start'}
        </button>
        <button
          className="btn btn-red"
          disabled={!isRunning || loading !== null}
          onClick={() => handleAction('stop')}
        >
          {loading === 'stop' ? '…' : 'Stop'}
        </button>
        <button
          className="btn btn-yellow"
          disabled={loading !== null}
          onClick={() => handleAction('restart')}
        >
          {loading === 'restart' ? '…' : 'Restart'}
        </button>
        <button
          className="btn btn-blue"
          onClick={() => onViewLogs(container.id, name)}
        >
          Logs
        </button>
      </div>
    </div>
  );
}
