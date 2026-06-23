const BASE = '';

export const fetchContainers = () =>
  fetch(`${BASE}/api/containers?all=true`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export const containerAction = (id, action) =>
  fetch(`${BASE}/api/containers/${id}/${action}`, { method: 'POST' }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  });

export const getLogUrl = (id) => `${BASE}/api/containers/${id}/logs?tail=100`;
