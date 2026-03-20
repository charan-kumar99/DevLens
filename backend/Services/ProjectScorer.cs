using DevLens.Api.Models;

namespace DevLens.Api.Services;

public interface IProjectScorer
{
    void CalculateScore(AnalysisResult result);
}

public class ProjectScorer : IProjectScorer
{
    public void CalculateScore(AnalysisResult result)
    {
        double score = 0;


        score += (result.ReadmeScore?.Total ?? 0) * 0.3;



        if (DateTime.TryParse(result.LastCommit, out var lastDate))
        {
            var diff = (DateTime.UtcNow - lastDate).TotalDays;
            if (diff < 30) score += 25;
            else if (diff < 90) score += 15;
            else if (diff < 180) score += 5;
        }



        var closed = result.IssueStats?.Closed ?? 0;
        var open = result.IssueStats?.Open ?? 0;
        var total = closed + open;
        if (total > 0)
        {
            var closeRatio = (double)closed / total;
            score += closeRatio * 15; // Max 15 pts for ratio

            var avgDays = result.IssueStats?.AvgCloseTimeDays ?? 30;
            if (avgDays < 7) score += 10;
            else if (avgDays < 30) score += 5;
        }



        if (result.Stars > 1000) score += 10;
        else if (result.Stars > 100) score += 5;

        if (result.TopContributors?.Count >= 10) score += 10;
        else if (result.TopContributors?.Count >= 3) score += 5;

        result.OverallScore = (int)Math.Min(100, Math.Max(0, score));


        result.ProjectStatus = DetermineStatus(result, score);
    }

    private string DetermineStatus(AnalysisResult result, double score)
    {
        if (score >= 80) return "Production-Ready";
        if (score >= 50) return "Stable";
        

        if (DateTime.TryParse(result.LastCommit, out var lastDate))
        {
            if ((DateTime.UtcNow - lastDate).TotalDays > 365) return "Abandoned";
        }

        if (result.Stars < 50 && (result.TopContributors?.Count ?? 0) < 3) return "Early-Stage";
        
        return "Experimental";
    }
}
