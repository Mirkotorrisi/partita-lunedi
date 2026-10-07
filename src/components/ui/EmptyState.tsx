import { Inbox, type LucideIcon } from 'lucide-react'

export function EmptyState({
  message,
  icon: Icon = Inbox,
  children,
}: {
  message: string
  icon?: LucideIcon
  children?: React.ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-3 py-10 text-center">
      <Icon className="h-8 w-8 text-muted" aria-hidden="true" />
      <p className="text-muted">{message}</p>
      {children}
    </div>
  )
}
