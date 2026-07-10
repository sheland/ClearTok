using System.Text.RegularExpressions;

namespace ClearTok.API.Services;

// ─── Interface ───────────────────────────────────────────────────────────────
public interface IVideoDownloadService
{
    Task<(Stream fileStream, string fileName)> GetVideoStreamAsync(string url, CancellationToken cancellationToken = default);
}

// ─── Implementation ──────────────────────────────────────────────────────────
public class VideoDownloadService : IVideoDownloadService
{
    private readonly IYtDlpService _ytDlpService;
    private readonly ILogger<VideoDownloadService> _logger;
    private readonly string _tempDirectory;

    public VideoDownloadService(IYtDlpService ytDlpService, ILogger<VideoDownloadService> logger, IConfiguration configuration)
    {
        _ytDlpService = ytDlpService;
        _logger = logger;
        _tempDirectory = configuration["Storage:TempDirectory"] ?? Path.GetTempPath();
        Directory.CreateDirectory(_tempDirectory);
    }

    /// <summary>
    /// Downloads a TikTok video and returns it as a stream.
    /// Filename is based on the TikTok video ID extracted from the URL.
    /// Example: cleartok-7626836944281980191.mp4
    /// </summary>
    public async Task<(Stream fileStream, string fileName)> GetVideoStreamAsync(string url, CancellationToken cancellationToken = default)
    {
        if (!IsValidTikTokUrl(url))
        {
            throw new ArgumentException("Please provide a valid TikTok URL (e.g. https://www.tiktok.com/@username/video/123456789)");
        }

        // ── Reject photo/slideshow posts UPFRONT ──────────────────────────────
        // TikTok /photo/ URLs are image slideshows, not videos. yt-dlp can't
        // download them and would waste ~3 slow proxy attempts failing. Catch it
        // here BEFORE any network request and give the user a clear message.
        if (IsPhotoPost(url))
        {
            _logger.LogInformation("Rejected photo post upfront: {Url}", url);
            throw new DownloadFailedException(
                DownloadFailureType.PrivateOrRemoved,  // permanent — treated as 422, no retry
                "This looks like a photo post. ClearTok works with TikTok videos, not photo slideshows.",
                "Photo post URL rejected before download.");
        }

        // Extract the video ID from the URL to use as the filename
        var videoId = ExtractVideoId(url);
        _logger.LogInformation("Extracted video ID: {VideoId} from URL: {Url}", videoId ?? "NULL", url);

        var fileName = videoId != null
            ? $"cleartok-{videoId}.mp4"
            : $"cleartok-{Guid.NewGuid():N}.mp4"; // fallback if ID can't be extracted

        var filePath = await _ytDlpService.DownloadVideoAsync(url, _tempDirectory, cancellationToken);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("Download completed but file not found.");
        }

        _logger.LogInformation("Serving file as: {FileName}", fileName);

        var stream = new DeleteOnCloseStream(filePath);
        return (stream, fileName);
    }

    /// <summary>
    /// Extracts the numeric video ID from a TikTok URL.
    /// Handles both standard and short URLs.
    /// </summary>
    private static string? ExtractVideoId(string url)
    {
        var match = Regex.Match(url, @"/video/(\d+)");
        return match.Success ? match.Groups[1].Value : null;
    }

    /// <summary>
    /// Detects TikTok photo/slideshow posts, which are not downloadable as video.
    /// Example: https://www.tiktok.com/@user/photo/7655840136382532894
    /// </summary>
    private static bool IsPhotoPost(string url)
    {
        return Regex.IsMatch(url, @"/photo/\d+", RegexOptions.IgnoreCase);
    }

    /// <summary>
    /// Validates that the URL looks like a real TikTok video URL.
    /// </summary>
    private static bool IsValidTikTokUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return false;
        var host = uri.Host.ToLower();
        return host.Contains("tiktok.com");
    }
}

// ─── Helper: DeleteOnCloseStream ─────────────────────────────────────────────
public class DeleteOnCloseStream : FileStream
{
    public DeleteOnCloseStream(string filePath)
        : base(filePath, FileMode.Open, FileAccess.Read, FileShare.None, 4096, FileOptions.DeleteOnClose)
    {
    }
}