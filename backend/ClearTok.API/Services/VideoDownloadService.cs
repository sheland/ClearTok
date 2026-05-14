namespace ClearTok.API.Services;

// ─── Interface ───────────────────────────────────────────────────────────────
public interface IVideoDownloadService
{
    Task<(Stream fileStream, string fileName)> GetVideoStreamAsync(string url, CancellationToken cancellationToken = default);
}

// ─── Implementation ──────────────────────────────────────────────────────────
// This service sits between the controller and yt-dlp.
// It handles temp file management and cleanup so we don't
// fill up our Azure disk with downloaded videos.
public class VideoDownloadService : IVideoDownloadService
{
    private readonly IYtDlpService _ytDlpService;
    private readonly ILogger<VideoDownloadService> _logger;
    private readonly string _tempDirectory;

    public VideoDownloadService(IYtDlpService ytDlpService, ILogger<VideoDownloadService> logger, IConfiguration configuration)
    {
        _ytDlpService = ytDlpService;
        _logger = logger;

        // Use configured temp dir or fall back to system temp
        _tempDirectory = configuration["Storage:TempDirectory"] ?? Path.GetTempPath();

        // Ensure temp directory exists
        Directory.CreateDirectory(_tempDirectory);
    }

    /// <summary>
    /// Downloads a TikTok video and returns it as a stream.
    /// The caller (controller) is responsible for streaming it to the client.
    /// We use a wrapper stream that deletes the temp file after streaming completes.
    /// </summary>
    public async Task<(Stream fileStream, string fileName)> GetVideoStreamAsync(string url, CancellationToken cancellationToken = default)
    {
        // Validate URL before passing to yt-dlp
        if (!IsValidTikTokUrl(url))
        {
            throw new ArgumentException("Please provide a valid TikTok URL (e.g. https://www.tiktok.com/@username/video/123456789)");
        }

        // Download to temp file
        var filePath = await _ytDlpService.DownloadVideoAsync(url, _tempDirectory, cancellationToken);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("Download completed but file not found.");
        }

        // Generate a clean filename for the download
        var fileName = $"cleartok_{DateTime.UtcNow:yyyyMMdd_HHmmss}.mp4";

        // Return a DeleteOnCloseStream — this automatically deletes the temp file
        // once the HTTP response has been fully streamed to the user
        var stream = new DeleteOnCloseStream(filePath);
        return (stream, fileName);
    }

    /// <summary>
    /// Validates that the URL looks like a real TikTok video URL.
    /// This is a first line of defense — yt-dlp will do deeper validation.
    /// </summary>
    private static bool IsValidTikTokUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return false;

        var host = uri.Host.ToLower();

        // Accept tiktok.com, www.tiktok.com, vm.tiktok.com (short links)
        return host.Contains("tiktok.com");
    }
}

// ─── Helper: DeleteOnCloseStream ─────────────────────────────────────────────
// A FileStream wrapper that deletes the underlying file when disposed.
// This ensures temp files are always cleaned up after streaming,
// even if the user disconnects mid-download.
public class DeleteOnCloseStream : FileStream
{
    private readonly string _filePath;

    public DeleteOnCloseStream(string filePath)
        : base(filePath, FileMode.Open, FileAccess.Read, FileShare.None, 4096, FileOptions.DeleteOnClose)
    {
        _filePath = filePath;
    }
}
