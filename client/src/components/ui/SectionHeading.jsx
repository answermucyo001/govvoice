import { cn } from '../../utils/cn';

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  action,
  className
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className={cn('section-title', eyebrow && 'mt-4')}>{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
