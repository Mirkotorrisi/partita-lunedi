import { LoadingAnnouncement, Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <LoadingAnnouncement />
      <Skeleton className="h-6 w-48" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}
