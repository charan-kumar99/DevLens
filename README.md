# DevLens 🔍

> AI-powered GitHub repository analysis platform that provides comprehensive insights into code quality, community health, and project metrics.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

## ✨ Features

- **Comprehensive Repository Analysis**: Deep dive into GitHub repositories with metrics on stars, forks, contributors, and more
- **AI-Powered Insights**: Gemini AI generates architectural summaries, code risk assessments, and improvement suggestions
- **README Quality Scoring**: Automated evaluation of documentation quality with actionable feedback
- **Repository Comparison**: Side-by-side comparison of two repositories with AI-generated verdicts
- **Interactive Visualizations**: Commit heatmaps, language distribution charts, and contributor statistics
- **PDF Export**: Generate professional analysis reports for sharing and archiving
- **Smart Caching**: SQLite-based caching system for fast repeated analyses
- **AI Chat Support**: Built-in AI assistant to answer questions about the platform and repositories

## 🚀 Tech Stack

### Frontend
- **React 18.2** - UI framework
- **React Router 6** - Client-side routing
- **D3.js** - Data visualization (heatmaps)
- **Recharts** - Chart components
- **Framer Motion** - Animations
- **jsPDF** - PDF generation
- **Vite** - Build tool and dev server

### Backend
- **.NET 8.0** - Web API framework
- **Entity Framework Core** - ORM with SQLite
- **SQLite** - Embedded database for caching
- **Gemini AI API** - AI-powered analysis and insights
- **GitHub REST API** - Repository data fetching

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **.NET SDK** 8.0+
- **GitHub Personal Access Token** (for API access)
- **Google Gemini API Key** (for AI features)

### Getting Your API Keys

#### 1. GitHub Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "DevLens API Access")
4. Set expiration (recommended: 90 days or No expiration for development)
5. Select scopes:
   - ✅ `public_repo` (Access public repositories)
   - ✅ `read:user` (Read user profile data)
6. Click "Generate token"
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)
8. Save it securely - you'll add it to your `.env` file

**Note**: Without a token, you're limited to 60 API requests/hour. With a token, you get 5,000 requests/hour.

#### 2. Google Gemini API Key (Free)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Select "Create API key in new project" (or choose an existing project)
5. Your API key will be generated instantly
6. Click the copy icon to copy your key
7. Save it securely - you'll add it to your `.env` file

**Free Tier Limits**:
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day
- Perfect for development and testing!

**Important Notes**:
- Keep your API keys private and never commit them to version control
- The `.env` file is already in `.gitignore` to protect your keys
- If you accidentally expose a key, revoke it immediately and generate a new one

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/devlens.git
cd devlens
```

### 2. Backend Setup

```bash
cd backend

# Create .env file from example
cp .env.example .env

# Open .env in your text editor and add your API keys:
# GITHUB_TOKEN=your_github_token_here
# GEMINI_API_KEY=your_gemini_api_key_here

# Example .env file:
# GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Restore dependencies
dotnet restore

# Build the project
dotnet build

# Run the backend (starts on http://localhost:5000)
dotnet run
```

**Troubleshooting Backend**:
- If you get "GITHUB_TOKEN not found", make sure your `.env` file is in the `backend` folder
- If you get "GEMINI_API_KEY not found", verify your Gemini API key is correct
- If port 5000 is in use, the app will automatically try 5001, 5002, etc.
- Check `backend/out.log` for detailed error messages (if logging is enabled)

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Create .env file for custom API URL
# By default, it connects to http://localhost:5000
# Only create this file if your backend runs on a different port
echo "VITE_API_URL=http://localhost:5000" > .env

# Start development server (opens on http://localhost:5173)
npm run dev
```

**Troubleshooting Frontend**:
- If you get "Cannot connect to backend", ensure the backend is running on port 5000
- If port 5173 is in use, Vite will automatically try 5174, 5175, etc.
- Clear browser cache if you see stale data (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console (F12) for JavaScript errors

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

**First-Time Setup Checklist**:
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:5173
- ✅ `.env` file created with both API keys
- ✅ No console errors in browser (F12)
- ✅ Try analyzing a public repo like `facebook/react`

**Common Issues**:
- **"Repository not found"**: Make sure the repo is public or your GitHub token has access
- **"AI features unavailable"**: Check your Gemini API key is valid
- **"Rate limit exceeded"**: You've hit GitHub's API limit - wait an hour or add a token
- **CORS errors**: Make sure backend is running and frontend is connecting to the correct URL

## 📁 Project Structure

```
devlens/
├── backend/                    # .NET Web API
│   ├── Controllers/           # API endpoints
│   │   ├── AnalyzeController.cs
│   │   ├── DiscoverController.cs
│   │   └── SupportController.cs
│   ├── Services/              # Business logic
│   │   ├── GeminiService.cs   # AI integration
│   │   ├── GitHubService.cs   # GitHub API client
│   │   ├── ProjectScorer.cs   # Quality scoring
│   │   └── ReadmeScorer.cs    # README evaluation
│   ├── Models/                # Data models & DTOs
│   ├── Data/                  # Database context
│   ├── Utils/                 # Utility classes
│   └── Program.cs             # Application entry point
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/             # Route components
│   │   │   ├── Home.jsx       # Landing page
│   │   │   ├── Dashboard.jsx  # Analysis results
│   │   │   ├── Compare.jsx    # Repository comparison
│   │   │   └── Discover.jsx   # Trending repos
│   │   ├── components/        # Reusable UI components
│   │   ├── utils/             # Helper functions
│   │   │   ├── api.js         # API client
│   │   │   ├── formatters.js  # Data formatting
│   │   │   ├── markdown.js    # Markdown rendering
│   │   │   └── pdfExport.js   # PDF generation
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Application entry
│   └── public/                # Static assets
│
└── README.md                   # This file
```

## 🔌 API Endpoints

### Analysis Endpoints

- `POST /api/analyze/analyze` - Analyze a GitHub repository
- `GET /api/analyze/analyze/{owner}/{repo}` - Get cached analysis
- `POST /api/analyze/regenerate-summary` - Regenerate AI summary
- `POST /api/analyze/compare` - Compare two repositories
- `POST /api/analyze/ask-ai` - Ask AI about a repository
- `POST /api/analyze/generate-readme` - Generate README template
- `POST /api/analyze/generate-pdf-content` - Get PDF export data
- `DELETE /api/analyze/cache/{owner}/{repo}` - Clear specific cache
- `DELETE /api/analyze/cache/all` - Clear all cache

### Discovery Endpoints

- `GET /api/discover/trending?topic={topic}` - Search trending repositories

### Support Endpoints

- `POST /api/support/ask` - Ask AI support questions

## 🎯 Usage Examples

### Analyze a Repository

1. Navigate to the home page
2. Enter a GitHub repository URL (e.g., `https://github.com/facebook/react`)
3. Click "Analyze Repository"
4. View comprehensive metrics, AI insights, and visualizations

### Compare Repositories

1. Go to the "Compare" page
2. Enter two repository URLs
3. View side-by-side comparison with AI verdict

### Export PDF Report

1. After analyzing a repository, scroll to the bottom of the dashboard
2. Click "Export PDF Report"
3. A professional PDF report will be generated and downloaded

## 🤖 AI Features

DevLens leverages Google's Gemini AI to provide:

- **Architectural Summaries**: High-level overview of repository structure and purpose
- **Code Risk Assessment**: Identification of potential issues and technical debt
- **Improvement Suggestions**: Actionable recommendations for enhancement
- **Trend Predictions**: Analysis of project trajectory and community engagement
- **Smart Comparisons**: Intelligent verdicts when comparing repositories
- **Interactive Support**: Chat-based assistance for using the platform

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```env
GITHUB_TOKEN=your_github_personal_access_token
GEMINI_API_KEY=your_gemini_api_key
```

**Frontend (.env)** (optional):
```env
VITE_API_URL=http://localhost:5000
```

### CORS Configuration

The backend is configured to accept requests from `localhost:5173-5176` by default. For production deployment, update the CORS policy in `backend/Program.cs`.

## 📊 Metrics & Scoring

DevLens calculates an overall quality score (0-100) based on:

- **Community Engagement** (30%): Stars, forks, watchers
- **Activity Level** (25%): Recent commits, issue resolution
- **Documentation Quality** (20%): README completeness and clarity
- **Project Health** (15%): Open issues, PR merge rate
- **Contributor Diversity** (10%): Number and distribution of contributors

## 🚢 Deployment

### Backend Deployment

```bash
cd backend
dotnet publish -c Release -o ./publish
# Deploy the ./publish folder to your hosting service
```

### Frontend Deployment

```bash
cd frontend
npm run build
# Deploy the ./dist folder to your static hosting service
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GitHub API** for providing comprehensive repository data
- **Google Gemini** for powering AI-driven insights
- **React** and **.NET** communities for excellent documentation
- All open-source contributors who make projects like this possible

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/devlens/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/devlens/discussions)

---

Made with ❤️ by Charan Kumar
