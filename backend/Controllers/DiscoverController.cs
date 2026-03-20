using Microsoft.AspNetCore.Mvc;
using DevLens.Api.Services;

namespace DevLens.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscoverController : ControllerBase
{
    private readonly IGitHubService _github;

    public DiscoverController(IGitHubService github)
    {
        _github = github;
    }

    [HttpGet("trending")]
    public async Task<ActionResult<List<SearchRepoResult>>> GetTrending([FromQuery] string topic, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(topic)) topic = "trending";
        
        try
        {
            var results = await _github.DiscoverReposAsync(topic, ct);
            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Search failed.", detail = ex.Message });
        }
    }
}
