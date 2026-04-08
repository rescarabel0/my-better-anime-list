import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AnimeCardSkeletonProps {
  variant?: 'grid' | 'list'
}

export function AnimeCardSkeleton({ variant = 'grid' }: AnimeCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <Card className="overflow-hidden py-0 gap-0 flex-row h-28">
        <Skeleton className="w-20 shrink-0 h-full rounded-none" />
        <CardContent className="p-3 flex flex-col justify-center gap-1 min-w-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-14" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden h-full pt-0 gap-0">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <CardContent className="p-3 space-y-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
    </Card>
  )
}
