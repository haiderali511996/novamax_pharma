'use client';

import { useState } from 'react';
import { uploadFile } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
// Uploaded files are served from the backend's origin, not the /api prefix.
const FILE_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export default function FileUploadField({ field, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data } = await uploadFile(file);
      onChange(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        id={field.name}
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs focus:border-emerald-500 focus:outline-none"
      />
      {uploading && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {value && !uploading && (
        <a
          href={`${FILE_ORIGIN}${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-emerald-700 hover:underline"
        >
          View uploaded file
        </a>
      )}
    </div>
  );
}
