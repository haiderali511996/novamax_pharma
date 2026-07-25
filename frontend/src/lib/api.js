const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('novamax_token');
}

export async function apiFetch(path, { method = 'GET', body, params } = {}) {
  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const token = getToken();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

// File uploads bypass apiFetch's JSON body handling - multipart requests
// must not set a Content-Type header themselves (the browser adds the
// boundary), and the body is FormData, not a JSON-serializable object.
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const token = getToken();

  const res = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Upload failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  get: (path, params) => apiFetch(path, { method: 'GET', params }),
  post: (path, body) => apiFetch(path, { method: 'POST', body }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body }),
  del: (path) => apiFetch(path, { method: 'DELETE' }),
};
