using DevLens.Api.Data;
using DevLens.Api.Middleware;
using DevLens.Api.Services;
using Microsoft.EntityFrameworkCore;


LoadEnvironmentVariables();

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=devlens.db";
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connectionString));


var githubToken = builder.Configuration["GITHUB_TOKEN"] ?? Environment.GetEnvironmentVariable("GITHUB_TOKEN");
builder.Services.AddHttpClient<IGitHubService, GitHubService>(client =>
{
    GitHubService.Configure(client, githubToken);
});


builder.Services.AddHttpClient<IGeminiService, GeminiService>(client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
});


builder.Services.AddScoped<IReadmeScorer, ReadmeScorer>();
builder.Services.AddScoped<IProjectScorer, ProjectScorer>();


builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var corsOrigins = builder.Configuration["CORS_ORIGINS"] ?? Environment.GetEnvironmentVariable("CORS_ORIGINS");
        
        var allowedOrigins = !string.IsNullOrWhiteSpace(corsOrigins)
            ? corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : new[]
            {
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
                "http://127.0.0.1:5176"
            };
        
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}


app.UseCors();


app.UseRateLimiting(requestLimit: 100, timeWindowMinutes: 1);

app.MapControllers();

app.Run();

/// <summary>
/// Loads environment variables from .env file if it exists
/// </summary>
static void LoadEnvironmentVariables()
{
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
    if (!File.Exists(envPath))
        envPath = Path.Combine(AppContext.BaseDirectory, ".env");
    if (!File.Exists(envPath))
    {
        var projectDir = Path.GetDirectoryName(Path.GetDirectoryName(Path.GetDirectoryName(AppContext.BaseDirectory)));
        if (!string.IsNullOrEmpty(projectDir))
            envPath = Path.Combine(projectDir, ".env");
    }
    
    if (!File.Exists(envPath)) return;

    foreach (var line in File.ReadAllLines(envPath))
    {
        var trimmed = line.Trim();
        if (trimmed.Length == 0 || trimmed[0] == '#') continue;
        
        var eq = trimmed.IndexOf('=');
        if (eq <= 0) continue;
        
        var key = trimmed[..eq].Trim();
        var value = trimmed[(eq + 1)..].Trim().Trim('"').Trim('\'');
        
        if (!string.IsNullOrEmpty(key))
            Environment.SetEnvironmentVariable(key, value);
    }
}
