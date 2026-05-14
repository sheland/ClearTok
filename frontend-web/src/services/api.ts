// ─── API Service ─────────────────────────────────────────────────────────────
// All calls to the .NET backend live here.
// This keeps components clean and makes it easy to swap the API URL.

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export interface DownloadResult {
  blob: Blob
  fileName: string
}

export interface ApiError {
  error: string
}

// ─── downloadVideo ────────────────────────────────────────────────────────────
// Sends the TikTok URL to the backend and returns the video as a Blob.
// The Blob is used to trigger a file download in the browser.
export async function downloadVideo(url: string): Promise<DownloadResult> {
  const response = await fetch(`${API_BASE}/video/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    // Parse the error message from our .NET ErrorResponse model
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Something went wrong. Please try again.',
    }))

    if (response.status === 429) {
      throw new Error('You\'ve hit the download limit (10/hour). Please try again later.')
    }

    throw new Error(errorData.error)
  }

  // Extract filename from Content-Disposition header if available
  const contentDisposition = response.headers.get('Content-Disposition')
  const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
  const fileName = fileNameMatch?.[1] ?? 'cleartok_video.mp4'

  const blob = await response.blob()
  return { blob, fileName }
}

// ─── triggerDownload ──────────────────────────────────────────────────────────
// Takes a Blob and triggers the browser's native "Save File" dialog.
// This is the standard approach for client-side file downloads.
export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
