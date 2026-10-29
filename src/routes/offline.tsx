import { WifiOff } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '#/components/ui/button.tsx'

export const Route = createFileRoute('/offline')({
  component: OfflinePage,
})

function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <WifiOff className="size-8" />
      </div>
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold">You&rsquo;re offline</h1>
        <p className="text-muted-foreground text-sm text-balance">
          No internet connection right now. Check your connection and try again
          — your data will be waiting when you&rsquo;re back.
        </p>
      </div>
      <Button type="button" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  )
}
