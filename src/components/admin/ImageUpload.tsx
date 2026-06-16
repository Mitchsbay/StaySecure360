'use client';

import { supabase } from '@/lib/supabase-client';
import { useState, useRef } from 'react';

interface ImageUploadProps {
  bucket: string;
  value: string;
  onChange: (url: string) => void;
  altValue?: string;
  onAltChange?: (alt: string) => void;
  label: string;
  accept?: string;
}

export function ImageUpload({ bucket, value, onChange, altValue, onAltChange, label, accept = 'image/*' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(publicUrl);
    setUploading(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
      {value && (
        <div className="mb-2">
          <img src={value} alt={altValue || label} className="w-32 h-32 object-cover rounded-lg border border-dark-700" />
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Choose file'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-3 py-2 text-sm text-dark-400 hover:text-error-500 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
        className="hidden"
      />
      {onAltChange && (
        <input
          type="text"
          value={altValue || ''}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Alt text"
          className="mt-2 w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      )}
    </div>
  );
}

interface FileUploadProps {
  bucket: string;
  value: string;
  onChange: (path: string) => void;
  label: string;
  accept?: string;
}

export function FileUpload({ bucket, value, onChange, label, accept = '.pdf,.zip' }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }

    onChange(path);
    setUploading(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
      {value && (
        <p className="mb-2 text-sm text-dark-400">File: {value}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Choose file'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-3 py-2 text-sm text-dark-400 hover:text-error-500 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
        className="hidden"
      />
    </div>
  );
}
