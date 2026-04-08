import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown, UserPlus, ArrowRightLeft, UserCircle } from 'lucide-react'
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
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { ProfileForm } from '@/components/ProfileForm'
import { useUser } from '@/contexts/UserContext'

export function UserSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const { activeUser, allUsers, switchUser, createUser } = useUser()
  const navigate = useNavigate()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  if (!activeUser) return null

  const otherUsers = allUsers.filter((u) => u.id !== activeUser.id)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors cursor-pointer text-left">
          <AvatarDisplay name={activeUser.name} avatarUrl={activeUser.avatarUrl} size="sm" />
          <span className="truncate flex-1 font-medium">{activeUser.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-52">
          <DropdownMenuItem
            onClick={() => {
              onNavigate?.()
            }}
            render={<Link to="/profile/" />}
          >
            <UserCircle className="h-4 w-4" />
            {t('profile.myProfile')}
          </DropdownMenuItem>

          {otherUsers.length > 0 && (
            <>
              <Separator className="my-1" />
              {otherUsers.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id)
                    onNavigate?.()
                    navigate({ to: '/', search: { sort: 'score_desc', q: '', genres: [] } })
                  }}
                >
                  <AvatarDisplay name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                  <span className="truncate">{user.name}</span>
                  <ArrowRightLeft className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </DropdownMenuItem>
              ))}
            </>
          )}

          <Separator className="my-1" />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            {t('profile.createNew')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.createNew')}</DialogTitle>
            <DialogDescription>{t('profile.createDescription')}</DialogDescription>
          </DialogHeader>
          <ProfileForm
            onSubmit={(name, bio, avatarUrl) => {
              createUser(name, bio, avatarUrl)
              setCreateDialogOpen(false)
              onNavigate?.()
              navigate({ to: '/', search: { sort: 'score_desc', q: '', genres: [] } })
            }}
            submitLabel={t('profile.create')}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
