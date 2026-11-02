import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function StepIndicator({ steps = [], current = 0, onStepClick, className }) {
  return (
    <ol className={cn('flex items-center gap-1.5 sm:gap-2', className)}>
      {steps.map((step, index) => {
        const completed = index < current;
        const active = index === current;
        const clickable = Boolean(onStepClick) && index < current;

        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(index)}
              className={cn(
                'flex min-w-0 items-center gap-2 text-left',
                clickable ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition',
                  completed && 'border-rwanda-green bg-rwanda-green text-white',
                  active && 'border-rwanda-blue bg-rwanda-blue text-white',
                  !completed && !active && 'border-ink/15 bg-white text-ink-muted'
                )}
              >
                {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden truncate text-xs font-semibold sm:block',
                  active ? 'text-ink' : 'text-ink-muted'
                )}
              >
                {step}
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  'h-px min-w-3 flex-1',
                  completed ? 'bg-rwanda-green/50' : 'bg-ink/10'
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
