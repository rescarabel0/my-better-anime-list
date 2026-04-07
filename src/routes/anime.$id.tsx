import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus, Plus, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { getAnimeById } from '@/services/jikan'
import { useGroups } from '@/contexts/GroupsContext'
import { CreateGroupDialog } from '@/components/CreateGroupDialog'

export const Route = createFileRoute('/anime/$id')({
  component: AnimeDetailPage,
})

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

function AnimeDetailPage() {
  const { t } = useTranslation()
  const { id } = Route.useParams()
  const { groups, addAnimesToGroup } = useGroups()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['anime', id],
    queryFn: () => getAnimeById(Number(id)),
  })

  const anime = data?.data

  const handleAddToGroup = (groupId: string) => {
    if (!anime) return
    addAnimesToGroup(groupId, [{
      mal_id: anime.mal_id,
      title: anime.title,
      title_english: anime.title_english,
      image_url: anime.images.jpg.image_url,
      score: anime.score,
      episodes: anime.episodes,
    }])
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">{t('detail.error')}</p>
        <Link to="/" search={{ sort: 'score_desc', q: '', genres: [] }}  className={buttonVariants({ variant: 'outline' })}>
          {t('detail.back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/" search={{ sort: 'score_desc', q: '', genres: [] }}  className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        {t('detail.backArrow')}
      </Link>

      {isLoading ? (
        <div className="flex gap-6">
          <Skeleton className="w-48 aspect-[2/3] shrink-0 rounded-lg" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : anime ? (
        <div className="flex flex-col sm:flex-row gap-6">
          <img
            src={anime.images.jpg.large_image_url}
            alt={anime.title}
            className="w-48 aspect-[2/3] object-cover rounded-lg shrink-0 self-start"
          />
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {anime.title_english ?? anime.title}
              </h1>
              {anime.title_english && (
                <p className="text-muted-foreground">{anime.title}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {anime.score && (
                <Badge variant="secondary">⭐ {anime.score}</Badge>
              )}
              {anime.rank && (
                <Badge variant="outline">Rank #{anime.rank}</Badge>
              )}
              {anime.episodes && (
                <Badge variant="outline">{anime.episodes} {t('detail.episodes')}</Badge>
              )}
              <Badge variant="outline">{anime.status}</Badge>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                  <FolderPlus className="h-4 w-4" />
                  {t('detail.addToCollection')}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {groups.map((group) => {
                    const isInGroup = group.animeIds.includes(anime.mal_id)
                    return (
                      <DropdownMenuItem
                        key={group.id}
                        onClick={() => handleAddToGroup(group.id)}
                      >
                        {isInGroup && <Check className="h-4 w-4" />}
                        {groupDisplayName(group.name, t)}
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t('groups.newGroup')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {anime.genres.map((g) => (
                  <Badge key={g.mal_id} variant="secondary" className="text-xs">
                    {g.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm max-w-sm">
              {anime.studios.length > 0 && (
                <div>
                  <span className="text-muted-foreground">{t('detail.studio')}</span>
                  <p className="font-medium">{anime.studios.map((s) => s.name).join(', ')}</p>
                </div>
              )}
              {anime.aired.string && (
                <div>
                  <span className="text-muted-foreground">{t('detail.aired')}</span>
                  <p className="font-medium">{anime.aired.string}</p>
                </div>
              )}
              {anime.scored_by && (
                <div>
                  <span className="text-muted-foreground">{t('detail.ratings')}</span>
                  <p className="font-medium">{anime.scored_by.toLocaleString('pt-BR')}</p>
                </div>
              )}
              {anime.popularity && (
                <div>
                  <span className="text-muted-foreground">{t('detail.popularity')}</span>
                  <p className="font-medium">#{anime.popularity}</p>
                </div>
              )}
            </div>

            {anime.synopsis && (
              <div className="space-y-1">
                <h2 className="font-semibold text-sm">{t('detail.synopsis')}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {anime.synopsis}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(name) => {
          const group = groups.find((g) => g.name === name)
          if (group) handleAddToGroup(group.id)
        }}
      />
    </div>
  )
}
