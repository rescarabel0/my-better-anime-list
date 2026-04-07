import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Anime } from '@/types/anime'

interface AnimeCardProps {
  anime: Anime
  variant?: 'grid' | 'list'
}

export function AnimeCard({ anime, variant = 'grid' }: AnimeCardProps) {
  const title = anime.title_english ?? anime.title
  const subtitle = anime.title_english ? anime.title : null

  if (variant === 'list') {
    return (
      <Link to="/anime/$id" params={{ id: String(anime.mal_id) }}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group py-0 gap-0 flex-row h-28">
          <div className="w-20 shrink-0 overflow-hidden bg-muted">
            <img
              src={anime.images.jpg.image_url}
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
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer group pt-0 gap-0">
        <div className="aspect-[2/3] overflow-hidden bg-muted">
          <img
            src={anime.images.jpg.image_url}
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
