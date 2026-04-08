import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus, X, Plus, Check, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { useSelection, useGroups } from '@/contexts/GroupsContext'
import { CreateGroupDialog } from '@/components/CreateGroupDialog'

function groupDisplayName(name: string, t: (key: string) => string): string {
  if (name === 'watched') return t('groups.watched')
  if (name === 'wantToWatch') return t('groups.wantToWatch')
  return name
}

export function SelectionActionBar() {
  const { t } = useTranslation()
  const { selected, clearSelection } = useSelection()
  const { groups, addAnimesToGroup } = useGroups()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  if (selected.size === 0) return null

  const entries = Array.from(selected.values())

  const handleAddToGroup = (groupId: string) => {
    addAnimesToGroup(groupId, entries)
    clearSelection()
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-popover p-2 shadow-lg ring-1 ring-foreground/10">

        <Tooltip>
          <TooltipTrigger className="flex items-center gap-1.5 px-2 cursor-default rounded-md hover:bg-accent transition-colors py-1">
            <Images className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t('selection.selected', { count: selected.size })}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="p-2 bg-popover text-popover-foreground ring-1 ring-foreground/10 shadow-lg max-w-none w-auto"
          >
            <div className="flex flex-wrap gap-1.5" style={{ maxWidth: `${Math.min(entries.length, 6) * 52}px` }}>
              {entries.map((entry) => (
                <div key={entry.mal_id} className="relative group/thumb">
                  <img
                    src={entry.image_url}
                    alt={entry.title_english ?? entry.title}
                    className="w-11 h-16 object-cover rounded-sm"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-sm flex items-end p-0.5">
                    <span className="text-white text-[9px] leading-tight line-clamp-2">
                      {entry.title_english ?? entry.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 sm:px-4 py-2 cursor-pointer"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('selection.addToGroup')}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" sideOffset={8}>
            {groups.map((group) => {
              const allInGroup = entries.every((e) => group.animeIds.includes(e.mal_id))
              return (
                <DropdownMenuItem
                  key={group.id}
                  onClick={() => handleAddToGroup(group.id)}
                >
                  {allInGroup && <Check className="h-4 w-4" />}
                  {groupDisplayName(group.name, t)}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('groups.newGroup')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={clearSelection}>
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">{t('selection.clearSelection')}</span>
        </Button>
      </div>

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(groupId) => handleAddToGroup(groupId)}
      />
    </>
  )
}
