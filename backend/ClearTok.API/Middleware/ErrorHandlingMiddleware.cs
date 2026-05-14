using System.Net;
using System.Text.Json;
using ClearTok.API.Models;

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
        catch (InvalidOperationException ex)
        {
            // Business logic errors (yt-dlp failed, private video, etc.) → 422
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
