using System.Collections.Concurrent;

namespace DevLens.Api.Middleware;

/// <summary>
/// Simple in-memory rate limiting middleware
/// Limits requests per IP address to prevent abuse
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly int _requestLimit;
    private readonly TimeSpan _timeWindow;
    private static readonly ConcurrentDictionary<string, RequestCounter> _requestCounts = new();

    public RateLimitingMiddleware(RequestDelegate next, int requestLimit = 100, int timeWindowMinutes = 1)
    {
        _next = next;
        _requestLimit = requestLimit;
        _timeWindow = TimeSpan.FromMinutes(timeWindowMinutes);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ipAddress = GetClientIpAddress(context);
        
        if (string.IsNullOrEmpty(ipAddress))
        {
            await _next(context);
            return;
        }

        var counter = _requestCounts.GetOrAdd(ipAddress, _ => new RequestCounter());

        bool isAllowed;
        lock (counter)
        {
            // Clean up old requests outside the time window
            counter.Requests.RemoveAll(r => DateTime.UtcNow - r > _timeWindow);

            // Check if limit exceeded
            if (counter.Requests.Count >= _requestLimit)
            {
                isAllowed = false;
            }
            else
            {
                // Add current request
                counter.Requests.Add(DateTime.UtcNow);
                isAllowed = true;
            }
        }

        if (!isAllowed)
        {
            DateTime? firstRequest = null;
            lock (counter)
            {
                if (counter.Requests.Count > 0)
                    firstRequest = counter.Requests.First();
            }

            var retrySeconds = firstRequest.HasValue 
                ? (int)Math.Max(1, _timeWindow.TotalSeconds - (DateTime.UtcNow - firstRequest.Value).TotalSeconds)
                : (int)_timeWindow.TotalSeconds;
            
            context.Response.StatusCode = 429; // Too Many Requests
            context.Response.ContentType = "application/json";
            context.Response.Headers["Retry-After"] = retrySeconds.ToString();
            
            var errorResponse = System.Text.Json.JsonSerializer.Serialize(new
            {
                error = "Rate limit exceeded",
                detail = $"Too many requests. Please try again in {retrySeconds} seconds.",
                limit = _requestLimit,
                window = $"{_timeWindow.TotalMinutes} minute(s)"
            });
            
            await context.Response.WriteAsync(errorResponse);
            return;
        }

        // Cleanup old entries periodically (every 1000 requests)
        if (_requestCounts.Count > 1000)
        {
            CleanupOldEntries();
        }

        await _next(context);
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            var ips = forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries);
            if (ips.Length > 0)
                return ips[0].Trim();
        }

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
            return realIp;

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private static void CleanupOldEntries()
    {
        // Use a snapshot of keys to avoid modification issues during enumeration
        var keys = _requestCounts.Keys.ToList();
        var now = DateTime.UtcNow;

        foreach (var key in keys)
        {
            if (_requestCounts.TryGetValue(key, out var counter))
            {
                lock (counter)
                {
                    // Remove if no recent requests (within last 10 mins)
                    var isStale = counter.Requests.Count == 0 || 
                                 (now - counter.Requests.Last()) > TimeSpan.FromMinutes(10);
                    
                    if (isStale)
                    {
                        _requestCounts.TryRemove(key, out _);
                    }
                }
            }
        }
    }

    private class RequestCounter
    {
        public List<DateTime> Requests { get; } = new();
    }
}

/// <summary>
/// Extension method to easily add rate limiting to the pipeline
/// </summary>
public static class RateLimitingMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(
        this IApplicationBuilder builder, 
        int requestLimit = 100, 
        int timeWindowMinutes = 1)
    {
        return builder.UseMiddleware<RateLimitingMiddleware>(requestLimit, timeWindowMinutes);
    }
}