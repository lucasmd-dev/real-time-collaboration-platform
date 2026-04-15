import { PresenceUser } from '@/types'
import { getInitials } from '@/lib/utils'

interface AvatarListProps {
  users: PresenceUser[]
  maxVisible?: number
}

export function AvatarList({ users, maxVisible = 5 }: AvatarListProps) {
  const visible = users.slice(0, maxVisible)
  const overflow = users.length - maxVisible

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map(u => (
        <div
          key={u.userId}
          title={u.name}
          style={{ backgroundColor: u.color }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-[#f6f1e8] shadow-[0_10px_20px_-16px_rgba(16,24,40,0.8)]"
        >
          {getInitials(u.name)}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-zinc-700 ring-2 ring-[#f6f1e8]">
          +{overflow}
        </div>
      )}
    </div>
  )
}
