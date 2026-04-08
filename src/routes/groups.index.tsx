import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useGroups } from '@/contexts/GroupsContext'
import { CreateGroupDialog } from '@/components/CreateGroupDialog'

export const Route = createFileRoute('/groups/')({
  component: GroupsIndexPage,
})

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

function GroupsIndexPage() {
  const { t } = useTranslation()
  const { groups, animeCache } = useGroups()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('nav.myCollections')}</h1>
          <p className="text-sm text-muted-foreground">{t('groups.myCollectionsPage')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t('groups.create')}
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <p className="text-sm">{t('profile.noGroups')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {groups.map((group) => {
            const firstAnimeId = group.animeIds[0]
            const thumbnail = firstAnimeId ? animeCache[firstAnimeId]?.image_url : null

            return (
              <Link
                key={group.id}
                to="/groups/$groupId"
                params={{ groupId: group.id }}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer pt-0 gap-0 h-full">
                  <div className="aspect-[2/3] overflow-hidden bg-muted">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={groupDisplayName(group.name, t)}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                        <span className="text-4xl">📁</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-0.5">
                    <h3 className="font-medium text-sm leading-tight line-clamp-1">
                      {groupDisplayName(group.name, t)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('groups.animeCount', { count: group.animeIds.length })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <CreateGroupDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
