using Microsoft.EntityFrameworkCore;

namespace DevLens.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<CachedResult> CachedResults => Set<CachedResult>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CachedResult>(e =>
        {
            e.HasIndex(x => x.Id).IsUnique();
        });
    }
}
