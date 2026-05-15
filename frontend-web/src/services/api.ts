// ─── API Service ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export interface DownloadResult {
  blob: Blob
  fileName: string
}

export interface ApiError {
  error: string
}

// ─── downloadVideo ────────────────────────────────────────────────────────────
export async function downloadVideo(url: string): Promise<DownloadResult> {
  const response = await fetch(`${API_BASE}/video/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Something went wrong. Please try again.',
    }))

    if (response.status === 429) {
      throw new Error("You've hit the download limit (10/hour). Please try again later.")
    }

    throw new Error(errorData.error)
  }

  // ── Clean filename extraction ─────────────────────────────────────────────
  // The Content-Disposition header can come in two formats:
  //   Simple:   attachment; filename="cleartok-123456.mp4"
  //   Encoded:  attachment; filename*=UTF-8''cleartok-123456.mp4
  // We handle both and fall back to a clean default if neither works.
  const contentDisposition = response.headers.get('Content-Disposition')
  let fileName = 'cleartok-video.mp4'

  if (contentDisposition) {
    // Try simple filename first: filename="cleartok-123.mp4"
    const simpleMatch = contentDisposition.match(/filename="([^"]+)"/)
    if (simpleMatch) {
      fileName = simpleMatch[1]
    }

    // Try encoded filename: filename*=UTF-8''cleartok-123.mp4
    const encodedMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
    if (encodedMatch) {
      fileName = decodeURIComponent(encodedMatch[1])
    }
  }

  const blob = await response.blob()
  return { blob, fileName }
}

// ─── triggerDownload ──────────────────────────────────────────────────────────
export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}