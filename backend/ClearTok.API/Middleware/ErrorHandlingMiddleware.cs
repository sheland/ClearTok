using System.Net;
using System.Text.Json;
using ClearTok.API.Models;
using ClearTok.API.Services;

namespace ClearTok.API.Middleware;

// ─── Global Error Handler ────────────────────────────────────────────────────
// Catches all unhandled exceptions and returns a clean JSON error response.
// Without this, .NET would return an HTML error page which breaks the React frontend.
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ArgumentException ex)
        {
            // Validation errors (bad URL, etc.) → 400 Bad Request
            _logger.LogWarning("Validation error: {Message}", ex.Message);
            await WriteErrorResponse(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (DownloadFailedException ex)
        {
            // Classified yt-dlp failure from YtDlpService (after retries).
            // The user-facing message (ex.Message) is already friendly.
            // The raw stderr (ex.RawError) is logged for debugging but never shown to the user.
            //
            // Status code depends on WHOSE fault it is:
            //   PrivateOrRemoved → 422 (the user's video is private/gone — not our problem)
            //   Everything else  → 503 (proxy/network/timeout on our side — retry-worthy)
            var statusCode = ex.FailureType == DownloadFailureType.PrivateOrRemoved
                ? HttpStatusCode.UnprocessableEntity   // 422
                : HttpStatusCode.ServiceUnavailable;   // 503

            _logger.LogWarning("Download failed ({Type}). User message: {Message}. Raw stderr: {Raw}",
                ex.FailureType, ex.Message, ex.RawError);

            await WriteErrorResponse(context, statusCode, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            // Other business logic errors → 422
            _logger.LogWarning("Processing error: {Message}", ex.Message);
            await WriteErrorResponse(context, HttpStatusCode.UnprocessableEntity, ex.Message);
        }
        catch (OperationCanceledException)
        {
            // User cancelled the download — not an error, just log it
            _logger.LogInformation("Request was cancelled by the client.");
        }
        catch (Exception ex)
        {
            // Unexpected errors → 500
            _logger.LogError(ex, "Unexpected error processing request");
            await WriteErrorResponse(context, HttpStatusCode.InternalServerError,
                "Something went wrong. Please try again.");
        }
    }

    private static async Task WriteErrorResponse(HttpContext context, HttpStatusCode statusCode, string message)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var error = new ErrorResponse { Error = message };
        var json = JsonSerializer.Serialize(error, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        await context.Response.WriteAsync(json);
    }
}