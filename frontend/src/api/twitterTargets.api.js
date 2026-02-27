/**
 * Parse Targets API client
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export async function getTargets() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/targets`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export async function createTarget(dto) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export async function updateTarget(id, dto) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/targets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export async function deleteTarget(id) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/targets/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return true;
}

export async function toggleTarget(id) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/targets/${id}/toggle`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export async function getQuota() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/quota`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export async function schedulePreview() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/schedule/preview`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export async function scheduleCommit() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/schedule/commit`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}
