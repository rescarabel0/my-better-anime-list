import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimeCard } from '@/components/AnimeCard'
import { AnimeCardSkeleton } from '@/components/AnimeCardSkeleton'
import { SelectionActionBar } from '@/components/SelectionActionBar'
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
import { getTopAnime, searchAnime, getGenres } from '@/services/jikan'
import type { SortOption } from '@/services/jikan'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LayoutGrid, List, Loader2, Search, SlidersHorizontal } from 'lucide-react'
import { useSelection } from '@/contexts/GroupsContext'
import type { Anime } from '@/types/anime'

const SORT_OPTIONS: { labelKey: string; value: string; order_by: string; sort: 'asc' | 'desc' }[] = [
  { labelKey: 'home.sort.scoreDesc', value: 'score_desc', order_by: 'score', sort: 'desc' },
  { labelKey: 'home.sort.scoreAsc', value: 'score_asc', order_by: 'score', sort: 'asc' },
  { labelKey: 'home.sort.popularity', value: 'popularity_asc', order_by: 'popularity', sort: 'asc' },
  { labelKey: 'home.sort.rank', value: 'rank_asc', order_by: 'rank', sort: 'asc' },
  { labelKey: 'home.sort.titleAsc', value: 'title_asc', order_by: 'title', sort: 'asc' },
  { labelKey: 'home.sort.titleDesc', value: 'title_desc', order_by: 'title', sort: 'desc' },
  { labelKey: 'home.sort.episodesDesc', value: 'episodes_desc', order_by: 'episodes', sort: 'desc' },
  { labelKey: 'home.sort.episodesAsc', value: 'episodes_asc', order_by: 'episodes', sort: 'asc' },
  { labelKey: 'home.sort.favorites', value: 'favorites_desc', order_by: 'favorites', sort: 'desc' },
]

const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value))

function parseGenres(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is number => typeof v === 'number')
}

export const Route = createFileRoute('/')({
  component: HomePage,
  validateSearch: (search: Record<string, unknown>) => ({
    sort: typeof search.sort === 'string' && SORT_VALUES.has(search.sort) ? search.sort : 'score_desc',
    q: typeof search.q === 'string' ? search.q : '',
    genres: parseGenres(search.genres),
  }),
})

function HomePage() {
  const { t } = useTranslation()
  const { sort: sortKey, q: searchQuery, genres: genreIds } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const { selected, toggleSelect } = useSelection()
  const [inputValue, setInputValue] = useState(searchQuery)
  const [query, setQuery] = useState(searchQuery)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('anime-view-mode') as 'grid' | 'list') || 'grid'
  })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pendingGenreIds, setPendingGenreIds] = useState<number[]>(genreIds)

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    staleTime: Infinity,
  })
  const genres = genresData?.data ?? []

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = inputValue.trim()
      setQuery(trimmed)
      navigate({ search: (prev) => ({ ...prev, q: trimmed }) })
    }, 400)
    return () => clearTimeout(timeout)
  }, [inputValue, navigate])

  const isSearching = query.length > 0

  const topAnime = useInfiniteQuery({
    queryKey: ['top-anime', sortKey, genreIds] as const,
    queryFn: ({ pageParam }) => {
      const opt = SORT_OPTIONS.find((o) => o.value === sortKey)
      const sort = opt ? { order_by: opt.order_by, sort: opt.sort } as SortOption : undefined
      return getTopAnime(pageParam, sort, genreIds)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.has_next_page
        ? (lastPage.pagination.current_page + 1)
        : undefined,
    enabled: !isSearching,
    gcTime: 0,
  })

  const searchResult = useInfiniteQuery({
    queryKey: ['search-anime', query, sortKey, genreIds] as const,
    queryFn: ({ pageParam }) => {
      const opt = SORT_OPTIONS.find((o) => o.value === sortKey)
      const sort = opt ? { order_by: opt.order_by, sort: opt.sort } as SortOption : undefined
      return searchAnime(query, pageParam, sort, genreIds)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.has_next_page
        ? (lastPage.pagination.current_page + 1)
        : undefined,
    enabled: isSearching,
  })

  const active = isSearching ? searchResult : topAnime
  const animes = (() => {
    const all = active.data?.pages.flatMap((page) => page.data) ?? []
    const seen = new Set<number>()
    return all.filter((a) => {
      if (seen.has(a.mal_id)) return false
      seen.add(a.mal_id)
      return true
    })
  })()
  const loading = active.isLoading || (active.isFetching && !active.isFetchingNextPage)

  const handleToggleSelect = useCallback((anime: Anime) => {
    toggleSelect({
      mal_id: anime.mal_id,
      title: anime.title,
      title_english: anime.title_english,
      image_url: anime.images.jpg.image_url,
      score: anime.score,
      episodes: anime.episodes,
      genres: anime.genres,
    })
  }, [toggleSelect])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && active.hasNextPage && !active.isFetchingNextPage) {
        active.fetchNextPage()
      }
    },
    [active.fetchNextPage, active.hasNextPage, active.isFetchingNextPage],
  )

  useEffect(() => {
    const el = sentinelRef.current
    const root = scrollContainerRef.current
    if (!el || !root) return
    const observer = new IntersectionObserver(handleObserver, { root, rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  const activeGenres = genres.filter((g) => genreIds.includes(g.mal_id))
  const hasFilters = genreIds.length > 0

  function togglePending(id: number) {
    setPendingGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('home.searchPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9"
          />
        </div>

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

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">{t('home.sortBy')}</label>
          <Select value={sortKey} onValueChange={(val) => navigate({ search: (prev) => ({ ...prev, sort: val ?? 'score_desc' }) })}>
            <SelectTrigger className="w-48">
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
            {t('home.filters')}
            {hasFilters && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </SheetTrigger>
          <SheetContent side="right" className="w-80 flex flex-col gap-6">
            <SheetHeader>
              <SheetTitle>{t('home.filters')}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-3 px-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('home.genre')}</span>
                {pendingGenreIds.length > 0 && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => setPendingGenreIds([])}
                  >
                    {t('home.clearFilter')}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre.mal_id}
                    variant={pendingGenreIds.includes(genre.mal_id) ? 'default' : 'outline'}
                    className="cursor-pointer select-none text-sm py-1 px-3 transition-colors hover:bg-accent hover:text-accent-foreground"
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
                className="flex-1"
                onClick={() => {
                  setPendingGenreIds([])
                  navigate({ search: (prev) => ({ ...prev, genres: [] }) })
                  setSheetOpen(false)
                }}
              >
                {t('home.clearFilter')}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  navigate({ search: (prev) => ({ ...prev, genres: pendingGenreIds }) })
                  setSheetOpen(false)
                }}
              >
                {t('home.applyFilters')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0 gap-1.5"
            onClick={() => navigate({ search: (prev) => ({ ...prev, genres: [] }) })}
          >
            {t('home.clearFilter')}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {activeGenres.map((genre) => (
          <Badge key={genre.mal_id} variant="secondary" className="gap-1">
            {genre.name}
            <button
              className="ml-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
              onClick={() => navigate({ search: (prev) => ({ ...prev, genres: genreIds.filter((id) => id !== genre.mal_id) }) })}
              aria-label={`Remove ${genre.name} filter`}
            >
              ×
            </button>
          </Badge>
        ))}
        {isSearching && !loading && animes.length === 0 && (
          <span className="text-sm text-muted-foreground">{t('home.noResults')}</span>
        )}
      </div>

      {active.isError && (
        <p className="text-destructive text-sm">{t('home.error')}</p>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
        <div className={viewMode === 'grid'
          ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 p-1 pb-4 pr-3"
          : "flex flex-col gap-3 p-1 pb-4 pr-3"
        }>
          {loading
            ? Array.from({ length: 24 }).map((_, i) => <AnimeCardSkeleton key={i} variant={viewMode} />)
            : animes.map((anime) => (
              <AnimeCard
                key={anime.mal_id}
                anime={anime}
                variant={viewMode}
                selected={selected.has(anime.mal_id)}
                selectionMode={selected.size > 0}
                onToggleSelect={handleToggleSelect}
              />
            ))}
        </div>

        <div ref={sentinelRef} className="flex justify-center py-4">
          {active.isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <SelectionActionBar />
    </div>
  )
}
