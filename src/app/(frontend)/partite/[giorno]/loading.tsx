import { LoadingAnnouncement, SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <LoadingAnnouncement />
      <SkeletonCard className="h-56" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <SkeletonTable rows={7} />
        <SkeletonTable rows={7} />
      </div>
    </div>
  )
}
