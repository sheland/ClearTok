using System.Diagnostics;

namespace ClearTok.API.Services;

// ─── Interface ───────────────────────────────────────────────────────────────
public interface IYtDlpService
{
    Task<string> DownloadVideoAsync(string url, string outputPath, CancellationToken cancellationToken = default);
    Task<bool> IsAvailableAsync();
    Task<string> GetVersionAsync();
}

// ─── Proxy Model ─────────────────────────────────────────────────────────────
public record ProxyConfig(string Host, int Port, string Username, string Password)
{
    public string ToytDlpFormat() => $"http://{Username}:{Password}@{Host}:{Port}";
}

// ─── Failure Classification ──────────────────────────────────────────────────
public enum DownloadFailureType
{
    ProxyOrNetwork,   // transient — bad/stale proxy IP, connection issue. RETRY.
    Timeout,          // transient — slow exit IP or slow TikTok. RETRY.
    PrivateOrRemoved, // permanent — private/deleted/region-locked/unsupported. DO NOT RETRY.
    Unknown           // permanent by default — fail fast (retrying wastes time).
}

// ─── Custom Exception ────────────────────────────────────────────────────────
public class DownloadFailedException : Exception
{
    public DownloadFailureType FailureType { get; }
    public string RawError { get; }

    public DownloadFailedException(DownloadFailureType failureType, string userMessage, string rawError)
        : base(userMessage)
    {
        FailureType = failureType;
        RawError = rawError;
    }
}

// ─── Implementation ──────────────────────────────────────────────────────────
public class YtDlpService : IYtDlpService
{
    private readonly ILogger<YtDlpService> _logger;
    private readonly IConfiguration _configuration;
    private readonly List<ProxyConfig> _proxies;

    // Total attempts for a TRANSIENT failure before giving up.
    // 3 = 1 initial + 2 retries. Only transient failures (proxy/timeout) retry;
    // permanent and unknown failures fail immediately.
    private const int MaxAttempts = 3;

    private string YtDlpPath => _configuration["YtDlp:ExecutablePath"]
        ?? Path.Combine(AppContext.BaseDirectory, "yt-dlp")
        ?? "yt-dlp";

    private string PythonPackagesPath => Path.Combine(AppContext.BaseDirectory, "python-packages");

    public YtDlpService(ILogger<YtDlpService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _proxies = LoadProxies(configuration);
    }

    private static List<ProxyConfig> LoadProxies(IConfiguration configuration)
    {
        var proxyList = configuration["Proxies:List"];
        if (string.IsNullOrWhiteSpace(proxyList))
            return new List<ProxyConfig>();

        var proxies = new List<ProxyConfig>();
        foreach (var entry in proxyList.Split(',', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = entry.Trim().Split(':');
            if (parts.Length == 4 && int.TryParse(parts[1], out var port))
                proxies.Add(new ProxyConfig(parts[0], port, parts[2], parts[3]));
        }
        return proxies;
    }

    private ProxyConfig? GetRandomProxy()
    {
        if (_proxies.Count == 0) return null;
        return _proxies[Random.Shared.Next(_proxies.Count)];
    }

    /// <summary>
    /// Downloads a TikTok video. Retries ONLY transient failures (proxy/timeout).
    /// Permanent and Unknown failures fail immediately — no wasted retries.
    /// </summary>
    public async Task<string> DownloadVideoAsync(string url, string outputPath, CancellationToken cancellationToken = default)
    {
        DownloadFailedException? lastFailure = null;

        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                return await TryDownloadOnceAsync(url, outputPath, attempt, cancellationToken);
            }
            catch (DownloadFailedException ex)
            {
                lastFailure = ex;

                // Only proxy/network and timeout failures are worth retrying.
                // Permanent (private/removed/unsupported) AND Unknown fail fast —
                // retrying them just makes the user wait longer to still fail.
                var isRetryable = ex.FailureType == DownloadFailureType.ProxyOrNetwork
                               || ex.FailureType == DownloadFailureType.Timeout;

                if (!isRetryable)
                {
                    _logger.LogWarning("Non-retryable failure on attempt {Attempt} ({Type}). Failing fast.", attempt, ex.FailureType);
                    throw;
                }

                if (attempt < MaxAttempts)
                {
                    _logger.LogWarning("Transient failure on attempt {Attempt}/{Max} ({Type}). Retrying...",
                        attempt, MaxAttempts, ex.FailureType);
                }
                else
                {
                    _logger.LogError("All {Max} attempts failed. Final cause: {Type}. Stderr: {Err}",
                        MaxAttempts, ex.FailureType, ex.RawError);
                }
            }
        }

        throw lastFailure!;
    }

    private async Task<string> TryDownloadOnceAsync(string url, string outputPath, int attempt, CancellationToken cancellationToken)
    {
        var fileName = $"{Guid.NewGuid()}.mp4";
        var fullOutputPath = Path.Combine(outputPath, fileName);

        var proxy = GetRandomProxy();

        // NOTE: keeping bestvideo+bestaudio to preserve HD quality (a differentiator
        // users specifically praised). Do not downgrade to single-stream.
        var arguments = $"-o \"{fullOutputPath}\" " +
                $"--no-playlist " +
                $"--merge-output-format mp4 " +
                $"--impersonate chrome " +
                $"--no-update ";

        if (proxy != null)
        {
            arguments += $"--proxy \"{proxy.ToytDlpFormat()}\" ";
            _logger.LogInformation("Attempt {Attempt}: using proxy {Host}:{Port}", attempt, proxy.Host, proxy.Port);
        }
        else
        {
            _logger.LogInformation("Attempt {Attempt}: no proxy configured — direct connection", attempt);
        }

        arguments += $"-f \"bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best\" " +
                $"\"{url}\"";

        var processInfo = new ProcessStartInfo
        {
            FileName = YtDlpPath,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        var existingPythonPath = Environment.GetEnvironmentVariable("PYTHONPATH") ?? "";
        processInfo.Environment["PYTHONPATH"] = string.IsNullOrEmpty(existingPythonPath)
            ? PythonPackagesPath
            : $"{PythonPackagesPath}:{existingPythonPath}";

        using var process = new Process { StartInfo = processInfo };
        process.Start();

        var stdErr = await process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);

        if (process.ExitCode == 0)
        {
            _logger.LogInformation("Download succeeded on attempt {Attempt}. File: {FilePath}", attempt, fullOutputPath);
            return fullOutputPath;
        }

        var (type, userMessage) = ClassifyError(stdErr);
        throw new DownloadFailedException(type, userMessage, stdErr);
    }

    /// <summary>
    /// Maps yt-dlp stderr to a failure type + user-facing message.
    /// User never sees proxy/IP/technical details — those stay in RawError for logs.
    /// </summary>
    private static (DownloadFailureType, string) ClassifyError(string stdErr)
    {
        var err = (stdErr ?? string.Empty).ToLowerInvariant();

        // ── Permanent: unsupported content (photo posts, non-video URLs). ──
        // yt-dlp says "Unsupported URL" for photo slideshows and other non-videos.
        if (err.Contains("unsupported url") ||
            err.Contains("photo") ||
            err.Contains("no video could be found"))
        {
            return (DownloadFailureType.PrivateOrRemoved,
                "This link isn't a downloadable TikTok video. Make sure it's a video, not a photo post.");
        }

        // ── Permanent: the video itself is unavailable. ──
        if (err.Contains("private") ||
            err.Contains("you do not have permission") ||
            err.Contains("log into an account") ||
            err.Contains("video is unavailable") ||
            err.Contains("removed") ||
            err.Contains("not available in your") ||
            err.Contains("unable to find video") ||
            err.Contains("status code 404"))
        {
            return (DownloadFailureType.PrivateOrRemoved,
                "This video is private or no longer available. Make sure the video is public and try again.");
        }

        // ── Transient: proxy / network problems. Worth retrying. ──
        if (err.Contains("407") ||
            err.Contains("connect tunnel failed") ||
            err.Contains("403") ||
            err.Contains("forbidden") ||
            err.Contains("proxyerror") ||
            err.Contains("unable to download webpage") ||
            err.Contains("connection") ||
            err.Contains("failed to perform"))
        {
            return (DownloadFailureType.ProxyOrNetwork,
                "Something went wrong on our end. Please try again.");
        }

        // ── Transient: timeouts. Worth retrying. ──
        if (err.Contains("timed out") ||
            err.Contains("timeout") ||
            err.Contains("read timed out"))
        {
            return (DownloadFailureType.Timeout,
                "This is taking longer than expected. Please try again.");
        }

        // ── Unknown: fail fast (does NOT retry). Generic message. ──
        return (DownloadFailureType.Unknown,
            "Download failed. Please check the link and try again.");
    }

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

    public async Task<string> GetVersionAsync()
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
            var version = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();
            return version.Trim();
        }
        catch
        {
            return "unknown";
        }
    }
}