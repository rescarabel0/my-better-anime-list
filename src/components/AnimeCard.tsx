import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { Anime } from '@/types/anime'

interface AnimeCardProps {
  anime: Anime
  variant?: 'grid' | 'list'
  selected?: boolean
  onToggleSelect?: (anime: Anime) => void
}

export function AnimeCard({ anime, variant = 'grid', selected, onToggleSelect }: AnimeCardProps) {
  const title = anime.title_english ?? anime.title
  const subtitle = anime.title_english ? anime.title : null

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSelect?.(anime)
  }

  const checkbox = onToggleSelect ? (
    <div
      className={`absolute top-1.5 left-1.5 z-10 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      onClick={handleCheckboxClick}
    >
      <Checkbox
        checked={selected ?? false}
        className="bg-background/80 backdrop-blur-sm"
      />
    </div>
  ) : null

  if (variant === 'list') {
    return (
      <Link to="/anime/$id" params={{ id: String(anime.mal_id) }}>
        <Card className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer group py-0 gap-0 flex-row h-28 ${selected ? 'ring-2 ring-primary' : ''}`}>
          <div className="relative w-20 shrink-0 overflow-hidden bg-muted">
            {checkbox}
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
      <Card className={`overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer group pt-0 gap-0 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          {checkbox}
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
