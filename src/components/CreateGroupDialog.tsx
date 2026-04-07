import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useGroups } from '@/contexts/GroupsContext'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (groupId: string) => void
}

export function CreateGroupDialog({ open, onOpenChange, onCreated }: CreateGroupDialogProps) {
  const { t } = useTranslation()
  const { groups, createGroup } = useGroups()
  const [name, setName] = useState('')

  const trimmed = name.trim()
  const isDuplicate = groups.some((g) => g.name === trimmed)
  const isValid = trimmed.length > 0 && !isDuplicate

  const handleCreate = () => {
    if (!isValid) return
    createGroup(trimmed)
    setName('')
    onOpenChange(false)
    // Find the newly created group - it will be the last one
    // We need to use a timeout since state updates are async
    setTimeout(() => {
      onCreated?.(trimmed)
    }, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('groups.createGroup')}</DialogTitle>
          <DialogDescription>{t('groups.groupName')}</DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('groups.groupNamePlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => { setName(''); onOpenChange(false) }}>
            {t('groups.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={!isValid}>
            {t('groups.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
