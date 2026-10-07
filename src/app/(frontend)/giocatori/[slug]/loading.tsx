import { LoadingAnnouncement, SkeletonCard, SkeletonChart } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <LoadingAnnouncement />
      <SkeletonCard className="h-32" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <SkeletonChart height={220} />
        <SkeletonChart height={220} />
      </div>
    </div>
  )
}
