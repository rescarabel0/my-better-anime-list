import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { useGroups, useSelection } from '@/contexts/GroupsContext'
import { SelectionActionBar } from '@/components/SelectionActionBar'

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupPage,
})

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

function GroupPage() {
  const { t } = useTranslation()
  const { groupId } = Route.useParams()
  const { groups, animeCache, removeAnimeFromGroup } = useGroups()
  const { selected, toggleSelect } = useSelection()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('anime-view-mode') as 'grid' | 'list') || 'grid'
  })

  const group = groups.find((g) => g.id === groupId)

  const handleToggleSelect = useCallback((malId: number) => {
    const entry = animeCache[malId]
    if (entry) toggleSelect(entry)
  }, [toggleSelect, animeCache])

  if (!group) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">{t('groups.empty')}</p>
        <Link to="/" search={{ sort: 'score_desc', q: '' }} className={buttonVariants({ variant: 'outline' })}>
          {t('detail.backArrow')}
        </Link>
      </div>
    )
  }

  const animes = group.animeIds.map((id) => animeCache[id]).filter(Boolean)

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight flex-1">
          {groupDisplayName(group.name, t)}
          <span className="text-muted-foreground font-normal text-sm ml-2">
            ({animes.length})
          </span>
        </h1>

        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => { setViewMode('grid'); localStorage.setItem('anime-view-mode', 'grid') }}
            aria-label={t('home.view.grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => { setViewMode('list'); localStorage.setItem('anime-view-mode', 'list') }}
            aria-label={t('home.view.list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {animes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">{t('groups.empty')}</p>
          <p className="text-xs">{t('groups.emptyHint')}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 pr-3">
          <div className={viewMode === 'grid'
            ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3"
            : "flex flex-col gap-3"
          }>
            {animes.map((anime) => (
              <GroupAnimeCard
                key={anime.mal_id}
                anime={anime}
                variant={viewMode}
                selected={selected.has(anime.mal_id)}
                onToggleSelect={() => handleToggleSelect(anime.mal_id)}
                onRemove={() => removeAnimeFromGroup(groupId, anime.mal_id)}
              />
            ))}
          </div>
        </div>
      )}

      <SelectionActionBar />
    </div>
  )
}

interface GroupAnimeCardProps {
  anime: { mal_id: number; title: string; title_english: string | null; image_url: string; score: number | null; episodes: number | null }
  variant: 'grid' | 'list'
  selected: boolean
  onToggleSelect: () => void
  onRemove: () => void
}

function GroupAnimeCard({ anime, variant, selected, onToggleSelect, onRemove }: GroupAnimeCardProps) {
  const title = anime.title_english ?? anime.title
  const subtitle = anime.title_english ? anime.title : null

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSelect()
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove()
  }

  const checkbox = (
    <div
      className={`absolute top-1.5 left-1.5 z-10 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      onClick={handleCheckboxClick}
    >
      <div className={`size-4 shrink-0 rounded-sm border border-input bg-background/80 backdrop-blur-sm shadow-xs flex items-center justify-center ${selected ? 'border-primary bg-primary text-primary-foreground' : ''}`}>
        {selected && <span className="text-xs">&#10003;</span>}
      </div>
    </div>
  )

  const removeButton = (
    <div
      className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleRemoveClick}
    >
      <div className="size-5 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center backdrop-blur-sm">
        <X className="h-3 w-3" />
      </div>
    </div>
  )

  if (variant === 'list') {
    return (
      <Link to="/anime/$id" params={{ id: String(anime.mal_id) }}>
        <Card className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer group py-0 gap-0 flex-row h-28 ${selected ? 'ring-2 ring-primary' : ''}`}>
          <div className="relative w-20 shrink-0 overflow-hidden bg-muted">
            {checkbox}
            {removeButton}
            <img
              src={anime.image_url}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <CardContent className="p-3 flex flex-col justify-center gap-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight line-clamp-1">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {anime.score && (
                <Badge variant="secondary" className="text-xs">
                  ⭐ {anime.score}
                </Badge>
              )}
              {anime.episodes && (
                <Badge variant="outline" className="text-xs">
                  {anime.episodes} eps
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link to="/anime/$id" params={{ id: String(anime.mal_id) }}>
      <Card className={`overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer group pt-0 gap-0 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          {checkbox}
          {removeButton}
          <img
            src={anime.image_url}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="p-3 space-y-1">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {anime.score && (
              <Badge variant="secondary" className="text-xs">
                ⭐ {anime.score}
              </Badge>
            )}
            {anime.episodes && (
              <Badge variant="outline" className="text-xs">
                {anime.episodes} eps
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
