import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/AvatarDisplay'

interface ProfileFormProps {
  initialName?: string
  initialBio?: string
  initialAvatarUrl?: string
  onSubmit: (name: string, bio: string, avatarUrl: string) => void
  submitLabel?: string
}

export function ProfileForm({
  initialName = '',
  initialBio = '',
  initialAvatarUrl = '',
  onSubmit,
  submitLabel,
}: ProfileFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), bio.trim(), avatarUrl.trim())
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

      <Button type="submit" disabled={!name.trim()}>
        {submitLabel ?? t('profile.save')}
      </Button>
    </form>
  )
}
