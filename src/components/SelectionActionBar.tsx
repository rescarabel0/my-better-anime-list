import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus, X, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-popover p-2 shadow-lg ring-1 ring-foreground/10">
        <span className="text-sm font-medium px-2">
          {t('selection.selected', { count: selected.size })}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            <FolderPlus className="h-4 w-4" />
            {t('selection.addToGroup')}
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
          {t('selection.clearSelection')}
        </Button>
      </div>

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(name) => {
          // Find the group by name and add animes to it
          // This runs after state update via setTimeout in CreateGroupDialog
          const group = groups.find((g) => g.name === name)
          if (group) {
            handleAddToGroup(group.id)
          }
        }}
      />
    </>
  )
}
