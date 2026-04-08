import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { useUser } from '@/contexts/UserContext'

interface ProfileFormProps {
  initialName?: string
  initialBio?: string
  initialAvatarUrl?: string
  /** When editing, pass the current user's id so their own name is not flagged as duplicate */
  excludeUserId?: string
  onSubmit: (name: string, bio: string, avatarUrl: string) => void
  submitLabel?: string
}

export function ProfileForm({
  initialName = '',
  initialBio = '',
  initialAvatarUrl = '',
  excludeUserId,
  onSubmit,
  submitLabel,
}: ProfileFormProps) {
  const { t } = useTranslation()
  const { allUsers } = useUser()
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)

  const trimmedName = name.trim()
  const nameTaken = trimmedName.length > 0 && allUsers.some(
    (u) => u.id !== excludeUserId && u.name.toLowerCase() === trimmedName.toLowerCase(),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (trimmedName && !nameTaken) {
      onSubmit(trimmedName, bio.trim(), avatarUrl.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <AvatarDisplay
          name={name || '?'}
          avatarUrl={avatarUrl}
          className="h-16 w-16 text-lg"
        />
        <div className="flex-1">
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder={t('profile.avatarUrlPlaceholder')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t('profile.name')}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('profile.namePlaceholder')}
          required
          autoFocus
        />
        {nameTaken && (
          <p className="text-sm text-destructive">{t('profile.nameTaken')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t('profile.bio')}</label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t('profile.bioPlaceholder')}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={!trimmedName || nameTaken}>
        {submitLabel ?? t('profile.save')}
      </Button>
    </form>
  )
}
