import React, { useEffect, useState } from 'react';
import { fetchInspect } from '../api';

function Section({ title, children, empty }) {
  return (
    <div className="inspect-section">
      <div className="inspect-section-title">{title}</div>
      {empty ? <div className="inspect-empty">None</div> : children}
    </div>
  );
}

function EnvRow({ raw }) {
  const eq = raw.indexOf('=');
  if (eq === -1) return <div className="inspect-row"><span className="inspect-key">{raw}</span></div>;
  const key = raw.slice(0, eq);
  const val = raw.slice(eq + 1);
  return (
    <div className="inspect-row">
      <span className="inspect-key">{key}</span>
      <span className="inspect-eq">=</span>
      <span className="inspect-val">{val}</span>
    </div>
  );
}

function GenericRow({ value }) {
  if (typeof value === 'string') return <div className="inspect-row"><span className="inspect-val">{value}</span></div>;
  return (
    <div className="inspect-row inspect-row--obj">
      {Object.entries(value).map(([k, v]) => (
        <span key={k} className="inspect-kv"><span className="inspect-key">{k}</span><span className="inspect-eq">:</span><span className="inspect-val">{String(v)}</span></span>
      ))}
    </div>
  );
}

export default function InspectModal({ containerId, containerName, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetchInspect(containerId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [containerId]);

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal modal--inspect">
        <div className="modal-header">
          <div className="modal-title">Inspect — {containerName}</div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="inspect-body">
          {loading && <div className="inspect-loading">Loading…</div>}
          {error   && <div className="log-error">{error}</div>}
          {data && (
            <>
              <Section title="Ports" empty={!data.ports?.length}>
                {data.ports?.map((p, i) => <GenericRow key={i} value={p} />)}
              </Section>
              <Section title="Volumes" empty={!data.volumes?.length}>
                {data.volumes?.map((v, i) => <GenericRow key={i} value={v} />)}
              </Section>
              <Section title="Environment Variables" empty={!data.envVars?.length}>
                {data.envVars?.map((e, i) => <EnvRow key={i} raw={e} />)}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
