using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ClearTok.API.Models;
using ClearTok.API.Services;

namespace ClearTok.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VideoController : ControllerBase
{
    private readonly IVideoDownloadService _downloadService;
    private readonly ILogger<VideoController> _logger;

    public VideoController(IVideoDownloadService downloadService, ILogger<VideoController> logger)
    {
        _downloadService = downloadService;
        _logger = logger;
    }

    // ─── POST /api/video/download ─────────────────────────────────────────────
    // Main endpoint: accepts a TikTok URL, returns the video file as a download.
    // The [EnableRateLimiting] attribute applies our IP-based rate limiter.
    [HttpPost("download")]
    [EnableRateLimiting("downloadPolicy")]
    public async Task<IActionResult> Download([FromBody] DownloadRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return BadRequest(new ErrorResponse { Error = "URL is required." });
        }

        _logger.LogInformation("Download request received for URL: {Url}", request.Url);

        // Get the video as a stream from our service
        var (fileStream, fileName) = await _downloadService.GetVideoStreamAsync(request.Url, cancellationToken);

        // Stream the file directly to the client as a download
        // FileStreamResult handles streaming efficiently without loading into memory
        return File(fileStream, "video/mp4", fileName);
    }

    // ─── GET /api/video/health ────────────────────────────────────────────────
    // Health check endpoint — useful for Azure monitoring and debugging.
    // Verifies yt-dlp is installed and working.
    [HttpGet("health")]
    public async Task<IActionResult> Health([FromServices] IYtDlpService ytDlpService)
    {
        var ytDlpAvailable = await ytDlpService.IsAvailableAsync();

        if (!ytDlpAvailable)
        {
            return StatusCode(503, new
            {
                status = "unhealthy",
                message = "yt-dlp is not installed or not accessible. Run: pip install yt-dlp"
            });
        }

        return Ok(new
        {
            status = "healthy",
            service = "ClearTok API",
            ytDlp = "available",
            timestamp = DateTime.UtcNow
        });
    }
}
