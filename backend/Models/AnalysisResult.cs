namespace DevLens.Api.Models;

/// <summary>
/// Comprehensive analysis result for a GitHub repository
/// </summary>
public class AnalysisResult
{
    public string Owner { get; set; } = string.Empty;
    public string Repo { get; set; } = string.Empty;
    public int Stars { get; set; }
    public int Forks { get; set; }
    public int OpenIssues { get; set; }
    public string? License { get; set; }
    public string? Description { get; set; }
    public string? LastCommit { get; set; }
    public Dictionary<string, int> Languages { get; set; } = new();
    public List<ContributorDto> TopContributors { get; set; } = new();
    public List<CommitDayDto> CommitHeatmap { get; set; } = new();
    public ReadmeScoreDto ReadmeScore { get; set; } = new();
    public IssueStatsDto IssueStats { get; set; } = new();
    public PrStatsDto PrStats { get; set; } = new();
    public string? AiSummary { get; set; }
    public List<CodeRiskDto> Risks { get; set; } = new();
    public int OverallScore { get; set; }
    public string ProjectStatus { get; set; } = "Unknown";
    public List<string> Suggestions { get; set; } = new();
    public string? Trend { get; set; }
}

/// <summary>
/// Represents a potential code risk or issue
/// </summary>
public class CodeRiskDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium";
    public string Category { get; set; } = string.Empty;
}

/// <summary>
/// Repository contributor information
/// </summary>
public class ContributorDto
{
    public string Login { get; set; } = string.Empty;
    public int Commits { get; set; }
    public string? AvatarUrl { get; set; }
}

/// <summary>
/// Daily commit activity data
/// </summary>
public class CommitDayDto
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
    public List<string> Messages { get; set; } = new();
}

/// <summary>
/// README quality assessment scores
/// </summary>
public class ReadmeScoreDto
{
    public int Total { get; set; }
    public bool HasBadges { get; set; }
    public bool HasInstall { get; set; }
    public bool HasUsage { get; set; }
    public bool HasScreenshots { get; set; }
    public bool HasLicense { get; set; }
}

/// <summary>
/// Issue management statistics
/// </summary>
public class IssueStatsDto
{
    public int Open { get; set; }
    public int Closed { get; set; }
    public double AvgCloseTimeDays { get; set; }
}

/// <summary>
/// Pull request statistics
/// </summary>
public class PrStatsDto
{
    public int Merged { get; set; }
    public int Open { get; set; }
    public int Closed { get; set; }
}

/// <summary>
/// Chat message for AI conversations
/// </summary>
public class ChatMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
