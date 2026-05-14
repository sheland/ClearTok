namespace ClearTok.API.Models;

// ─── Request Model ───────────────────────────────────────────────────────────
// What the frontend sends to the API
public class DownloadRequest
{
    public string Url { get; set; } = string.Empty;
}

// ─── Response Models ─────────────────────────────────────────────────────────
// Returned on error
public class ErrorResponse
{
    public string Error { get; set; } = string.Empty;
    public string? Details { get; set; }
}

// Returned when video info is needed (future use: show preview before download)
public class VideoInfoResponse
{
    public string Title { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
}
