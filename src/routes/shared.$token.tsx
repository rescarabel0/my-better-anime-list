import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { useTokens, useUser } from '@/contexts/UserContext'
import { useGroups } from '@/contexts/GroupsContext'
import type { AnimeGroupEntry } from '@/types/groups'

export const Route = createFileRoute('/shared/$token')({
  component: SharedGroupPage,
})

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

function CopyGroupButton({ animes, defaultName }: { animes: AnimeGroupEntry[]; defaultName: string }) {
  const { t } = useTranslation()
  const { groups, addAnimesToGroup, createGroup } = useGroups()
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState(defaultName)
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null)
  const [pendingGroupName, setPendingGroupName] = useState<string | null>(null)

  // Once the new group exists in state, add the animes to it
  if (pendingGroupName) {
    const newGroup = groups.find((g) => g.name === pendingGroupName && g.animeIds.length === 0)
    if (newGroup) {
      addAnimesToGroup(newGroup.id, animes)
      setPendingGroupName(null)
    }
  }

  const flash = (label: string) => {
    setCopiedLabel(label)
    setTimeout(() => setCopiedLabel(null), 2000)
  }

  const handleAddToExisting = (groupId: string, label: string) => {
    addAnimesToGroup(groupId, animes)
    flash(label)
  }

  const handleCreateAndCopy = () => {
    const name = newGroupName.trim()
    if (!name) return
    createGroup(name)
    setPendingGroupName(name)
    setNewGroupDialogOpen(false)
    flash(name)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="secondary" size="sm" className="gap-2" />}>
          {copiedLabel ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              {copiedLabel}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              {t('share.copyToCollection')}
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {groups.map((group) => (
            <DropdownMenuItem
              key={group.id}
              onClick={() => handleAddToExisting(group.id, groupDisplayName(group.name, t))}
            >
              {groupDisplayName(group.name, t)}
              <span className="ml-auto text-xs text-muted-foreground">{group.animeIds.length}</span>
            </DropdownMenuItem>
          ))}
          {groups.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => { setNewGroupName(defaultName); setNewGroupDialogOpen(true) }}>
            {t('groups.newGroup')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.createGroup')}</DialogTitle>
            <DialogDescription>{t('share.copyNewGroupDescription', { count: animes.length })}</DialogDescription>
          </DialogHeader>
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndCopy() }}
            placeholder={t('groups.groupNamePlaceholder')}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGroupDialogOpen(false)}>
              {t('groups.cancel')}
            </Button>
            <Button onClick={handleCreateAndCopy} disabled={!newGroupName.trim()}>
              {t('groups.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SharedGroupPage() {
  const { t } = useTranslation()
  const { token } = Route.useParams()
  const { getToken } = useTokens()
  const { getUserById, activeUserId } = useUser()
  const { getGroupById, animeCache } = useGroups()

  const sharedToken = getToken(token)

  if (!sharedToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <p className="text-sm">{t('share.notFound')}</p>
        <Link to="/" search={{ sort: 'score_desc', q: '', genres: [] }} className="text-sm text-primary hover:underline">
          {t('detail.backArrow')}
        </Link>
      </div>
    )
  }

  const group = getGroupById(sharedToken.groupId)
  const owner = getUserById(sharedToken.userId)
  const isOwnGroup = sharedToken.userId === activeUserId

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <p className="text-sm">{t('share.groupDeleted')}</p>
        <Link to="/" search={{ sort: 'score_desc', q: '', genres: [] }} className="text-sm text-primary hover:underline">
          {t('detail.backArrow')}
        </Link>
      </div>
    )
  }

  const animes = group.animeIds.map((id) => animeCache[id]).filter(Boolean)
  const copyDefaultName = (group.name === 'watched' || group.name === 'wantToWatch')
    ? `${owner?.name ?? ''} - ${groupDisplayName(group.name, t)}`
    : group.name

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Owner info */}
      {owner && (
        <Link
          to="/profile/$userId"
          params={{ userId: owner.id }}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <AvatarDisplay name={owner.name} avatarUrl={owner.avatarUrl} />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{owner.name}</span>
            <span className="text-xs text-muted-foreground">{t('share.sharedBy')}</span>
          </div>
        </Link>
      )}

      {/* Group header */}
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold">{groupDisplayName(group.name, t)}</h1>
        <Badge variant="secondary">{animes.length}</Badge>
        {!isOwnGroup && animes.length > 0 && (
          <div className="ml-auto">
            <CopyGroupButton animes={animes} defaultName={copyDefaultName} />
          </div>
        )}
      </div>

      {/* Anime grid */}
      {animes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('groups.empty')}</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
          {animes.map((anime) => {
            const title = anime.title_english ?? anime.title
            return (
              <Link key={anime.mal_id} to="/anime/$id" params={{ id: String(anime.mal_id) }}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer pt-0 gap-0 h-full">
                  <div className="aspect-[2/3] overflow-hidden bg-muted">
                    <img
                      src={anime.image_url}
                      alt={title}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-2 sm:p-3 space-y-1">
                    <h3 className="font-medium text-xs sm:text-sm leading-tight line-clamp-2">{title}</h3>
                    <div className="flex flex-wrap gap-1">
                      {anime.score && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          ⭐ {anime.score}
                        </Badge>
                      )}
                      {anime.episodes && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {anime.episodes} eps
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
