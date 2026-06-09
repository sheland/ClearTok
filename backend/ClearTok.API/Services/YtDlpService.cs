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

// ─── Implementation ──────────────────────────────────────────────────────────
public class YtDlpService : IYtDlpService
{
    private readonly ILogger<YtDlpService> _logger;
    private readonly IConfiguration _configuration;
    private readonly List<ProxyConfig> _proxies;

    // yt-dlp executable path — reads from config, falls back to bundled binary
    private string YtDlpPath => _configuration["YtDlp:ExecutablePath"]
        ?? Path.Combine(AppContext.BaseDirectory, "yt-dlp")
        ?? "yt-dlp";

    // Python packages path — bundled curl_cffi inside the deployment
    private string PythonPackagesPath => Path.Combine(AppContext.BaseDirectory, "python-packages");

    public YtDlpService(ILogger<YtDlpService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _proxies = LoadProxies(configuration);
    }

    /// <summary>
    /// Loads proxy list from configuration.
    /// Format: "host:port:user:pass,host:port:user:pass,..."
    /// </summary>
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
    /// Downloads a TikTok video without watermark using yt-dlp.
    /// Uses bundled yt-dlp binary and curl_cffi — no system Python required.
    /// </summary>
    public async Task<string> DownloadVideoAsync(string url, string outputPath, CancellationToken cancellationToken = default)
    {
        var fileName = $"{Guid.NewGuid()}.mp4";
        var fullOutputPath = Path.Combine(outputPath, fileName);

        var proxy = GetRandomProxy();

        var arguments = $"-o \"{fullOutputPath}\" " +
                $"--no-playlist " +
                $"--merge-output-format mp4 " +
                $"--impersonate chrome ";

        if (proxy != null)
        {
            arguments += $"--proxy \"{proxy.ToytDlpFormat()}\" ";
            _logger.LogInformation("Using proxy: {Host}:{Port}", proxy.Host, proxy.Port);
        }
        else
        {
            _logger.LogInformation("No proxy configured — using direct connection");
        }

        arguments += $"-f \"bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best\" " +
                $"\"{url}\"";

        _logger.LogInformation("Starting yt-dlp download for URL: {Url}", url);
        _logger.LogInformation("Using yt-dlp at: {Path}", YtDlpPath);

        var processInfo = new ProcessStartInfo
        {
            FileName = YtDlpPath,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // Add bundled python-packages to PYTHONPATH so curl_cffi is found
        // This lets yt-dlp find curl_cffi even without a system-wide install
        var existingPythonPath = Environment.GetEnvironmentVariable("PYTHONPATH") ?? "";
        processInfo.Environment["PYTHONPATH"] = string.IsNullOrEmpty(existingPythonPath)
            ? PythonPackagesPath
            : $"{PythonPackagesPath}:{existingPythonPath}";

        _logger.LogInformation("PYTHONPATH set to: {Path}", processInfo.Environment["PYTHONPATH"]);

        using var process = new Process { StartInfo = processInfo };
        process.Start();

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
    /// Checks if yt-dlp is installed and accessible.
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