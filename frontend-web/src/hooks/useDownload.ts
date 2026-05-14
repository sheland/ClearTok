import { useState, useCallback } from 'react'
import { downloadVideo, triggerDownload } from '../services/api'

// ─── Download States ──────────────────────────────────────────────────────────
export type DownloadStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseDownloadReturn {
  status: DownloadStatus
  errorMessage: string | null
  handleDownload: (url: string) => Promise<void>
  reset: () => void
}

// ─── useDownload Hook ─────────────────────────────────────────────────────────
// Encapsulates all download logic so the component stays clean.
// Components just call handleDownload(url) and react to status changes.
export function useDownload(): UseDownloadReturn {
  const [status, setStatus] = useState<DownloadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDownload = useCallback(async (url: string) => {
    setStatus('loading')
    setErrorMessage(null)

    try {
      const { blob, fileName } = await downloadVideo(url)
      triggerDownload(blob, fileName)
      setStatus('success')

      // Auto-reset to idle after 4 seconds so user can download another
      setTimeout(() => setStatus('idle'), 4000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setErrorMessage(message)
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  return { status, errorMessage, handleDownload, reset }
}
