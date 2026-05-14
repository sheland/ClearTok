import { useEffect, useRef } from 'react'

interface AdSlotProps {
  slot: string           // AdSense ad slot ID
  format?: 'auto' | 'rectangle' | 'leaderboard'
  style?: React.CSSProperties
}

// ─── AdSlot Component ─────────────────────────────────────────────────────────
// Renders a Google AdSense ad unit.
// To activate: replace 'ca-pub-XXXXXXXXXXXXXXXX' in index.html with your
// real publisher ID, then replace the data-ad-slot values with real slot IDs
// from your AdSense dashboard.
export default function AdSlot({ slot, format = 'auto', style }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      // Push to AdSense queue — this tells AdSense to fill this slot
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adsbygoogle = (window as any).adsbygoogle
      if (adsbygoogle) {
        adsbygoogle.push({})
      }
    } catch {
      // AdSense not loaded (dev environment) — silently ignore
    }
  }, [])

  return (
    <div
      style={{
        textAlign: 'center',
        minHeight: format === 'leaderboard' ? 90 : 250,
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.06)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // ← Replace with your publisher ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
