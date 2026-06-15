// C:\Users\user\maylet-xlab\src\app\routes\LearningHub.tsx
// PROFESSIONAL LEARNING HUB – Courses, videos, articles with progress tracking

import { useLearningHubPage } from '../hooks/useLearningHubPage';
import { Loader } from '../../../design-system';
import type { ResourceType, SkillLevel } from '../../../core';

// ============================================================
// RESOURCE CARD COMPONENT
// ============================================================
const ResourceCard = ({
  resource,
  completed,
  onToggleComplete,
}: {
  resource: import('../../../core').LearningResourceRecord;
  completed: boolean;
  onToggleComplete: (resourceId: string, completed: boolean) => void;
}) => {
  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'course': return '📘';
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'workshop': return '🎤';
      default: return '📚';
    }
  };

  const getLevelColor = (level: SkillLevel) => {
    switch (level) {
      case 'beginner': return '#48bb78';
      case 'intermediate': return '#f6c90e';
      case 'advanced': return '#fc8181';
      default: return '#7c5fe6';
    }
  };

  return (
    <div className={`resource-card ${completed ? 'completed' : ''}`}>
      <div className="resource-thumbnail">
        {resource.thumbnail_url ? (
          <img loading="lazy" decoding="async" src={resource.thumbnail_url} alt={resource.title} />
        ) : (
          <div className="thumbnail-placeholder">{getTypeIcon(resource.type)}</div>
        )}
      </div>
      <div className="resource-content">
        <div className="resource-header">
          <span className="resource-type">{getTypeIcon(resource.type)} {resource.type.toUpperCase()}</span>
          <span className="resource-level" style={{ background: getLevelColor(resource.skill_level) }}>
            {resource.skill_level}
          </span>
        </div>
        <h3>{resource.title}</h3>
        <p>{resource.description.substring(0, 120)}...</p>
        <div className="resource-meta">
          <span>⏱️ {resource.duration}</span>
          <span>✍️ {resource.author}</span>
          <span>🏷️ {resource.tags.slice(0, 2).join(', ')}</span>
        </div>
        <div className="resource-actions">
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn-view">Open Resource</a>
          <button
            className={`btn-complete ${completed ? 'completed' : ''}`}
            onClick={() => onToggleComplete(resource.id, !completed)}
          >
            {completed ? '✓ Completed' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN LEARNING HUB PAGE
// ============================================================
const LearningHub = () => {
  const {
    loading,
    error,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    levelFilter,
    setLevelFilter,
    filteredResources,
    isCompleted,
    toggleComplete,
    resources,
    progress,
  } = useLearningHubPage();

  const stats = {
    total: resources.length,
    completed: progress.length,
    inProgress: resources.filter(r => !isCompleted(r.id)).length,
    byType: {
      courses: resources.filter(r => r.type === 'course').length,
      videos: resources.filter(r => r.type === 'video').length,
      articles: resources.filter(r => r.type === 'article').length,
      workshops: resources.filter(r => r.type === 'workshop').length,
    },
  };

  if (loading) {
    return (
      <div className="learning-hub-container">
        <main className="hub-main"><Loader label="Loading learning hub" /></main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="learning-hub-container">
        <main className="hub-main"><p className="mxl-ds-error">{error}</p></main>
      </div>
    );
  }

  return (
    <div className="learning-hub-container">
      <main className="hub-main">
        <div className="hub-header">
          <h1>📚 Learning Hub</h1>
          <p>Master innovation, design, and entrepreneurship with curated resources</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">📖</div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Resources</div></div>
          <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{stats.completed}</div><div className="stat-label">Completed</div></div>
          <div className="stat-card"><div className="stat-icon">🔄</div><div className="stat-value">{stats.inProgress}</div><div className="stat-label">In Progress</div></div>
          <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-value">{stats.byType.courses}/{stats.byType.videos}/{stats.byType.articles}/{stats.byType.workshops}</div><div className="stat-label">C/V/A/W</div></div>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="Search by title, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filters">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ResourceType | 'all')}>
              <option value="all">All Types</option>
              <option value="course">📘 Courses</option>
              <option value="video">🎥 Videos</option>
              <option value="article">📄 Articles</option>
              <option value="workshop">🎤 Workshops</option>
            </select>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as SkillLevel | 'all')}>
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="resources-grid">
            {filteredResources.map(res => (
              <ResourceCard
                key={res.id}
                resource={res}
                completed={isCompleted(res.id)}
                onToggleComplete={toggleComplete}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        .learning-hub-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .hub-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .hub-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .hub-header {
          margin-bottom: 2rem;
        }
        .hub-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .stat-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stat-icon {
          font-size: 2rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        .search-filter-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 2;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          padding: 0.75rem 1rem;
          color: white;
        }
        .filters {
          display: flex;
          gap: 0.5rem;
        }
        .filters select {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          padding: 0.75rem 1rem;
          color: white;
        }
        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .resource-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .resource-card:hover {
          transform: translateY(-4px);
        }
        .resource-card.completed {
          opacity: 0.8;
          border-left: 4px solid #48bb78;
        }
        .resource-thumbnail {
          height: 160px;
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thumbnail-placeholder {
          font-size: 3rem;
        }
        .resource-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .resource-content {
          padding: 1.2rem;
        }
        .resource-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .resource-type {
          font-size: 0.7rem;
          color: #2fd4ff;
        }
        .resource-level {
          font-size: 0.6rem;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          color: #0a0d1a;
          font-weight: 600;
        }
        .resource-content h3 {
          margin: 0.5rem 0;
          font-size: 1.1rem;
        }
        .resource-content p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
          margin: 0.5rem 0;
        }
        .resource-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
          margin: 0.5rem 0;
        }
        .resource-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .btn-view, .btn-complete {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          text-decoration: none;
          color: white;
          font-size: 0.7rem;
        }
        .btn-view:hover {
          background: #7c5fe6;
        }
        .btn-complete {
          background: rgba(72,187,120,0.2);
          color: #48bb78;
        }
        .btn-complete.completed {
          background: #48bb78;
          color: #0a0d1a;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6;
          border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LearningHub;