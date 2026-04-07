import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { GroupSidebar } from '@/components/GroupSidebar'
import { Logo } from '@/components/Logo'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TrendingUp, Menu } from 'lucide-react'

export const Route = createRootRoute({
  component: RootLayout,
})

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()

  return (
    <>
      <div className="h-14 flex items-center px-4 border-b shrink-0">
        <Link
          to="/"
          search={{ sort: 'score_desc', q: '', genres: [] }}
          className="flex items-center gap-2 font-semibold text-sm tracking-tight cursor-pointer"
          onClick={onNavigate}
        >
          <Logo className="h-7 w-7 shrink-0" />
          {t('nav.brand')}
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-3 text-sm overflow-y-auto">
        <Link
          to="/"
          search={{ sort: 'score_desc', q: '', genres: [] }}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer [&.active]:text-foreground [&.active]:bg-accent [&.active]:font-medium"
          onClick={onNavigate}
        >
          <TrendingUp className="h-4 w-4" />
          {t('nav.topAnimes')}
        </Link>

        <Separator className="my-2" />

        <GroupSidebar onNavigate={onNavigate} />
      </nav>

      <div className="border-t p-3 flex flex-col gap-2 shrink-0">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </>
  )
}

function RootLayout() {
  const { t } = useTranslation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="md:hidden flex items-center px-3 h-14 border-b shrink-0 bg-background">
        <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link
          to="/"
          search={{ sort: 'score_desc', q: '', genres: [] }}
          className="flex items-center gap-2 font-semibold text-sm tracking-tight cursor-pointer ml-1"
        >
          <Logo className="h-7 w-7 shrink-0" />
          {t('nav.brand')}
        </Link>
      </header>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 flex flex-col gap-0" showCloseButton={false}>
          <SidebarContent onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0 overflow-hidden p-3 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
