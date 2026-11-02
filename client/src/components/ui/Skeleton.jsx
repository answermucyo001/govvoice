import { cn } from '../../utils/cn';

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}

export function CardSkeleton({ lines = 3, className }) {
  return (
    <div className={cn('card p-5', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-40" />
      <div className="mt-5 space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
          />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="card flex items-center gap-4 p-4">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
