using System.Net.Http.Headers;
using System.Text.Json;
using DevLens.Api.Models;

namespace DevLens.Api.Services;

public interface IGitHubService
{
    Task<AnalysisResult> AnalyzeAsync(string owner, string repo, CancellationToken ct = default);
    Task<string?> RegenerateSummaryAsync(string owner, string repo, AnalysisResult existing, CancellationToken ct = default);
    Task<List<SearchRepoResult>> DiscoverReposAsync(string query, CancellationToken ct = default);
}

public class SearchRepoResult
{
    public string Owner { get; set; } = "";
    public string Repo { get; set; } = "";
    public string Description { get; set; } = "";
    public int Stars { get; set; }
    public string Language { get; set; } = "";
}

public class GitHubService : IGitHubService
{
    private readonly HttpClient _http;
    private readonly IReadmeScorer _readmeScorer;
    private readonly IGeminiService _geminiService;
    private readonly IProjectScorer _projectScorer;
    private const string ApiBase = "https://api.github.com";

    public GitHubService(
        HttpClient http,
        IReadmeScorer readmeScorer,
        IGeminiService geminiService,
        IProjectScorer projectScorer)
    {
        _http = http;
        _readmeScorer = readmeScorer;
        _geminiService = geminiService;
        _projectScorer = projectScorer;
    }

    public static void Configure(HttpClient http, string? token)
    {
        http.BaseAddress = new Uri(ApiBase);
        http.DefaultRequestHeaders.UserAgent.TryParseAdd("DevLens/1.0");
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));
        if (!string.IsNullOrWhiteSpace(token))
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.Trim());
    }

    public async Task<AnalysisResult> AnalyzeAsync(string owner, string repo, CancellationToken ct = default)
    {
        await EnsureRepoExistsAsync(owner, repo, ct);
        var result = new AnalysisResult { Owner = owner, Repo = repo };

        await Task.WhenAll(
            FillRepoBasicAsync(owner, repo, result, ct),
            FillLanguagesAsync(owner, repo, result, ct),
            FillContributorsAsync(owner, repo, result, ct),
            FillCommitHeatmapAsync(owner, repo, result, ct),
            FillReadmeScoreAsync(owner, repo, result, ct),
            FillIssueStatsAsync(owner, repo, result, ct),
            FillPrStatsAsync(owner, repo, result, ct)
        );

        result.LastCommit = await GetLastCommitDateAsync(owner, repo, ct);
        
        var summaryTask = _geminiService.GetSummaryAsync(owner, repo, result, ct);
        var risksTask = _geminiService.GetCodeRisksAsync(owner, repo, result, ct);
        var suggestionsTask = _geminiService.GetSuggestionsAsync(owner, repo, result, ct);
        var trendTask = _geminiService.GetTrendPredictionAsync(owner, repo, result, ct);
        
        try { await Task.WhenAll(summaryTask, risksTask, suggestionsTask, trendTask); } catch { }
        
        result.AiSummary = summaryTask.IsCompletedSuccessfully ? await summaryTask : "Summary analysis currently unavailable.";
        result.Risks = risksTask.IsCompletedSuccessfully ? await risksTask : new();
        result.Suggestions = suggestionsTask.IsCompletedSuccessfully ? await suggestionsTask : new();
        result.Trend = trendTask.IsCompletedSuccessfully ? await trendTask : "Sustained activity";


        _projectScorer.CalculateScore(result);

        return result;
    }

    public async Task<string?> RegenerateSummaryAsync(string owner, string repo, AnalysisResult existing, CancellationToken ct = default)
    {
        return await _geminiService.GetSummaryAsync(owner, repo, existing, ct);
    }

    private async Task FillRepoBasicAsync(string owner, string repo, AnalysisResult result, CancellationToken ct)
    {
        var doc = await GetJsonAsync($"/repos/{owner}/{repo}", ct);
        if (!doc.HasValue) return;
        var r = doc.Value;
        result.Stars = r.TryGetProperty("stargazers_count", out var s) ? s.GetInt32() : 0;
        result.Forks = r.TryGetProperty("forks_count", out var f) ? f.GetInt32() : 0;
        result.OpenIssues = r.TryGetProperty("open_issues_count", out var o) ? o.GetInt32() : 0;
        result.Description = r.TryGetProperty("description", out var d) && d.ValueKind == JsonValueKind.String ? d.GetString() : null;
        if (r.TryGetProperty("license", out var lic) && lic.ValueKind == JsonValueKind.Object
            && lic.TryGetProperty("spdx_id", out var spdx))
            result.License = spdx.GetString();
    }

    private async Task FillLanguagesAsync(string owner, string repo, AnalysisResult result, CancellationToken ct)
    {
        var doc = await GetJsonAsync($"/repos/{owner}/{repo}/languages", ct);
        if (!doc.HasValue) return;
        foreach (var prop in doc.Value.EnumerateObject())
            result.Languages[prop.Name] = prop.Value.GetInt32();
    }

    private async Task FillContributorsAsync(string owner, string repo, AnalysisResult result, CancellationToken ct)
    {
        var arr = await GetJsonArrayAsync($"/repos/{owner}/{repo}/contributors?per_page=10", ct);
        if (arr == null) return;
        foreach (var item in arr)
        {
            var login = item.TryGetProperty("login", out var l) ? l.GetString() ?? "" : "";
            var commits = item.TryGetProperty("contributions", out var c) ? c.GetInt32() : 0;
            var avatar = item.TryGetProperty("avatar_url", out var a) ? a.GetString() : null;
            result.TopContributors.Add(new ContributorDto { Login = login, Commits = commits, AvatarUrl = avatar });
        }
    }

    private async Task FillCommitHeatmapAsync(string owner, string repo, AnalysisResult result, CancellationToken ct)
    {
        var since = DateTime.UtcNow.AddYears(-1).ToString("yyyy-MM-ddTHH:mm:ssZ");
        var commitsByDate = new Dictionary<DateTime, List<string>>();
        var page = 1;
        const int perPage = 100;
        while (page <= 5)
        {
            var arr = await GetJsonArrayAsync(
                $"/repos/{owner}/{repo}/commits?per_page={perPage}&page={page}&since={since}", ct);
            if (arr == null || arr.Count == 0) break;
            foreach (var item in arr)
            {
                if (item.TryGetProperty("commit", out var commit) &&
                    commit.TryGetProperty("author", out var author) &&
                    author.TryGetProperty("date", out var dateProp))
                {
                    if (DateTime.TryParse(dateProp.GetString(), out var dt))
                    {
                        var date = dt.Date;
                        var message = commit.TryGetProperty("message", out var msg) ? msg.GetString() ?? "" : "";
                        

                        var firstLine = message.Split('\n')[0].Trim();
                        if (string.IsNullOrEmpty(firstLine)) firstLine = "No message";
                        
                        if (!commitsByDate.ContainsKey(date))
                            commitsByDate[date] = new List<string>();
                        

                        if (commitsByDate[date].Count < 5)
                            commitsByDate[date].Add(firstLine);
                    }
                }
            }
            if (arr.Count < perPage) break;
            page++;
        }

        var start = DateTime.UtcNow.Date.AddDays(-52 * 7);
        for (var d = start; d <= DateTime.UtcNow.Date; d = d.AddDays(1))
        {
            var hasCommits = commitsByDate.TryGetValue(d, out var messages);
            result.CommitHeatmap.Add(new CommitDayDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                Count = hasCommits ? messages!.Count : 0,
                Messages = hasCommits ? messages! : new List<string>()
            });
        }
    }

    private async Task<string?> GetReadmeContentAsync(string owner, string repo, CancellationToken ct)
    {
        var doc = await GetJsonAsync($"/repos/{owner}/{repo}/readme", ct);
        if (!doc.HasValue) return null;
        var r = doc.Value;
        if (!r.TryGetProperty("content", out var content)) return null;
        var encoding = r.TryGetProperty("encoding", out var enc) ? enc.GetString() : null;
        if (string.Equals(encoding, "base64", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var decoded = Convert.FromBase64String(content.GetString() ?? "");
                return System.Text.Encoding.UTF8.GetString(decoded);
            }
            catch { return null; }
        }
        return content.GetString();
    }

    private async Task FillReadmeScoreAsync(string owner, string repo, AnalysisResult result, CancellationToken ct)
    {
        var content = await GetReadmeContentAsync(owner, repo, ct);
        var ruleBasedScore = _readmeScorer.Score(content);
        

        if (!string.IsNullOrWhiteSpace(content))
        {
            try
            {
                result.ReadmeScore = await _geminiService.GetAIReadmeScoreAsync(content, ruleBasedScore, ct);
            }
            catch
            {

                result.ReadmeScore = ruleBasedScore;
            }
        }
        else
        {
            result.ReadmeScore = ruleBasedScore;
        }
    }

    private async Task FillIssueStatsAsync(string owner, string repo, AnalysisResult result, CancellationToken ct)
    {
        var open = 0;
        var closed = 0;
        var closeTimes = new List<double>();
        var page = 1;
        const int perPage = 100;
        while (page <= 5)
        {
            var arr = await GetJsonArrayAsync(
                $"/repos/{owner}/{repo}/issues?state=all&per_page={perPage}&page={page}", ct);
            if (arr == null || arr.Count == 0) break;
            foreach (var item in arr)
            {
                if (item.TryGetProperty("pull_request", out _)) continue;
                var state = item.TryGetProperty("state", out var st) ? st.GetString() : null;
                if (state == "open") open++;
                else if (state == "closed")
                {
                    closed++;
                    if (item.TryGetProperty("created_at", out var ca) && item.TryGetProperty("closed_at", out var cl))
                    {
                        if (DateTime.TryParse(ca.GetString(), out var created) && DateTime.TryParse(cl.GetString(), out var closedAt))
                            closeTimes.Add((closedAt - created).TotalDays);
                    }
                }
            }
            if (arr.Count < perPage) break;
            page++;
        }
        result.IssueStats = new IssueStatsDto
        {
            Open = open,
            Closed = closed,
            AvgCloseTimeDays = closeTimes.Count > 0 ? closeTimes.Average() : 0
        };
    }

    private async Task FillPrStatsAsync(string owner, string repo, AnalysisResult result, CancellationToken ct)
    {
        var merged = 0;
        var open = 0;
        var closed = 0;
        var page = 1;
        const int perPage = 100;
        while (page <= 5)
        {
            var arr = await GetJsonArrayAsync(
                $"/repos/{owner}/{repo}/pulls?state=all&per_page={perPage}&page={page}", ct);
            if (arr == null || arr.Count == 0) break;
            foreach (var item in arr)
            {
                var state = item.TryGetProperty("state", out var st) ? st.GetString() : null;
                if (state == "open") open++;
                else if (state == "closed")
                {
                    if (item.TryGetProperty("merged_at", out var ma) && ma.ValueKind != JsonValueKind.Null && !string.IsNullOrEmpty(ma.GetString()))
                        merged++;
                    else
                        closed++;
                }
            }
            if (arr.Count < perPage) break;
            page++;
        }
        result.PrStats = new PrStatsDto { Merged = merged, Open = open, Closed = closed };
    }

    private async Task<string?> GetLastCommitDateAsync(string owner, string repo, CancellationToken ct)
    {
        var arr = await GetJsonArrayAsync($"/repos/{owner}/{repo}/commits?per_page=1", ct);
        if (arr == null || arr.Count == 0) return null;
        var first = arr[0];
        if (first.TryGetProperty("commit", out var commit) && commit.TryGetProperty("author", out var author) && author.TryGetProperty("date", out var date))
            return date.GetString();
        return null;
    }

    /// <summary>
    /// Throws if the repo does not exist or is inaccessible (404/403). Call this once at start of analysis.
    /// </summary>
    public async Task EnsureRepoExistsAsync(string owner, string repo, CancellationToken ct = default)
    {
        var path = $"/repos/{owner}/{repo}";
        HttpResponseMessage res;
        try
        {
            res = await _http.GetAsync(path, ct);
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException("Could not reach GitHub. Check your internet connection or try again later.", ex);
        }
        catch (TaskCanceledException)
        {
            throw new InvalidOperationException("Request to GitHub timed out. Try again.");
        }
        if (res.IsSuccessStatusCode) return;
        var body = await res.Content.ReadAsStringAsync(ct);
        if (res.StatusCode == System.Net.HttpStatusCode.NotFound)
            throw new InvalidOperationException("Repository not found. Check the URL or ensure the repo is public.");
        if ((int)res.StatusCode == 403)
            throw new InvalidOperationException("GitHub API rate limit exceeded or access denied. Try again later or add a GITHUB_TOKEN.");
        throw new InvalidOperationException($"GitHub API error ({(int)res.StatusCode}): {(body.Length > 200 ? body[..200] : body)}");
    }

    public async Task<List<SearchRepoResult>> DiscoverReposAsync(string query, CancellationToken ct = default)
    {
        var path = $"/search/repositories?q={Uri.EscapeDataString(query)}&sort=stars&order=desc&per_page=15";
        var root = await GetJsonAsync(path, ct);
        var results = new List<SearchRepoResult>();

        if (root.HasValue && root.Value.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in items.EnumerateArray())
            {
                var owner = item.GetProperty("owner").GetProperty("login").GetString() ?? "";
                var repo = item.GetProperty("name").GetString() ?? "";
                var desc = item.TryGetProperty("description", out var d) ? d.GetString() : "";
                var stars = item.TryGetProperty("stargazers_count", out var s) ? s.GetInt32() : 0;
                var lang = item.TryGetProperty("language", out var l) ? l.GetString() : "";

                results.Add(new SearchRepoResult
                {
                    Owner = owner,
                    Repo = repo,
                    Description = desc ?? "",
                    Stars = stars,
                    Language = lang ?? ""
                });
            }
        }
        return results;
    }

    private async Task<JsonElement?> GetJsonAsync(string path, CancellationToken ct)
    {
        try
        {
            var res = await _http.GetAsync(path, ct);
            if (!res.IsSuccessStatusCode) return null;
            var json = await res.Content.ReadAsStringAsync(ct);
            return JsonDocument.Parse(json).RootElement;
        }
        catch { return null; }
    }

    private async Task<List<JsonElement>?> GetJsonArrayAsync(string path, CancellationToken ct)
    {
        var root = await GetJsonAsync(path, ct);
        if (!root.HasValue || root.Value.ValueKind != JsonValueKind.Array) return null;
        var list = new List<JsonElement>();
        foreach (var e in root.Value.EnumerateArray())
            list.Add(e);
        return list;
    }
}
