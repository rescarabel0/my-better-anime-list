import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { useUser } from '@/contexts/UserContext'
import { useGroups } from '@/contexts/GroupsContext'
import { ChevronDown, ChevronUp } from 'lucide-react'

export const Route = createFileRoute('/profile/$userId')({
  component: UserProfilePage,
})

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

function UserProfilePage() {
  const { t } = useTranslation()
  const { userId } = Route.useParams()
  const { getUserById, activeUser } = useUser()
  const { getGroupsByUserId, animeCache } = useGroups()

  const user = getUserById(userId)
  const userGroups = getGroupsByUserId(userId)

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <p className="text-sm">{t('profile.notFound')}</p>
        <Link to="/" search={{ sort: 'score_desc', q: '', genres: [] }} className="text-sm text-primary hover:underline">
          {t('detail.backArrow')}
        </Link>
      </div>
    )
  }

  const isOwnProfile = activeUser?.id === userId

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Profile header */}
      <div className="flex items-start gap-4">
        <AvatarDisplay
          name={user.name}
          avatarUrl={user.avatarUrl}
          className="h-20 w-20 text-2xl"
        />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{user.name}</h1>
          {user.bio && (
            <p className="text-sm text-muted-foreground">{user.bio}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('profile.memberSince', { date: new Date(user.createdAt).toLocaleDateString() })}
          </p>
        </div>
        {isOwnProfile && (
          <Link to="/profile/" className="text-sm text-primary hover:underline shrink-0">
            {t('profile.editProfile')}
          </Link>
        )}
      </div>

      {/* Groups */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {isOwnProfile ? t('profile.myGroups') : t('profile.userGroups', { name: user.name })}
        </h2>
        {userGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('profile.noGroups')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {userGroups.map((group) => (
              <GroupPreview
                key={group.id}
                groupName={groupDisplayName(group.name, t)}
                animeIds={group.animeIds}
                animeCache={animeCache}
                isOwnProfile={isOwnProfile}
                groupId={group.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface GroupPreviewProps {
  groupName: string
  animeIds: number[]
  animeCache: Record<number, import('@/types/groups').AnimeGroupEntry>
  isOwnProfile: boolean
  groupId: string
}

function GroupPreview({ groupName, animeIds, animeCache, isOwnProfile, groupId }: GroupPreviewProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const allAnimes = animeIds.map((id) => animeCache[id]).filter(Boolean)
  const displayAnimes = expanded ? allAnimes : allAnimes.slice(0, 6)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{groupName}</h3>
          <Badge variant="secondary" className="text-xs">{animeIds.length}</Badge>
        </div>
        {isOwnProfile && (
          <Link
            to="/groups/$groupId"
            params={{ groupId }}
            className="text-xs text-primary hover:underline"
          >
            {t('profile.viewGroup')}
          </Link>
        )}
      </div>

      {allAnimes.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('groups.empty')}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {displayAnimes.map((anime) => {
              const title = anime.title_english ?? anime.title
              return (
                <Link key={anime.mal_id} to="/anime/$id" params={{ id: String(anime.mal_id) }}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer pt-0 gap-0 h-full">
                    <div className="aspect-[2/3] overflow-hidden bg-muted">
                      <img
                        src={anime.image_url}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium line-clamp-2 leading-tight">{title}</p>
                      <div className="flex gap-1 mt-1">
                        {anime.score && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            ⭐ {anime.score}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {allAnimes.length > 6 && (
            <button
              className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1 self-start"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  {t('profile.showLess')}
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  {t('profile.showAll', { count: allAnimes.length })}
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}
