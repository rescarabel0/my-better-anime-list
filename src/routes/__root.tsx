import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { TrendingUp } from 'lucide-react'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { t } = useTranslation()

  return (
    <div className="h-screen flex bg-background">
      <aside className="w-56 shrink-0 border-r flex flex-col">
        <div className="h-14 flex items-center px-4 border-b">
          <Link to="/" className="font-semibold text-lg tracking-tight">
            {t('nav.brand')}
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-3 text-sm">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors [&.active]:text-foreground [&.active]:bg-accent [&.active]:font-medium"
          >
            <TrendingUp className="h-4 w-4" />
            {t('nav.topAnimes')}
          </Link>
        </nav>

        <div className="border-t p-3 flex flex-col gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 overflow-hidden">
        <Outlet />
      </main>

    </div>
  )
}
