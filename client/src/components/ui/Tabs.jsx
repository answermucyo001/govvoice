import { cn } from '../../utils/cn';

export default function Tabs({ items = [], active, onChange, className }) {
  return (
    <div
      className={cn(
        'no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-ink/10 bg-white p-1',
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
              selected
                ? 'bg-ink text-white shadow-sm'
                : 'text-ink-soft hover:bg-ink/[0.05] hover:text-ink'
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
            {item.badge !== undefined && item.badge !== null ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  selected ? 'bg-white/20 text-white' : 'bg-ink/10 text-ink-soft'
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
