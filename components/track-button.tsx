'use client'

import { useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

interface TrackButtonProps {
  itemId: string
}

export function TrackButton({ itemId }: TrackButtonProps) {
  const [tracking, setTracking] = useState(false)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (tracking || busy) {
      setTracking((t) => !t)
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      if (res.ok) setTracking(true)
    } catch {
      /* leave untracked on failure */
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-colors disabled:opacity-60 ${
        tracking
          ? 'bg-[#ECFDF5] border-[#10B981] text-[#10B981]'
          : 'border-[#d1e8de] text-[#6b7f78] hover:border-[#10B981] hover:text-[#10B981] hover:bg-[#ECFDF5]'
      }`}
      aria-pressed={tracking}
    >
      {busy ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving…
        </>
      ) : tracking ? (
        <>
          <Bell className="w-4 h-4" />
          Tracking price
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          Track price
        </>
      )}
    </button>
  )
}
