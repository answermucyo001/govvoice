import { cn } from '../../utils/cn';

export default function EmptyState({ icon: Icon, title, body, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white px-6 py-14 text-center',
        className
      )}
    >
      {Icon ? (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rwanda-blue-soft text-rwanda-blue-dark">
          <Icon className="h-7 w-7" />
        </span>
      ) : null}
      {title ? <h3 className="text-lg font-bold text-ink">{title}</h3> : null}
      {body ? <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
