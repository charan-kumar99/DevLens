namespace DevLens.Api.Models;

public class PdfContentDto
{
    public string ExecutiveSummary { get; set; } = string.Empty;
    public string KeyHighlights { get; set; } = string.Empty;
    public string TechnicalAnalysis { get; set; } = string.Empty;
    public string CommunityHealth { get; set; } = string.Empty;
    public string Recommendations { get; set; } = string.Empty;
}
