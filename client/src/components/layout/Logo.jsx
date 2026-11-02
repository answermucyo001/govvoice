import { Link } from 'react-router-dom';
import { MessageSquareText } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Logo({ variant = 'light', compact = false, className }) {
  const dark = variant === 'dark';

  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="GovVoice Rwanda"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-rwanda-green shadow-sm ring-1 ring-black/5 transition group-hover:scale-105">
        <span className="absolute inset-x-0 top-0 h-1.5 bg-rwanda-blue" />
        <span className="absolute inset-x-0 top-1.5 h-1 bg-rwanda-yellow" />
        <MessageSquareText className="mt-1 h-5 w-5 text-white" strokeWidth={2.2} />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display text-lg font-extrabold tracking-tight',
              dark ? 'text-white' : 'text-ink'
            )}
          >
            GovVoice
          </span>
          <span
            className={cn(
              'mt-1 text-[10px] font-bold uppercase tracking-[0.22em]',
              dark ? 'text-white/65' : 'text-ink-muted'
            )}
          >
            Rwanda
          </span>
        </span>
      ) : null}
    </Link>
  );
}
