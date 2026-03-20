using System.Text.RegularExpressions;

namespace DevLens.Api.Utils;

/// <summary>
/// Utility class for parsing and validating GitHub repository URLs
/// </summary>
public static class UrlParser
{
    private static readonly Regex GitHubUrlRegex = new(
        @"^(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+?)(?:\.git)?/?$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );
    
    private static readonly Regex ShorthandRegex = new(
        @"^([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)$",
        RegexOptions.Compiled
    );

    /// <summary>
    /// Parses and validates a GitHub repository URL and extracts owner and repo name
    /// Supports multiple formats:
    /// - Full URL: https://github.com/owner/repo
    /// - Partial URL: github.com/owner/repo
    /// - Shorthand: owner/repo
    /// </summary>
    public static (string? owner, string? repo) ParseGitHubUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return (null, null);
        
        url = url.Trim();
        
        // Security: Block potentially malicious URLs
        if (url.Contains("javascript:", StringComparison.OrdinalIgnoreCase) ||
            url.Contains("data:", StringComparison.OrdinalIgnoreCase) ||
            url.Contains("<script", StringComparison.OrdinalIgnoreCase) ||
            url.Contains("onclick", StringComparison.OrdinalIgnoreCase))
        {
            return (null, null);
        }
        
        // Remove trailing .git and slashes
        url = url.TrimEnd('/');
        if (url.EndsWith(".git", StringComparison.OrdinalIgnoreCase))
            url = url[..^4];

        // Try full GitHub URL with regex validation
        var match = GitHubUrlRegex.Match(url);
        if (match.Success)
        {
            return (match.Groups[1].Value, match.Groups[2].Value);
        }

        // Try shorthand format with validation
        match = ShorthandRegex.Match(url);
        if (match.Success)
        {
            return (match.Groups[1].Value, match.Groups[2].Value);
        }

        // Try parsing as URI for additional validation
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            if (!uri.Host.Equals("github.com", StringComparison.OrdinalIgnoreCase) &&
                !uri.Host.Equals("www.github.com", StringComparison.OrdinalIgnoreCase))
            {
                return (null, null);
            }

            var path = uri.AbsolutePath.TrimStart('/').TrimEnd('/');
            var parts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            
            if (parts.Length >= 2 && 
                IsValidGitHubName(parts[0]) && 
                IsValidGitHubName(parts[1]))
            {
                return (parts[0], parts[1]);
            }
        }

        return (null, null);
    }

    /// <summary>
    /// Validates if a string is a valid GitHub username or repository name
    /// </summary>
    private static bool IsValidGitHubName(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            return false;

        // GitHub names can contain alphanumeric, hyphens, underscores, and dots
        return Regex.IsMatch(name, @"^[a-zA-Z0-9_.-]+$");
    }
}
