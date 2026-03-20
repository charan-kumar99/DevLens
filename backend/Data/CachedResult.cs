using System.ComponentModel.DataAnnotations;

namespace DevLens.Api.Data;

public class CachedResult
{
    [Key]
    [MaxLength(256)]
    public string Id { get; set; } = string.Empty; // "owner/repo"

    [Required]
    public string JsonPayload { get; set; } = string.Empty;

    public DateTime CachedAt { get; set; }
}
