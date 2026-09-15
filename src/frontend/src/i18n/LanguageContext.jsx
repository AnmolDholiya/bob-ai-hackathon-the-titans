import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('portmind_lang') || 'en'
    } catch {
      return 'en'
    }
  })

  const setLanguage = (lang) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('portmind_lang', lang)
    } catch (e) {
      console.warn('Could not save language to localStorage:', e)
    }
  }

  const t = (key, fallback) => {
    if (!key) return ''
    const currentDict = translations[language] || translations.en
    if (currentDict && currentDict[key]) {
      return currentDict[key]
    }
    // Fallback to English
    if (translations.en && translations.en[key]) {
      return translations.en[key]
    }
    return fallback !== undefined ? fallback : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
