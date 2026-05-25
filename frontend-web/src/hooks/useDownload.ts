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

// ─── Config ───────────────────────────────────────────────────────────────────
// How long to wait before giving up on a download (90 seconds)
// TikTok videos can be large and connections can be slow
const DOWNLOAD_TIMEOUT_MS = 90_000

// How long to show the success message before auto-resetting (6 seconds)
const SUCCESS_RESET_MS = 6_000

// ─── useDownload Hook ─────────────────────────────────────────────────────────
// Encapsulates all download logic so the component stays clean.
// Components just call handleDownload(url) and react to status changes.
//
// Changes from v1:
// 1. Added 90 second timeout — if download takes too long, shows friendly error
// 2. Extended success message to 6 seconds so user actually sees it
// 3. Better error message for timeout vs other errors
export function useDownload(): UseDownloadReturn {
  const [status, setStatus] = useState<DownloadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDownload = useCallback(async (url: string) => {
    setStatus('loading')
    setErrorMessage(null)

    try {
      // ── Timeout race ────────────────────────────────────────────────────────
      // We race the actual download against a timeout promise.
      // Whichever resolves/rejects first wins.
      // If the timeout fires first, we throw a friendly error message.
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Download is taking too long. Please check your connection and try again.')),
          DOWNLOAD_TIMEOUT_MS
        )
      )

      // Race: download vs timeout
      const { blob, fileName } = await Promise.race([
        downloadVideo(url),
        timeoutPromise
      ])

      // ── Success ─────────────────────────────────────────────────────────────
      // Trigger the browser file save dialog
      triggerDownload(blob, fileName)

      // Flip to success state — user sees the success message
      setStatus('success')

      // Auto-reset after SUCCESS_RESET_MS so user can download another
      setTimeout(() => setStatus('idle'), SUCCESS_RESET_MS)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
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