using System.Net.Http.Json;
using System.Text.Json;
using DevLens.Api.Models;

namespace DevLens.Api.Services;

public interface IGeminiService
{
    Task<string?> GetSummaryAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default);
    Task<string?> AskAIAsync(string owner, string repo, AnalysisResult result, string query, CancellationToken ct = default);
    Task<string> GetSupportAnswerAsync(string question, List<ChatMessage> history, CancellationToken ct = default);
    Task<List<CodeRiskDto>> GetCodeRisksAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default);
    Task<string?> GenerateReadmeAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default);
    Task<string?> GetCompareVerdictAsync(AnalysisResult a, AnalysisResult b, CancellationToken ct = default);
    Task<List<string>> GetSuggestionsAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default);
    Task<string?> GetTrendPredictionAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default);
    Task<ReadmeScoreDto> GetAIReadmeScoreAsync(string readmeContent, ReadmeScoreDto ruleBasedScore, CancellationToken ct = default);
    Task<PdfContentDto?> GeneratePdfContentAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default);
}

public class GeminiService : IGeminiService
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;

    public GeminiService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["GEMINI_API_KEY"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
    }

    public async Task<string?> GetSummaryAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;
        
        var langBreakdown = result.Languages.Any() 
            ? string.Join(", ", result.Languages.OrderByDescending(x => x.Value).Take(3).Select(x => x.Key))
            : "Unknown";
        
        var activityLevel = DateTime.TryParse(result.LastCommit, out var lastCommit)
            ? (DateTime.UtcNow - lastCommit).TotalDays < 30 ? "actively maintained" : "less active"
            : "unknown activity";
        
        var prompt = $@"You are an expert software architect analyzing the GitHub repository '{owner}/{repo}' for DevLens, an AI-powered repository analysis platform.

Repository Context:
- Description: {result.Description ?? "No description provided"}
- Primary Technologies: {langBreakdown}
- Community Engagement: {result.Stars} stars, {result.Forks} forks, {result.OpenIssues} open issues
- Activity Status: {activityLevel}
- Contributors: {result.TopContributors?.Count ?? 0} contributors
- Overall Score: {result.OverallScore}/100

Task: Provide a concise, professional architectural summary (2-3 sentences) that:
1. Explains the repository's purpose and technical approach
2. Highlights its key strengths or notable characteristics
3. Mentions the technology stack and architecture style if evident

Write in a clear, technical tone suitable for developers evaluating this project.";
        
        return await PostGeminiAsync(prompt, ct);
    }

    public async Task<string?> AskAIAsync(string owner, string repo, AnalysisResult result, string query, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;
        
        var langBreakdown = result.Languages.Any() 
            ? string.Join(", ", result.Languages.OrderByDescending(x => x.Value).Take(5).Select(x => $"{x.Key} ({x.Value} bytes)"))
            : "No language data";
        
        var prompt = $@"You are DevLens AI Assistant, an expert in software architecture and repository analysis. You're helping a developer understand the repository '{owner}/{repo}'.

Repository Analysis Data:
- Description: {result.Description ?? "No description"}
- Languages: {langBreakdown}
- Stars: {result.Stars} | Forks: {result.Forks} | Open Issues: {result.OpenIssues}
- License: {result.License ?? "Not specified"}
- Last Commit: {result.LastCommit ?? "Unknown"}
- Overall Quality Score: {result.OverallScore}/100
- Project Status: {result.ProjectStatus}
- README Score: {result.ReadmeScore?.Total ?? 0}/100
- Contributors: {result.TopContributors?.Count ?? 0}
- Issue Stats: {result.IssueStats?.Open ?? 0} open, {result.IssueStats?.Closed ?? 0} closed (avg close time: {result.IssueStats?.AvgCloseTimeDays:F1} days)
- PR Stats: {result.PrStats?.Merged ?? 0} merged, {result.PrStats?.Open ?? 0} open, {result.PrStats?.Closed ?? 0} closed

User Question: {query}

Instructions:
1. Answer the user's question directly and accurately based on the repository data
2. Provide specific insights using the metrics and data available
3. If the question requires information not in the data, acknowledge this and provide general guidance
4. Keep responses concise but informative (2-4 sentences)
5. Use technical language appropriate for developers
6. If relevant, reference specific metrics to support your answer

Provide a helpful, data-driven response:";
        
        return await PostGeminiAsync(prompt, ct, 0.7, 2000);
    }

    public async Task<string> GetSupportAnswerAsync(string question, List<ChatMessage> history, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return "AI Support is currently unavailable (No API Key).";

        var systemContext = @"You are DevLens AI Support Assistant. Provide CONCISE, DIRECT answers. Keep responses to 2-3 sentences maximum unless the user explicitly asks for more detail.

DevLens Features:
1. Repository Analysis: Analyze GitHub repos for metrics, quality scores, and insights
2. Dashboard: View Overview, Commits, Contributors, README Score, Issues/PRs, AI Summary, Code Risks, README Generator
3. Compare Mode: Side-by-side repo comparison with AI verdict
4. Discover Trending: Browse trending repos by category
5. README Generator: AI-powered README creation
6. AI Chat: Ask questions about analyzed repositories
7. Code Risk Detection: AI identifies issues and concerns
8. Export Reports: Generate PDF reports
9. Quality Scoring: 0-100 score based on documentation, activity, issues, and community

Key Metrics:
- Overall Score: 0-100 composite score (README 30%, activity 25%, issues 25%, community 20%)
- Project Status: Production-Ready (80+), Stable (50-79), Early-Stage, Experimental, or Abandoned
- Trend Prediction: Repository's growth trajectory based on activity, stars, and engagement
  * ""Rapidly growing popularity"" - High stars + very active development
  * ""Steady growth trajectory"" - Consistent activity and increasing engagement
  * ""Gaining momentum"" - Growing interest and contributions
  * ""Sustained steady activity"" - Regular maintenance, stable metrics
  * ""Stable maintenance mode"" - Maintained but not actively growing
  * ""Declining activity"" - Reduced commits and engagement
  * ""Stagnant development"" - Little to no recent activity
  * ""Potentially abandoned"" - No recent commits, inactive maintainers
- README Score: Documentation quality (badges, install, usage, screenshots, license)
- Issue Health: Average close time and open/closed ratio
- PR Merge Rate: Percentage of merged pull requests

Response Style:
- Be BRIEF and DIRECT - answer the specific question asked
- Use 1-3 sentences for simple questions
- Avoid bullet points unless listing is necessary
- Don't over-explain - users want quick answers
- If they ask ""what does X mean"", just explain X directly
- Save detailed explanations for when users ask ""how"" or ""why""

Examples:
Q: ""What does potentially abandoned mean?""
A: ""It means the repository hasn't had any commits in a long time and appears to be no longer maintained by its creators.""

Q: ""How do I export a report?""
A: ""Click the 'Export Report' button at the bottom of the sidebar to generate a PDF with all analysis data.""

Q: ""What's the overall score?""
A: ""It's a 0-100 rating of repository quality based on documentation, recent activity, issue management, and community engagement.""";

        var contents = new List<object>();

        foreach (var msg in history ?? new())
            contents.Add(new { role = msg.Role == "bot" ? "model" : "user", parts = new[] { new { text = msg.Content } } });

        contents.Add(new { role = "user", parts = new[] { new { text = question } } });

        return await PostGeminiComplexAsync(contents, 800, 0.7, ct, systemContext) ?? "Sorry, I'm having trouble connecting right now. Try again in a moment.";
    }

    public async Task<List<CodeRiskDto>> GetCodeRisksAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return new();
        
        var activityDays = DateTime.TryParse(result.LastCommit, out var lastCommit)
            ? (DateTime.UtcNow - lastCommit).TotalDays
            : 999;
        
        var issueCloseTime = result.IssueStats?.AvgCloseTimeDays ?? 0;
        var prMergeRate = (result.PrStats?.Merged ?? 0) + (result.PrStats?.Open ?? 0) + (result.PrStats?.Closed ?? 0) > 0
            ? (double)(result.PrStats?.Merged ?? 0) / ((result.PrStats?.Merged ?? 0) + (result.PrStats?.Open ?? 0) + (result.PrStats?.Closed ?? 0)) * 100
            : 0;
        
        var prompt = $@"You are a senior software architect performing a code risk assessment for DevLens on the repository '{owner}/{repo}'.

Repository Metrics:
- Description: {result.Description ?? "No description"}
- Technologies: {string.Join(", ", result.Languages.Keys.Take(5))}
- Stars: {result.Stars} | Forks: {result.Forks}
- Contributors: {result.TopContributors?.Count ?? 0}
- Last Activity: {activityDays:F0} days ago
- Open Issues: {result.IssueStats?.Open ?? 0} | Closed: {result.IssueStats?.Closed ?? 0}
- Avg Issue Close Time: {issueCloseTime:F1} days
- PR Merge Rate: {prMergeRate:F1}%
- README Score: {result.ReadmeScore?.Total ?? 0}/100
- Overall Score: {result.OverallScore}/100
- License: {result.License ?? "None"}

Task: Identify 3-5 potential risks, bad practices, or concerns based on the metrics above. Consider:
- Maintenance risks (inactivity, few contributors, slow issue resolution)
- Documentation gaps (low README score, missing license)
- Community health (low engagement, poor PR merge rate)
- Scalability concerns (technology choices, architecture patterns)
- Quality issues (high open issues, abandoned state)

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {{
    ""title"": ""Brief risk title (5-8 words)"",
    ""description"": ""Clear explanation of the risk and its impact (1-2 sentences)"",
    ""severity"": ""Low"" or ""Medium"" or ""High"",
    ""category"": ""Maintenance"" or ""Documentation"" or ""Community"" or ""Scalability"" or ""Quality""
  }}
]

Ensure the JSON is valid and parseable. Output ONLY the JSON array:";
        
        var jsonResult = await PostGeminiAsync(prompt, ct, 0.3, 2000);
        try
        {
            if (string.IsNullOrWhiteSpace(jsonResult)) return new();
            var cleaned = jsonResult.Trim();
            if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
            if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
            if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
            cleaned = cleaned.Trim();
            return JsonSerializer.Deserialize<List<CodeRiskDto>>(cleaned, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }
        catch { return new(); }
    }

    public async Task<string?> GenerateReadmeAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default)
    {
        var primaryLang = result.Languages.OrderByDescending(x => x.Value).FirstOrDefault().Key ?? "Unknown";
        var topContributors = result.TopContributors?.Take(3).Select(c => c.Login) ?? new List<string>();
        
        var prompt = $@"You are a technical writer creating a professional README.md for the GitHub repository '{owner}/{repo}'.

Repository Information:
- Description: {result.Description ?? "A software project"}
- Primary Language: {primaryLang}
- Technologies: {string.Join(", ", result.Languages.Keys.Take(5))}
- Stars: {result.Stars} | Forks: {result.Forks}
- License: {result.License ?? "Not specified"}
- Contributors: {result.TopContributors?.Count ?? 0} (Top: {string.Join(", ", topContributors)})
- Open Issues: {result.OpenIssues}

Task: Generate a complete, professional README.md with these sections:

1. Title & Badges (2-3 lines)
   - Project name with emoji
   - 4-6 relevant badges (license, stars, forks, language)

2. Description (2-3 sentences)
   - What the project does
   - Key benefits

3. Table of Contents (if needed)

4. Installation (concise)
   - Prerequisites (1-2 items)
   - Installation steps (3-5 commands)
   - Keep it brief and actionable

5. Usage (concise)
   - 1-2 basic code examples
   - Essential configuration only

6. Features (bullet list)
   - 4-6 key features

7. Contributing (brief)
   - 2-3 sentences on how to contribute
   - Link to issues/PRs

8. License
   - State the license: {result.License ?? "MIT"}

9. Acknowledgments (1-2 lines)
   - Thank contributors

CRITICAL INSTRUCTIONS:
- Keep each section CONCISE to fit within token limits
- Use SHORT code examples (5-10 lines max)
- Avoid lengthy explanations
- Prioritize completeness over detail
- MUST include ALL 9 sections
- End with proper closing (License + Acknowledgments)
- Do NOT truncate - finish the entire README

Generate the COMPLETE README now:";
        
        return await PostGeminiAsync(prompt, ct, 0.7, 8192);
    }

    public async Task<string?> GetCompareVerdictAsync(AnalysisResult a, AnalysisResult b, CancellationToken ct = default)
    {
        var prompt = $@"You are a senior software architect providing a comparison analysis for DevLens between two GitHub repositories.

Repository A: {a.Owner}/{a.Repo}
- Description: {a.Description ?? "No description"}
- Overall Score: {a.OverallScore}/100
- Status: {a.ProjectStatus}
- Stars: {a.Stars} | Forks: {a.Forks} | Open Issues: {a.OpenIssues}
- Technologies: {string.Join(", ", a.Languages.Keys.Take(3))}
- Contributors: {a.TopContributors?.Count ?? 0}
- README Score: {a.ReadmeScore?.Total ?? 0}/100
- License: {a.License ?? "None"}
- Last Commit: {a.LastCommit ?? "Unknown"}
- Issue Close Time: {a.IssueStats?.AvgCloseTimeDays:F1} days
- PR Merge Rate: {(a.PrStats?.Merged ?? 0) * 100.0 / Math.Max(1, (a.PrStats?.Merged ?? 0) + (a.PrStats?.Open ?? 0) + (a.PrStats?.Closed ?? 0)):F1}%

Repository B: {b.Owner}/{b.Repo}
- Description: {b.Description ?? "No description"}
- Overall Score: {b.OverallScore}/100
- Status: {b.ProjectStatus}
- Stars: {b.Stars} | Forks: {b.Forks} | Open Issues: {b.OpenIssues}
- Technologies: {string.Join(", ", b.Languages.Keys.Take(3))}
- Contributors: {b.TopContributors?.Count ?? 0}
- README Score: {b.ReadmeScore?.Total ?? 0}/100
- License: {b.License ?? "None"}
- Last Commit: {b.LastCommit ?? "Unknown"}
- Issue Close Time: {b.IssueStats?.AvgCloseTimeDays:F1} days
- PR Merge Rate: {(b.PrStats?.Merged ?? 0) * 100.0 / Math.Max(1, (b.PrStats?.Merged ?? 0) + (b.PrStats?.Open ?? 0) + (b.PrStats?.Closed ?? 0)):F1}%

Task: Provide a comprehensive comparison analysis in 2-3 well-structured paragraphs that:

1. First Paragraph: Compare overall quality, maturity, and community health
   - Which has better metrics and why
   - Community engagement and maintenance status
   - Documentation quality

2. Second Paragraph: Compare technical aspects and use case suitability
   - Technology stack differences
   - Issue resolution and PR management
   - Active development and responsiveness

3. Third Paragraph (Verdict): Clear recommendation
   - Which repository is better for production use
   - Which is better for learning/contribution
   - Any specific scenarios where one excels over the other

Write in a professional, objective tone. Use specific metrics to support your analysis. Be decisive but fair.";
        
        return await PostGeminiAsync(prompt, ct, 0.7, 2000);
    }

    public async Task<List<string>> GetSuggestionsAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return new();
        
        var weaknesses = new List<string>();
        if (result.ReadmeScore?.Total < 70) weaknesses.Add("low README score");
        if (result.Stars < 100) weaknesses.Add("limited community engagement");
        if (!result.ReadmeScore?.HasBadges ?? true) weaknesses.Add("missing badges");
        if (!result.ReadmeScore?.HasUsage ?? true) weaknesses.Add("no usage examples");
        if (string.IsNullOrEmpty(result.License)) weaknesses.Add("no license");
        if ((result.TopContributors?.Count ?? 0) < 3) weaknesses.Add("few contributors");
        if ((result.IssueStats?.AvgCloseTimeDays ?? 0) > 30) weaknesses.Add("slow issue resolution");
        
        var prompt = $@"You are a DevOps and open-source expert providing actionable improvement suggestions for the repository '{owner}/{repo}'.

Current Metrics:
- Overall Score: {result.OverallScore}/100
- README Score: {result.ReadmeScore?.Total ?? 0}/100
- Stars: {result.Stars} | Forks: {result.Forks}
- Contributors: {result.TopContributors?.Count ?? 0}
- Open Issues: {result.IssueStats?.Open ?? 0}
- Avg Issue Close Time: {result.IssueStats?.AvgCloseTimeDays:F1} days
- License: {result.License ?? "None"}
- Has Badges: {result.ReadmeScore?.HasBadges ?? false}
- Has Install Instructions: {result.ReadmeScore?.HasInstall ?? false}
- Has Usage Examples: {result.ReadmeScore?.HasUsage ?? false}
- Has Screenshots: {result.ReadmeScore?.HasScreenshots ?? false}

Identified Weaknesses: {string.Join(", ", weaknesses)}

Task: Generate 4-6 specific, actionable suggestions to improve this repository's quality, community engagement, and maintainability.

Focus on:
- Documentation improvements (README, contributing guidelines, code comments)
- Community building (issue templates, PR templates, code of conduct)
- Code quality (CI/CD, testing, linting, security scanning)
- Visibility (badges, social media, package registries)
- Maintenance (regular updates, issue triage, responsive communication)

Each suggestion should be:
- Specific and actionable (not vague advice)
- Realistic to implement
- Impactful for the repository's success
- 10-20 words long

Return ONLY a valid JSON array of strings (no markdown, no explanation):
[""suggestion 1"", ""suggestion 2"", ""suggestion 3"", ""suggestion 4"", ""suggestion 5""]

Output ONLY the JSON array:";
        
        var jsonResult = await PostGeminiAsync(prompt, ct, 0.6, 1500);
        try {
            var cleaned = jsonResult?.Trim() ?? "[]";
            if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
            if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
            if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
            cleaned = cleaned.Trim();
            return JsonSerializer.Deserialize<List<string>>(cleaned, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        } catch { return new(); }
    }

    public async Task<string?> GetTrendPredictionAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default)
    {
        var activityDays = DateTime.TryParse(result.LastCommit, out var lastCommit)
            ? (DateTime.UtcNow - lastCommit).TotalDays
            : 999;
        
        var prompt = $@"You are a data analyst predicting the growth trend for the GitHub repository '{owner}/{repo}'.

Key Indicators:
- Stars: {result.Stars}
- Forks: {result.Forks}
- Contributors: {result.TopContributors?.Count ?? 0}
- Days Since Last Commit: {activityDays:F0}
- Open Issues: {result.IssueStats?.Open ?? 0}
- Overall Score: {result.OverallScore}/100
- Project Status: {result.ProjectStatus}

Based on these metrics, predict the repository's trend using EXACTLY 3-5 words from these categories:

Growth Trends:
- ""Rapidly growing popularity""
- ""Steady growth trajectory""
- ""Gaining momentum""
- ""Sustained steady activity""
- ""Stable maintenance mode""
- ""Declining activity""
- ""Stagnant development""
- ""Potentially abandoned""

Consider:
- High stars + recent activity = growing
- Low activity + old commits = declining
- Balanced metrics = sustained
- High engagement + active = gaining momentum

Return ONLY 3-5 words, no punctuation, no explanation:";
        
        return await PostGeminiAsync(prompt, ct, 0.5, 100);
    }

    public async Task<ReadmeScoreDto> GetAIReadmeScoreAsync(string readmeContent, ReadmeScoreDto ruleBasedScore, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || string.IsNullOrWhiteSpace(readmeContent))
            return ruleBasedScore;

        var truncatedReadme = readmeContent.Length > 3000 
            ? readmeContent.Substring(0, 3000) + "... [truncated]"
            : readmeContent;

        var prompt = $@"You are a technical documentation expert evaluating a GitHub repository's README quality.

README Content:
```
{truncatedReadme}
```

Rule-Based Score Analysis:
- Badges: {(ruleBasedScore.HasBadges ? "✓ Present (20 pts)" : "✗ Missing (0 pts)")}
- Install Instructions: {(ruleBasedScore.HasInstall ? "✓ Present (25 pts)" : "✗ Missing (0 pts)")}
- Usage Examples: {(ruleBasedScore.HasUsage ? "✓ Present (25 pts)" : "✗ Missing (0 pts)")}
- Screenshots: {(ruleBasedScore.HasScreenshots ? "✓ Present (15 pts)" : "✗ Missing (0 pts)")}
- License Section: {(ruleBasedScore.HasLicense ? "✓ Present (15 pts)" : "✗ Missing (0 pts)")}
- Rule-Based Total: {ruleBasedScore.Total}/100

Task: Evaluate the README quality and provide scores for each component (0-100 scale):

1. Badges (0-20): Quality and relevance of badges
2. Install Instructions (0-25): Clarity, completeness, and ease of following
3. Usage Examples (0-25): Quality, variety, and helpfulness of examples
4. Screenshots (0-15): Presence and quality of visual documentation
5. License (0-15): Clear license information

Consider:
- Clarity and organization
- Completeness of information
- Ease of understanding for new users
- Professional presentation
- Actual content quality (not just presence)

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{{
  ""badges"": <score 0-20>,
  ""install"": <score 0-25>,
  ""usage"": <score 0-25>,
  ""screenshots"": <score 0-15>,
  ""license"": <score 0-15>
}}

Output ONLY the JSON:";

        var jsonResult = await PostGeminiAsync(prompt, ct, 0.3, 500);
        
        try
        {
            if (string.IsNullOrWhiteSpace(jsonResult)) return ruleBasedScore;
            
            var cleaned = jsonResult.Trim();
            if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
            if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
            if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
            cleaned = cleaned.Trim();

            var aiScores = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, int>>(cleaned);
            if (aiScores == null) return ruleBasedScore;

            var badgesScore = aiScores.GetValueOrDefault("badges", ruleBasedScore.HasBadges ? 20 : 0);
            var installScore = aiScores.GetValueOrDefault("install", ruleBasedScore.HasInstall ? 25 : 0);
            var usageScore = aiScores.GetValueOrDefault("usage", ruleBasedScore.HasUsage ? 25 : 0);
            var screenshotsScore = aiScores.GetValueOrDefault("screenshots", ruleBasedScore.HasScreenshots ? 15 : 0);
            var licenseScore = aiScores.GetValueOrDefault("license", ruleBasedScore.HasLicense ? 15 : 0);

            var finalBadges = (int)Math.Round(badgesScore * 0.6 + (ruleBasedScore.HasBadges ? 20 : 0) * 0.4);
            var finalInstall = (int)Math.Round(installScore * 0.6 + (ruleBasedScore.HasInstall ? 25 : 0) * 0.4);
            var finalUsage = (int)Math.Round(usageScore * 0.6 + (ruleBasedScore.HasUsage ? 25 : 0) * 0.4);
            var finalScreenshots = (int)Math.Round(screenshotsScore * 0.6 + (ruleBasedScore.HasScreenshots ? 15 : 0) * 0.4);
            var finalLicense = (int)Math.Round(licenseScore * 0.6 + (ruleBasedScore.HasLicense ? 15 : 0) * 0.4);

            var total = finalBadges + finalInstall + finalUsage + finalScreenshots + finalLicense;

            return new ReadmeScoreDto
            {
                Total = Math.Min(100, total),
                HasBadges = finalBadges > 0,
                HasInstall = finalInstall > 0,
                HasUsage = finalUsage > 0,
                HasScreenshots = finalScreenshots > 0,
                HasLicense = finalLicense > 0
            };
        }
        catch
        {
            return ruleBasedScore;
        }
    }

    private async Task<string?> PostGeminiAsync(string text, CancellationToken ct, double temp = 0.7, int maxTokens = 1500)
    {
        var contents = new[] { new { role = "user", parts = new[] { new { text } } } };
        return await PostGeminiComplexAsync(contents, maxTokens, temp, ct);
    }

    private async Task<string?> PostGeminiComplexAsync(object contents, int maxTokens = 1500, double temp = 0.7, CancellationToken ct = default, string? systemContext = null)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;

        object request = string.IsNullOrWhiteSpace(systemContext)
            ? new { contents, generationConfig = new { temperature = temp, maxOutputTokens = maxTokens } }
            : new { systemInstruction = new { parts = new[] { new { text = systemContext } } }, contents, generationConfig = new { temperature = temp, maxOutputTokens = maxTokens } };
        var models = new[]
        {
            "gemini-flash-latest",
            "gemini-pro-latest",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
        };

        foreach (var model in models)
        {
            try
            {
                var path = $"v1beta/models/{model}:generateContent?key={_apiKey}";
                var response = await _http.PostAsJsonAsync(path, request, ct);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync(ct);
                    Console.Error.WriteLine($"Gemini API Error ({model}): {response.StatusCode} - {err}");
                    
                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    {
                        break; // Stop trying other models to avoid further API bans
                    }
                    continue;
                }

                var root = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
                if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                {
                    var first = candidates[0];
                    if (first.TryGetProperty("content", out var con) && con.TryGetProperty("parts", out var p) && p.GetArrayLength() > 0)
                    {
                        var text = p[0].GetProperty("text").GetString();
                        if (!string.IsNullOrWhiteSpace(text)) return text;
                    }
                    else if (first.TryGetProperty("finishReason", out var reason))
                    {
                        Console.Error.WriteLine($"Gemini Filtered ({model}): {reason.GetString()}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Gemini Service Exception: {ex.Message}");
            }
        }
        return null;
    }

    public async Task<PdfContentDto?> GeneratePdfContentAsync(string owner, string repo, AnalysisResult result, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;

        var langBreakdown = result.Languages.Any() 
            ? string.Join(", ", result.Languages.OrderByDescending(x => x.Value).Take(5).Select(x => $"{x.Key}"))
            : "Unknown";

        var activityLevel = DateTime.TryParse(result.LastCommit, out var lastCommit)
            ? (DateTime.UtcNow - lastCommit).TotalDays < 30 ? "actively maintained" : "less active"
            : "unknown activity";

        var prompt = $@"Create a PDF report for the GitHub repository '{owner}/{repo}' with these metrics:
- Overall Score: {result.OverallScore}/100
- Status: {result.ProjectStatus}
- Stars: {result.Stars} | Forks: {result.Forks}
- Technologies: {langBreakdown}
- Contributors: {result.TopContributors?.Count ?? 0}

Generate ONLY valid JSON (no markdown, no code blocks) with exactly these fields:
1. executiveSummary: 2-3 sentences about the repository
2. keyHighlights: 5-7 bullet points (use • symbol)
3. technicalAnalysis: 3-4 sentences about tech stack
4. communityHealth: 3-4 sentences about community
5. recommendations: 5-7 bullet points (use • symbol) for developers

Output only the JSON object, nothing else.";

        var jsonResult = await PostGeminiAsync(prompt, ct, 0.5, 2000);
        if (string.IsNullOrWhiteSpace(jsonResult))
        {
            Console.Error.WriteLine("Gemini returned empty response for PDF content");
            return null;
        }

        try
        {
            var cleaned = jsonResult.Trim();
            
            if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
            if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
            if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
            
            cleaned = cleaned.Trim();
            
            if (!cleaned.StartsWith("{")) cleaned = cleaned[(cleaned.IndexOf("{") > -1 ? cleaned.IndexOf("{") : 0)..];
            if (!cleaned.EndsWith("}")) cleaned = cleaned[..cleaned.LastIndexOf("}")];
            cleaned = cleaned.Trim();
            
            Console.Error.WriteLine($"Cleaned JSON response: {cleaned[..Math.Min(200, cleaned.Length)]}...");
            
            var result2 = JsonSerializer.Deserialize<PdfContentDto>(cleaned, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return result2;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to parse PDF content JSON: {ex.Message}");
            Console.Error.WriteLine($"Raw response was: {jsonResult[..Math.Min(500, jsonResult.Length)]}");
            return null;
        }
    }
}
