using DevLens.Api.Models;

namespace DevLens.Api.Services;

public interface IReadmeScorer
{
    ReadmeScoreDto Score(string? readmeContent);
}

public class ReadmeScorer : IReadmeScorer
{
    private const int PointsBadges = 20;
    private const int PointsInstall = 25;
    private const int PointsUsage = 25;
    private const int PointsScreenshots = 15;
    private const int PointsLicense = 15;

    public ReadmeScoreDto Score(string? readmeContent)
    {
        var content = readmeContent ?? "";
        var normalized = content.ToLowerInvariant();

        var hasBadges = HasBadges(normalized);
        var hasInstall = HasInstallInstructions(normalized);
        var hasUsage = HasUsageExamples(normalized);
        var hasScreenshots = HasScreenshots(normalized);
        var hasLicense = HasLicenseSection(normalized);

        var total = (hasBadges ? PointsBadges : 0)
                    + (hasInstall ? PointsInstall : 0)
                    + (hasUsage ? PointsUsage : 0)
                    + (hasScreenshots ? PointsScreenshots : 0)
                    + (hasLicense ? PointsLicense : 0);

        return new ReadmeScoreDto
        {
            Total = total,
            HasBadges = hasBadges,
            HasInstall = hasInstall,
            HasUsage = hasUsage,
            HasScreenshots = hasScreenshots,
            HasLicense = hasLicense
        };
    }

    private static bool HasBadges(string content)
    {
        return content.Contains("![") && content.Contains("](") ||
               content.Contains("shields.io") ||
               content.Contains("badge") ||
               content.Contains("img.shields");
    }

    private static bool HasInstallInstructions(string content)
    {
        var markers = new[] { "install", "getting started", "setup", "## install", "### install", "npm install", "yarn add", "pip install", "cargo build", "go get", "clone", "```bash" };
        return markers.Any(m => content.Contains(m));
    }

    private static bool HasUsageExamples(string content)
    {
        var markers = new[] { "usage", "example", "## usage", "### usage", "how to use", "```js", "```ts", "```python", "```java", "```csharp", "```go", "```rust", "```ruby" };
        return markers.Any(m => content.Contains(m));
    }

    private static bool HasScreenshots(string content)
    {
        return content.Contains("screenshot") || content.Contains(".png)") || content.Contains(".jpg)") ||
               content.Contains(".gif)") || content.Contains("![") && (content.Contains("screen") || content.Contains("demo") || content.Contains("preview"));
    }

    private static bool HasLicenseSection(string content)
    {
        return content.Contains("license") || content.Contains("licence") || content.Contains("mit license") ||
               content.Contains("apache") || content.Contains("gpl") || content.Contains("## license");
    }
}
