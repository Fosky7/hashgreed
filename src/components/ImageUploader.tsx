// src/components/ImageUploader.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
  uploadImageToIpfs,
  validateImageFile,
  type IpfsUploadResult,
} from '@/lib/blockchain/kross/ipfs';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface ImageUploaderProps {
  /** Current image URL (gateway URL) once uploaded. */
  value?: string;
  /** Fired with the full IPFS result after a successful pin. */
  onUploaded: (result: IpfsUploadResult) => void;
  /** Fired when the image is cleared. */
  onClear?: () => void;
  /** External error to surface (e.g. submit-time required error). */
  error?: string | null;
}

/**
 * Drag-and-drop image uploader that pins to IPFS via the secure edge function.
 * Shows a loading spinner during upload and clear inline error states.
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onUploaded,
  onClear,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const handleFile = useCallback(
    async (file: File) => {
      setLocalError(null);

      const clientError = validateImageFile(file);
      if (clientError) {
        setLocalError(clientError);
        setStatus('error');
        return;
      }

      // Optimistic local preview while uploading.
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setStatus('uploading');

      try {
        const result = await uploadImageToIpfs(file);
        setPreview(result.url);
        setStatus('success');
        onUploaded(result);
      } catch (e) {
        setStatus('error');
        setLocalError(e instanceof Error ? e.message : 'Upload failed.');
        setPreview(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    },
    [onUploaded],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const clear = () => {
    setPreview(null);
    setStatus('idle');
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  const shownError = localError ?? error ?? null;
  const isUploading = status === 'uploading';

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
        Image
      </label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-[var(--border-color)]">
          <img
            src={preview}
            alt="NFT preview"
            className="w-full h-56 object-cover"
          />

          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-sm">
              <svg
                className="h-7 w-7 animate-spin text-white"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                />
              </svg>
              <span className="text-xs font-medium text-white">
                Pinning to IPFS…
              </span>
            </div>
          )}

          {status === 'success' && !isUploading && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-1 text-[11px] font-semibold text-white shadow">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Pinned to IPFS
            </span>
          )}

          {!isUploading && (
            <button
              type="button"
              onClick={clear}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
              aria-label="Remove image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-[var(--color-primary)] bg-[var(--hover-bg)]'
              : shownError
                ? 'border-red-500'
                : 'border-[var(--border-color)] hover:border-[var(--color-primary)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          <svg
            className="h-9 w-9 text-[var(--text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Drag & drop an image, or{' '}
            <span style={{ color: 'var(--color-primary)' }}>browse</span>
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            PNG, JPG, GIF, WEBP or SVG — up to 15 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={onInputChange}
      />

      {shownError && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600" role="alert">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {shownError}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
