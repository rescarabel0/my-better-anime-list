import { useTranslation } from 'react-i18next'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import type { UserProfile } from '@/types/user'

interface ProfileCardProps {
  user: UserProfile
  className?: string
}

export function ProfileCard({ user, className }: ProfileCardProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <AvatarDisplay
          name={user.name}
          avatarUrl={user.avatarUrl}
          className="h-20 w-20 text-2xl"
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{user.name}</h2>
          {user.bio && (
            <p className="text-sm text-muted-foreground">{user.bio}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('profile.memberSince', {
              date: new Date(user.createdAt).toLocaleDateString(),
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
