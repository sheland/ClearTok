using System.Diagnostics;

namespace ClearTok.API.Services;

// ─── Interface ───────────────────────────────────────────────────────────────
public interface IYtDlpService
{
    Task<string> DownloadVideoAsync(string url, string outputPath, CancellationToken cancellationToken = default);
    Task<bool> IsAvailableAsync();
}

// ─── Implementation ──────────────────────────────────────────────────────────
// This service is the bridge between .NET and the yt-dlp CLI tool.
// yt-dlp is a Python-based command line tool. We shell out to it,
// wait for it to download the video, then return the file path.
public class YtDlpService : IYtDlpService
{
    private readonly ILogger<YtDlpService> _logger;
    private readonly IConfiguration _configuration;

    // yt-dlp executable name — works on both Windows and Linux/Azure
    private string YtDlpPath => _configuration["YtDlp:ExecutablePath"] ?? "yt-dlp";

    public YtDlpService(ILogger<YtDlpService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Downloads a TikTok video without watermark using yt-dlp.
    /// yt-dlp accesses TikTok's CDN directly to fetch the unwatermarked version.
    /// </summary>
    /// <param name="url">The TikTok video URL</param>
    /// <param name="outputPath">Directory where the file will be saved</param>
    /// <returns>Full path to the downloaded file</returns>
    public async Task<string> DownloadVideoAsync(string url, string outputPath, CancellationToken cancellationToken = default)
    {
        // Generate a unique filename for this download
        var fileName = $"{Guid.NewGuid()}.mp4";
        var fullOutputPath = Path.Combine(outputPath, fileName);

        // Build the yt-dlp command arguments:
        // -o  = output file path template
        // --no-playlist = don't download entire playlists
        // --merge-output-format mp4 = always output as mp4
        // -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" = best quality mp4
        var arguments = $"-o \"{fullOutputPath}\" " +
                $"--no-playlist " +
                $"--merge-output-format mp4 " +
                $"--impersonate chrome " +
                $"-f \"bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best\" " +
                $"\"{url}\"";

        _logger.LogInformation("Starting yt-dlp download for URL: {Url}", url);

        var processInfo = new ProcessStartInfo
        {
            FileName = YtDlpPath,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = processInfo };
        process.Start();

        // Capture output for logging/debugging
        var stdOut = await process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stdErr = await process.StandardError.ReadToEndAsync(cancellationToken);

        await process.WaitForExitAsync(cancellationToken);

        if (process.ExitCode != 0)
        {
            _logger.LogError("yt-dlp failed. Exit code: {ExitCode}. Stderr: {StdErr}", process.ExitCode, stdErr);
            throw new InvalidOperationException($"Failed to download video. The URL may be invalid or the video may be private.");
        }

        _logger.LogInformation("yt-dlp download completed. File: {FilePath}", fullOutputPath);
        return fullOutputPath;
    }

    /// <summary>
    /// Checks if yt-dlp is installed and accessible on this machine.
    /// Call this on startup to give a clear error if yt-dlp isn't installed.
    /// </summary>
    public async Task<bool> IsAvailableAsync()
    {
        try
        {
            var processInfo = new ProcessStartInfo
            {
                FileName = YtDlpPath,
                Arguments = "--version",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processInfo };
            process.Start();
            await process.WaitForExitAsync();
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }
}
