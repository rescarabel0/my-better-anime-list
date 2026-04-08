import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check, Link2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTokens } from '@/contexts/UserContext'
import { useUser } from '@/contexts/UserContext'

interface ShareGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
}

export function ShareGroupDialog({ open, onOpenChange, groupId, groupName }: ShareGroupDialogProps) {
  const { t } = useTranslation()
  const { createToken, getTokensForGroup } = useTokens()
  const { activeUserId } = useUser()
  const [copied, setCopied] = useState(false)

  const existingTokens = getTokensForGroup(groupId)
  const existingToken = existingTokens[0]?.token

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`
  }

  const handleGenerateAndCopy = () => {
    if (!activeUserId) return
    const token = existingToken ?? createToken(activeUserId, groupId)
    const url = getShareUrl(token)
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopy = () => {
    if (!existingToken) return
    navigator.clipboard.writeText(getShareUrl(existingToken))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {t('share.title')}
          </DialogTitle>
          <DialogDescription>
            {t('share.description', { name: groupName })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {existingToken ? (
            <div className="flex gap-2">
              <Input
                readOnly
                value={getShareUrl(existingToken)}
                className="text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerateAndCopy} className="w-full">
              <Link2 className="h-4 w-4 mr-2" />
              {t('share.generateLink')}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {t('share.localOnly')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
