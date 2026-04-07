import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
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
import { getTopAnime, searchAnime } from '@/services/jikan'
import type { SortOption } from '@/services/jikan'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List, Loader2, Search } from 'lucide-react'
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

export const Route = createFileRoute('/')({
  component: HomePage,
  validateSearch: (search: Record<string, unknown>) => ({
    sort: typeof search.sort === 'string' && SORT_VALUES.has(search.sort) ? search.sort : 'score_desc',
    q: typeof search.q === 'string' ? search.q : '',
  }),
})

function HomePage() {
  const { t } = useTranslation()
  const { sort: sortKey, q: searchQuery } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const { selected, toggleSelect } = useSelection()
  const [inputValue, setInputValue] = useState(searchQuery)
  const [query, setQuery] = useState(searchQuery)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('anime-view-mode') as 'grid' | 'list') || 'grid'
  })

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
    queryKey: ['top-anime', sortKey] as const,
    queryFn: ({ pageParam }) => {
      const opt = SORT_OPTIONS.find((o) => o.value === sortKey)
      const sort = opt ? { order_by: opt.order_by, sort: opt.sort } as SortOption : undefined
      return getTopAnime(pageParam, sort)
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
    queryKey: ['search-anime', query, sortKey] as const,
    queryFn: ({ pageParam }) => {
      const opt = SORT_OPTIONS.find((o) => o.value === sortKey)
      const sort = opt ? { order_by: opt.order_by, sort: opt.sort } as SortOption : undefined
      return searchAnime(query, pageParam, sort)
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

    const observer = new IntersectionObserver(handleObserver, {
      root,
      rootMargin: '200px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

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
                <SelectItem value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isSearching && !loading && animes.length === 0 && (
          <span className="text-sm text-muted-foreground">{t('home.noResults')}</span>
        )}
      </div>

      {active.isError && (
        <p className="text-destructive text-sm">{t('home.error')}</p>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 pr-3">
        <div className={viewMode === 'grid'
          ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3"
          : "flex flex-col gap-3"
        }>
          {loading
            ? Array.from({ length: 24 }).map((_, i) => <AnimeCardSkeleton key={i} variant={viewMode} />)
            : animes.map((anime) => (
              <AnimeCard
                key={anime.mal_id}
                anime={anime}
                variant={viewMode}
                selected={selected.has(anime.mal_id)}
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
