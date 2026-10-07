import { LoadingAnnouncement, Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <LoadingAnnouncement />
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} className="h-36" />
        ))}
      </div>
    </div>
  )
}
