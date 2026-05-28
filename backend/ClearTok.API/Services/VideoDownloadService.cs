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

        // Extract the video ID from the URL to use as the filename
        // TikTok URLs follow the pattern: /video/1234567890123456789
        var videoId = ExtractVideoId(url);

        // Add this line temporarily to debug
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
    ///
    /// Examples:
    ///   https://www.tiktok.com/@username/video/7626836944281980191 → 7626836944281980191
    ///   https://www.tiktok.com/@username/video/7626836944281980191?is_from_webapp=1 → 7626836944281980191
    /// </summary>
    private static string? ExtractVideoId(string url)
    {
        // Match /video/ followed by a long numeric ID
        var match = Regex.Match(url, @"/video/(\d+)");
        return match.Success ? match.Groups[1].Value : null;
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