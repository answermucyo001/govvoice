import { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import attachmentService from '../../services/attachment.service';
import { useToast } from '../../context/ToastContext';
import { formatFileSize } from '../../utils/format';
import { cn } from '../../utils/cn';

export default function AttachmentList({ attachments = [], className }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [downloading, setDownloading] = useState(null);

  if (!attachments.length) {
    return <p className="text-sm text-ink-muted">{t('submission.no_attachments')}</p>;
  }

  const handleDownload = async (attachment) => {
    setDownloading(attachment.id);
    try {
      await attachmentService.download(attachment.id, attachment.originalName);
    } catch {
      toast.error(t('common.error'), t('errors.generic'));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <ul className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {attachments.map((attachment) => {
        const isImage = attachment.mimeType?.startsWith('image/');
        const Icon = isImage ? ImageIcon : FileText;
        const busy = downloading === attachment.id;

        return (
          <li
            key={attachment.id}
            className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-3 py-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rwanda-blue-soft text-rwanda-blue-dark">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{attachment.originalName}</p>
              <p className="text-xs text-ink-muted">{formatFileSize(attachment.sizeBytes)}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload(attachment)}
              disabled={busy}
              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-rwanda-blue-soft hover:text-rwanda-blue-dark disabled:opacity-50"
              aria-label={t('common.download')}
              title={t('common.download')}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
