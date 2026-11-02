import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    className,
    containerClassName,
    required,
    id,
    rows = 4,
    maxLength,
    value,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label ? (
        <label htmlFor={textareaId} className="label">
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        className={cn('field resize-y leading-relaxed', error && 'field-error', className)}
        {...props}
      />
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={`${textareaId}-error`} className="error-text">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        ) : hint ? (
          <p id={`${textareaId}-hint`} className="helper">
            {hint}
          </p>
        ) : (
          <span />
        )}
        {maxLength && typeof value === 'string' ? (
          <span className="mt-1.5 shrink-0 text-xs text-ink-muted">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
});

export default Textarea;
