import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import type { Anime } from '@/types/anime'

interface AnimeCardProps {
  anime: Anime
  variant?: 'grid' | 'list'
  selected?: boolean
  selectionMode?: boolean
  onToggleSelect?: (anime: Anime) => void
}

export function AnimeCard({ anime, variant = 'grid', selected, selectionMode, onToggleSelect }: AnimeCardProps) {
  const title = anime.title_english ?? anime.title
  const subtitle = anime.title_english ? anime.title : null

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSelect?.(anime)
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault()
      onToggleSelect?.(anime)
    }
  }

  const checkboxVisible = selectionMode || selected

  const checkbox = onToggleSelect ? (
    <div
      className={`absolute top-2 left-2 z-20 transition-opacity cursor-pointer ${checkboxVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      onClick={handleCheckboxClick}
    >
      <div className={`size-6 rounded-md border-2 flex items-center justify-center backdrop-blur-sm transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/80' : 'border-muted-foreground/60 bg-background/80 hover:border-primary hover:bg-primary/10'}`}>
        {selected && <Check className="size-4" strokeWidth={3} />}
      </div>
    </div>
  ) : null

  if (variant === 'list') {
    return (
      <div className="relative group">
        {onToggleSelect && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 right-2 z-20 transition-opacity cursor-pointer ${checkboxVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            onClick={handleCheckboxClick}
          >
            <div className={`size-6 rounded-md border-2 flex items-center justify-center backdrop-blur-sm transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/80' : 'border-muted-foreground/60 bg-background/80 hover:border-primary hover:bg-primary/10'}`}>
              {selected && <Check className="size-4" strokeWidth={3} />}
            </div>
          </div>
        )}
        <Link to="/anime/$id" params={{ id: String(anime.mal_id) }} onClick={handleLinkClick}>
          <Card className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer py-0 gap-0 flex-row h-28 ${selected ? 'ring-2 ring-primary' : ''}`}>
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
              <div className="flex flex-nowrap gap-1">
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
      {checkbox}
      <Link to="/anime/$id" params={{ id: String(anime.mal_id) }} onClick={handleLinkClick}>
        <Card className={`overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer pt-0 gap-0 ${selected ? 'ring-2 ring-primary' : ''}`}>
          <div className="aspect-[2/3] overflow-hidden bg-muted">
            <img
              src={anime.images.jpg.image_url}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <CardContent className="p-3 flex flex-col gap-1 flex-1">
            <div className="flex-1 min-h-0 space-y-1">
              <h3 className="font-medium text-sm leading-tight line-clamp-2">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
              )}
            </div>
            <div className="flex flex-nowrap gap-1 pt-1">
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
