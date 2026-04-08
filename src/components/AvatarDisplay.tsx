import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

interface AvatarDisplayProps {
  name: string
  avatarUrl?: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function AvatarDisplay({ name, avatarUrl, size = 'default', className }: AvatarDisplayProps) {
  return (
    <Avatar size={size} className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback>{getInitials(name || '?')}</AvatarFallback>
    </Avatar>
  )
}
