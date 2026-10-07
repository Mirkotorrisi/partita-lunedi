import { LoadingAnnouncement, Skeleton, SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <LoadingAnnouncement />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-11 w-full rounded-full lg:max-w-sm" />
      <SkeletonTable rows={10} />
    </div>
  )
}
