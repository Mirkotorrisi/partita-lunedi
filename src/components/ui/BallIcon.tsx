/** Pallone da calcio (lucide non ne ha uno). Stessa API visiva delle icone lucide: currentColor, stroke 2. */
export function BallIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.5l4.3 3.1-1.6 5h-5.4l-1.6-5z" fill="currentColor" stroke="none" />
      <path d="M12 7.5V2.2M16.3 10.6l5-1.6M14.7 15.6l3.1 4.3M9.3 15.6l-3.1 4.3M7.7 10.6l-5-1.6" />
    </svg>
  )
}
