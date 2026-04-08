import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Check, SlidersHorizontal, Link2, Copy, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useGroups, useSelection } from '@/contexts/GroupsContext'
import { useUser } from '@/contexts/UserContext'
import { SelectionActionBar } from '@/components/SelectionActionBar'
import { ShareGroupDialog } from '@/components/ShareGroupDialog'
import type { AnimeGroupEntry } from '@/types/groups'

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupPage,
})

const SORT_OPTIONS = [
  { labelKey: 'home.sort.scoreDesc', value: 'score_desc' },
  { labelKey: 'home.sort.scoreAsc', value: 'score_asc' },
  { labelKey: 'home.sort.titleAsc', value: 'title_asc' },
  { labelKey: 'home.sort.titleDesc', value: 'title_desc' },
  { labelKey: 'home.sort.episodesDesc', value: 'episodes_desc' },
  { labelKey: 'home.sort.episodesAsc', value: 'episodes_asc' },
]

function sortAnimes(animes: AnimeGroupEntry[], key: string): AnimeGroupEntry[] {
  return [...animes].sort((a, b) => {
    switch (key) {
      case 'score_desc': return (b.score ?? 0) - (a.score ?? 0)
      case 'score_asc': return (a.score ?? 0) - (b.score ?? 0)
      case 'title_asc': return (a.title_english ?? a.title).localeCompare(b.title_english ?? b.title)
      case 'title_desc': return (b.title_english ?? b.title).localeCompare(a.title_english ?? a.title)
      case 'episodes_desc': return (b.episodes ?? 0) - (a.episodes ?? 0)
      case 'episodes_asc': return (a.episodes ?? 0) - (b.episodes ?? 0)
      default: return 0
    }
  })
}

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

function GroupPage() {
  const { t } = useTranslation()
  const { groupId } = Route.useParams()
  const { groups, allGroups, animeCache, removeAnimeFromGroup, renameGroup } = useGroups()
  const { getUserById } = useUser()
  const { selected, toggleSelect } = useSelection()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('anime-view-mode') as 'grid' | 'list') || 'grid'
  })
  const [sortKey, setSortKey] = useState('score_desc')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [genreIds, setGenreIds] = useState<number[]>([])
  const [pendingGenreIds, setPendingGenreIds] = useState<number[]>([])
  const [shareOpen, setShareOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingName) nameInputRef.current?.select()
  }, [editingName])

  function startRename() {
    if (!group || group.isDefault) return
    setNameValue(group.name)
    setEditingName(true)
  }

  function commitRename() {
    const trimmed = nameValue.trim()
    if (trimmed && group && trimmed !== group.name) {
      renameGroup(group.id, trimmed)
    }
    setEditingName(false)
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setEditingName(false)
  }

  const group = groups.find((g) => g.id === groupId) ?? allGroups.find((g) => g.id === groupId)
  const isOwnGroup = groups.some((g) => g.id === groupId)
  const groupOwner = group ? getUserById(group.userId) : undefined

  const handleToggleSelect = useCallback((malId: number) => {
    const entry = animeCache[malId]
    if (entry) toggleSelect(entry)
  }, [toggleSelect, animeCache])

  const rawAnimes = useMemo(
    () => group?.animeIds.map((id) => animeCache[id]).filter(Boolean) ?? [],
    [group, animeCache]
  )

  // Derive unique genres from the group's animes
  const availableGenres = useMemo(() => {
    const map = new Map<number, string>()
    for (const anime of rawAnimes) {
      for (const g of anime.genres ?? []) {
        if (!map.has(g.mal_id)) map.set(g.mal_id, g.name)
      }
    }
    return Array.from(map.entries())
      .map(([mal_id, name]) => ({ mal_id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [rawAnimes])

  const animes = useMemo(() => {
    const filtered = genreIds.length > 0
      ? rawAnimes.filter((a) => genreIds.every((id) => a.genres?.some((g) => g.mal_id === id)))
      : rawAnimes
    return sortAnimes(filtered, sortKey)
  }, [rawAnimes, genreIds, sortKey])

  const hasFilters = genreIds.length > 0
  const activeGenres = availableGenres.filter((g) => genreIds.includes(g.mal_id))

  function togglePending(id: number) {
    setPendingGenreIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id])
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">{t('groups.empty')}</p>
        <Link to="/" search={{ sort: 'score_desc', q: '', genres: [] }} className={buttonVariants({ variant: 'outline' })}>
          {t('detail.backArrow')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Row 1: Share + Title + Owner */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {isOwnGroup && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShareOpen(true)}>
              <Link2 className="h-4 w-4" />
            </Button>
          )}
          {editingName ? (
            <div className="flex items-center gap-3 min-w-0">
              <Input
                ref={nameInputRef}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleNameKeyDown}
                className="h-8 text-xl font-bold tracking-tight px-2 w-full max-w-xs"
              />
              <span className="text-muted-foreground font-normal text-sm shrink-0">
                ({animes.length}{rawAnimes.length !== animes.length ? `/${rawAnimes.length}` : ''})
              </span>
            </div>
          ) : (
            <h1 className="text-xl font-bold tracking-tight min-w-0 flex items-center gap-3">
              <span
                onClick={isOwnGroup && !group.isDefault ? startRename : undefined}
                className={isOwnGroup && !group.isDefault ? 'cursor-text rounded px-2 -mx-2 py-0.5 hover:bg-muted transition-colors' : ''}
                title={isOwnGroup && !group.isDefault ? t('groups.rename') : undefined}
              >
                {groupDisplayName(group.name, t)}
              </span>
              <span className="text-muted-foreground font-normal text-sm">
                ({animes.length}{rawAnimes.length !== animes.length ? `/${rawAnimes.length}` : ''})
              </span>
            </h1>
          )}
          {!isOwnGroup && rawAnimes.length > 0 && (
            <CopyGroupButton groupName={group.name} ownerName={groupOwner?.name} animes={rawAnimes} />
          )}
        </div>
        {!isOwnGroup && groupOwner && (
          <Link
            to="/profile/$userId"
            params={{ userId: group.userId }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 w-fit"
          >
            {t('groups.ownedBy', { name: groupOwner.name })}
          </Link>
        )}
      </div>

      {/* Row 2: View toggle + Sort + Filter */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 shrink-0">
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

        <div className="flex items-center gap-2 flex-1">
          <label className="hidden sm:block text-sm text-muted-foreground whitespace-nowrap">{t('home.sortBy')}</label>
          <Select value={sortKey} onValueChange={(val) => val && setSortKey(val)}>
            <SelectTrigger className="flex-1 sm:w-44 sm:flex-none">
              <SelectValue>
                {t(SORT_OPTIONS.find((o) => o.value === sortKey)?.labelKey ?? '')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availableGenres.length > 0 && (
          <Sheet
            open={sheetOpen}
            onOpenChange={(open) => {
              if (open) setPendingGenreIds(genreIds)
              setSheetOpen(open)
            }}
          >
            <SheetTrigger
              render={
                <Button variant={hasFilters ? 'secondary' : 'outline'} className="relative shrink-0 gap-2" aria-label={t('home.filters')} />
              }
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">{t('home.filters')}</span>
              {hasFilters && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6">
              <SheetHeader>
                <SheetTitle>{t('home.filters')}</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-3 px-4 flex-1 overflow-y-auto">
                <span className="text-sm font-medium">{t('home.genre')}</span>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genre) => (
                    <Badge
                      key={genre.mal_id}
                      variant={pendingGenreIds.includes(genre.mal_id) ? 'default' : 'outline'}
                      className="cursor-pointer select-none text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={() => togglePending(genre.mal_id)}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <SheetFooter className="px-4 pb-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-11"
                  onClick={() => {
                    setPendingGenreIds([])
                    setGenreIds([])
                    setSheetOpen(false)
                  }}
                >
                  {t('home.clearFilter')}
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-11"
                  onClick={() => {
                    setGenreIds(pendingGenreIds)
                    setSheetOpen(false)
                  }}
                >
                  {t('home.applyFilters')}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}

      </div>

      {activeGenres.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeGenres.map((genre) => (
            <Badge key={genre.mal_id} variant="secondary" className="gap-1 text-sm">
              {genre.name}
              <button
                className="ml-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                onClick={() => setGenreIds((prev) => prev.filter((id) => id !== genre.mal_id))}
                aria-label={`Remove ${genre.name} filter`}
              >
                ×
              </button>
            </Badge>
          ))}
          <button
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={() => setGenreIds([])}
          >
            {t('home.clearFilter')}
          </button>
        </div>
      )}

      {animes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">{rawAnimes.length === 0 ? t('groups.empty') : t('home.noResults')}</p>
          {rawAnimes.length === 0 && <p className="text-xs">{t('groups.emptyHint')}</p>}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className={viewMode === 'grid'
            ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 p-1 pb-4 pr-3"
            : "grid grid-cols-1 md:grid-cols-2 gap-3 p-1 pb-4 pr-3"
          }>
            {animes.map((anime) => (
              <GroupAnimeCard
                key={anime.mal_id}
                anime={anime}
                variant={viewMode}
                selected={selected.has(anime.mal_id)}
                selectionMode={selected.size > 0}
                onToggleSelect={() => handleToggleSelect(anime.mal_id)}
                onRemove={isOwnGroup ? () => removeAnimeFromGroup(groupId, anime.mal_id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <SelectionActionBar />

      <ShareGroupDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        groupId={groupId}
        groupName={groupDisplayName(group.name, t)}
      />
    </div>
  )
}

interface GroupAnimeCardProps {
  anime: AnimeGroupEntry
  variant: 'grid' | 'list'
  selected: boolean
  selectionMode?: boolean
  onToggleSelect: () => void
  onRemove?: () => void
}

function GroupAnimeCard({ anime, variant, selected, selectionMode, onToggleSelect, onRemove }: GroupAnimeCardProps) {
  const title = anime.title_english ?? anime.title
  const subtitle = anime.title_english ? anime.title : null
  const checkboxVisible = selectionMode || selected

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSelect()
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove?.()
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault()
      onToggleSelect()
    }
  }

  const checkbox = (position: 'top-left' | 'center-right') => (
    <div
      className={`absolute z-20 transition-opacity cursor-pointer ${position === 'center-right' ? 'top-1/2 -translate-y-1/2 right-2' : 'top-2 left-2'} ${checkboxVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      onClick={handleCheckboxClick}
    >
      <div className={`size-6 rounded-md border-2 flex items-center justify-center backdrop-blur-sm transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/80' : 'border-muted-foreground/60 bg-background/80 hover:border-primary hover:bg-primary/10'}`}>
        {selected && <Check className="size-4" strokeWidth={3} />}
      </div>
    </div>
  )

  const removeButton = (position: 'top-left' | 'center-right') => onRemove ? (
    <div
      className={`absolute z-20 transition-opacity cursor-pointer ${position === 'center-right' ? 'top-1/2 -translate-y-1/2 right-10' : 'top-2 left-10'} ${checkboxVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      onClick={handleRemoveClick}
    >
      <div className="size-6 rounded-md flex items-center justify-center backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="size-4" />
      </div>
    </div>
  ) : null

  if (variant === 'list') {
    return (
      <div className="relative group">
        {checkbox('center-right')}
        {removeButton('center-right')}
        <Link to="/anime/$id" params={{ id: String(anime.mal_id) }} onClick={handleLinkClick}>
          <Card className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer py-0 gap-0 flex-row h-28 ${selected ? 'ring-2 ring-primary' : ''}`}>
            <div className="w-20 shrink-0 overflow-hidden bg-muted">
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
      </div>
    )
  }

  return (
    <div className="relative group">
      {checkbox('top-left')}
      {removeButton('top-left')}
      <Link to="/anime/$id" params={{ id: String(anime.mal_id) }} onClick={handleLinkClick}>
        <Card className={`overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer pt-0 gap-0 ${selected ? 'ring-2 ring-primary' : ''}`}>
          <div className="aspect-[2/3] overflow-hidden bg-muted">
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
    </div>
  )
}

function CopyGroupButton({ groupName, ownerName, animes }: { groupName: string; ownerName?: string; animes: AnimeGroupEntry[] }) {
  const { t } = useTranslation()
  const { createGroup, addAnimesToGroup } = useGroups()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const copyName = ownerName ? `${groupName} - ${ownerName}` : groupName
    const created = await createGroup(copyName)
    if (created && animes.length > 0) {
      addAnimesToGroup(created.id, animes)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs shrink-0" onClick={handleCopy} disabled={copied}>
      <Copy className="h-3 w-3" />
      {copied ? t('share.copyToCollection') + ' ✓' : t('share.copyToCollection')}
    </Button>
  )
}
