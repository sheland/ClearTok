using System.Threading.RateLimiting;
using ClearTok.API.Services;
using ClearTok.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ─── Services ───────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register our custom services (dependency injection)
builder.Services.AddSingleton<IYtDlpService, YtDlpService>();
builder.Services.AddScoped<IVideoDownloadService, VideoDownloadService>();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allows the React frontend to call this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClearTokPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",   // Vite dev server
                "https://getcleartok.com",   // Production domain
                "https://cleartok.azurestaticapps.net" // Production (update with your domain)
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// 10 requests per IP per hour — protects your Azure free tier costs
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("downloadPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromHours(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }
        )
    );

    // What happens when rate limit is hit
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Too many requests. You can download up to 10 videos per hour.",
            retryAfter = "1 hour"
        }, cancellationToken);
    };
});

// ─── App Pipeline ────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("ClearTokPolicy");
app.UseRateLimiter();

// Global error handling middleware
app.UseMiddleware<ErrorHandlingMiddleware>();

app.MapControllers();

app.Run();
