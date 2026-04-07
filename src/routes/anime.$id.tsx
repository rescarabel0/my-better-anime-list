import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { getAnimeById } from '@/services/jikan'

export const Route = createFileRoute('/anime/$id')({
  component: AnimeDetailPage,
})

function AnimeDetailPage() {
  const { t } = useTranslation()
  const { id } = Route.useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['anime', id],
    queryFn: () => getAnimeById(Number(id)),
  })

  const anime = data?.data

  if (isError) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">{t('detail.error')}</p>
        <Link to="/" search={{ sort: 'score_desc', q: '' }}  className={buttonVariants({ variant: 'outline' })}>
          {t('detail.back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/" search={{ sort: 'score_desc', q: '' }}  className={buttonVariants({ variant: 'outline', size: 'sm' })}>
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

            <div className="flex flex-wrap gap-2">
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
    </div>
  )
}
