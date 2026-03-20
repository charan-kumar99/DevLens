import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import StatCard from '../components/StatCard';
import Sidebar from '../components/Sidebar';
import HeatMap from '../components/HeatMap';
import AIInsightCard from '../components/AIInsightCard';
import CodeRiskCard from '../components/CodeRiskCard';
import ReadmeGenerator from '../components/ReadmeGenerator';
import Footer from '../components/Footer';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonLoader';
import { formatDate, languagePercentages } from '../utils/formatters';
import './Dashboard.css';

const SECTION_IDS = ['overview', 'commits', 'contributors', 'readme', 'issues', 'ai', 'risks', 'readme-gen'];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.result ?? null);
  const [section, setSection] = useState('overview');

  useEffect(() => {
    if (!result) navigate('/', { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const repoLabel = `${result.owner}/${result.repo}`;
  const langData = languagePercentages(result.languages);
  const totalIssues = (result.issueStats?.open ?? 0) + (result.issueStats?.closed ?? 0);
  const issuePieData = [
    { name: 'Open', value: result.issueStats?.open ?? 0, color: 'var(--accent-orange)' },
    { name: 'Closed', value: result.issueStats?.closed ?? 0, color: 'var(--accent-green)' },
  ].filter((d) => d.value > 0);
  const prTotal = (result.prStats?.merged ?? 0) + (result.prStats?.open ?? 0) + (result.prStats?.closed ?? 0);
  const prMergeRate = prTotal > 0 ? Math.round(((result.prStats?.merged ?? 0) / prTotal) * 100) : 0;
  const prBarData = [
    { name: 'Merged', count: result.prStats?.merged ?? 0, fill: 'var(--accent-green)' },
    { name: 'Open', count: result.prStats?.open ?? 0, fill: 'var(--accent-orange)' },
    { name: 'Closed', count: result.prStats?.closed ?? 0, fill: 'var(--text-secondary)' },
  ];
  const radarData = result.readmeScore
    ? [
        { subject: 'Badges', value: result.readmeScore.hasBadges ? 20 : 0, fullMark: 20 },
        { subject: 'Install', value: result.readmeScore.hasInstall ? 25 : 0, fullMark: 25 },
        { subject: 'Usage', value: result.readmeScore.hasUsage ? 25 : 0, fullMark: 25 },
        { subject: 'Screenshots', value: result.readmeScore.hasScreenshots ? 15 : 0, fullMark: 15 },
        { subject: 'License', value: result.readmeScore.hasLicense ? 15 : 0, fullMark: 15 },
      ]
    : [];

  const handleAiUpdate = (updated) => setResult(updated);

  return (
    <div className="dashboard">
      <Sidebar
        current={section}
        onNavigate={setSection}
        repoLabel={repoLabel}
        result={result}
      />
      <main className="dashboard__main">
        {section === 'overview' && (
          <section className="dashboard__section" aria-labelledby="overview-title">
            <h2 id="overview-title" className="dashboard__heading">Overview</h2>
            <div className="dashboard__cards dashboard__cards--prominent">
              <StatCard label="Overall Score" value={`${result.overallScore ?? 0}/100`} icon="🎯" />
              <StatCard label="Project Status" value={result.projectStatus || 'Unknown'} icon="🚦" />
              <StatCard label="Trend Prediction" value={result.trend || 'Analyzing...'} icon="📈" />
            </div>
            <div className="dashboard__cards">
              <StatCard label="Stars" value={result.stars ?? 0} icon="★" />
              <StatCard label="Forks" value={result.forks ?? 0} icon="⎇" />
              <StatCard label="Open issues" value={result.openIssues ?? 0} icon="!" />
              <StatCard label="Last commit" value={formatDate(result.lastCommit)} icon="◷" />
              <StatCard label="License" value={result.license || '—'} icon="©" />
              <StatCard label="Primary language" value={Object.keys(result.languages || {})[0] || '—'} icon="{}" />
            </div>
            {result.description && (
              <p className="dashboard__description">{result.description}</p>
            )}
            {langData.length > 0 && (
              <div className="dashboard__lang">
                <h3 className="dashboard__subheading">Language breakdown</h3>
                <div className="lang-bar">
                  {langData.map((item, i) => (
                    <div
                      key={item.name}
                      className="lang-bar__segment"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: `hsl(${220 + i * 40}, 60%, 50%)`,
                      }}
                      title={`${item.name} ${item.value}%`}
                    />
                  ))}
                </div>
                <div className="lang-bar__labels">
                  {langData.map((item) => (
                    <span key={item.name} className="lang-bar__label">
                      {item.name} {item.value}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {section === 'commits' && (
          <section className="dashboard__section" aria-labelledby="commits-title">
            <h2 id="commits-title" className="dashboard__heading">Commit activity</h2>
            <HeatMap data={result.commitHeatmap} />
          </section>
        )}

        {section === 'contributors' && (
          <section className="dashboard__section" aria-labelledby="contributors-title">
            <h2 id="contributors-title" className="dashboard__heading">Top contributors</h2>
            <div className="dashboard__chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={(result.topContributors || []).slice(0, 10)}
                  margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                >
                  <XAxis dataKey="login" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(28, 33, 40, 0.95)',
                      border: '1px solid var(--accent)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px' }}
                    itemStyle={{ color: 'var(--accent)' }}
                    cursor={false}
                  />
                  <Bar dataKey="commits" fill="var(--accent)" radius={[4, 4, 0, 0]} cursor="default" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {section === 'readme' && (
          <section className="dashboard__section" aria-labelledby="readme-title">
            <h2 id="readme-title" className="dashboard__heading">README score</h2>
            <div className="dashboard__readme-score">
              <div className="readme-total">
                <span className="readme-total__value">{result.readmeScore?.total ?? 0}</span>
                <span className="readme-total__label">/ 100</span>
              </div>
              {radarData.length > 0 && (
                <div className="dashboard__chart-wrap dashboard__chart-wrap--radar">
                  <ResponsiveContainer width="100%" height={380}>
                    <RadarChart data={radarData} margin={{ top: 60, right: 60, bottom: 30, left: 60 }}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11, dy: -10 }}
                        tickLine={false}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 25]} 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
                        tickCount={6}
                        axisLine={false}
                      />
                      <Radar 
                        name="Score" 
                        dataKey="value" 
                        stroke="var(--accent)" 
                        fill="var(--accent)" 
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ul className="readme-checklist">
                <li className={result.readmeScore?.hasBadges ? 'readme-checklist--yes' : 'readme-checklist--no'}>
                  Badges
                </li>
                <li className={result.readmeScore?.hasInstall ? 'readme-checklist--yes' : 'readme-checklist--no'}>
                  Install instructions
                </li>
                <li className={result.readmeScore?.hasUsage ? 'readme-checklist--yes' : 'readme-checklist--no'}>
                  Usage examples
                </li>
                <li className={result.readmeScore?.hasScreenshots ? 'readme-checklist--yes' : 'readme-checklist--no'}>
                  Screenshots
                </li>
                <li className={result.readmeScore?.hasLicense ? 'readme-checklist--yes' : 'readme-checklist--no'}>
                  License section
                </li>
              </ul>
            </div>
          </section>
        )}

        {section === 'issues' && (
          <section className="dashboard__section" aria-labelledby="issues-title">
            <h2 id="issues-title" className="dashboard__heading">Issues & PRs</h2>
            <div className="dashboard__issue-stats">
              <StatCard
                label="Avg. issue close time (days)"
                value={result.issueStats?.avgCloseTimeDays != null ? Number(result.issueStats.avgCloseTimeDays).toFixed(1) : '—'}
                icon="⏱"
              />
            </div>
            <div className="dashboard__charts-row">
              <div className="dashboard__chart-wrap">
                <h3 className="dashboard__subheading">Issues (open vs closed)</h3>
                {issuePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={issuePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {issuePieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(28, 33, 40, 0.95)',
                          border: '1px solid var(--accent)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                        }}
                        itemStyle={{ color: 'var(--accent)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="dashboard__empty">No issue data.</p>
                )}
              </div>
              <div className="dashboard__chart-wrap">
                <h3 className="dashboard__subheading">PR merge rate: {prMergeRate}%</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={prBarData} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <XAxis type="number" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={50} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="default">
                      {prBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(28, 33, 40, 0.95)',
                        border: '1px solid var(--accent)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                      }}
                      itemStyle={{ color: 'var(--accent)' }}
                      cursor={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {section === 'ai' && (
          <section className="dashboard__section" aria-labelledby="ai-title">
            <h2 id="ai-title" className="dashboard__heading">AI Summary</h2>
            <AIInsightCard
              owner={result.owner}
              repo={result.repo}
              summary={result.aiSummary}
              onUpdate={handleAiUpdate}
            />
            
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="dashboard__suggestions">
                <h3 className="dashboard__subheading">Ways to improve this project</h3>
                <ul className="suggestion-list">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="suggestion-item">
                      <span className="suggestion-bullet">💡</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        {section === 'risks' && (
          <section className="dashboard__section" aria-labelledby="risks-title">
            <h2 id="risks-title" className="dashboard__heading">AI Code Risk Detection</h2>
            <p className="dashboard__description">
              Our AI analyzes repository metadata to identify potential bad practices, 
              scalability bottlenecks, and maintainability risks.
            </p>
            <CodeRiskCard risks={result.risks} />
          </section>
        )}
        {section === 'readme-gen' && (
          <section className="dashboard__section" aria-labelledby="readme-gen-title">
            <h2 id="readme-gen-title" className="dashboard__heading">AI README Generator</h2>
            <ReadmeGenerator owner={result.owner} repo={result.repo} />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
