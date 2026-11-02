import { initials } from '../../utils/format';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg'
};

const TONES = {
  blue: 'bg-rwanda-blue-soft text-rwanda-blue-dark',
  green: 'bg-rwanda-green-soft text-rwanda-green-dark',
  yellow: 'bg-rwanda-yellow-soft text-[#7d6900]',
  ink: 'bg-ink/10 text-ink'
};

export default function Avatar({ firstName, lastName, size = 'md', tone = 'green', className }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold uppercase',
        SIZES[size] || SIZES.md,
        TONES[tone] || TONES.green,
        className
      )}
      aria-hidden="true"
    >
      {initials(firstName, lastName)}
    </span>
  );
}
