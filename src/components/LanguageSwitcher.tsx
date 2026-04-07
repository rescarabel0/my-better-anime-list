import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Languages } from 'lucide-react'

const LANGUAGES = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <Select value={i18n.language} onValueChange={(val) => val && i18n.changeLanguage(val)}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <SelectValue>
            {LANGUAGES.find((l) => l.value === i18n.language)?.label}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
