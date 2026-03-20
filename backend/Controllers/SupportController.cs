using Microsoft.AspNetCore.Mvc;
using DevLens.Api.Services;
using DevLens.Api.Models;

namespace DevLens.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupportController : ControllerBase
{
    private readonly IGeminiService _gemini;

    public SupportController(IGeminiService gemini)
    {
        _gemini = gemini;
    }

    [HttpPost("ask")]
    public async Task<ActionResult<object>> Ask([FromBody] AskSupportRequest request, CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Question))
            return BadRequest(new { error = "question is required." });

        try
        {
            var answer = await _gemini.GetSupportAnswerAsync(request.Question.Trim(), request.History ?? new List<ChatMessage>(), ct);
            return Ok(new { answer });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "AI Support failed.", detail = ex.Message });
        }
    }
}

public class AskSupportRequest
{
    public string Question { get; set; } = string.Empty;
    public List<ChatMessage>? History { get; set; }
}
