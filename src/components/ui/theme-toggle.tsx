'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/app/providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Evitar hidratação incorreta
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-[#5E6C84] hover:text-[#0F5FA8] dark:text-[#94a3b8] dark:hover:text-[#4D90D9]"
      >
        <Moon className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-[#5E6C84] hover:text-[#0F5FA8] dark:text-[#94a3b8] dark:hover:text-[#4D90D9]"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
