import { useState } from 'react'
import { Link, useNavigate, useMatches } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, Bookmark, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useGroups } from '@/contexts/GroupsContext'
import { CreateGroupDialog } from '@/components/CreateGroupDialog'
import { ShareGroupDialog } from '@/components/ShareGroupDialog'

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

function groupIcon(name: string) {
  if (name === 'watched') return <Eye className="h-4 w-4" />
  if (name === 'wantToWatch') return <Bookmark className="h-4 w-4" />
  return null
}

export function GroupSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const { groups, deleteGroup, renameGroup } = useGroups()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [targetGroup, setTargetGroup] = useState<{ id: string; name: string } | null>(null)
  const [renameName, setRenameName] = useState('')

  const handleRenameOpen = (group: { id: string; name: string }) => {
    setTargetGroup(group)
    setRenameName(group.name)
    setRenameDialogOpen(true)
  }

  const handleRenameConfirm = () => {
    if (targetGroup && renameName.trim()) {
      renameGroup(targetGroup.id, renameName.trim())
      setRenameDialogOpen(false)
    }
  }

  const handleDeleteOpen = (group: { id: string; name: string }) => {
    setTargetGroup(group)
    setDeleteDialogOpen(true)
  }

  const navigate = useNavigate()
  const matches = useMatches()

  const handleDeleteConfirm = () => {
    if (targetGroup) {
      deleteGroup(targetGroup.id)
      setDeleteDialogOpen(false)
      // If we're on the deleted group's page, redirect to home
      const isOnGroupPage = matches.some(
        (m) => m.routeId === '/groups/$groupId' && (m.params as { groupId?: string }).groupId === targetGroup.id
      )
      if (isOnGroupPage) {
        navigate({ to: '/', search: { sort: 'score_desc', q: '', genres: [] } })
      }
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('nav.collections')}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {groups.map((group) => (
          <div key={group.id} className="group/item flex items-center">
            <Link
              to="/groups/$groupId"
              params={{ groupId: group.id }}
              className="flex-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer [&.active]:text-foreground [&.active]:bg-accent [&.active]:font-medium min-w-0"
              onClick={onNavigate}
            >
              {groupIcon(group.name)}
              <span className="truncate flex-1 min-w-0">{groupDisplayName(group.name, t)}</span>
            </Link>
            <div className="relative flex items-center justify-center w-8 h-7 shrink-0 mr-1">
              <span className={`text-xs text-muted-foreground transition-opacity ${!group.isDefault ? 'group-hover/item:opacity-0' : ''}`}>
                {group.animeIds.length}
              </span>
              {!group.isDefault && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity rounded-md hover:bg-accent cursor-pointer">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" sideOffset={4}>
                    <DropdownMenuItem onClick={() => handleRenameOpen(group)}>
                      <Pencil className="h-4 w-4" />
                      {t('groups.rename')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setTargetGroup(group); setShareDialogOpen(true) }}>
                      <Link2 className="h-4 w-4" />
                      {t('share.share')}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => handleDeleteOpen(group)}>
                      <Trash2 className="h-4 w-4" />
                      {t('groups.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateGroupDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.rename')}</DialogTitle>
            <DialogDescription>{t('groups.groupName')}</DialogDescription>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameConfirm() }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {t('groups.cancel')}
            </Button>
            <Button onClick={handleRenameConfirm} disabled={!renameName.trim()}>
              {t('groups.rename')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.delete')}</DialogTitle>
            <DialogDescription>
              {t('groups.deleteConfirm', { name: targetGroup ? groupDisplayName(targetGroup.name, t) : '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('groups.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {t('groups.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {targetGroup && (
        <ShareGroupDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          groupId={targetGroup.id}
          groupName={groupDisplayName(targetGroup.name, t)}
        />
      )}
    </>
  )
}
