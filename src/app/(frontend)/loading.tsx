import { LoadingAnnouncement, SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <LoadingAnnouncement />
      <SkeletonCard className="h-44" />
      <div className="grid grid-cols-3 gap-3">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SkeletonChart />
        <div className="lg:col-span-2">
          <SkeletonTable />
        </div>
      </div>
    </div>
  )
}
