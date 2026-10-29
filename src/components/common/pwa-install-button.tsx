import { Download } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { cn } from 'cn'

import { Button } from '#/components/ui/button.tsx'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  )
}

/**
 * "Install app" button. Captures the browser's `beforeinstallprompt` event so
 * the user can install the PWA with one click from inside the app.
 *
 * Renders nothing when:
 * - the app is already installed (standalone display mode)
 * - the browser has no deferred prompt (e.g. iOS Safari, dev mode without a
 *   service worker) — in that case the browser's native install options are
 *   still available (address bar / share menu).
 */
export function InstallButton({ className }: { className?: string }) {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    function handleInstalled() {
      setInstalled(true)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleInstall = useCallback(() => {
    installEvent?.prompt().catch(() => {
      // Prompt may reject if already consumed; the native options remain.
    })
  }, [installEvent])

  if (installed || !installEvent) return null

  return (
    <Button
      variant="outline"
      type="button"
      className={cn('w-full', className)}
      onClick={handleInstall}
    >
      <Download aria-hidden /> Install app
    </Button>
  )
}
