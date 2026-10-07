export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
}

export function SkeletonCard({ className = 'h-32' }: { className?: string }) {
  return (
    <div className={`card flex flex-col gap-3 ${className}`} aria-hidden="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ height = 240 }: { height?: number }) {
  return (
    <div className="card flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="w-full" style={{ height }} />
    </div>
  )
}

/** Annuncio per gli screen reader mentre la pagina carica. */
export function LoadingAnnouncement() {
  return (
    <p className="sr-only" role="status">
      Caricamento…
    </p>
  )
}
