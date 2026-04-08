import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { ProfileForm } from '@/components/ProfileForm'
import { useUser } from '@/contexts/UserContext'
import { useGroups } from '@/contexts/GroupsContext'
import { Pencil } from 'lucide-react'

export const Route = createFileRoute('/profile/')({
  component: MyProfilePage,
})

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

function MyProfilePage() {
  const { t } = useTranslation()
  const { activeUser, updateUser } = useUser()
  const { groups, animeCache } = useGroups()
  const [editOpen, setEditOpen] = useState(false)

  if (!activeUser) return null

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Profile header */}
      <div className="flex items-start gap-4">
        <AvatarDisplay
          name={activeUser.name}
          avatarUrl={activeUser.avatarUrl}
          className="h-20 w-20 text-2xl"
        />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold truncate">{activeUser.name}</h1>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          {activeUser.bio && (
            <p className="text-sm text-muted-foreground">{activeUser.bio}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('profile.memberSince', { date: new Date(activeUser.createdAt).toLocaleDateString() })}
          </p>
        </div>
      </div>

      {/* Groups */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('profile.myGroups')}</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('profile.noGroups')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.map((group) => {
              const groupAnimes = group.animeIds.map((id) => animeCache[id]).filter(Boolean)
              const previewAnimes = groupAnimes.slice(0, 4)

              return (
                <Link key={group.id} to="/groups/$groupId" params={{ groupId: group.id }}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{groupDisplayName(group.name, t)}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {group.animeIds.length}
                        </Badge>
                      </div>
                      {previewAnimes.length > 0 ? (
                        <div className="flex gap-1.5">
                          {previewAnimes.map((anime) => (
                            <div key={anime.mal_id} className="w-12 h-16 rounded overflow-hidden bg-muted shrink-0">
                              <img
                                src={anime.image_url}
                                alt={anime.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ))}
                          {groupAnimes.length > 4 && (
                            <div className="w-12 h-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                              +{groupAnimes.length - 4}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('groups.empty')}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.editProfile')}</DialogTitle>
            <DialogDescription>{t('profile.editDescription')}</DialogDescription>
          </DialogHeader>
          <ProfileForm
            initialName={activeUser.name}
            initialBio={activeUser.bio}
            initialAvatarUrl={activeUser.avatarUrl}
            onSubmit={(name, bio, avatarUrl) => {
              updateUser(activeUser.id, { name, bio, avatarUrl })
              setEditOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
