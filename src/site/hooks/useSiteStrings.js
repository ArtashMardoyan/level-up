import { siteStrings } from '../i18n'
import { useLanguage } from '../../hooks/useLanguage'

// The active marketing-site string bundle, following the app's language (en/ru/hy),
// with EN fallback for any untranslated key.
export function useSiteStrings() {
  const { language } = useLanguage()
  return siteStrings(language)
}
