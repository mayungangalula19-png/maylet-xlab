import fs from 'fs';

const legacy = fs.readFileSync('src/app/routes/Projects.legacy.tsx', 'utf8');
let content = legacy;

content = content.replace(
  /\/\/ C:\\Users\\user\\maylet-xlab\\src\\app\\routes\\Projects\.tsx[\s\S]*?FULLY FIXED - NO SYNTAX ERRORS/,
  '// Projects route — stable owner-only queries (no collaboration DB calls)\n// DashboardLayout provides AppSidebar. Full legacy copy: ./Projects.legacy.tsx'
);

content = content.replace(
  /\/\/ =+\r?\n\/\/ SIDEBAR COMPONENT[\s\S]*?\};\r?\n\r?\n\/\/ =+\r?\n\/\/ STAT CARD COMPONENT/,
  '// ============================================================\n// STAT CARD COMPONENT'
);

content = content.replace(/\s*<Sidebar \/>\r?\n/g, '\n');

content = content.replace(
  /\.projects-container \{\r?\n\s*display: flex;\r?\n\s*min-height: 100vh;\r?\n\s*background: linear-gradient\(135deg, #0a0d1a, #1a1a2e\);\r?\n\}/,
  `.projects-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0d1a, #1a1a2e);
        }`
);

content = content.replace(
  /\.projects-main \{\r?\n\s*flex: 1;\r?\n\s*margin-left: 280px;/,
  `.projects-main {
          max-width: 1400px;
          margin: 0 auto;`
);

content = content.replace(
  /@media \(max-width: 768px\) \{\r?\n\s*\.projects-main \{\r?\n\s*margin-left: 0;\r?\n\s*padding: 1rem;\r?\n\s*padding-top: 5rem;\r?\n\s*\}\r?\n\s*\}/,
  `@media (max-width: 768px) {
          .projects-main {
            padding: 1rem;
          }
        }`
);

content = content.replace(
  /const StatCard = \(\{ icon, label, value, color, route \}: \{[\s\S]*?<div className="stat-icon" style=\{\{ background: color \}\}>\{icon\}<\/div>/,
  `const StatCard = ({ label, value, color, route }: { 
  label: string; 
  value: number; 
  color: string;
  route: string;
}) => (
  <Link to={route} className="stat-card">
    <div className="stat-icon" style={{ background: color }} aria-hidden="true" />`
);

content = content.replace(
  /const getSectorIcon = \(sector: string\) => \{[\s\S]*?\};/,
  `const getProjectSymbol = (name: string) => {
    const words = name.trim().split(/\\s+/).filter(Boolean);
    if (words.length >= 2) {
      return \`\${words[0][0]}\${words[1][0]}\`.toUpperCase();
    }
    const word = words[0] || 'Project';
    return word.slice(0, 2).toUpperCase();
  };

  const getProjectColor = (name: string) => {
    const colors = ['#7c5fe6', '#2fd4ff', '#48bb78', '#f6c90e', '#f093fb', '#4facfe'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };`
);

content = content.replace(
  /<div className="project-icon">\{getSectorIcon\(project\.sector\)\}<\/div>/,
  `<div
            className="project-icon"
            title={project.name}
            style={{ background: getProjectColor(project.name) }}
          >
            {getProjectSymbol(project.name)}
          </div>`
);

content = content.replace(
  /<div className="project-stat">\r?\n\s*<span className="stat-emoji">≡ƒæÑ<\/span>\r?\n\s*<span>\{project\.team_size\} members<\/span>/,
  `<div className="project-stat">
            <span>{project.team_size} team members</span>`
);

content = content.replace(
  /<div className="project-stat">\r?\n\s*<span className="stat-emoji">Γ£à<\/span>\r?\n\s*<span>\{project\.tasks_completed\}\/\{project\.tasks_total\} tasks<\/span>/,
  `<div className="project-stat">
            <span>{project.tasks_completed}/{project.tasks_total} tasks completed</span>`
);

content = content.replace(
  /\{project\.ai_score && \(\r?\n\s*<div className="project-stat">\r?\n\s*<span className="stat-emoji">≡ƒñû<\/span>\r?\n\s*<span>AI: \{project\.ai_score\}<\/span>/,
  `{project.ai_score && (
            <div className="project-stat">
              <span>AI score: {project.ai_score}</span>`
);

content = content.replace(
  /case 'task': return 'Γ£à';\r?\n\s*case 'document': return '≡ƒôä';\r?\n\s*case 'team': return '≡ƒæÑ';\r?\n\s*case 'experiment': return '≡ƒº¬';\r?\n\s*default: return '≡ƒôî';/,
  `case 'task': return 'Task';
      case 'document': return 'Document';
      case 'team': return 'Team';
      case 'experiment': return 'Experiment';
      default: return 'Note';`
);

content = content.replace(
  /case 'ai': return '≡ƒñû';\r?\n\s*case 'team': return '≡ƒæÑ';\r?\n\s*case 'funding': return '≡ƒÆ░';\r?\n\s*default: return '≡ƒöö';/,
  `case 'ai': return 'AI';
      case 'team': return 'Team';
      case 'funding': return 'Funding';
      default: return 'Alert';`
);

content = content.replace(/<span className="search-icon">≡ƒöì<\/span>/, '<span className="search-icon">Search</span>');

content = content.replace(
  /<StatCard icon="≡ƒôü" label="Total Projects"[^/]+\/>\r?\n\s*<StatCard icon="≡ƒƒó" label="In Progress"[^/]+\/>\r?\n\s*<StatCard icon="Γ£à" label="Completed"[^/]+\/>\r?\n\s*<StatCard icon="≡ƒôè" label="Avg Progress"[^/]+\/>/,
  `<StatCard label="Total Projects" value={stats.total} color="linear-gradient(135deg, #7c5fe6, #2fd4ff)" route="/projects" />
          <StatCard label="In Progress" value={stats.inProgress} color="linear-gradient(135deg, #2fd4ff, #7c5fe6)" route="/projects?status=active" />
          <StatCard label="Completed" value={stats.completed} color="linear-gradient(135deg, #48bb78, #38a169)" route="/projects?status=completed" />
          <StatCard label="Average Progress" value={stats.avgProgress} color="linear-gradient(135deg, #f6c90e, #ecc30b)" route="/analytics" />`
);

content = content.replace(/<div className="empty-icon">≡ƒôü<\/div>/, '<div className="empty-icon">Projects</div>');

content = content.replace(
  /<h3>≡ƒñû AI Insights<\/h3>\r?\n\s*<Link to="\/ai-assistant" className="card-link">Ask AI ΓåÆ<\/Link>/,
  `<h3>AI Insights</h3>
                <Link to="/ai-assistant" className="card-link">Ask AI</Link>`
);

content = content.replace(
  /<p>Your project <strong>"\{projects\[0\]\?\.name \|\| 'AI Smart Farming'\}"<\/strong> has great potential for impact\.<\/p>\r?\n\s*<p className="ai-tip">≡ƒÆí Tip: Consider adding IoT sensors to improve data accuracy by 35%\.<\/p>/,
  `<p>Your project <strong>"{projects[0]?.name || 'your latest project'}"</strong> has great potential for impact.</p>
                <p className="ai-tip">Tip: Consider adding IoT sensors to improve data accuracy by 35%.</p>`
);

content = content.replace(/Run Full Analysis ΓåÆ/, 'Run Full Analysis');

content = content.replace(
  /<h3>≡ƒæÑ Team Activity<\/h3>\r?\n\s*<Link to="\/teams" className="card-link">View All ΓåÆ<\/Link>/,
  `<h3>Team Activity</h3>
                <Link to="/teams" className="card-link">View All</Link>`
);

content = content.replace(
  /<h3>≡ƒöö Notifications<\/h3>\r?\n\s*<Link to="\/notifications" className="card-link">View All ΓåÆ<\/Link>/,
  `<h3>Notifications</h3>
                <Link to="/notifications" className="card-link">View All</Link>`
);

content = content.replace(/<p>┬⌐ 2025 Maylet XLab\. All rights reserved\.<\/p>/, '<p>© 2026 Maylet XLab. All rights reserved.</p>');

content = content.replace(
  /\.project-icon \{\r?\n\s*font-size: 2rem;\r?\n\s*\}/,
  `.project-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #fff;
        }`
);

content = content.replace(
  /\.search-icon \{\r?\n\s*font-size: 1\.2rem;\r?\n\s*margin-right: 0\.5rem;\r?\n\s*\}/,
  `.search-icon {
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: 0.5rem;
          color: #667eea;
        }`
);

fs.writeFileSync('src/app/routes/Projects.tsx', content);
console.log('Restored Projects.tsx:', content.split('\n').length, 'lines');
