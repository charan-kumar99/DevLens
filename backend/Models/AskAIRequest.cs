namespace DevLens.Api.Models;

public class AskAIRequest
{
    public string RepoUrl { get; set; } = string.Empty;
    public string Query { get; set; } = string.Empty;
}
