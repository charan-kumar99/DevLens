/**
 * API client for DevLens backend
 * Handles all HTTP requests to the backend API with timeout support
 */

const API_BASE = import.meta.env.VITE_API_URL || '';
const DEFAULT_TIMEOUT = 60000; // 60 seconds

/**
 * Generic request handler with error handling and timeout
 */
async function request(path, options = {}, timeout = DEFAULT_TIMEOUT) {
  const url = `${API_BASE}${path}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      const body = contentType.includes('application/json')
        ? await res.json().catch(() => ({}))
        : {};
      const message = body.detail || body.error || res.statusText || 'Request failed.';
      const hint = res.status === 500 ? ' Try a public repo like https://github.com/facebook/react' : '';
      throw new Error(message + hint);
    }
    
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond. Please try again.');
    }
    
    throw error;
  }
}

/**
 * Analyzes a GitHub repository (with extended timeout for large repos)
 */
export async function analyzeRepo(repoUrl) {
  return request('/api/analyze/analyze', {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  }, 120000); // 2 minutes for analysis
}

/**
 * Retrieves cached analysis for a repository
 */
export async function getCached(owner, repo) {
  return request(`/api/analyze/analyze/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}

/**
 * Compares two repositories side-by-side (with extended timeout)
 */
export async function compareRepos(repoUrl1, repoUrl2) {
  return request('/api/analyze/compare', {
    method: 'POST',
    body: JSON.stringify({ repoUrl1, repoUrl2 }),
  }, 120000); // 2 minutes for comparison
}

/**
 * Regenerates AI summary for a repository
 */
export async function regenerateSummary(owner, repo) {
  const repoUrl = `https://github.com/${owner}/${repo}`;
  return request('/api/analyze/regenerate-summary', {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  });
}

/**
 * Asks AI a question about a specific repository
 */
export async function askAI(repoUrl, query) {
  const response = await request('/api/analyze/ask-ai', {
    method: 'POST',
    body: JSON.stringify({ repoUrl, query }),
  });
  return response.answer;
}

/**
 * Asks AI support questions about the platform
 */
export async function askSupport(question, history = []) {
  return request('/api/support/ask', {
    method: 'POST',
    body: JSON.stringify({
      question,
      history: history.map((m) => ({ role: m.type, content: m.text })),
    }),
  }).then((r) => r.answer);
}

/**
 * Generates a README template for a repository (with extended timeout)
 */
export async function generateReadme(owner, repo) {
  const repoUrl = `https://github.com/${owner}/${repo}`;
  return request('/api/analyze/generate-readme', {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  }, 90000); // 90 seconds for README generation
}

/**
 * Discovers trending repositories by topic
 */
export async function discoverRepos(topic) {
  return request(`/api/discover/trending?topic=${encodeURIComponent(topic)}`);
}

/**
 * Clears cached analysis for a specific repository
 */
export async function clearCache(owner, repo) {
  return request(`/api/analyze/cache/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    method: 'DELETE',
  });
}

/**
 * Clears all cached analyses
 */
export async function clearAllCache() {
  return request('/api/analyze/cache/all', {
    method: 'DELETE',
  });
}

/**
 * Gets PDF-ready content for a repository analysis
 */
export async function getPdfContent(owner, repo) {
  const repoUrl = `https://github.com/${owner}/${repo}`;
  return request('/api/analyze/generate-pdf-content', {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  });
}
