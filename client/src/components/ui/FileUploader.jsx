import { useId, useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { formatFileSize } from '../../utils/format';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

export default function FileUploader({
  files = [],
  onFilesSelected,
  onRemove,
  disabled = false,
  maxFiles = 5,
  className
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const generatedId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = (fileList) => {
    setError('');
    const selected = Array.from(fileList || []);
    if (!selected.length) return;

    if (files.length + selected.length > maxFiles) {
      setError(t('validation.max_files'));
      return;
    }

    const invalidType = selected.find((file) => !ACCEPTED.includes(file.type));
    if (invalidType) {
      setError(t('validation.file_type_invalid'));
      return;
    }

    const tooLarge = selected.find((file) => file.size > MAX_SIZE);
    if (tooLarge) {
      setError(t('validation.file_too_large'));
      return;
    }

    onFilesSelected(selected);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition',
          dragging
            ? 'border-rwanda-blue bg-rwanda-blue-soft'
            : 'border-ink/15 bg-ink/[0.015] hover:border-rwanda-blue/50 hover:bg-rwanda-blue-soft/40',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <input
          ref={inputRef}
          id={generatedId}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="sr-only"
          disabled={disabled || files.length >= maxFiles}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rwanda-blue-dark shadow-sm">
          <UploadCloud className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-ink">
          {t('submission.drop_files')}{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
            className="link disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('submission.browse')}
          </button>
        </p>
        <p className="mt-1.5 text-xs text-ink-muted">{t('submission.upload_hint')}</p>
      </div>

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

      {files.length ? (
        <ul className="space-y-2">
          {files.map((file) => {
            const isImage = file.mimeType?.startsWith('image/');
            const FileIcon = isImage ? ImageIcon : FileText;
            const uploading = file.status === 'uploading';

            return (
              <li
                key={file.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5',
                  file.status === 'error' ? 'border-red-200' : 'border-ink/10'
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rwanda-blue-soft text-rwanda-blue-dark">
                  <FileIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                    <span>{formatFileSize(file.size)}</span>
                    {uploading ? (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-rwanda-blue-dark">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t('submission.uploading')} {file.progress}%
                        </span>
                      </>
                    ) : null}
                    {file.status === 'error' ? (
                      <span className="font-medium text-red-600">{t('errors.file_type_invalid')}</span>
                    ) : null}
                  </div>
                  {uploading ? (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-rwanda-blue transition-all"
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(file)}
                  disabled={uploading}
                  className="rounded-lg p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t('submission.remove_file')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
