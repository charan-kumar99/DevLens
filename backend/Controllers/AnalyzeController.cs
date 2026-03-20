using System.Text.Json;
using DevLens.Api.Data;
using DevLens.Api.Models;
using DevLens.Api.Services;
using DevLens.Api.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevLens.Api.Controllers;

/// <summary>
/// Controller for repository analysis operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AnalyzeController : ControllerBase
{
    private readonly IGitHubService _github;
    private readonly IGeminiService _gemini;
    private readonly AppDbContext _db;
    private readonly ILogger<AnalyzeController> _logger;

    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AnalyzeController(IGitHubService github, IGeminiService gemini, AppDbContext db, ILogger<AnalyzeController> logger)
    {
        _github = github;
        _gemini = gemini;
        _db = db;
        _logger = logger;
    }

    [HttpPost("analyze")]
    public async Task<ActionResult<AnalysisResult>> Analyze([FromBody] RepoRequest? request, CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RepoUrl))
            return BadRequest(new { error = "repoUrl is required." });

        var (owner, repo) = UrlParser.ParseGitHubUrl(request.RepoUrl);
        if (owner == null || repo == null)
            return BadRequest(new { error = "Invalid GitHub repository URL." });

        var id = $"{owner}/{repo}";
        var cached = await _db.CachedResults.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cached != null)
        {
            var result = JsonSerializer.Deserialize<AnalysisResult>(cached.JsonPayload, _jsonOptions);
            

            if (result != null && result.OverallScore == 0)
            {
                var toDelete = await _db.CachedResults.FirstOrDefaultAsync(c => c.Id == id, ct);
                if (toDelete != null)
                {
                    _db.CachedResults.Remove(toDelete);
                    await _db.SaveChangesAsync(ct);
                }
                cached = null;
            }
            else if (result != null)
            {
                return Ok(result);
            }
        }

        try
        {
            var result = await _github.AnalyzeAsync(owner, repo, ct);
            var json = JsonSerializer.Serialize(result);
            _db.CachedResults.Add(new CachedResult
            {
                Id = id,
                JsonPayload = json,
                CachedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            var msg = ex.Message ?? "Invalid operation.";
            if (msg.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { error = "Repository not found.", detail = msg });
            if (msg.Contains("rate limit", StringComparison.OrdinalIgnoreCase) || msg.Contains("403"))
                return StatusCode(403, new { error = "GitHub rate limit or access denied.", detail = msg });
            if (msg.Contains("Could not reach GitHub") || msg.Contains("timed out"))
                return StatusCode(503, new { error = "GitHub unavailable.", detail = msg });
            return BadRequest(new { error = "Invalid request.", detail = msg });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Analysis failed for {Owner}/{Repo}", owner, repo);
            return StatusCode(500, new { error = "Analysis failed.", detail = ex.Message });
        }
    }

    [HttpGet("analyze/{owner}/{repo}")]
    public async Task<ActionResult<AnalysisResult>> GetCached(string owner, string repo, CancellationToken ct)
    {
        var id = $"{owner}/{repo}";
        var cached = await _db.CachedResults.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cached == null)
            return NotFound();

        var result = JsonSerializer.Deserialize<AnalysisResult>(cached.JsonPayload, _jsonOptions);
        return Ok(result);
    }

    [HttpPost("regenerate-summary")]
    public async Task<ActionResult<AnalysisResult>> RegenerateSummary([FromBody] RepoRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RepoUrl))
            return BadRequest(new { error = "repoUrl is required." });

        var (owner, repo) = UrlParser.ParseGitHubUrl(request.RepoUrl);
        if (owner == null || repo == null)
            return BadRequest(new { error = "Invalid GitHub repository URL." });

        var id = $"{owner}/{repo}";
        var cached = await _db.CachedResults.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cached == null)
            return NotFound();

        var result = JsonSerializer.Deserialize<AnalysisResult>(cached.JsonPayload, _jsonOptions);
        if (result == null) return NotFound();

        var summary = await _github.RegenerateSummaryAsync(owner, repo, result, ct);
        if (summary != null) result.AiSummary = summary;

        cached.JsonPayload = JsonSerializer.Serialize(result);
        await _db.SaveChangesAsync(ct);
        return Ok(result);
    }

    [HttpPost("generate-readme")]
    public async Task<ActionResult<object>> GenerateReadme([FromBody] RepoRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RepoUrl))
            return BadRequest(new { error = "repoUrl is required." });

        var (owner, repo) = UrlParser.ParseGitHubUrl(request.RepoUrl);
        if (owner == null || repo == null) return BadRequest(new { error = "Invalid GitHub repository URL." });

        var id = $"{owner}/{repo}";
        var cached = await _db.CachedResults.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cached == null) return NotFound(new { error = "Please analyze the repository first." });

        var result = JsonSerializer.Deserialize<AnalysisResult>(cached.JsonPayload, _jsonOptions);
        if (result == null) return NotFound();

        var readme = await _gemini.GenerateReadmeAsync(owner, repo, result, ct);
        return Ok(new { readme });
    }


    [HttpPost("compare")]
    public async Task<ActionResult<CompareResponse>> Compare([FromBody] CompareRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RepoUrl1) || string.IsNullOrWhiteSpace(request.RepoUrl2))
            return BadRequest(new { error = "repoUrl1 and repoUrl2 are required." });

        var (owner1, repo1) = UrlParser.ParseGitHubUrl(request.RepoUrl1);
        var (owner2, repo2) = UrlParser.ParseGitHubUrl(request.RepoUrl2);
        
        if (owner1 == null || repo1 == null) return BadRequest(new { error = "Invalid repoUrl1." });
        if (owner2 == null || repo2 == null) return BadRequest(new { error = "Invalid repoUrl2." });

        try
        {
            var task1 = GetOrAnalyzeAsync(owner1, repo1, ct);
            var task2 = GetOrAnalyzeAsync(owner2, repo2, ct);
            await Task.WhenAll(task1, task2);

            var r1 = await task1;
            var r2 = await task2;

            if (r1 == null) return StatusCode(500, new { error = "Failed to analyze repo1." });
            if (r2 == null) return StatusCode(500, new { error = "Failed to analyze repo2." });

            var response = new CompareResponse { Repo1 = r1, Repo2 = r2 };
            
            try 
            {
                response.AiVerdict = await _gemini.GetCompareVerdictAsync(r1, r2, ct);
            }
            catch 
            { 
                response.AiVerdict = "Smart Verdict is temporarily unavailable."; 
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Compare failed between {Repo1} and {Repo2}", request.RepoUrl1, request.RepoUrl2);
            return StatusCode(500, new { error = "Compare failed.", detail = ex.Message });
        }
    }

    [HttpPost("ask-ai")]
    public async Task<ActionResult<object>> AskAI([FromBody] AskAIRequest request, CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RepoUrl))
            return BadRequest(new { error = "repoUrl is required." });

        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest(new { error = "query is required." });

        var (owner, repo) = UrlParser.ParseGitHubUrl(request.RepoUrl);
        if (owner == null || repo == null)
            return BadRequest(new { error = "Invalid GitHub repository URL." });

        var id = $"{owner}/{repo}";
        var cached = await _db.CachedResults.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cached == null)
            return NotFound(new { error = "Repository not analyzed yet. Please analyze the repo first." });

        var result = JsonSerializer.Deserialize<AnalysisResult>(cached.JsonPayload, _jsonOptions);
        if (result == null)
            return NotFound(new { error = "Repository analysis data corrupted." });

        try
        {
            var response = await _gemini.AskAIAsync(owner, repo, result, request.Query, ct);
            return Ok(new { answer = response });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI query failed for {Owner}/{Repo}", owner, repo);
            return StatusCode(500, new { error = "AI query failed.", detail = ex.Message });
        }
    }

    [HttpDelete("cache/{owner}/{repo}")]
    public async Task<ActionResult> ClearCache(string owner, string repo, CancellationToken ct)
    {
        var id = $"{owner}/{repo}";
        var cached = await _db.CachedResults.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cached != null)
        {
            _db.CachedResults.Remove(cached);
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Cache cleared successfully." });
        }
        return NotFound(new { message = "No cache found for this repository." });
    }

    [HttpDelete("cache/all")]
    public async Task<ActionResult> ClearAllCache(CancellationToken ct)
    {
        var allCached = await _db.CachedResults.ToListAsync(ct);
        _db.CachedResults.RemoveRange(allCached);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = $"Cleared {allCached.Count} cached results." });
    }

    [HttpPost("generate-pdf-content")]
    public async Task<ActionResult<PdfContentDto>> GeneratePdfContent([FromBody] RepoRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RepoUrl))
            return BadRequest(new { error = "repoUrl is required." });
        
        var (owner, repo) = UrlParser.ParseGitHubUrl(request.RepoUrl);
        if (owner == null || repo == null)
            return BadRequest(new { error = "Invalid GitHub repository URL." });

        var id = $"{owner}/{repo}";
        var cached = await _db.CachedResults.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cached == null)
            return NotFound(new { error = "Repository not found. Please analyze it first." });

        var result = JsonSerializer.Deserialize<AnalysisResult>(cached.JsonPayload, _jsonOptions);
        if (result == null)
            return StatusCode(500, new { error = "Failed to deserialize cached result." });

        try
        {

            var pdfContent = await _gemini.GeneratePdfContentAsync(owner, repo, result, ct);
            

            if (pdfContent == null)
            {
                pdfContent = GetFallbackPdfContent(owner, repo, result);
            }
            
            return Ok(pdfContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PDF content generation error for {Owner}/{Repo}", owner, repo);
            return Ok(GetFallbackPdfContent(owner, repo, result));
        }
    }

    private static PdfContentDto GetFallbackPdfContent(string owner, string repo, AnalysisResult result)
    {
        var primaryLangs = string.Join(", ", result.Languages.Keys.Take(3));
        var activityText = result.ProjectStatus?.ToLower() switch
        {
            "production-ready" => "mature and production-ready",
            "stable" => "stable and well-maintained",
            "early-stage" => "in early development",
            "experimental" => "experimental",
            "abandoned" => "inactive",
            _ => "under development"
        };

        var contributorText = result.TopContributors?.Count switch
        {
            null or 0 => "no active contributors",
            1 => "a single maintainer",
            < 5 => "a small core team",
            < 20 => "an active community",
            _ => "a large contributor base"
        };

        return new PdfContentDto
        {
            ExecutiveSummary = $"{owner}/{repo} is a {activityText} open-source repository with an overall quality score of {result.OverallScore}/100. Built primarily with {primaryLangs}, this project has garnered {result.Stars:N0} stars and {result.Forks:N0} forks. The repository features {contributorText} with {result.TopContributors?.Count ?? 0} total contributors.",
            KeyHighlights = $"• Overall Quality Score: {result.OverallScore}/100 ({result.ProjectStatus})\n• Stars: {result.Stars:N0} | Forks: {result.Forks:N0}\n• Documentation: {result.ReadmeScore?.Total ?? 0}/100\n• Issues: {result.IssueStats?.Open ?? 0} open, {result.IssueStats?.Closed ?? 0} closed", 
            TechnicalAnalysis = $"This repository is built primarily with {primaryLangs}. {(result.Languages.Count > 3 ? "The tech stack is diverse, supporting multiple implementation aspects." : "It features a focused tech stack optimized for its primary purpose.")} Documentation quality is rated at {result.ReadmeScore?.Total ?? 0}/100.",
            CommunityHealth = $"Community engagement is {(result.Stars > 1000 ? "strong" : "moderate")} with {result.Stars} stars and {result.Forks} forks. Issues are resolved in an average of {result.IssueStats?.AvgCloseTimeDays:F1} days, with {result.IssueStats?.Closed ?? 0} issues handled so far.",
            Recommendations = $"• {(result.ReadmeScore?.Total < 70 ? "Enhance documentation with more usage examples" : "Maintain high-quality documentation standards")}\n• {(result.OpenIssues > 50 ? "Prioritize issue triage to reduce backlog" : "Continue regular issue maintenance")}\n• {(result.License == null ? "Add a license file to clarify usage terms" : "Ensure license remains up to date")}\n• {(result.TopContributors?.Count < 5 ? "Focus on attracting more community contributors" : "Foster the existing healthy contributor base")}"
        };
    }

    private async Task<AnalysisResult?> GetOrAnalyzeAsync(string owner, string repo, CancellationToken ct)
    {
        var id = $"{owner}/{repo}";
        var cached = await _db.CachedResults.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cached != null)
        {
            return JsonSerializer.Deserialize<AnalysisResult>(cached.JsonPayload, _jsonOptions);
        }

        var result = await _github.AnalyzeAsync(owner, repo, ct);
        var json = JsonSerializer.Serialize(result);
        _db.CachedResults.Add(new CachedResult { Id = id, JsonPayload = json, CachedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync(ct);
        return result;
    }
}

public class CompareResponse
{
    public AnalysisResult Repo1 { get; set; } = null!;
    public AnalysisResult Repo2 { get; set; } = null!;
    public string? AiVerdict { get; set; }
}
